// localStorage bridge for Battery D candidate-card progress (profile + per-test results).
// Kept compatible with the reference HTML key (myx-bat-d-v8).
export const SKEY = 'myx-bat-d-v8';

export function loadCardData(key = SKEY) {
  try {
    const d = JSON.parse(localStorage.getItem(key) || 'null');
    if (d && d.profile) return { profile: d.profile, results: d.results || {} };
    return null;
  } catch {
    return null;
  }
}

export function saveCardData(profile, results, key = SKEY) {
  try {
    localStorage.setItem(key, JSON.stringify({ profile, results }));
  } catch {
    // ignore quota/serialize errors
  }
}

export function clearCardData(key = SKEY) {
  localStorage.removeItem(key);
}
