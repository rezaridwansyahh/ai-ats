import employees from './employees.js';

// October 2026 attendance for the active employees in employees.js (22 workdays, no holidays).
// Rows are generated, not typed: ordinary days use a seeded random generator so the data is
// the same on every seed, and the special cases below are fixed on purpose so the screens
// have something to show (late, alpa, Bradford, forgot-to-scan, Monday sick pattern, ...).

const FROM = '2026-10-01';
const TO = '2026-10-30';

// Written in the data on purpose (same idea as the duplicate NIK in employees.js):
// this person's attendance machine record carries a mistyped NIK.
const MISTYPED_NIK = { 25: 'CS18902' };

// Fixed cases, keyed by NIK. late = { date: minutes after 08:00 }.
const SPECIAL = {
  CS24006: { late: { '2026-10-02': 32, '2026-10-07': 28, '2026-10-13': 41, '2026-10-20': 25, '2026-10-22': 37, '2026-10-27': 30 } },
  CS21003: { late: { '2026-10-01': 22, '2026-10-08': 35, '2026-10-15': 27, '2026-10-21': 45, '2026-10-29': 30 } },
  CS20004: { alpa: ['2026-10-14', '2026-10-15'] },
  CS25002: { sakit: ['2026-10-12', '2026-10-26'] },            // both Mondays
  CS25005: { sakit: ['2026-10-05', '2026-10-19'] },            // both Mondays
  CS25007: { izin: ['2026-10-08', '2026-10-16', '2026-10-23'] },
  CS22005: { cuti: ['2026-10-19', '2026-10-20', '2026-10-21'] },
  CS18005: { cuti: ['2026-10-08', '2026-10-09'] },
  CS23002: { dinas: ['2026-10-06', '2026-10-07', '2026-10-13', '2026-10-14'] },
  CS21001: { dinas: ['2026-10-12', '2026-10-21'], wfh: ['2026-10-02'] },
  CS26001: { wfh: ['2026-10-09', '2026-10-16', '2026-10-23'] },
  CS25009: { noOut: ['2026-10-14', '2026-10-28'] },            // forgot to scan out
  CS20002: { missing: ['2026-10-13', '2026-10-14'] },          // no record at all
};
const OVERTIME_DIVISIONS = ['Produksi', 'Gudang & Logistik'];

// ---------- helpers ----------
const pad = (n) => String(n).padStart(2, '0');
const hhmm = (min) => `${pad(Math.floor(min / 60))}:${pad(min % 60)}`;

function rng(seed) { // mulberry32
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const workdays = [];
for (let d = new Date(`${FROM}T00:00:00Z`); d <= new Date(`${TO}T00:00:00Z`); d = new Date(d.getTime() + 86400000)) {
  if (d.getUTCDay() >= 1 && d.getUTCDay() <= 5) workdays.push(d.toISOString().slice(0, 10));
}

const rows = [];
for (const emp of employees.filter((e) => e.aktif === 'Aktif' && e.nik)) {
  const nik = emp.nik;
  const special = SPECIAL[emp.nik] || {};
  const rand = rng(emp.id * 1009);
  const overtimeProne = OVERTIME_DIVISIONS.includes(emp.divisi);

  for (const tgl of workdays) {
    if (tgl < emp.tgl_masuk) continue;
    const roll = rand();       // always drawn, so one employee's special case never shifts another's random times
    const roll2 = rand();
    const roll3 = rand();
    if (special.missing?.includes(tgl)) continue;

    const row = { nik, tgl, status: 'Hadir', jam_masuk: null, jam_pulang: null, ket: null, source: 'mesin' };
    if (special.cuti?.includes(tgl)) Object.assign(row, { status: 'Cuti', source: 'pengajuan' });
    else if (special.sakit?.includes(tgl)) Object.assign(row, { status: 'Sakit', source: 'hr' });
    else if (special.izin?.includes(tgl)) Object.assign(row, { status: 'Izin', source: 'hr' });
    else if (special.alpa?.includes(tgl)) Object.assign(row, { status: 'Alpa', source: 'hr' });
    else if (special.dinas?.includes(tgl)) Object.assign(row, { status: 'Dinas Luar', ket: 'Kunjungan pelanggan', source: 'hr' });
    else {
      if (special.wfh?.includes(tgl)) row.status = 'WFH';
      const lateBy = special.late?.[tgl];
      row.jam_masuk = hhmm(lateBy ? 480 + lateBy : 450 + Math.floor(roll * 39));          // 07:30 - 08:08
      row.jam_pulang = hhmm(overtimeProne && roll2 < 0.4
        ? 1080 + Math.floor(roll3 * 111)                                                // 18:00 - 19:50
        : 1022 + Math.floor(roll3 * 27));                                               // 17:02 - 17:28
      if (special.noOut?.includes(tgl)) row.jam_pulang = null;
    }
    rows.push(row);
  }
}

export default rows;