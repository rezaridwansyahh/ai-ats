// 16PF (Battery D only). Ported verbatim from PFTest.jsx's finish(). Already
// content-driven (content.factor/score_first/score_last/is_reasoning/
// correct_index) — no fix needed.
//
// Answer shape per question: 'a' | 'b' | 'c' | null.
// FACTOR_ORDER/FACTOR_MAX are subtest-level scoring config, not per-question
// content.

export const FACTOR_ORDER = [
  'A', 'B', 'C', 'E', 'F', 'G', 'H', 'I', 'L', 'M', 'N', 'O', 'Q1', 'Q2', 'Q3', 'Q4',
];

export const FACTOR_MAX = {
  A: 14, B: 18, C: 16, E: 12, F: 16, G: 10, H: 14, I: 8,
  L: 14, M: 16, N: 14, O: 8, Q1: 14, Q2: 14, Q3: 12, Q4: 10,
};

const CHOICE_INDEX = { a: 0, b: 1, c: 2 };

export function scorePF16(items, answersByOrderIndex) {
  const raw = {};
  FACTOR_ORDER.forEach((f) => (raw[f] = 0));

  items.forEach((it) => {
    const choice = answersByOrderIndex[it.order_index];
    if (!choice) return;
    const c = it.content;
    const f = c.factor;
    if (!c.is_reasoning) {
      if (choice === 'a') raw[f] += c.score_first;
      else if (choice === 'b') raw[f] += 1;
      else if (choice === 'c') raw[f] += c.score_last;
    } else {
      const choiceIdx = CHOICE_INDEX[choice];
      if (choiceIdx === c.correct_index) raw[f] += 2;
      else if (choice === 'b' && c.correct_index !== 1) raw[f] += 1;
    }
  });

  const std = {};
  FACTOR_ORDER.forEach((f) => {
    const max = FACTOR_MAX[f] || 1;
    std[f] = Math.max(1, Math.min(10, Math.round((raw[f] / max) * 10)));
  });

  return { raw, std };
}
