// localStorage bridge for Battery C candidate-card progress (profile + per-test results).
// Kept compatible with the reference HTML key (myx-bat-c-v8).
export const SKEY = 'myx-bat-c-v8';

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
