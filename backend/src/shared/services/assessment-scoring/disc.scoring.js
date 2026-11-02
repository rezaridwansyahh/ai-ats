// DISC (Battery A). Ported from assessment-a/utils/scoring.js's scoreDISC —
// reading each option's most_dim/least_dim from the fetched `content` instead
// of the hardcoded static `GROUPS` import (same category of fix as
// bigfive.scoring.js; content.options[].most_dim/least_dim are confirmed
// seeded correctly, verbatim from that same static source).
//
// Answer shape per question (confirmed via DISCTest.jsx's persistAnswer):
// { m: optionIdx|null, l: optionIdx|null } — "most like me" / "least like me".
export function scoreDISC(items, answersByOrderIndex) {
  const line1 = { D: 0, I: 0, S: 0, C: 0 };
  const line2 = { D: 0, I: 0, S: 0, C: 0 };

  items.forEach((it) => {
    const ans = answersByOrderIndex[it.order_index];
    if (!ans) return;
    const options = it.content.options;
    if (ans.m != null) {
      const dim = options[ans.m]?.most_dim;
      if (dim && dim !== '*') line1[dim]++;
    }
    if (ans.l != null) {
      const dim = options[ans.l]?.least_dim;
      if (dim && dim !== '*') line2[dim]++;
    }
  });

  const line3 = {
    D: line1.D - line2.D,
    I: line1.I - line2.I,
    S: line1.S - line2.S,
    C: line1.C - line2.C,
  };
  const pickMax = (obj) => Object.entries(obj).sort((a, b) => b[1] - a[1])[0][0];

  return {
    scores: { line1, line2, line3 },
    dominant: pickMax(line3),
    adaptive: pickMax(line1),
    natural: pickMax(line2),
  };
}
