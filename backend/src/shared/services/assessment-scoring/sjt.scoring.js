// SJT (Battery C & D — confirmed byte-identical scoreSJT/lvlSJT code and
// COMPS table in both batteries' utils/scoring.js and data/sjt.js). Ported
// verbatim. Already content-driven (content.competency, content.options[].score)
// — no fix needed.
//
// Answer shape per question: chosen option index (0..3) or null.
// COMPS maxScores are subtest-level scoring config (how many points each
// competency can earn across all 22 items), not per-question content.

export const COMPS_MAX_SCORE = {
  KK: 15, KOM: 12, MK: 12, OH: 9, AD: 9, IE: 9,
};

export function lvlSJT(pct) {
  if (pct >= 85) return 'Sangat Unggul';
  if (pct >= 70) return 'Unggul';
  if (pct >= 55) return 'Kompeten';
  if (pct >= 40) return 'Berkembang';
  return 'Pemula';
}

export function scoreSJT(items, answersByOrderIndex, { pctToScore10, getVerdict }) {
  const compScores = { KK: 0, KOM: 0, MK: 0, OH: 0, AD: 0, IE: 0 };
  let totalScore = 0;

  items.forEach((it) => {
    const idx = answersByOrderIndex[it.order_index];
    if (idx == null) return;
    const opt = it.content.options[idx];
    if (!opt) return;
    const s = opt.score ?? 0;
    if (compScores[it.content.competency] != null) compScores[it.content.competency] += s;
    totalScore += s;
  });

  const compPct = {};
  for (const k of Object.keys(compScores)) {
    compPct[k] = Math.round((compScores[k] / (COMPS_MAX_SCORE[k] || 1)) * 100);
  }

  const totalMax = Object.values(COMPS_MAX_SCORE).reduce((sum, m) => sum + m, 0) || 66;
  const overallPct = Math.round((totalScore / totalMax) * 100);
  const score10 = pctToScore10(overallPct);
  const verdict = getVerdict(score10).v;

  let profile;
  if (overallPct >= 78) {
    profile = 'BJ';
  } else if (overallPct >= 58) {
    const topComp = Object.entries(compPct).sort((a, b) => b[1] - a[1])[0][0];
    if (topComp === 'KK' || topComp === 'OH') profile = 'EK';
    else if (topComp === 'KOM' || topComp === 'MK') profile = 'KL';
    else profile = 'AE';
  } else {
    profile = 'BK';
  }

  return { compScores, compPct, totalScore, overallPct, score10, verdict, profile };
}
