import model from './attendance.model.js';
import settingService from '../attendance-setting/attendance-setting.service.js';
import { isRealDate } from '../../shared/utils/date.util.js';

const CATEGORY = {
  Hadir: 'Hadir', 'Dinas Luar': 'Hadir', WFH: 'Hadir',
  Cuti: 'Terencana',
  Sakit: 'Tidak terencana', Izin: 'Tidak terencana', Alpa: 'Tidak terencana',
};
const STATUSES = ['Hadir', 'Dinas Luar', 'WFH', 'Cuti', 'Sakit', 'Izin', 'Alpa'];
const WEEKDAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];

const UNPLANNED = 'Tidak terencana';

const toDate = (s) => new Date(`${s}T00:00:00Z`);
const addDays = (s, n) => new Date(toDate(s).getTime() + n * 86400000).toISOString().slice(0, 10);
const weekday = (s) => (toDate(s).getUTCDay() + 6) % 7; // 0 = Monday
const minutes = (t) => (t ? Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5)) : null);
const sum = (list, fn) => list.reduce((a, x) => a + fn(x), 0);
const round1 = (n) => Math.round(n * 10) / 10;
const pct = (a, b) => (b > 0 ? round1((100 * a) / b) : 0);
const dec = (n) => round1(n).toFixed(1).replace('.', ',');

function workdays(from, to, holidays) {
  const out = [];
  for (let d = from; d <= to; d = addDays(d, 1)) {
    if (weekday(d) < 5 && !holidays.has(d)) out.push(d);
  }
  return out;
}

function prevWorkday(d, holidays) {
  let x = addDays(d, -1);
  while (weekday(x) > 4 || holidays.has(x)) x = addDays(x, -1);
  return x;
}

function compute({ employees, rows, settings, from, to }) {
  const holidays = new Set(settings.holidays);
  const J = minutes(settings.jm);
  const P = minutes(settings.jp);
  const days = workdays(from, to, holidays);

  const dayRows = rows.map((r) => {
    const cat = CATEGORY[r.status];
    const a = minutes(r.jam_masuk);
    const b = minutes(r.jam_pulang);
    return {
      tgl: r.tgl, nik: r.nik, status: r.status, cat, w: weekday(r.tgl), spell: 0,
      late: cat === 'Hadir' && a != null && a > J + settings.tol ? a - J : 0,
      jk: a != null && b != null ? (b - a) / 60 - settings.ist : null,
      ot: b != null && b - P >= settings.otMin ? Math.round((b - P) / 6) / 10 : 0,
      lupa: cat === 'Hadir' && r.status !== 'Dinas Luar' && (a == null || b == null),
    };
  });

  const unplannedKeys = new Set(dayRows.filter((o) => o.cat === UNPLANNED).map((o) => `${o.nik}|${o.tgl}`));
  for (const o of dayRows) {
    if (o.cat === UNPLANNED) o.spell = unplannedKeys.has(`${o.nik}|${prevWorkday(o.tgl, holidays)}`) ? 0 : 1;
  }

  const byNik = new Map();
  for (const o of dayRows) {
    if (!byNik.has(o.nik)) byNik.set(o.nik, []);
    byNik.get(o.nik).push(o);
  }

  const noNik = employees.filter((e) => !e.nik).map((e) => e.nama);

  const rekap = employees.filter((e) => e.nik).map((e) => {
    const L = byNik.get(e.nik) || [];
    const count = (status) => L.filter((x) => x.status === status).length;
    const hk = days.filter((d) => d >= (e.masuk || '0000-01-01')).length;
    const hadir = L.filter((x) => x.cat === 'Hadir').length;
    const cuti = count('Cuti');
    const jkList = L.filter((x) => x.jk != null).map((x) => x.jk);

    const r = {
      nik: e.nik, nama: e.nama, divisi: e.divisi || '(kosong)', lokasi: e.lokasi,
      hk, hadir, cuti,
      dinasWfh: count('Dinas Luar') + count('WFH'),
      sakit: count('Sakit'), izin: count('Izin'), alpa: count('Alpa'),
      tidakTercatat: Math.max(0, hk - L.length),
      pct: hk - cuti > 0 ? (100 * hadir) / (hk - cuti) : 0,
      lateN: L.filter((x) => x.late > 0).length,
      lateM: sum(L, (x) => x.late),
      jamKerja: jkList.length ? sum(jkList, (x) => x) / jkList.length : null,
      lembur: sum(L, (x) => x.ot),
      lupa: L.filter((x) => x.lupa).length,
      sakitSenin: L.filter((x) => x.status === 'Sakit' && x.w === 0).length,
    };
    const S = sum(L, (x) => x.spell);
    const D = L.filter((x) => x.cat === UNPLANNED).length;
    r.bradford = S * S * D;

    r.flags = [];
    if (r.lateN >= settings.bLate) r.flags.push('Sering terlambat');
    if (r.bradford >= settings.bBrad) r.flags.push('Bradford tinggi');
    if (r.pct < settings.bPct) r.flags.push('Kehadiran rendah');
    if (r.alpa > 0) r.flags.push('Ada alpa');
    if (r.lupa >= settings.bLupa) r.flags.push('Sering lupa absen');
    if (r.tidakTercatat > 0) r.flags.push('Hari tidak tercatat');
    return r;
  });

  return { days, dayRows, rekap, noNik };
}

