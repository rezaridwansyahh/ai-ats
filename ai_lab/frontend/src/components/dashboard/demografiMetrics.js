import { normalise, teamNiks, REF_DATE } from './dashboardMetrics.js';

export const LEVELS = ['Direktur', 'Manajer', 'Supervisor', 'Staf', 'Operator'];

const ageGrp = (u) =>
  u == null ? '' : u < 25 ? 'Di bawah 25' : u < 35 ? '25–34' : u < 45 ? '35–44' : u < 55 ? '45–54' : '55 ke atas';
const tenGrp = (t) =>
  t == null ? '' : t < 1 ? 'Di bawah 1 thn' : t < 3 ? '1–3 thn' : t < 5 ? '3–5 thn' : t < 10 ? '5–10 thn' : '10 thn ke atas';

export const pct = (n, d, dp = 1) => (d ? `${((100 * n) / d).toFixed(dp).replace('.', ',')}%` : '—');

const avg = (list, k) => {
  const v = list.map((e) => e[k]).filter((x) => x != null);
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
};

export function countBy(list, key, order) {
  const map = {};
  list.forEach((e) => {
    const v = e[key] || '(kosong)';
    (map[v] = map[v] || []).push(e);
  });
  const keys = order ? order.filter((o) => map[o]) : Object.keys(map).sort((a, b) => map[b].length - map[a].length);
  if (map['(kosong)'] && !keys.includes('(kosong)')) keys.push('(kosong)');
  return keys.map((k) => ({ label: k, n: map[k].length, list: map[k] }));
}

export function buildDemografi(rows, role = 'hr') {
  const all = normalise(rows).map((e) => ({ ...e, kelUsia: ageGrp(e.usia), kelMasa: tenGrp(e.masa) }));
  const team = role === 'hr' ? null : teamNiks(all);
  const scoped = team ? all.filter((e) => team.has(e.nik)) : all;
  const active = scoped.filter((e) => e.aktif === 'Aktif');
  const year = REF_DATE.slice(0, 4);

  const leavers = scoped.filter((e) => e.aktif === 'Keluar' && e.tgl_keluar && e.tgl_keluar.slice(0, 4) === year);
  const female = active.filter((e) => e.jk === 'Perempuan');
  const male = active.filter((e) => e.jk === 'Laki-laki');
  const kontrak = active.filter((e) => e.status !== 'PKWTT');
  const urg = active.filter((e) => e.warn === 'Lewat' || e.warn === 'Segera');
  const perh = active.filter((e) => e.warn === 'Perhatian');
  const prob = active.filter((e) => e.dalamProb);

  const kpis = [
    { key: 'aktif', label: 'Karyawan aktif', value: String(active.length), list: active },
    { key: 'fem', label: '% Perempuan', value: pct(female.length, active.length), sub: `${female.length} orang` },
    { key: 'usia', label: 'Rata-rata usia', value: `${fmt1(avg(active, 'usia'))} thn` },
    { key: 'masa', label: 'Rata-rata masa kerja', value: `${fmt1(avg(active, 'masa'))} thn` },
    { key: 'kontrak', label: '% PKWT + Magang', value: pct(kontrak.length, active.length), sub: `${kontrak.length} orang`, list: kontrak },
    { key: 'urg', label: 'Kontrak ≤ 30 hari / lewat', value: String(urg.length), sub: 'Segera + Lewat', list: urg },
    { key: 'perh', label: 'Kontrak 31–60 hari', value: String(perh.length), sub: 'Perhatian', list: perh },
    { key: 'prob', label: 'Dalam masa percobaan', value: String(prob.length), list: prob },
    { key: 'keluar', label: `Keluar ${year}`, value: String(leavers.length), list: leavers },
    { key: 'turn', label: `Turnover ${year}`, value: pct(leavers.length, active.length + leavers.length), sub: 'keluar ÷ (aktif + keluar thn ini)' },
  ];

  const divs = [...new Set(scoped.map((e) => e.divisi || '(kosong)'))].sort();
  const divRows = divs
    .map((d) => {
      const l = active.filter((e) => (e.divisi || '(kosong)') === d);
      const k = leavers.filter((e) => (e.divisi || '(kosong)') === d).length;
      return {
        divisi: d,
        list: l,
        n: l.length,
        L: l.filter((e) => e.jk === 'Laki-laki').length,
        P: l.filter((e) => e.jk === 'Perempuan').length,
        K: l.filter((e) => e.status !== 'PKWTT').length,
        usia: avg(l, 'usia'),
        masa: avg(l, 'masa'),
        keluar: k,
      };
    })
    .filter((r) => r.n || r.keluar);

  const perLevel = LEVELS.map((lv) => {
    const l = active.filter((e) => e.level === lv);
    return { level: lv, n: l.length, P: l.filter((e) => e.jk === 'Perempuan').length, list: l };
  }).filter((r) => r.n);

  return {
    total: active.length,
    kpis,
    gender: { male, female },
    perLevel,
    divRows,
    totals: {
      n: active.length, L: male.length, P: female.length, K: kontrak.length,
      usia: avg(active, 'usia'), masa: avg(active, 'masa'), keluar: leavers.length,
    },
    groups: {
      divisi: countBy(active, 'divisi'),
      status: countBy(active, 'status', ['PKWTT', 'PKWT', 'Magang']),
      usia: countBy(active, 'kelUsia', ['Di bawah 25', '25–34', '35–44', '45–54', '55 ke atas']),
      generasi: countBy(active, 'generasi', ['Baby Boomer', 'Gen X', 'Milenial', 'Gen Z', 'Gen Alpha']),
      masa: countBy(active, 'kelMasa', ['Di bawah 1 thn', '1–3 thn', '3–5 thn', '5–10 thn', '10 thn ke atas']),
      lokasi: countBy(active, 'lokasi'),
      pendidikan: countBy(active, 'pendidikan', ['SD/SMP', 'SMA/SMK', 'D3', 'S1', 'S2', 'S3']),
      level: countBy(active, 'level', LEVELS),
    },
  };
}

const fmt1 = (x) => (x == null || isNaN(x) ? '—' : x.toFixed(1).replace('.', ','));
export { fmt1 };