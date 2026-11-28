import Model from './leave.model.js';
import { workdays } from '../attendance-rekap/attendance-rekap.service.js';
import { isRealDate, today } from '../../shared/utils/date.util.js';

const bad = (message) => ({ status: 400, message });
const notFound = (message) => ({ status: 404, message });

const JENIS = ['Cuti tahunan', 'Izin', 'Sakit', 'Dinas Luar', 'WFH'];
const STATUS = ['Menunggu atasan', 'Disetujui', 'Ditolak'];

const dayMs = 86400000;
const nextDay = (s) => new Date(Date.parse(`${s}T00:00:00Z`) + dayMs).toISOString().slice(0, 10);

const toId = (id) => {
  const n = Number(id);
  if (!Number.isInteger(n) || n < 1) throw bad('Invalid request id');
  return n;
};
const toNik = (nik) => String(nik ?? '').trim().toUpperCase();

export const portalUrl = (token) => `${process.env.FRONTEND_URL || 'http://localhost:5173'}/portal/leave/${token}`;

function readSettings(stored) {
  const num = (v, d) => (v !== null && v !== '' && Number.isFinite(Number(v)) ? Number(v) : d);
  return {
    hak: num(stored.hak_cuti_tahunan, 12),
    cutiBersama: num(stored.cuti_bersama, 0),
    holidays: new Set((Array.isArray(stored.hari_libur) ? stored.hari_libur : []).filter(isRealDate)),
  };
}

function refDate(query) {
  const ref = query?.tanggal || today();
  if (!isRealDate(ref)) throw bad('tanggal must be a valid date (YYYY-MM-DD)');
  return ref;
}

function buildSaldo({ employees, balances, used, approved, cfg, ref }) {
  const yearEnd = `${ref.slice(0, 4)}-12-31`;
  const after = nextDay(ref);
  const balBy = new Map(balances.map((b) => [b.nik, b]));
  const usedBy = new Map(used.map((u) => [u.nik, u.n]));

  const ahead = new Map();
  for (const a of approved) {
    const from = a.tgl_mulai > after ? a.tgl_mulai : after;
    const to = a.tgl_selesai < yearEnd ? a.tgl_selesai : yearEnd;
    if (from <= to) ahead.set(a.nik, (ahead.get(a.nik) ?? 0) + workdays(from, to, cfg.holidays).length);
  }

  return employees.map((e) => {
    const years = e.tgl_masuk ? (Date.parse(ref) - Date.parse(e.tgl_masuk)) / (365.25 * dayMs) : 0;
    const berhak = years >= 1;
    const b = balBy.get(e.nik);

    const hak = berhak ? cfg.hak : 0;
    const terpakai_awal = b?.terpakai_awal ?? 0;
    const terpakai_tercatat = usedBy.get(e.nik) ?? 0;
    const disetujui_mendatang = ahead.get(e.nik) ?? 0;
    const cuti_bersama = berhak ? cfg.cutiBersama : 0;
    const penyesuaian = b?.penyesuaian ?? 0;

    return {
      nik: e.nik, nama: e.nama, divisi: e.divisi, berhak, hak, penyesuaian,
      terpakai_awal, terpakai_tercatat, terpakai: terpakai_awal + terpakai_tercatat,
      disetujui_mendatang, cuti_bersama,
      sisa: hak + penyesuaian - terpakai_awal - terpakai_tercatat - disetujui_mendatang - cuti_bersama,
    };
  });
}

async function loadSaldo(ref, nik = null) {
  const cfg = readSettings(await Model.getSettings());
  const tahun = ref.slice(0, 4);
  const [employees, balances, used, approved] = await Promise.all([
    Model.getEmployees(nik),
    Model.getBalances(Number(tahun), nik),
    Model.getUsedCuti(`${tahun}-01-01`, ref, nik),
    Model.getApprovedCuti(nextDay(ref), `${tahun}-12-31`, nik),
  ]);
  return { cfg, rows: buildSaldo({ employees, balances, used, approved, cfg, ref }) };
}

class LeaveService {
  async getAll(query) {
    const status = query?.status || null;
    if (status && !STATUS.includes(status)) throw bad(`status must be one of: ${STATUS.join(', ')}`);
    const nik = query?.nik ? toNik(query.nik) : null;

    const rows = await Model.getAll({ status, nik });
    const { cfg, rows: saldo } = await loadSaldo(today());
    const saldoBy = new Map(saldo.map((s) => [s.nik, s]));

    const requests = rows.map(({ bersamaan, ...r }) => {
      const hari_kerja = workdays(r.tgl_mulai, r.tgl_selesai, cfg.holidays).length;
      const cek = { saldo: null, sisa: null, bersamaan };

      if (r.jenis === 'Cuti tahunan') {
        const s = saldoBy.get(r.nik);
        if (!s || !s.berhak) cek.saldo = 'belum_berhak';
        else {
          cek.sisa = s.sisa;
          cek.saldo = hari_kerja > s.sisa + (r.status === 'Disetujui' ? hari_kerja : 0) ? 'kurang' : 'cukup';
        }
      }
      return { ...r, hari_kerja, cek };
    });

    return { requests };
  }

