// localStorage bridge for Battery B candidate-card progress (profile + per-test results).
// Kept identical to the reference HTML so older data still loads.
// Report annotations have moved to the DB (summary.assessor JSONB on core_applicant_assessment),
// so the previous myx-rpt-b-v8 key is no longer used.
export const SKEY = 'myx-bat-b-v8';

export function loadCardData() {
  try {
    const d = JSON.parse(localStorage.getItem(SKEY) || 'null');
    if (d && d.profile) return d;
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
