// PAPI standard (Battery B & C) and PAPI-L (Battery D) — confirmed
// functionally identical code and ROLE_DIMS/NEED_DIMS values across all three
// by direct audit; one shared scorer covers both, only the subtest differs.
// Ported verbatim from PAPITest.jsx's finish(). Already content-driven
// (content.a.scale/content.b.scale) — no fix needed.
//
// Answer shape per question: 'A' | 'B' | null.

export const ROLE_DIMS = ['G', 'L', 'I', 'T', 'V', 'S', 'R', 'D', 'C', 'E'];
export const NEED_DIMS = ['N', 'A', 'P', 'X', 'B', 'O', 'Z', 'K', 'F', 'W'];

export function scorePapi(items, answersByOrderIndex) {
  const scores = {};
  [...ROLE_DIMS, ...NEED_DIMS].forEach((d) => (scores[d] = 0));

  items.forEach((it) => {
    const a = answersByOrderIndex[it.order_index];
    if (!a) return;
    const dim = a === 'A' ? it.content.a.scale : it.content.b.scale;
    scores[dim]++;
  });

  const roleTotal = ROLE_DIMS.reduce((s, d) => s + scores[d], 0);
  const needTotal = NEED_DIMS.reduce((s, d) => s + scores[d], 0);
  return { scores, roleTotal, needTotal };
}

// Display-time helper (not called during scoring/persist — confirmed via
// audit it's never referenced by finish()) — ported for completeness since
// report rendering may need it, but not part of the persisted score shape.
export function getPapiRange(code, score) {
  if (code === 'G') return score <= 3 ? 'LOW' : score <= 7 ? 'MIDDLE' : 'HIGH';
  if (code === 'Z' || code === 'K') return score <= 2 ? 'LOW' : score <= 5 ? 'MIDDLE' : 'HIGH';
  if (code === 'S') return score < 6 ? 'LOW' : 'HIGH';
  if (code === 'V') return score < 5 ? 'LOW' : 'HIGH';
  if (code === 'A') return score <= 5 ? 'LOW' : 'HIGH';
  if (code === 'E') return score <= 2 ? 'LOW' : score <= 6 ? 'MIDDLE' : 'HIGH';
  return score <= 3 ? 'LOW' : score <= 6 ? 'MIDDLE' : 'HIGH';
}