  async create(body) {
    const nik = toNik(body?.nik);
    const jenis = body?.jenis;
    const alasan = typeof body?.alasan === 'string' ? body.alasan.trim() || null : null;

    if (!nik) throw bad('nik is required');
    if (!JENIS.includes(jenis)) throw bad(`jenis must be one of: ${JENIS.join(', ')}`);
    if (!isRealDate(body?.tgl_mulai) || !isRealDate(body?.tgl_selesai)) throw bad('tgl_mulai and tgl_selesai must be valid dates (YYYY-MM-DD)');
    if (body.tgl_selesai < body.tgl_mulai) throw bad('tgl_selesai must not be before tgl_mulai');
    if (alasan && alasan.length > 255) throw bad('alasan must be at most 255 characters');

    const employee = await Model.getEmployee(nik);
    if (!employee) throw notFound('Employee not found');
    if (employee.aktif !== 'Aktif') throw bad('Karyawan sudah tidak aktif');
    if (!employee.atasan) throw bad('Karyawan belum memiliki atasan langsung, pengajuan tidak bisa disetujui');

    const cfg = readSettings(await Model.getSettings());
    if (!workdays(body.tgl_mulai, body.tgl_selesai, cfg.holidays).length) throw bad('Rentang tanggal tidak berisi hari kerja');
    if (await Model.countOverlap(nik, body.tgl_mulai, body.tgl_selesai)) throw bad('Sudah ada pengajuan lain pada tanggal tersebut');

    const created = await Model.create({ nik, jenis, tgl_mulai: body.tgl_mulai, tgl_selesai: body.tgl_selesai, alasan });
    return {
      request: { id: created.id, nik, jenis, tgl_mulai: body.tgl_mulai, tgl_selesai: body.tgl_selesai, alasan, status: 'Menunggu atasan', token_expires_at: created.token_expires_at },
      portal_url: portalUrl(created.token),
    };
  }

  async getLink(id) {
    const row = await Model.getById(toId(id));
    if (!row) throw notFound('Leave request not found');
    if (row.status !== 'Menunggu atasan') throw { status: 409, message: 'Pengajuan ini sudah diputuskan.' };
    if (row.expired) throw { status: 410, message: 'Link sudah kedaluwarsa, kirim ulang untuk membuat link baru.' };
    return { portal_url: portalUrl(row.token), token_expires_at: row.token_expires_at };
  }

  async resend(id) {
    const row = await Model.getById(toId(id));
    if (!row) throw notFound('Leave request not found');
    const fresh = await Model.regenerateToken(row.id);
    if (!fresh) throw { status: 409, message: 'Pengajuan ini sudah diputuskan.' };
    return { portal_url: portalUrl(fresh.token), token_expires_at: fresh.token_expires_at };
  }

  async getSaldo(query) {
    const ref = refDate(query);
    const divisi = query?.divisi?.trim() || null;
    const { rows } = await loadSaldo(ref);
    const saldo = rows.filter((s) => !divisi || s.divisi === divisi).sort((a, b) => b.sisa - a.sisa);
    return { tanggal: ref, tahun: Number(ref.slice(0, 4)), saldo };
  }

  async getSaldoByNik(nik, query) {
    const ref = refDate(query);
    const { rows } = await loadSaldo(ref, toNik(nik));
    if (!rows[0]) throw notFound('Employee not found');
    return { tanggal: ref, tahun: Number(ref.slice(0, 4)), saldo: rows[0] };
  }

  async setBalance(nik, body) {
    nik = toNik(nik);
    const tahun = Number(body?.tahun ?? today().slice(0, 4));
    const terpakai_awal = Number(body?.terpakai_awal ?? 0);
    const penyesuaian = Number(body?.penyesuaian ?? 0);
    const catatan = typeof body?.catatan === 'string' ? body.catatan.trim() || null : null;

    if (!Number.isInteger(tahun) || tahun < 2000 || tahun > 2100) throw bad('tahun must be a valid year');
    if (!Number.isInteger(terpakai_awal) || terpakai_awal < 0) throw bad('terpakai_awal must be a whole number, 0 or more');
    if (!Number.isInteger(penyesuaian)) throw bad('penyesuaian must be a whole number');
    if (catatan && catatan.length > 255) throw bad('catatan must be at most 255 characters');
    if (!(await Model.getEmployee(nik))) throw notFound('Employee not found');

    return { balance: await Model.upsertBalance(nik, tahun, { terpakai_awal, penyesuaian, catatan }) };
  }
}

export default new LeaveService();