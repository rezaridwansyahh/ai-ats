// MSDT (Battery D only). Ported verbatim from MSDTTest.jsx's finish().
// Already content-driven (content.a.scale/content.b.scale) — no fix needed.
//
// Answer shape per question: 'A' | 'B' | null.
// STYLE_ORDER/TO_STYLES/RO_STYLES/E_STYLES/*_MAX/STYLES are subtest-level
// scoring+display config, not per-question content — copied verbatim from
// the frontend data file (data/msdt.data.js) rather than hand-transcribed,
// since STYLES in particular is a large presentational object.

import { STYLES, STYLE_ORDER, TO_STYLES, RO_STYLES, E_STYLES, TO_MAX, RO_MAX, E_MAX } from './data/msdt.data.js';

export function scoreMSDT(items, answersByOrderIndex, { pctToScore10, getVerdict }) {
  const raw = {};
  STYLE_ORDER.forEach((s) => (raw[s] = 0));

  items.forEach((it) => {
    const choice = answersByOrderIndex[it.order_index];
    if (!choice) return;
    const c = it.content;
    if (choice === 'A') raw[c.a.scale]++;
    else if (choice === 'B') raw[c.b.scale]++;
  });

  const sumFamily = (arr) => arr.reduce((s, k) => s + raw[k], 0);
  const TO = Math.min(100, Math.round((sumFamily(TO_STYLES) / TO_MAX) * 100));
  const RO = Math.min(100, Math.round((sumFamily(RO_STYLES) / RO_MAX) * 100));
  const E = Math.min(100, Math.round((sumFamily(E_STYLES) / E_MAX) * 100));
  const dominant = Object.entries(raw).sort((a, b) => b[1] - a[1])[0][0];
  const effectPct = Math.round((TO + RO) / 2);
  const score10 = pctToScore10(effectPct);

  return {
    raw, TO, RO, E, dominant, effectPct, score10,
    verdict: getVerdict(score10).v,
    styleInfo: STYLES[dominant],
  };
}
