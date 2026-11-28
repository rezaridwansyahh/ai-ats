import employees from './employees.js';

const TAHUN = 2026;
const REF = '2026-11-30';

const years = (from, to) => (Date.parse(to) - Date.parse(from)) / (365.25 * 86400000);
const hash = (nik) => { let h = 0; for (const c of nik) h = (h * 31 + c.charCodeAt(0)) % 997; return h; };

// No right to annual leave before 12 months of service (same rule as the prototype).
export default employees
  .filter((e) => e.aktif === 'Aktif' && e.nik && e.tgl_masuk && years(e.tgl_masuk, REF) >= 1)
  .map((e) => ({ nik: e.nik, tahun: TAHUN, terpakai_awal: hash(e.nik) % 7, penyesuaian: 0, catatan: null }));