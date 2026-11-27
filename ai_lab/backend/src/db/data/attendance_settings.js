// Default attendance settings (Pengaturan kehadiran, M3-08), taken from the prototype.
// Values are stored as JSONB, so each one keeps its own type (string, number, array).

export default [
  { key: 'jam_masuk',          value: '08:00' },
  { key: 'jam_pulang',         value: '17:00' },
  { key: 'toleransi_menit',    value: 10 },
  { key: 'istirahat_jam',      value: 1 },
  { key: 'lembur_min_menit',   value: 30 },
  { key: 'batas_terlambat',    value: 4 },
  { key: 'batas_bradford',     value: 20 },
  { key: 'batas_persen_hadir', value: 90 },
  { key: 'batas_lupa_absen',   value: 2 },
  { key: 'hak_cuti_tahunan',   value: 12 },
  { key: 'cuti_bersama',       value: 0 },
  // Dummy holidays. None fall in October 2026, which matches attendance.js ("22 workdays, no holidays").
  { key: 'hari_libur',         value: ['2026-01-01', '2026-08-17', '2026-12-25'] },
];