function insights(rekap, settings, noNik) {
  const out = [];

  const late = rekap.filter((r) => r.lateN >= settings.bLate).sort((a, b) => b.lateN - a.lateN);
  if (late.length) {
    out.push(`${late.length} karyawan terlambat ≥${settings.bLate} kali pada periode ini (terbanyak ${late[0].lateN} kali, total ${late[0].lateM} menit). Saran: obrolan 1-on-1 oleh atasan untuk memahami penyebab (transportasi, jadwal, beban) sebelum langkah disiplin.`);
  }

  const monday = rekap.filter((r) => r.sakitSenin >= 2);
  if (monday.length) {
    out.push(`Pola: ${monday.length} karyawan sakit ≥2 kali di hari Senin. Ini pola, bukan bukti; saran: atasan menanyakan kondisi dengan empati, tanpa menuduh.`);
  }

  const alpa = rekap.filter((r) => r.alpa > 0);
  if (alpa.length) {
    out.push(`${sum(alpa, (r) => r.alpa)} hari alpa pada ${alpa.length} karyawan. Saran: konfirmasi dulu (bisa jadi izin yang belum dicatat), lalu ikuti prosedur Peraturan Perusahaan.`);
  }

  const lupa = sum(rekap, (r) => r.lupa);
  const missing = rekap.filter((r) => r.tidakTercatat > 0);
  if (lupa || missing.length) {
    const tail = missing.length
      ? ` dan ${sum(missing, (r) => r.tidakTercatat)} hari tidak tercatat (${missing.map((r) => r.nama).join(', ')})`
      : '';
    out.push(`${lupa} kejadian lupa absen${tail}. Rapikan ini dulu sebelum menyimpulkan apa pun dari angka kehadiran.`);
  }

  const byDiv = new Map();
  for (const r of rekap) byDiv.set(r.divisi, (byDiv.get(r.divisi) || 0) + r.lembur);
  const total = [...byDiv.values()].reduce((a, b) => a + b, 0);
  const top = [...byDiv.entries()].sort((a, b) => b[1] - a[1])[0];
  if (top && total > 0) {
    out.push(`Lembur terkonsentrasi di ${top[0]}: ${dec(top[1])} dari ${dec(total)} jam (${dec((100 * top[1]) / total)}%). Saran: cek apakah beban kerja atau jadwal perlu disesuaikan.`);
  }

  if (noNik.length) {
    out.push(`${noNik.length} karyawan belum punya NIK sehingga absensinya tidak bisa dicocokkan dan tidak ikut dihitung: ${noNik.join(', ')}. Saran: lengkapi NIK-nya di data karyawan.`);
  }
  return out;
}

function buildHome({ rekap, days, from, to, settings, noNik }) {
  const hk = sum(rekap, (r) => r.hk);
  const cuti = sum(rekap, (r) => r.cuti);
  const hadir = sum(rekap, (r) => r.hadir);
  const flagged = rekap.filter((r) => r.flags.length).sort((a, b) => b.flags.length - a.flags.length);

  return {
    period: { from, to, workdays: days.length, employees: rekap.length },
    kpi: {
      pctHadir: pct(hadir, hk - cuti),
      lateEvents: sum(rekap, (r) => r.lateN),
      lateMinutes: sum(rekap, (r) => r.lateM),
      needAttention: flagged.length,
      pendingLeave: null, // leave requests are not built yet
    },
    attention: flagged.map((r) => ({ nik: r.nik, nama: r.nama, divisi: r.divisi, flags: r.flags })),
    insights: insights(rekap, settings, noNik),
  };
}

