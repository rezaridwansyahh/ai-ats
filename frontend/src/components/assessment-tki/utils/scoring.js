// Thomas-Kilmann scoring — ported from the reference prototype's calcResult().
// answers: array length 30, each 'A' | 'B' | null (indexed by display position, mapped via ORDER).
import { ITEMS, ORDER, MODE_KEYS } from '../data/tki';

export function fmtDateID(d = new Date()) {
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

/**
 * Count how often each mode was chosen across the 30 forced-choice items.
 * Returns per-mode scores (0–12), sorted entries, dominant + secondary mode keys.
 */
export function computeTKI(answers) {
  const scores = { CP: 0, CL: 0, CM: 0, AV: 0, AC: 0 };
  answers.forEach((ans, idx) => {
    const qi = ORDER[idx];
    const item = ITEMS[qi];
    if (!item) return;
    if (ans === 'A') scores[item.a.m]++;
    else if (ans === 'B') scores[item.b.m]++;
  });
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  return {
    scores,
    sorted,
    dominant: sorted[0][0],
    secondary: sorted[1][0],
  };
}

export { MODE_KEYS };
