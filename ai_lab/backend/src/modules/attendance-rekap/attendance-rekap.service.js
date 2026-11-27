import Model from './attendance-rekap.model.js';
import { isRealDate, today } from '../../shared/utils/date.util.js';
import ExcelJS from 'exceljs';

const MAX_DAYS = 366;
const bad = (message) => ({ status: 400, message });

const DEFAULTS = {
  jam_masuk: '08:00', jam_pulang: '17:00', toleransi_menit: 10, istirahat_jam: 1, lembur_min_menit: 30,
  batas_terlambat: 4, batas_bradford: 20, batas_persen_hadir: 90, batas_lupa_absen: 2, hari_libur: [],
};

const CAT = { Hadir: 'Hadir', 'Dinas Luar': 'Hadir', WFH: 'Hadir', Cuti: 'Terencana', Sakit: 'Tidak terencana', Izin: 'Tidak terencana', Alpa: 'Tidak terencana' };

const SORTS = {
  flag: (a, b) => b.tanda.length - a.tanda.length || b.terlambat_kali - a.terlambat_kali,
  pct: (a, b) => a.persen_hadir - b.persen_hadir,
  late: (a, b) => b.terlambat_kali - a.terlambat_kali,
  brad: (a, b) => b.bradford - a.bradford,
  nama: (a, b) => a.nama.localeCompare(b.nama),
};

export const EXPORT_COLUMNS = [
  { header: 'NIK', key: 'nik', width: 12 },
  { header: 'Nama', key: 'nama', width: 24 },
  { header: 'Divisi', key: 'divisi', width: 22 },
  { header: 'Jabatan', key: 'jabatan', width: 26 },
  { header: 'Hari Kerja', key: 'hari_kerja', width: 11 },
  { header: 'Hadir', key: 'hadir', width: 8 },
  { header: 'Dinas Luar/WFH', key: 'dinas_wfh', width: 15 },
  { header: 'Cuti', key: 'cuti', width: 8 },
  { header: 'Sakit', key: 'sakit', width: 8 },
  { header: 'Izin', key: 'izin', width: 8 },
  { header: 'Alpa', key: 'alpa', width: 8 },
  { header: 'Tidak Tercatat', key: 'tidak_tercatat', width: 15 },
  { header: '% Hadir', key: 'persen_hadir', width: 10, fmt: '0.0' },
  { header: 'Terlambat (kali)', key: 'terlambat_kali', width: 16 },
  { header: 'Terlambat (menit)', key: 'terlambat_menit', width: 17 },
  { header: 'Rata-rata Jam Kerja', key: 'jam_kerja_rata', width: 19, fmt: '0.00' },
  { header: 'Lembur (jam)', key: 'lembur_jam', width: 13, fmt: '0.0' },
  { header: 'Lupa Absen', key: 'lupa_absen', width: 11 },
  { header: 'Bradford Factor', key: 'bradford', width: 15 },
  { header: 'Tanda Perhatian', key: 'tanda', width: 40 },
];

const dayMs = 86400000;
const ms = (s) => Date.parse(`${s}T00:00:00Z`);
const dow = (s) => (new Date(ms(s)).getUTCDay() + 6) % 7; // 0 = Monday
const addDays = (s, n) => new Date(ms(s) + n * dayMs).toISOString().slice(0, 10);

function workdays(from, to, holidays) {
  const out = [];
  for (let d = from; d <= to; d = addDays(d, 1)) if (dow(d) < 5 && !holidays.has(d)) out.push(d);
  return out;
}

function prevWorkday(d, holidays) {
  let x = addDays(d, -1);
  while (dow(x) > 4 || holidays.has(x)) x = addDays(x, -1);
  return x;
}

function period(query) {
  const t = today();
  const from = query?.from || `${t.slice(0, 8)}01`;
  const to = query?.to || t;
  if (!isRealDate(from)) throw bad('from must be a valid date (YYYY-MM-DD)');
  if (!isRealDate(to)) throw bad('to must be a valid date (YYYY-MM-DD)');
  if (from > to) throw bad('from must not be after to');
  if ((ms(to) - ms(from)) / dayMs + 1 > MAX_DAYS) throw bad(`Period cannot be longer than ${MAX_DAYS} days`);
  return { from, to };
}

