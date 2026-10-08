// EPPS (Battery B & C — byte-identical components confirmed by audit).
// Ported verbatim from EPPSTest.jsx's finish(). Already content-driven
// (content.a.scale/content.b.scale) — no fix needed.
//
// Answer shape per question: 'A' | 'B' | null.
// CON_PAIRS/SCALE_ORDER are subtest-level scoring config (which item indices
// pair up for the consistency check), not per-question content — genuinely
// global, ported as constants.

export const SCALE_ORDER = [
  'ach', 'def', 'ord', 'exh', 'aut', 'aff', 'int', 'suc', 'dom', 'aba',
  'nur', 'chg', 'end', 'agg', 'het',
];

// [item_order_index_1, item_order_index_2] pairs — 1-based, matching the
// frontend's own 1-based indexing into the answers/items arrays.
export const CON_PAIRS = [
  [1, 66], [7, 72], [8, 73], [9, 74], [5, 70], [76, 146], [82, 147],
  [78, 143], [79, 149], [80, 150], [151, 221], [152, 217], [158, 223],
  [155, 225], [159, 224],
];

export function scoreEPPS(items, answersByOrderIndex) {
  const scores = {};
  SCALE_ORDER.forEach((s) => (scores[s] = 0));

  items.forEach((it) => {
    const a = answersByOrderIndex[it.order_index];
    if (!a) return;
    const scale = a === 'A' ? it.content.a.scale : it.content.b.scale;
    if (scale) scores[scale]++;
  });

  let conScore = 0;
  CON_PAIRS.forEach(([i1, i2]) => {
    const a1 = answersByOrderIndex[i1];
    const a2 = answersByOrderIndex[i2];
    if (!a1 || !a2) return;
    const item1 = items[i1 - 1];
    const item2 = items[i2 - 1];
    const c1 = a1 === 'A' ? !!item1.content.a.scale : !!item1.content.b.scale;
    const c2 = a2 === 'A' ? !!item2.content.a.scale : !!item2.content.b.scale;
    if (c1 === c2) conScore++;
  });

  return { scores, conScore };
}
