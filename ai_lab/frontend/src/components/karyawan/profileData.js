import { REF_DATE, addDays, addMonths, daysBetween } from '@/components/dashboard/dashboardMetrics.js';
import { dec } from './karyawanUtils.js';

export const PKWT_MAX = 5;  
export const CERT_WARN = 60; 

export const ageGroup = (u) => (u == null ? '' : u < 25 ? 'Di bawah 25' : u < 35 ? '25–34' : u < 45 ? '35–44' : u < 55 ? '45–54' : '55 ke atas');
export const tenureGroup = (t) => (t == null ? '' : t < 1 ? 'Di bawah 1 thn' : t < 3 ? '1–3 thn' : t < 5 ? '3–5 thn' : t < 10 ? '5–10 thn' : '10 thn ke atas');

const jpAge = (y) => (y < 2019 ? 56 : Math.min(65, 57 + Math.floor((y - 2019) / 3)));
export function pensionDate(e) {
  if (!e.tgl_lahir) return '';
  const by = Number(e.tgl_lahir.slice(0, 4));
  for (let a = 56; a <= 65; a++) if (a >= jpAge(by + a)) return addMonths(e.tgl_lahir, 12 * a);
  return addMonths(e.tgl_lahir, 780);
}

export function contracts(e) {
  if (!e.tgl_masuk) return [];
  const yr = e.tgl_masuk.slice(0, 4);
  if (e.status === 'PKWTT') return [{ no: `PKWTT/${yr}/${e.nik}`, jenis: 'PKWTT', mulai: e.tgl_masuk, akhir: '', ket: 'Tetap' }];
  if (!e.akhir_kontrak) return [{ no: `${e.status}-1/${yr}/${e.nik}`, jenis: e.status, mulai: e.tgl_masuk, akhir: '', ket: 'Tanggal akhir kosong' }];
  const rows = [];
  let s = e.tgl_masuk;
  for (let i = 1; i <= 8; i++) {
    const nx = addDays(addMonths(s, 12), -1);
    const base = { no: `${e.status}-${i}/${s.slice(0, 4)}/${e.nik}`, jenis: e.status, mulai: s, ket: i === 1 ? 'Kontrak awal' : `Perpanjangan ke-${i - 1}` };
    if (daysBetween(nx, e.akhir_kontrak) < 60) { rows.push({ ...base, akhir: e.akhir_kontrak }); break; }
    rows.push({ ...base, akhir: nx });
    s = addDays(nx, 1);
  }
  return rows;
}

export function pkwtCheck(e) {
  if (e.status !== 'PKWT' || !e.akhir_kontrak || !e.tgl_masuk) return null;
  const yrs = daysBetween(e.tgl_masuk, e.akhir_kontrak) / 365.25;
  return { yrs, n: contracts(e).length, st: yrs > PKWT_MAX ? 'Melewati batas' : yrs > PKWT_MAX - 0.5 ? 'Mendekati batas' : 'Dalam batas' };
}

function rng(s) {
  let h = 2166136261;
  for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0;
  return () => { h = (Math.imul(h, 1664525) + 1013904223) >>> 0; return h / 4294967296; };
}
const pick = (r, a) => a[Math.floor(r() * a.length)];
const CACHE = {};
export function ext(e) {
  const k = `${e.nik}|${e.nama}`;
  if (CACHE[k]) return CACHE[k];
  const r = rng(k);
  const by = e.tgl_lahir ? Number(e.tgl_lahir.slice(0, 4)) : 1990;
  const JUR = { 'Produksi': 'Teknik Industri', 'Gudang & Logistik': 'Manajemen Logistik', 'Penjualan': 'Manajemen Pemasaran', 'Pemasaran': 'Ilmu Komunikasi', 'Keuangan & Akuntansi': 'Akuntansi', 'SDM & GA': 'Psikologi', 'IT': 'Teknik Informatika', 'Pengadaan': 'Manajemen', 'Direksi': 'Manajemen' };
  const edu = [];
  const p = e.pendidikan;
  if (['D3', 'S1', 'S2', 'S3'].includes(p)) edu.push({ j: p === 'D3' ? 'D3' : 'S1', ins: pick(r, ['Universitas Contoh Nusantara', 'Institut Contoh Bekasi', 'Politeknik Contoh Jakarta', 'Universitas Contoh Surabaya']), jur: JUR[e.divisi] || 'Manajemen', th: by + (p === 'D3' ? 21 : 22) });
  if (['S2', 'S3'].includes(p)) edu.push({ j: 'S2', ins: 'Universitas Contoh Nusantara', jur: 'Magister Manajemen', th: by + 28 });
  if (p && p !== 'SD/SMP') edu.unshift({ j: 'SMA/SMK', ins: pick(r, ['SMA Contoh 1', 'SMK Contoh Teknik', 'SMA Contoh 3']), jur: '—', th: by + 18 });
  const tr = [];
  if (e.tgl_masuk) tr.push({ n: 'Orientasi karyawan baru', by: 'Internal', tgl: addDays(e.tgl_masuk, 7), cert: false });
  const C = { 'Produksi': ['K3 Umum', 'Lembaga sertifikasi (contoh)', 36], 'Gudang & Logistik': ['Operator Forklift (SIO)', 'Lembaga sertifikasi (contoh)', 60], 'IT': ['Cloud Fundamentals', 'Penyedia pelatihan (contoh)', 36], 'SDM & GA': ['Sertifikasi Manajemen SDM', 'LSP (contoh)', 36], 'Keuangan & Akuntansi': ['Brevet Pajak A & B', 'Lembaga pelatihan (contoh)', 0] };
  const c = C[e.divisi];
  if (c && e.aktif === 'Aktif' && e.status !== 'Magang' && r() < 0.75) {
    const iss = addDays(REF_DATE, -Math.round(c[2] ? c[2] * 30.44 + 60 - r() * 360 : 400 + r() * 900));
    tr.push({ n: c[0], by: c[1], tgl: iss, cert: true, no: `SRT-${Math.floor(100000 + r() * 899999)}`, exp: c[2] ? addMonths(iss, c[2]) : '' });
  }
  const em = r() < 0.8
    ? { nama: `${pick(r, ['Sri Wahyuni', 'Bambang Hartono', 'Dewi Lestari', 'Agus Prasetyo', 'Ratna Sari', 'Hadi Susilo'])} (fiktif)`, hub: pick(r, ['Pasangan', 'Orang tua', 'Saudara kandung']), hp: `08••-••••-${Math.floor(1000 + r() * 8999)}` }
    : null;
  return (CACHE[k] = { edu, tr, em, tempat: pick(r, ['Jakarta', 'Bekasi', 'Bandung', 'Surabaya', 'Medan', 'Semarang', 'Yogyakarta']) });
}

