
export const REF_DATE = '2026-11-30';
export const MGR_NIK = 'CS22002'; 

const B1 = 30;          
const B2 = 60;          
const PROB_MONTHS = 3;  
const DATE_FIELDS = ['tgl_lahir', 'tgl_masuk', 'akhir_kontrak', 'tgl_keluar'];
const BLN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

const ymd = (v) => {
  if (!v) return null;
  const s = String(v);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const d = new Date(s);
  if (isNaN(d)) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const toMs = (s) => {
  const [y, m, d] = s.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
};
const daysBetween = (a, b) => Math.round((toMs(b) - toMs(a)) / 864e5);
const addMonths = (s, n) => {
  const [y, m, d] = s.split('-').map(Number);
  const t = m - 1 + n;
  const yy = y + Math.floor(t / 12);
  const mm = ((t % 12) + 12) % 12;
  const last = new Date(Date.UTC(yy, mm + 1, 0)).getUTCDate();
  return `${yy}-${String(mm + 1).padStart(2, '0')}-${String(Math.min(d, last)).padStart(2, '0')}`;
};
export const fmtDate = (s) => {
  if (!s) return '—';
  const [y, m, d] = s.split('-').map(Number);
  return `${d} ${BLN[m - 1]} ${y}`;
};
const pct = (n, d, dp = 1) => (d ? `${((100 * n) / d).toFixed(dp).replace('.', ',')}%` : '—');
const join = (...parts) => parts.filter(Boolean).join(' · ');

const fullYears = (a, b) => {
  const [ay, am, ad] = a.split('-').map(Number);
  const [by, bm, bd] = b.split('-').map(Number);
  return by - ay - (bm < am || (bm === am && bd < ad) ? 1 : 0);
};
const generation = (y) =>
  y >= 2013 ? 'Gen Alpha' : y >= 1997 ? 'Gen Z' : y >= 1981 ? 'Milenial' : y >= 1965 ? 'Gen X' : y >= 1946 ? 'Baby Boomer' : '';

/* ─── per-employee derived fields ─── */
export function normalise(rows) {
  const nikCount = {};
  rows.forEach((r) => { if (r.nik) nikCount[r.nik] = (nikCount[r.nik] || 0) + 1; });
  const niks = new Set(rows.map((r) => r.nik));

  return rows.map((r) => {
    const e = { ...r };
    DATE_FIELDS.forEach((k) => { e[k] = ymd(r[k]); });
    const isActive = e.aktif === 'Aktif';

    e.sisa = isActive && e.akhir_kontrak ? daysBetween(REF_DATE, e.akhir_kontrak) : null;
    e.warn = e.sisa == null ? '' : e.sisa < 0 ? 'Lewat' : e.sisa <= B1 ? 'Segera' : e.sisa <= B2 ? 'Perhatian' : '';

    e.akhirProb = e.status === 'PKWTT' && e.tgl_masuk ? addMonths(e.tgl_masuk, PROB_MONTHS) : null;
    const left = isActive && e.akhirProb ? daysBetween(REF_DATE, e.akhirProb) : null;
    e.probSisa = e.dalamProb = e.probSisa != null;
    e.usia = e.tgl_lahir ? fullYears(e.tgl_lahir, REF_DATE) : null;
    e.generasi = e.tgl_lahir ? generation(Number(e.tgl_lahir.slice(0, 4))) : '';
    const endDate = e.aktif === 'Keluar' && e.tgl_keluar ? e.tgl_keluar : REF_DATE;
    e.masa = e.tgl_masuk ? Math.round((daysBetween(e.tgl_masuk, endDate) / 365.25) * 10) / 10 : null;

    const q = [];
    if (nikCount[e.nik] > 1) q.push('NIK ganda');
    if (!e.tgl_lahir) q.push('Tgl lahir kosong');
    if (!e.pendidikan) q.push('Pendidikan kosong');
    if (!e.divisi) q.push('Divisi kosong');
    if (!e.tgl_masuk) q.push('Tgl masuk kosong');
    if (e.status && e.status !== 'PKWTT' && !e.akhir_kontrak) q.push('Akhir kontrak kosong');
    if (e.aktif === 'Keluar' && !e.tgl_keluar) q.push('Tgl keluar kosong');
    if (e.atasan && !niks.has(e.atasan)) q.push('NIK atasan tidak ditemukan');
    e.cek = q;
    return e;
  });
}

// Everyone under a manager in the reporting chain (manager included).
export function teamNiks(rows) {
  const s = new Set([MGR_NIK]);
  let changed = true;
  while (changed) {
    changed = false;
    rows.forEach((e) => {
      if (e.atasan && s.has(e.atasan) && !s.has(e.nik)) {
        s.add(e.nik);
        changed = true;
      }
    });
  }
  return s;
}

/* ─── main entry ─── */
// Insight sentences are arrays of strings and { b: 'bold text' } so no JSX is needed here.
export function buildDashboard(rows, role = 'hr') {
  const all = normalise(rows);
  const team = role === 'hr' ? null : teamNiks(all);
  const scoped = team ? all.filter((e) => team.has(e.nik)) : all;
  const active = scoped.filter((e) => e.aktif === 'Aktif');

  const urg = active.filter((e) => e.warn === 'Lewat' || e.warn === 'Segera').sort((a, b) => a.sisa - b.sisa);
  const perh = active.filter((e) => e.warn === 'Perhatian');
  const prob = active.filter((e) => e.probSisa != null).sort((a, b) => a.probSisa - b.probSisa);
  const probSoon = prob.filter((e) => e.probSisa != null && e.probSisa <= B1);
  const bad = scoped.filter((e) => e.cek.length);
  const left = scoped.filter((e) => e.aktif === 'Keluar');
  const female = active.filter((e) => e.jk === 'Perempuan').length;
  const link = (e) => (e.id != null ? `/karyawan/${e.id}` : '/karyawan');

  const stats = [
    { label: 'Karyawan aktif', value: String(active.length), sub: `${left.length} sudah keluar (tersimpan)`, to: '/karyawan' },
    { label: `Kontrak ≤ ${B1} hari / lewat`, value: String(urg.length), sub: 'Segera + Lewat', to: '/karyawan' },
    { label: 'Dalam masa percobaan', value: String(prob.length), sub: `PKWTT, ${PROB_MONTHS} bulan pertama`, to: '/karyawan' },
    { label: '% Perempuan', value: pct(female, active.length), sub: `${female} dari ${active.length}` },
  ];

  /* Perlu tindakan */
  const todos = [];
  urg.slice(0, 4).forEach((e) => todos.push({
    key: `u-${e.nik}`,
    kind: e.warn === 'Lewat' ? 'overdue' : 'soon',
    title: `${e.nama} — kontrak ${e.status} ${e.sisa < 0 ? `lewat ${-e.sisa} hari` : `habis dalam ${e.sisa} hari`}`,
    sub: join(e.jabatan, e.divisi, `berakhir ${fmtDate(e.akhir_kontrak)}`),
    action: 'Buka',
    to: link(e),
  }));
  if (urg.length > 4) todos.push({
    key: 'more', kind: 'more', title: `${urg.length - 4} kontrak lain perlu ditinjau`, action: 'Lihat semua', to: '/pengingat',
  });
  probSoon.forEach((e) => todos.push({
    key: `p-${e.nik}`,
    kind: 'prob',
    title: `${e.nama} — masa percobaan selesai ${fmtDate(e.akhirProb)}`,
    sub: join(e.jabatan, e.divisi, `${e.probSisa} hari lagi`),
    action: 'Buka',
    to: link(e),
  }));
  // MOCK: there is no certificate table yet, so this row is static.
  todos.push({
    key: 'cert', kind: 'cert', mock: true, title: '7 sertifikat kedaluwarsa atau ≤ 60 hari',
    sub: 'Lestari Permata · Sertifikasi Manajemen SDM · Putri Wibowo · Sertifikasi Manajemen SDM · Ayu Saputra · K3 Umum',
    action: 'Lihat', to: '/pengingat',
  });
  if (role === 'hr' && bad.length) todos.push({
    key: 'dq', kind: 'quality', hrOnly: true, title: `${bad.length} data karyawan perlu dirapikan`,
    sub: [...new Set(bad.flatMap((e) => e.cek))].join(' · '), action: 'Perbaiki', to: '/karyawan',
  });

  /* Insight minggu ini (sentences are computed; "AI" wording is still simulated) */
  const insights = [];
  if (urg.length || perh.length) {
    const dv = {};
    urg.concat(perh).forEach((e) => { dv[e.divisi] = (dv[e.divisi] || 0) + 1; });
    const top = Object.entries(dv).sort((a, b) => b[1] - a[1])[0];
    insights.push([
      { b: `${urg.length} kontrak` }, ` sudah lewat atau berakhir ≤${B1} hari, dan `, { b: String(perh.length) },
      ` lagi dalam ${B1 + 1}–${B2} hari. `,
      top[1] >= 2 ? ['Terbanyak di ', { b: top[0] }, ` (${top[1]}). `] : `Tersebar di ${Object.keys(dv).length} divisi. `,
      'Saran: jadwalkan tinjauan perpanjangan bersama atasan langsung minggu ini.',
    ].flat());
  }
  if (prob.length) {
    insights.push([
      { b: `${prob.length} karyawan` }, ` masih dalam masa percobaan; yang paling dekat selesai: ${prob[0].nama} (${fmtDate(prob[0].akhirProb)}). `,
      'Saran: minta penilaian atasan sebelum tanggal tersebut.',
    ]);
  }
  const byDiv = {};
  active.forEach((e) => { (byDiv[e.divisi] = byDiv[e.divisi] || []).push(e); });
  const ct = Object.entries(byDiv)
    .filter(([, l]) => l.length >= 4)
    .map(([d, l]) => [d, l.filter((e) => e.status !== 'PKWTT').length / l.length, l.length])
    .sort((a, b) => b[1] - a[1])[0];
  const allC = active.length ? active.filter((e) => e.status !== 'PKWTT').length / active.length : 0;
  if (ct && ct[1] > allC) {
    insights.push([
      'Porsi PKWT + Magang di ', { b: ct[0] }, ` ${pct(ct[1], 1)} dari ${ct[2]} karyawan aktif, di atas rata-rata perusahaan (${pct(allC, 1)}). `,
      'Saran: pastikan rencana kebutuhan tenaga kerja divisi ini jelas sebelum kontrak diperpanjang otomatis.',
    ]);
  }
  const refYear = REF_DATE.slice(0, 4);
  const leavers = left.filter((e) => e.tgl_keluar && e.tgl_keluar.slice(0, 4) === refYear);
  if (leavers.length) {
    const al = {};
    leavers.forEach((e) => { const k = e.alasan || 'Tidak diisi'; al[k] = (al[k] || 0) + 1; });
    const ta = Object.entries(al).sort((a, b) => b[1] - a[1])[0];
    insights.push([
      `${leavers.length} karyawan keluar di ${refYear}; alasan terbanyak: `, { b: ta[0] }, ` (${ta[1]}). `,
      'Saran: bila resign sukarela dominan, pertimbangkan wawancara keluar terstruktur.',
    ]);
  }
  if (bad.length && role === 'hr') {
    insights.push([
      { b: `${bad.length} baris` }, ` punya masalah kualitas data (mis. ${bad[0].cek[0]} pada ${bad[0].nama}). `,
      'Angka dashboard bisa meleset sampai ini diperbaiki.',
    ]);
  }

  return { stats, todos, insights, activeCount: active.length, total: scoped.length };
}