const mins = (t) => {
  if (!t) return null;
  const [h, m] = String(t).split(':').map(Number);
  return h * 60 + m;
};

function readSettings(stored) {
  const s = { ...DEFAULTS, ...stored };
  const time = (v, d) => (/^\d{1,2}:\d{2}/.test(String(v)) ? v : d);
  const num = (v, d) => (v !== null && v !== '' && Number.isFinite(Number(v)) ? Number(v) : d);
  return {
    jm: mins(time(s.jam_masuk, DEFAULTS.jam_masuk)),
    jp: mins(time(s.jam_pulang, DEFAULTS.jam_pulang)),
    tol: num(s.toleransi_menit, DEFAULTS.toleransi_menit),
    ist: num(s.istirahat_jam, DEFAULTS.istirahat_jam),
    otMin: num(s.lembur_min_menit, DEFAULTS.lembur_min_menit),
    bLate: num(s.batas_terlambat, DEFAULTS.batas_terlambat),
    bBrad: num(s.batas_bradford, DEFAULTS.batas_bradford),
    bPct: num(s.batas_persen_hadir, DEFAULTS.batas_persen_hadir),
    bLupa: num(s.batas_lupa_absen, DEFAULTS.batas_lupa_absen),
    holidays: new Set((Array.isArray(s.hari_libur) ? s.hari_libur : []).filter(isRealDate)),
  };
}

const round = (n, d) => Math.round(n * 10 ** d) / 10 ** d;

export function compute({ employees, rows, cfg, from, to }) {
  const days = workdays(from, to, cfg.holidays);

  const byNik = new Map();
  for (const r of rows) {
    const cat = CAT[r.status];
    if (!cat) continue;
    const a = mins(r.jam_masuk), b = mins(r.jam_pulang);
    const o = {
      tgl: r.tgl, status: r.status, cat,
      jam_masuk: r.jam_masuk?.slice(0, 5) ?? null,
      jam_pulang: r.jam_pulang?.slice(0, 5) ?? null,
      late: cat === 'Hadir' && a != null && a > cfg.jm + cfg.tol ? a - cfg.jm : 0,
      jk: a != null && b != null ? (b - a) / 60 - cfg.ist : null,
      ot: b != null && b - cfg.jp >= cfg.otMin ? Math.round((b - cfg.jp) / 6) / 10 : 0,
      lupa: cat === 'Hadir' && r.status !== 'Dinas Luar' && (a == null || b == null),
      spell: 0,
    };
    if (!byNik.has(r.nik)) byNik.set(r.nik, new Map());
    byNik.get(r.nik).set(r.tgl, o);
  }

  for (const log of byNik.values()) {
    for (const o of log.values()) {
      if (o.cat !== 'Tidak terencana') continue;
      const prev = log.get(prevWorkday(o.tgl, cfg.holidays));
      o.spell = prev?.cat === 'Tidak terencana' ? 0 : 1;
    }
  }

  const result = employees.map((e) => {
    const log = byNik.get(e.nik) ?? new Map();
    const list = [...log.values()];
    const count = (s) => list.filter((x) => x.status === s).length;

    const hk = days.filter((d) => (!e.tgl_masuk || d >= e.tgl_masuk) && (!e.tgl_keluar || d <= e.tgl_keluar)).length;
    const hadir = list.filter((x) => x.cat === 'Hadir').length;
    const cuti = count('Cuti');
    const jks = list.filter((x) => x.jk != null).map((x) => x.jk);
    const S = list.reduce((a, x) => a + x.spell, 0);
    const D = list.filter((x) => x.cat === 'Tidak terencana').length;

    const r = {
      nik: e.nik, nama: e.nama, divisi: e.divisi, jabatan: e.jabatan, lokasi: e.lokasi,
      hari_kerja: hk, hadir, dinas_wfh: count('Dinas Luar') + count('WFH'),
      cuti, sakit: count('Sakit'), izin: count('Izin'), alpa: count('Alpa'),
      tidak_tercatat: Math.max(0, hk - list.length),
      persen_hadir: hk - cuti > 0 ? round((100 * hadir) / (hk - cuti), 1) : 0,
      terlambat_kali: list.filter((x) => x.late > 0).length,
      terlambat_menit: list.reduce((a, x) => a + x.late, 0),
      jam_kerja_rata: jks.length ? round(jks.reduce((a, b) => a + b, 0) / jks.length, 2) : null,
      lembur_jam: round(list.reduce((a, x) => a + x.ot, 0), 1),
      lupa_absen: list.filter((x) => x.lupa).length,
      bradford_s: S, bradford_d: D, bradford: S * S * D,
    };

    const tanda = [];
    if (r.terlambat_kali >= cfg.bLate) tanda.push('Sering terlambat');
    if (r.bradford >= cfg.bBrad) tanda.push('Bradford tinggi');
    if (hk - cuti > 0 ? (100 * hadir) / (hk - cuti) < cfg.bPct : true) tanda.push('Kehadiran rendah');
    if (r.alpa > 0) tanda.push('Ada alpa');
    if (r.lupa_absen >= cfg.bLupa) tanda.push('Sering lupa absen');
    if (r.tidak_tercatat > 0) tanda.push('Hari tidak tercatat');

    return { ...r, tanda, log };
  });

  return { days, rows: result };
}