export function completeness(e) {
  const F = [
    ['Jenis kelamin', e.jk], ['Tanggal lahir', e.tgl_lahir], ['Pendidikan', e.pendidikan], ['Status PTKP', e.ptkp],
    ['Divisi', e.divisi], ['Jabatan', e.jabatan], ['Level', e.level],
    ['Atasan', e.atasan || (e.level === 'Direktur' ? '-' : '')], ['Lokasi', e.lokasi], ['Tanggal masuk', e.tgl_masuk],
    ['Email kantor', e.email], ['Kontak darurat', ext(e).em ? 'ok' : ''],
  ];
  if (e.status !== 'PKWTT') F.push(['Akhir kontrak', e.akhir_kontrak]);
  if (e.aktif === 'Keluar') F.push(['Tanggal keluar', e.tgl_keluar]);
  const miss = F.filter((f) => !f[1]).map((f) => f[0]);
  const idn = ['hp', 'ktp', 'npwp', 'bpjstk', 'bpjskes'].filter((k) => e[k]).length;
  return { pct: Math.round((100 * (F.length - miss.length)) / F.length), miss, idn };
}

export function history(e) {
  const h = [];
  if (['Supervisor', 'Manajer'].includes(e.level) && e.masa >= 4 && e.tgl_masuk) {
    h.push({ eff: addMonths(e.tgl_masuk, 36), t: '(sebelum Myralix)', who: 'Riwayat dari file lama', why: 'Promosi', contoh: true,
      items: [['Jabatan', `Staf ${e.divisi}`, e.jabatan], ['Level', 'Staf', e.level]] });
  }
  h.push({ eff: '2026-11-03', t: '2026-11-03 09:12', who: 'Rina (HR Admin)', why: 'Impor awal', items: [['Data karyawan', '—', 'Dibuat lewat impor batch #1']] });
  return h;
}

export const buildProfile = (e) => ({ X: ext(e), cp: completeness(e), pk: pkwtCheck(e), pen: pensionDate(e), C: contracts(e), H: history(e) });

export function aiSummary(e, p) {
  const certSoon = p.X.tr.filter((t) => t.exp && daysBetween(REF_DATE, t.exp) <= CERT_WARN);
  const parts = [`${e.jabatan} di ${e.divisi || '(divisi kosong)'}, ${(e.lokasi || '').split(' (')[0]}, masa kerja ${dec(e.masa)} tahun (${e.status}).`];
  if (e.warn) {
    parts.push(`Kontrak ${e.sisa < 0 ? `sudah lewat ${-e.sisa} hari` : `berakhir dalam ${e.sisa} hari`}${p.pk ? `, kontrak ke-${p.pk.n}, akumulasi PKWT ${dec(p.pk.yrs)} dari ${PKWT_MAX} tahun` : ''}.`);
  }
  if (e.dalamProb) parts.push(`Masih dalam masa percobaan sampai ${fmtDate(e.akhirProb)}.`);
  if (certSoon.length) parts.push(`Sertifikat ${certSoon.map((t) => t.n).join(', ')} perlu diperpanjang.`);
  if (p.cp.miss.length) parts.push(`Data yang belum lengkap: ${p.cp.miss.join(', ')}.`);
  const sug = e.warn ? 'Saran: minta rekomendasi perpanjangan dari atasan langsung.'
    : certSoon.length ? 'Saran: jadwalkan pelatihan ulang sebelum sertifikat kedaluwarsa.'
    : p.cp.miss.length ? 'Saran: lengkapi data yang kosong.'
    : 'Tidak ada tindakan mendesak.';
  return { text: parts.join(' '), suggestion: sug };
}