import employees from './employees.js';

// Requests need real, active employees who have a direct supervisor (the approval link goes to that supervisor).
// NIKs are picked from employees.js, so this file can never point at someone who is not there.
const pool = employees.filter((e) => e.aktif === 'Aktif' && e.nik && e.atasan);
if (pool.length < 4) throw new Error('leave_requests.js needs at least 4 active employees with an atasan in employees.js');

// Two people from the same division, so the "Bersamaan" check has something to show.
const byDivisi = {};
for (const e of pool) (byDivisi[e.divisi] ??= []).push(e);
const pair = (Object.values(byDivisi).find((g) => g.length >= 2) ?? pool).slice(0, 2);
const [c, d] = pool.filter((e) => !pair.includes(e));
const [a, b] = pair;

// Leave requests from the Cuti & saldo prototype (M3-06). Fictional.
export default [
  { id: 1, nik: a.nik, jenis: 'Cuti tahunan', tgl_mulai: '2026-11-23', tgl_selesai: '2026-11-25', alasan: 'Acara keluarga',    status: 'Menunggu atasan', decided_at: null },
  { id: 2, nik: b.nik, jenis: 'Cuti tahunan', tgl_mulai: '2026-11-24', tgl_selesai: '2026-11-24', alasan: 'Urusan pribadi',    status: 'Menunggu atasan', decided_at: null },
  { id: 3, nik: c.nik, jenis: 'Cuti tahunan', tgl_mulai: '2026-12-21', tgl_selesai: '2026-12-31', alasan: 'Libur akhir tahun', status: 'Menunggu atasan', decided_at: null },
  { id: 4, nik: d.nik, jenis: 'Izin',         tgl_mulai: '2026-11-16', tgl_selesai: '2026-11-16', alasan: 'Mengurus dokumen',  status: 'Disetujui',       decided_at: '2026-11-13 09:00:00' },
];