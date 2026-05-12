// localStorage bridge for Battery A candidate-card progress (profile + per-test results).
// Kept compatible with the reference HTML key (myx-bat-a-v8). The old AssessmentA.jsx
// used the same key with a different shape ({answers, completedTests, startedAt}) — those
// fields are ignored on load and harmlessly overwritten by saveCardData with the new shape.
export const SKEY = 'myx-bat-a-v8';

export function loadCardData() {
  try {
    const d = JSON.parse(localStorage.getItem(SKEY) || 'null');
    if (d && d.profile) return { profile: d.profile, results: d.results || {} };
    return null;
  } catch {
    return null;
  }
}

export function saveCardData(profile, results) {
  try {
    localStorage.setItem(SKEY, JSON.stringify({ profile, results }));
  } catch {
    // ignore quota/serialize errors
  }
}

export function clearCardData() {
  localStorage.removeItem(SKEY);
}
