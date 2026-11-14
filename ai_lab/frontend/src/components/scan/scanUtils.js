export const LOW = 0.85; 

export const FIELDS = [
  ['nama', 'Nama Lengkap'], ['jk', 'Jenis Kelamin'], ['tgl_lahir', 'Tanggal Lahir'], ['pendidikan', 'Pendidikan Terakhir'],
  ['divisi', 'Divisi'], ['jabatan', 'Jabatan'], ['lokasi', 'Lokasi Kerja'], ['status', 'Status Karyawan'],
  ['tgl_masuk', 'Tanggal Masuk'], ['akhir_kontrak', 'Tanggal Akhir Kontrak'], ['email', 'Email Kantor'],
];

export const ENUMS = {
  jk: ['Laki-laki', 'Perempuan'],
  pendidikan: ['SD/SMP', 'SMA/SMK', 'D3', 'S1', 'S2', 'S3'],
  status: ['PKWTT', 'PKWT', 'Magang'],
};
export const DATE_KEYS = ['tgl_lahir', 'tgl_masuk', 'akhir_kontrak'];

export const rowsOf = (body) => (Array.isArray(body) ? body : body?.employees ?? body?.data ?? []);

const toConf = (c) => {
  const n = Number(c);
  if (c == null || c === '' || Number.isNaN(n)) return null;
  return n > 1 ? n / 100 : n; // accepts 0.97 or 97
};

export function normalizeScan(body) {
  const src = body?.fields ?? body?.extracted ?? body?.data ?? body?.result ?? body?.employee ?? body;
  const found = {};
  const put = (key, v) => {
    found[key] = v && typeof v === 'object'
      ? { value: v.value ?? v.text ?? '', conf: toConf(v.confidence ?? v.conf ?? v.score), raw: v.raw ?? v.source_text ?? '', note: v.note ?? '' }
      : { value: v ?? '', conf: null, raw: '', note: '' };
  };
  if (Array.isArray(src)) src.forEach((f) => { const k = f?.key ?? f?.field ?? f?.name; if (k) put(k, f); });
  else if (src && typeof src === 'object') Object.entries(src).forEach(([k, v]) => put(k, v));

  return FIELDS.map(([key, label]) => ({
    key, label, ok: false,
    value: String(found[key]?.value ?? ''),
    conf: found[key]?.conf ?? null,
    raw: found[key]?.raw ?? '',
    note: found[key]?.note ?? '',
  }));
}

const isRealDate = (v) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const d = new Date(`${v}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
};

export function validate(values) {
  const errs = {};
  if (!values.nama) errs.nama = 'Nama wajib diisi';
  if (!ENUMS.status.includes(values.status)) errs.status = `Status harus salah satu dari: ${ENUMS.status.join(', ')}`;
  DATE_KEYS.forEach((k) => {
    if (values[k] && !isRealDate(values[k])) errs[k] = 'Format tanggal harus YYYY-MM-DD';
  });
  return errs;
}

export function buildPayload(values) {
  const out = {};
  FIELDS.forEach(([key]) => {
    if (values[key]) out[key] = values[key];
  });
  return out;
}