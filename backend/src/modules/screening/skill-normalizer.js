import skillAliasModel from './skill-alias.model.js';

const TTL_MS = 5 * 60 * 1000;

let cache = null;
let cachedAt = 0;
let inflight = null;

async function loadCache() {
  const rows = await skillAliasModel.getAll();
  const map = new Map();
  for (const row of rows) {
    map.set(row.alias.toLowerCase(), row.canonical);
  }
  cache = map;
  cachedAt = Date.now();
  return cache;
}

async function getCache() {
  if (cache && Date.now() - cachedAt < TTL_MS) return cache;
  if (!inflight) {
    inflight = loadCache().finally(() => { inflight = null; });
  }
  return inflight;
}

export function invalidateAliasCache() {
  cache = null;
  cachedAt = 0;
}

export async function normalizeSkill(raw) {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const map = await getCache();
  return map.get(trimmed.toLowerCase()) || trimmed;
}

export async function normalizeSkills(skills) {
  if (!Array.isArray(skills)) return [];
  const map = await getCache();
  const seen = new Set();
  const out = [];
  for (const s of skills) {
    if (typeof s !== 'string') continue;
    const trimmed = s.trim();
    if (!trimmed) continue;
    const canonical = map.get(trimmed.toLowerCase()) || trimmed;
    const key = canonical.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      out.push(canonical);
    }
  }
  return out;
}
