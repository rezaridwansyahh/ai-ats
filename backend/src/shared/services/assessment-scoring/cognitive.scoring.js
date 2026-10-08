// Shared cognitive-scoring helpers, ported verbatim from every battery's
// frontend `utils/scoring.js` (confirmed byte-identical across A/B/C/D) —
// the universal IQ/percentile/grade scale used by every battery's GI/PV/KN/PA/KA
// subtests, plus the composite battery-level weighting.

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
  if (s >= 7) return { v: 'pass', label: 'LOLOS', short: 'Lolos', emoji: '✅', color: '#15803D', bg: '#F0FDF4', br: '#16A34A' };
  if (s >= 5) return { v: 'warn', label: 'PERTIMBANGKAN', short: 'Pertimbangkan', emoji: '⚠️', color: '#92400E', bg: '#FFFBEB', br: '#D97706' };
  return { v: 'fail', label: 'TIDAK LOLOS', short: 'Tidak Lolos', emoji: '❌', color: '#991B1B', bg: '#FFF1F2', br: '#DC2626' };
}

export function getGrade(pct) {
  if (pct >= 90) return { g: 'A', l: 'Sangat Tinggi', c: '#059669', bg: '#ECFDF5' };
  if (pct >= 75) return { g: 'B', l: 'Tinggi', c: '#0369A1', bg: '#EFF6FF' };
  if (pct >= 26) return { g: 'C', l: 'Rata-rata', c: '#D97706', bg: '#FFFBEB' };
  if (pct >= 11) return { g: 'D', l: 'Rendah', c: '#DC2626', bg: '#FEF2F2' };
  return { g: 'E', l: 'Sangat Rendah', c: '#991B1B', bg: '#FFF1F2' };
}

// Lenient TK-GI answer normalization — ported verbatim.
export function normalizeAns(raw) {
  if (!raw && raw !== 0) return '';
  let s = String(raw).trim().toLowerCase().replace(/\s+/g, ' ');
  s = s.replace(/rp\.?|rupiah|dolar|\$|kaki|cm|meter/g, '').trim();
  if (s.includes(',')) return s.split(',').map((p) => p.trim()).sort().join(',');
  return s;
}

export function checkGIAnswer(qn, userAns, KEYS) {
  const norm = normalizeAns(userAns);
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

// Scores one TK subtest (GI/PV/KN/PA/KA) — ported from TKTest.jsx's
// computeSubScore. `items` must be ordered by order_index (array position
// idx+1 === order_index, same assumption the frontend makes — guaranteed by
// question.model.js's `ORDER BY order_index`). `answersByOrderIndex` is a
// plain object keyed by order_index.
export function scoreTkSubtest(subtestKey, items, answersByOrderIndex) {
  let ok = 0;

  if (subtestKey === 'GI') {
    const giKeys = {};
    items.forEach((it, idx) => { giKeys[idx + 1] = it.content.correct; });
    items.forEach((it, idx) => {
      const qn = idx + 1;
      const userAns = answersByOrderIndex[qn] ?? '';
      if (checkGIAnswer(qn, userAns, giKeys)) ok++;
    });
  } else {
    items.forEach((it, idx) => {
      const qn = idx + 1;
      const ans = answersByOrderIndex[qn];
      if (ans == null) return;
      if (ans === it.content.correct) ok++;
    });
  }

  const pct = rawToPercentile(ok, items.length);
  const score10 = pctToScore10(pct);
  const grade = getGrade(pct);
  const verdict = getVerdict(score10);
  const res = { ok, items: items.length, pct, score10, g: grade.g, label: grade.l, verdict: verdict.v };
  if (subtestKey === 'GI') {
    res.iq = getIQ(ok);
    res.iqCls = getIQClass(res.iq);
  }
  return res;
}

// Battery-level TK composite — ported from TKTest.jsx's computeComposite.
// `subtestScores` is { [subtestKey]: scoreTkSubtest result }, `tkOrder` is the
// ordered list of subtest keys, `weightByKey` is { [subtestKey]: weight }
// (from assessment_subtest.weight, DB-seeded — not a hardcoded table).
export function computeTkComposite(subtestScores, tkOrder, weightByKey) {
  const weightedSum = tkOrder.reduce(
    (s, k) => s + (subtestScores[k]?.score10 || 0) * Number(weightByKey[k]), 0
  );
  const totalWeight = tkOrder.reduce((s, k) => s + Number(weightByKey[k]), 0);
  const composite = Math.round((weightedSum / totalWeight) * 10) / 10;
  const compVerdict = getVerdict(Math.round(composite));
  return { sub: subtestScores, composite, compVerdict: compVerdict.v };
}
