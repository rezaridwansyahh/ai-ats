// Scoring helpers shared between Candidate Card and Report flows.

export const IQ_TABLE = [
  59, 59, 61, 64, 67, 69, 71, 73, 75, 78, 80, 81, 83, 86, 88, 90, 93, 95,
  97, 98, 100, 102, 104, 106, 108, 111, 113, 114, 116, 118, 120, 121, 123,
  125, 126, 128, 130, 132, 134, 136, 138, 140, 142, 143, 146, 146, 146,
  146, 146, 146, 146,
];

export const IQ_CLASSES = [
  { min: 130, label: 'Sangat Superior', color: '#059669' },
  { min: 120, label: 'Superior', color: '#0369A1' },
  { min: 110, label: 'Di Atas Rata-rata', color: '#7C3AED' },
  { min: 90, label: 'Rata-rata', color: '#D97706' },
  { min: 80, label: 'Di Bawah Rata-rata', color: '#D97706' },
  { min: 70, label: 'Batas Bawah', color: '#DC2626' },
  { min: 0, label: 'Sangat Rendah', color: '#DC2626' },
];

export function getIQ(raw) {
  return IQ_TABLE[Math.min(Math.max(raw, 0), 50)] || 90;
}

export function getIQClass(iq) {
  for (const c of IQ_CLASSES) if (iq >= c.min) return c;
  return IQ_CLASSES[IQ_CLASSES.length - 1];
}

export function rawToPercentile(raw, max) {
  const r = (raw / max) * 100;
  if (r >= 95) return 99;
  if (r >= 85) return 92;
  if (r >= 75) return 84;
  if (r >= 65) return 75;
  if (r >= 55) return 63;
  if (r >= 45) return 50;
  if (r >= 38) return 40;
  if (r >= 30) return 30;
  if (r >= 22) return 20;
  if (r >= 15) return 12;
  if (r >= 8) return 6;
  return 3;
}

export function pctToScore10(pct) {
  return Math.max(1, Math.min(10, Math.round(pct / 10)));
}

export function getVerdict(s) {
  if (s >= 7)
    return { v: 'pass', label: 'LOLOS', short: 'Lolos', emoji: '✅', color: '#15803D', bg: '#F0FDF4', br: '#16A34A' };
  if (s >= 5)
    return { v: 'warn', label: 'PERTIMBANGKAN', short: 'Pertimbangkan', emoji: '⚠️', color: '#92400E', bg: '#FFFBEB', br: '#D97706' };
  return { v: 'fail', label: 'TIDAK LOLOS', short: 'Tidak Lolos', emoji: '❌', color: '#991B1B', bg: '#FFF1F2', br: '#DC2626' };
}

export function getGrade(pct) {
  if (pct >= 90) return { g: 'A', l: 'Sangat Tinggi', c: '#059669', bg: '#ECFDF5' };
  if (pct >= 75) return { g: 'B', l: 'Tinggi', c: '#0369A1', bg: '#EFF6FF' };
  if (pct >= 26) return { g: 'C', l: 'Rata-rata', c: '#D97706', bg: '#FFFBEB' };
  if (pct >= 11) return { g: 'D', l: 'Rendah', c: '#DC2626', bg: '#FEF2F2' };
  return { g: 'E', l: 'Sangat Rendah', c: '#991B1B', bg: '#FFF1F2' };
}

export function s10ToLabel(s) {
  if (s >= 9) return 'Sangat Tinggi';
  if (s >= 7) return 'Tinggi';
  if (s >= 5) return 'Rata-rata';
  if (s >= 3) return 'Rendah';
  return 'Sangat Rendah';
}

export function levelColor(l) {
  return { Tinggi: '#059669', Sedang: '#D97706', Rendah: '#DC2626' }[l] || '#64748B';
}

export function levelBg(l) {
  return { Tinggi: '#ECFDF5', Sedang: '#FFFBEB', Rendah: '#FEF2F2' }[l] || '#F9FAFB';
}

export function rangeLbl(r) {
  return { HIGH: 'Tinggi', MIDDLE: 'Sedang', LOW: 'Rendah' }[r] || r;
}

export function rangeColor(r) {
  return { HIGH: '#059669', MIDDLE: '#D97706', LOW: '#DC2626' }[r] || '#64748B';
}

export function rangeBg(r) {
  return { HIGH: '#ECFDF5', MIDDLE: '#FFFBEB', LOW: '#FEF2F2' }[r] || '#F9FAFB';
}

// PAPI range rules (special per dimension code)
export function getPapiRange(code, score) {
  if (code === 'G') return score <= 3 ? 'LOW' : score <= 7 ? 'MIDDLE' : 'HIGH';
  if (code === 'Z' || code === 'K') return score <= 2 ? 'LOW' : score <= 5 ? 'MIDDLE' : 'HIGH';
  if (code === 'S') return score < 6 ? 'LOW' : 'HIGH';
  if (code === 'V') return score < 5 ? 'LOW' : 'HIGH';
  if (code === 'A') return score <= 5 ? 'LOW' : 'HIGH';
  if (code === 'E') return score <= 2 ? 'LOW' : score <= 6 ? 'MIDDLE' : 'HIGH';
  return score <= 3 ? 'LOW' : score <= 6 ? 'MIDDLE' : 'HIGH';
}

export function fmtTime(s) {
  const m = Math.floor(s / 60);
  const ss = s % 60;
  return `${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
}

export function fmtDateID(d = new Date()) {
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
}

// Lenient TK-GI answer normalization
export function normalizeAns(raw) {
  if (!raw && raw !== 0) return '';
  let s = String(raw).trim().toLowerCase().replace(/\s+/g, ' ');
  s = s.replace(/rp\.?|rupiah|dolar|\$|kaki|cm|meter/g, '').trim();
  if (s.includes(',')) return s.split(',').map((p) => p.trim()).sort().join(',');
  return s;
}

export function checkGIAnswer(qn, userAns, KEYS) {
  const norm = normalizeAns(userAns, qn);
  const key = String(KEYS[qn]).trim().toLowerCase();
  if (norm === key) return true;
  const specials = {
    4: ['tidak', 't', 'no', 'n'],
    22: ['s', 'salah'],
    32: ['ya', 'y', 'yes'],
    27: ['1/30', '0.03', '0.033', '0.0333'],
    31: ['1/9', '0.111', '0.1111'],
    8: ['0.125', '1/8', '⅛'],
    35: ['0.25', '1/4', '¼'],
    37: ['0.0625', '1/16'],
    43: ['0.33', '.33'],
  };
  if (specials[qn] && specials[qn].includes(norm)) return true;
  if (qn === 22 && (norm === 's' || norm.startsWith('s ') || norm === 'salah')) return true;
  return false;
}
