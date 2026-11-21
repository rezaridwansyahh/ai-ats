import { normalise, teamNiks, daysBetween, REF_DATE } from '@/components/dashboard/dashboardMetrics.js';

export function buildPengingat(rows, role = 'hr') {
  const all = normalise(rows);
  const team = role === 'hr' ? null : teamNiks(all);
  const active = all.filter((e) => e.aktif === 'Aktif' && (!team || team.has(e.nik)));
  const byNik = Object.fromEntries(all.map((e) => [e.nik, e]));

  return {
    kontrak: active.filter((e) => e.warn).sort((a, b) => a.sisa - b.sisa),
    prob: active.filter((e) => e.dalamProb).sort((a, b) => a.probSisa - b.probSisa),
    bossOf: (e) => byNik[e.atasan] ?? null,
  };
}

const SAMPLE_CERTS = [
  { nama: 'Lestari Permata', sertifikat: 'Sertifikasi Manajemen SDM', exp: '2026-10-20' },
  { nama: 'Putri Wibowo', sertifikat: 'Sertifikasi Manajemen SDM', exp: '2026-11-30' },
  { nama: 'Ayu Saputra', sertifikat: 'K3 Umum', exp: '2027-01-12' },
];

export const MOCK_CERTS = SAMPLE_CERTS.map((c) => ({ ...c, sisa: daysBetween(REF_DATE, c.exp) }));