function buildDashboard({ rekap, dayRows, days, from, to, settings, noNik }) {
  const niks = new Set(rekap.map((r) => r.nik));
  const rows = dayRows.filter((o) => niks.has(o.nik));
  const hk = sum(rekap, (r) => r.hk);
  const cuti = sum(rekap, (r) => r.cuti);
  const hadir = sum(rekap, (r) => r.hadir);

  const statusCount = Object.fromEntries(STATUSES.map((s) => [s, 0]));
  for (const o of rows) statusCount[o.status] += 1;

  const weeks = new Map();
  for (const o of rows) {
    const monday = addDays(o.tgl, -o.w);
    if (!weeks.has(monday)) weeks.set(monday, { weekStart: monday, hadir: 0, total: 0 });
    const wk = weeks.get(monday);
    wk.total += 1;
    if (o.cat === 'Hadir') wk.hadir += 1;
  }

  const divisions = [...new Set(rekap.map((r) => r.divisi))].sort().map((divisi) => {
    const list = rekap.filter((r) => r.divisi === divisi);
    const lateN = sum(list, (r) => r.lateN);
    return {
      divisi,
      employees: list.length,
      pctHadir: pct(sum(list, (r) => r.hadir), sum(list, (r) => r.hk - r.cuti)),
      lateN,
      avgLateMinutes: lateN ? round1(sum(list, (r) => r.lateM) / lateN) : 0,
      lembur: round1(sum(list, (r) => r.lembur)),
      sia: sum(list, (r) => r.sakit + r.izin + r.alpa),
    };
  });

  return {
    period: { from, to, workdays: days.length, employees: rekap.length },
    kpi: {
      employees: rekap.length,
      pctHadir: pct(hadir, hk - cuti),
      lateEvents: sum(rekap, (r) => r.lateN),
      lembur: round1(sum(rekap, (r) => r.lembur)),
      sia: sum(rekap, (r) => r.sakit + r.izin + r.alpa),
    },
    status: STATUSES.map((status) => ({ status, count: statusCount[status] })),
    byWeekday: WEEKDAYS.map((label, w) => ({
      weekday: label,
      late: rows.filter((o) => o.w === w && o.late > 0).length,
      unplanned: rows.filter((o) => o.w === w && o.cat === UNPLANNED).length,
    })),
    weekly: [...weeks.values()].sort((a, b) => a.weekStart.localeCompare(b.weekStart))
      .map((w) => ({ weekStart: w.weekStart, pctHadir: pct(w.hadir, w.total) })),
    divisions,
    insights: insights(rekap, settings, noNik),
  };
}

const roundRekap = (r) => ({
  ...r,
  pct: round1(r.pct),
  jamKerja: r.jamKerja == null ? null : round1(r.jamKerja),
  lembur: round1(r.lembur),
});

class AttendanceService {
  async resolvePeriod({ from, to } = {}) {
    if (from || to) {
      if (!isRealDate(from) || !isRealDate(to)) {
        throw { status: 400, message: 'from and to must both be dates in YYYY-MM-DD format' };
      }
      if (from > to) throw { status: 400, message: 'from must not be after to' };
      return { from, to };
    }
    const latest = await model.getLatestMonth();
    if (!latest) throw { status: 404, message: 'No attendance data yet' };
    return { from: latest.month_start, to: latest.month_end };
  }

  async load(query) {
    const { from, to } = await this.resolvePeriod(query);
    const [settings, employees, rows] = await Promise.all([
      settingService.getAll(),
      model.getActiveEmployees(),
      model.getDays(from, to),
    ]);
    const result = compute({ employees, rows, settings, from, to });
    return { ...result, from, to, settings };
  }

  async home(query) {
    return buildHome(await this.load(query));
  }

  async dashboard(query) {
    return buildDashboard(await this.load(query));
  }

  async recap(query) {
    const { rekap, days, from, to } = await this.load(query);
    return {
      period: { from, to, workdays: days.length, employees: rekap.length },
      rekap: rekap.map(roundRekap),
    };
  }
}

export default new AttendanceService();