const strip = ({ log, ...r }) => r;

class AttendanceRekapService {
  async getAll(query) {
    const { from, to } = period(query);
    const sort = query?.sort || 'flag';
    if (!SORTS[sort]) throw bad(`sort must be one of: ${Object.keys(SORTS).join(', ')}`);

    const cfg = readSettings(await Model.getSettings());
    const employees = await Model.getEmployees(from, to, query?.divisi?.trim() || null);
    const rows = await Model.getDays(from, to);
    const { days, rows: rekap } = compute({ employees, rows, cfg, from, to });
    return { period: { from, to }, hari_kerja: days.length, rekap: rekap.map(strip).sort(SORTS[sort]) };
  }

  async getByNik(nik, query) {
    const { from, to } = period(query);
    const cfg = readSettings(await Model.getSettings());
    const employee = await Model.getEmployee(String(nik).trim().toUpperCase());
    if (!employee) throw { status: 404, message: 'Employee not found' };

    const rows = await Model.getDays(from, to, employee.nik);
    const { days, rows: [r] } = compute({ employees: [employee], rows, cfg, from, to });

    const kalender = days.map((tgl) => {
      const o = r.log.get(tgl);
      return {
        tgl, status: o?.status ?? null, jam_masuk: o?.jam_masuk ?? null, jam_pulang: o?.jam_pulang ?? null,
        terlambat_menit: o?.late ?? 0, lupa_absen: o?.lupa ?? false,
      };
    });

    return {
      period: { from, to },
      employee: { nik: employee.nik, nama: employee.nama, divisi: employee.divisi, jabatan: employee.jabatan, lokasi: employee.lokasi, atasan: employee.atasan_nama },
      rekap: strip(r),
      kalender,
    };
  }

  async exportXlsx(query) {
    const { period: p, rekap } = await this.getAll(query);

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Rekap Kehadiran', { views: [{ state: 'frozen', ySplit: 1 }] });
    ws.columns = EXPORT_COLUMNS.map(({ header, key, width }) => ({ header, key, width }));
    ws.getRow(1).font = { bold: true };

    for (const r of rekap) {
      const added = ws.addRow({ ...r, tanda: r.tanda.join(', ') });
      for (const c of EXPORT_COLUMNS) if (c.fmt) added.getCell(c.key).numFmt = c.fmt;
    }
    ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: EXPORT_COLUMNS.length } };

    return {
      buffer: Buffer.from(await wb.xlsx.writeBuffer()),
      filename: `rekap_kehadiran_${p.from}_${p.to}.xlsx`,
    };
  }
}

export default new AttendanceRekapService();