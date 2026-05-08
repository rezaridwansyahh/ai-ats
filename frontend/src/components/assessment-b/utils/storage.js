// localStorage bridge keys (kept identical to reference HTML so older data still loads).
export const SKEY = 'myx-bat-b-v8';        // Card data (profile + results)
export const STATE_KEY = 'myx-rpt-b-v8';   // Report annotations (narratives, recruiter notes)

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

export function loadReportState() {
  try {
    return JSON.parse(localStorage.getItem(STATE_KEY) || '{}');
  } catch {
    return {};
  }
}

export function saveReportState(state) {
  try {
    localStorage.setItem(STATE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

export function clearReportState() {
  localStorage.removeItem(STATE_KEY);
}
