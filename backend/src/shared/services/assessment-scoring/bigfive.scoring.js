// Big Five (Battery A). Ported from assessment-a/utils/scoring.js's
// scoreBigFive — but reading trait/reverse from each question's `content`
// instead of a hardcoded array matched by position. The frontend version
// still reads a static `BF_ITEMS` import (array-position-matched against the
// answers array) rather than the fetched `content.trait`/`content.reverse` —
// confirmed via its own code comment this was a known gap ("An edit to a
// trait/reverse flag via the DB wouldn't affect scoring until scoreBigFive is
// also updated to take the mapping as an argument"). Since content.trait/
// content.reverse are confirmed seeded correctly (verbatim copies of that
// same static source), reading them directly here is strictly more robust —
// same output today, no second source of truth to drift out of sync.
export function scoreBigFive(items, answersByOrderIndex) {
  const traits = ['E', 'A', 'C', 'N', 'O'];
  const raw = { E: 0, A: 0, C: 0, N: 0, O: 0 };
  const counts = { E: 0, A: 0, C: 0, N: 0, O: 0 };

  items.forEach((it) => {
    const ans = answersByOrderIndex[it.order_index];
    if (ans == null) return;
    const { trait, reverse } = it.content;
    const scored = reverse ? 6 - ans : ans;
    raw[trait] += scored;
    counts[trait]++;
  });

  const pct = {};
  const lvl = {};
  traits.forEach((t) => {
    const n = counts[t] || 1;
    const p = ((raw[t] - n) / (n * 4)) * 100;
    pct[t] = Math.round(Math.max(0, Math.min(100, p)));
    lvl[t] = pct[t] >= 65 ? 'Tinggi' : pct[t] >= 35 ? 'Sedang' : 'Rendah';
  });

  return { raw, pct, lvl, counts };
}
