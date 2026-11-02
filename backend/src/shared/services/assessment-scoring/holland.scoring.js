// Holland RIASEC — genuinely two separate implementations exist (confirmed by
// direct audit of both batteries' live components): Battery A's HollandTest.jsx
// calls assessment-a/utils/scoring.js's scoreHolland (persisted shape includes
// comboInfo); Battery B's HollandTest.jsx has its own entirely separate inline
// finish() (persisted shape has `composite` instead). Both ported here as
// distinct functions rather than forced into one.
//
// Answer shape per question (both batteries): boolean true/false/null.

import { CONSISTENCY, COMBOS } from './data/holland.data.js';

// Battery A — ported from assessment-a/utils/scoring.js's scoreHolland, but
// reading each question's dimension from `content.dimension` instead of the
// hardcoded static `HOL_QS` import matched by position (same category of fix
// as bigfive/disc.scoring.js — content.dimension is confirmed seeded
// correctly from that same static source).
export function scoreHollandA(items, answersByOrderIndex) {
  const scores = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
  items.forEach((it) => {
    const ans = answersByOrderIndex[it.order_index];
    if (ans === true) scores[it.content.dimension]++;
  });
  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const code3 = ranked.slice(0, 3).map((x) => x[0]).join('');
  const top1 = ranked[0][0];
  const top2 = ranked[1][0];
  const combo2 = top1 + top2;
  const consistency = CONSISTENCY[combo2] || CONSISTENCY[top2 + top1] || 'Tidak Diketahui';
  const comboInfo = COMBOS[combo2] || COMBOS[top2 + top1] || null;
  return { scores, ranked, code3, top1, top2, combo2, consistency, comboInfo };
}

// Battery B — ported verbatim from assessment-b/candidate/HollandTest.jsx's
// own inline finish(). Already content-driven (content.dimension), no fix
// needed here.
export function scoreHollandB(items, answersByOrderIndex) {
  const scores = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
  items.forEach((it) => {
    const ans = answersByOrderIndex[it.order_index];
    if (ans === true) scores[it.content.dimension]++;
  });
  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const code3 = ranked.slice(0, 3).map((x) => x[0]).join('');
  const top1 = ranked[0][0];
  const top2 = ranked[1][0];
  const combo2 = top1 + top2;
  const consistency = CONSISTENCY[combo2] || CONSISTENCY[top2 + top1] || 'Tidak Diketahui';
  const top2Score = ranked.slice(0, 2).reduce((s, [, v]) => s + v, 0);
  const composite = Math.max(1, Math.min(10, Math.round(((top2Score / (18 * 2)) * 100) / 10)));
  return { scores, ranked, code3, top1, top2, combo2, consistency, composite };
}
