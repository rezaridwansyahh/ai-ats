// localStorage bridge for Insights Discovery candidate-card progress (profile + result).
// Mirrors assessment-a/utils/storage.js with an Insights-specific key.
export const SKEY = 'myx-insights-v9';

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
