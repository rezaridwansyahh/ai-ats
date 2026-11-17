const FORCED = ['missing_name', 'nik_dup_in_file', 'nik_ambiguous'];

export const unwrap = (body, key) => {
  if (body && body[key] != null) return body;
  const hit = Object.values(body ?? {}).find((v) => v && typeof v === 'object' && v[key] != null);
  return hit ?? body;
};

export function samplesOf(rows = [], header) {
  const out = [];
  for (const r of rows) {
    const v = r?.cells?.[header];
    if (v && !out.includes(v)) out.push(v.length > 40 ? `${v.slice(0, 40)}…` : v);
    if (out.length === 3) break;
  }
  return out;
}

export function duplicateFields(map) {
  const seen = new Set();
  const dup = new Set();
  Object.values(map).forEach((f) => {
    if (!f) return;
    if (seen.has(f)) dup.add(f);
    seen.add(f);
  });
  return dup;
}

export const mappingPayload = (map) => Object.fromEntries(Object.entries(map).map(([h, f]) => [h, f || null]));

export const decisionPayload = (decisions) =>
  Object.fromEntries(Object.entries(decisions).filter(([, d]) => d === 'skip' || d === 'merge'));

export function groupIssues(issues = []) {
  const byRow = new Map();
  issues.forEach((i) => {
    const g = byRow.get(i.row) ?? { row: i.row, nik: i.nik, nama: i.nama, issues: [] };
    g.issues.push(i);
    byRow.set(i.row, g);
  });
  return [...byRow.values()].map((g) => ({
    ...g,
    forced: g.issues.some((i) => FORCED.includes(i.kind)),
    same: g.issues.find((i) => i.kind === 'same_name') ?? null,
  }));
}

export function nameList(names, max = 3) {
  const u = [...new Set(names.filter(Boolean))];
  return u.length > max ? `${u.slice(0, max).join(', ')} +${u.length - max} lainnya` : u.join(', ');
}