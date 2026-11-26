import Model from './attendance-import.model.js';
import { parseSheet } from '../employee-import/employee-import.service.js';
import { isRealDate } from '../../shared/utils/date.util.js';

const MAX_ROWS = 20000;
const DOUBLE_SCAN_SECONDS = 120; // scans closer than this are the same finger press
const NOON = 12 * 3600;          // a lone scan before noon counts as "masuk", after as "pulang"

const bad = (message) => ({ status: 400, message });

const FIELDS = [
  { key: 'pin', label: 'PIN mesin' },
  { key: 'nama', label: 'Nama (hanya untuk cek)' },
  { key: 'waktu', label: 'Tanggal & jam scan' },
  { key: 'mesin', label: 'Lokasi mesin' },
];
const ALIASES = {
  pin: ['acno', 'pin', 'id', 'userid', 'empid', 'idmesin', 'badge'],
  nama: ['nama', 'name', 'employeename', 'namakaryawan'],
  waktu: ['waktu', 'time', 'datetime', 'tanggaljam', 'scantime', 'checktime', 'tanggal', 'date'],
  mesin: ['mesin', 'machine', 'device', 'terminal', 'lokasi'],
};
const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9]/g, '');
const TEMPLATE = {};
for (const [field, names] of Object.entries(ALIASES)) names.forEach((n) => { TEMPLATE[n] = field; });

const normPin = (raw) => String(raw).trim().replace(/^0+(?=\d)/, ''); // "01033" and "1033" are the same PIN
const toTime = (sec) => [Math.floor(sec / 3600), Math.floor((sec % 3600) / 60), sec % 60]
  .map((n) => String(n).padStart(2, '0')).join(':');

// Dates are read day-first (31/10/2026), the usual format of Indonesian machine exports.
function parseDateTime(raw) {
  let m, tgl, h, mi, s = 0;
  if ((m = raw.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{1,2}):(\d{2})(?::(\d{2}))?/))) {
    tgl = `${m[1]}-${m[2]}-${m[3]}`;
    [h, mi, s] = [+m[4], +m[5], +(m[6] ?? 0)];
  } else if ((m = raw.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})[ T](\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?$/i))) {
    tgl = `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
    [h, mi, s] = [+m[4], +m[5], +(m[6] ?? 0)];
    if (m[7]) h = (h % 12) + (m[7].toUpperCase() === 'PM' ? 12 : 0);
  } else if (/^\d{5}(\.\d+)?$/.test(raw) && +raw > 20000 && +raw < 60000) {
    const iso = new Date(Date.UTC(1899, 11, 30) + Math.round(+raw * 86400000)).toISOString();
    tgl = iso.slice(0, 10);
    [h, mi, s] = [+iso.slice(11, 13), +iso.slice(14, 16), +iso.slice(17, 19)];
  } else return null;
  if (!isRealDate(tgl) || h > 23 || mi > 59 || s > 59) return null;
  return { tgl, sec: h * 3600 + mi * 60 + s };
}

// Employees whose name starts with every part of the machine name ("Bayu G." -> "Bayu Gunawan").
const tokens = (s) => String(s).toLowerCase().replace(/[^a-z\s]/g, ' ').split(/\s+/).filter(Boolean);
function candidates(nama, employees) {
  const t = tokens(nama);
  if (!t.length) return [];
  return employees
    .filter((e) => {
      const et = tokens(e.nama);
      let i = 0;
      return t.every((x) => {
        while (i < et.length && !et[i].startsWith(x)) i++;
        return i++ < et.length;
      });
    })
    .slice(0, 5)
    .map((e) => ({ nik: e.nik, nama: e.nama }));
}

const parseJson = (raw, name, fallback) => {
  if (raw == null || raw === '') return fallback;
  try { return JSON.parse(raw); } catch { throw bad(`${name} must be valid JSON`); }
};

function checkMapping(mapping) {
  if (!mapping || typeof mapping !== 'object' || Array.isArray(mapping)) throw bad('mapping is required');
  const keys = FIELDS.map((f) => f.key);
  const used = new Set();
  for (const f of Object.values(mapping)) {
    if (f == null) continue;
    if (!keys.includes(f)) throw bad(`Unknown field "${f}" in mapping`);
    if (used.has(f)) throw bad(`Field "${f}" is mapped to more than one column`);
    used.add(f);
  }
  if (!used.has('pin')) throw bad('A column must be mapped to pin');
  if (!used.has('waktu')) throw bad('A column must be mapped to waktu');
}

function parseScans(rows, mapping) {
  const col = {};
  for (const [h, f] of Object.entries(mapping)) if (f) col[f] = h;

  const scans = [], invalid = [];
  for (const row of rows) {
    const pin = normPin(row.cells[col.pin] ?? '');
    const raw = (row.cells[col.waktu] ?? '').trim();
    const when = parseDateTime(raw);
    if (!pin) invalid.push({ row: row.row, message: 'PIN kosong' });
    else if (!when) invalid.push({ row: row.row, message: `Waktu "${raw}" tidak dikenali` });
    else scans.push({ pin, nama: col.nama ? (row.cells[col.nama] ?? '').trim() : '', ...when });
  }
  const dates = scans.map((s) => s.tgl).sort();
  return { scans, invalid, from: dates[0], to: dates[dates.length - 1] };
}

function buildPlan({ parsed, employees, pinMap, existing, decisions }) {
  const byNik = new Map(employees.map((e) => [e.nik, e]));
  const issues = [];

  const pins = new Map();
  for (const s of parsed.scans) {
    const p = pins.get(s.pin) ?? { pin: s.pin, nama: s.nama, scans: 0 };
    p.scans += 1;
    pins.set(s.pin, p);
  }
  const nikOf = new Map(), newPins = [];
  for (const p of pins.values()) {
    if (pinMap.has(p.pin)) { nikOf.set(p.pin, pinMap.get(p.pin)); continue; }
    const choice = decisions.pins[p.pin] ?? null;
    if (choice && choice !== 'skip') {
      if (!byNik.has(choice)) throw bad(`NIK ${choice} tidak ditemukan`);
      nikOf.set(p.pin, choice);
      newPins.push({ pin: p.pin, nik: choice });
    }
    issues.push({ kind: 'unknown_pin', pin: p.pin, nama: p.nama, scans: p.scans, decision: choice, candidates: candidates(p.nama, employees) });
  }

  const groups = new Map();
  for (const s of parsed.scans) {
    const nik = nikOf.get(s.pin);
    if (!nik) continue; // unknown PIN with no decision: its scans are left out
    const key = `${nik}|${s.tgl}`;
    if (!groups.has(key)) groups.set(key, { nik, tgl: s.tgl, secs: [] });
    groups.get(key).secs.push(s.sec);
  }

  const items = [], flagged = [];
  const counts = { insert: 0, update: 0, unchanged: 0, skip: 0, flagged: 0 };
  let doubles = 0;
  for (const [key, g] of groups) {
    const kept = [];
    for (const sec of g.secs.sort((a, b) => a - b)) {
      if (kept.length && sec - kept[kept.length - 1] < DOUBLE_SCAN_SECONDS) doubles += 1;
      else kept.push(sec);
    }
    const single = kept.length === 1;
    const jam_masuk = single && kept[0] >= NOON ? null : toTime(kept[0]);
    const jam_pulang = single ? (kept[0] >= NOON ? toTime(kept[0]) : null) : toTime(kept[kept.length - 1]);
    const nama = byNik.get(g.nik).nama;

    const item = { nik: g.nik, nama, tgl: g.tgl, jam_masuk, jam_pulang, action: 'insert' };
    const old = existing.get(key);
    if (old) {
      item.old = old;
      if (old.source !== 'mesin') {
        const overwrite = decisions.conflicts[key] === 'overwrite';
        issues.push({ kind: 'conflict', key, nik: g.nik, nama, tgl: g.tgl, existing_status: old.status, existing_source: old.source, decision: overwrite ? 'overwrite' : 'keep' });
        item.action = overwrite ? 'update' : 'skip';
      } else {
        const same = old.status === 'Hadir' && old.jam_masuk === jam_masuk && old.jam_pulang === jam_pulang;
        item.action = same ? 'unchanged' : 'update';
      }
    }
    counts[item.action] += 1;
    if (single && (item.action === 'insert' || item.action === 'update')) {
      counts.flagged += 1;
      flagged.push({ nik: g.nik, nama, tgl: g.tgl });
    }
    items.push(item);
  }

  if (parsed.invalid.length) issues.push({ kind: 'invalid_rows', count: parsed.invalid.length, examples: parsed.invalid.slice(0, 5) });
  if (doubles) issues.push({ kind: 'double_scan', count: doubles });
  if (flagged.length) issues.push({ kind: 'single_scan', count: flagged.length, examples: flagged.slice(0, 5) });

  return { items, issues, counts, newPins, scans: parsed.scans.length, days: counts.insert + counts.update + counts.unchanged };
}

async function prepare(file, body) {
  if (!file) throw bad('file is required');
  const mapping = parseJson(body?.mapping, 'mapping', null);
  checkMapping(mapping);

  const raw = parseJson(body?.decisions, 'decisions', {}) ?? {};
  const decisions = { pins: {}, conflicts: {} };
  for (const [pin, v] of Object.entries(raw.pins ?? {})) {
    if (typeof v === 'string' && v.trim()) decisions.pins[normPin(pin)] = v.trim().toLowerCase() === 'skip' ? 'skip' : v.trim().toUpperCase();
  }
  for (const [key, v] of Object.entries(raw.conflicts ?? {})) {
    if (v === 'overwrite') decisions.conflicts[key] = v;
  }

  const { rows } = await parseSheet(file, MAX_ROWS);
  const parsed = parseScans(rows, mapping);
  if (!parsed.scans.length) throw bad('Tidak ada scan yang bisa dibaca. Periksa pemetaan kolom PIN dan waktu.');
  return { parsed, mapping, decisions, totalRows: rows.length };
}

async function loadExisting(db, parsed) {
  const days = await Model.getDays(db, parsed.from, parsed.to);
  return new Map(days.map((d) => [`${d.nik}|${d.tgl}`, d]));
}

class AttendanceImportService {
  async preview(file) {
    if (!file) throw bad('file is required');
    const { headers, rows } = await parseSheet(file, MAX_ROWS);

    const key = [...headers].sort().join('|');
    const saved = (await Model.getSavedMappings()).find((m) => Object.keys(m).sort().join('|') === key) ?? null;

    const mapping = headers.map((h) => {
      if (saved) return { header: h, field: saved[h] ?? null, confidence: 1, source: 'saved' };
      const field = TEMPLATE[norm(h)] ?? null;
      return { header: h, field, confidence: field ? 1 : 0, source: field ? 'template' : null };
    });
    const taken = new Set();
    for (const m of mapping) {
      if (m.field && taken.has(m.field)) Object.assign(m, { field: null, confidence: 0, source: null }); 
      else if (m.field) taken.add(m.field);
    }

    return {
      file_name: file.originalname,
      total_rows: rows.length,
      fields: FIELDS,
      mapping,
      sample_rows: rows.slice(0, 5),
      saved_mapping: !!saved,
    };
  }

  async validate(file, body) {
    const { parsed, decisions, totalRows } = await prepare(file, body);
    const employees = await Model.getEmployees();
    const pinMap = await Model.getPinMap();
    const existing = await loadExisting(undefined, parsed);
    const plan = buildPlan({ parsed, employees, pinMap, existing, decisions });

    return {
      total_rows: totalRows,
      period: { from: parsed.from, to: parsed.to },
      scans: plan.scans,
      days: plan.days,
      counts: plan.counts,
      issues: plan.issues,
    };
  }

  async commit(file, body) {
    const { parsed, mapping, decisions } = await prepare(file, body);

    return await Model.transaction(async (db) => {
      const employees = await Model.getEmployees(db);
      const pinMap = await Model.getPinMap(db);
      const existing = await loadExisting(db, parsed);
      const plan = buildPlan({ parsed, employees, pinMap, existing, decisions });

      const writes = plan.items.filter((i) => i.action === 'insert' || i.action === 'update');
      const undo = writes.map((i) => (i.old
        ? {
            op: 'update', nik: i.nik, tgl: i.tgl,
            old: { status: i.old.status, jam_masuk: i.old.jam_masuk, jam_pulang: i.old.jam_pulang, ket: i.old.ket, source: i.old.source, import_id: i.old.import_id },
          }
        : { op: 'insert', nik: i.nik, tgl: i.tgl }));

      const importId = await Model.createImport(db, file.originalname, mapping, undo);
      for (const p of plan.newPins) await Model.savePin(db, p.pin, p.nik);
      for (const i of writes) await Model.upsertDay(db, i, importId);

      return { import_id: importId, scans: plan.scans, days: plan.days, ...plan.counts };
    });
  }

  async undo(id) {
    if (!Number.isInteger(Number(id))) throw bad('Invalid import id');
    const imp = await Model.getImport(id);
    if (!imp) throw { status: 404, message: 'Import not found' };
    if (imp.undone_at) throw bad('Impor ini sudah dibatalkan');
    if (imp.expired) throw bad('Batas pembatalan 24 jam sudah lewat');

    return await Model.transaction(async (db) => {
      let removed = 0, restored = 0, skipped = 0;
      for (const u of imp.undo) {
        const n = u.op === 'insert'
          ? await Model.deleteDay(db, u.nik, u.tgl, imp.id)
          : await Model.restoreDay(db, u.nik, u.tgl, imp.id, u.old);
        if (!n) skipped += 1;
        else if (u.op === 'insert') removed += 1;
        else restored += 1;
      }
      await Model.markUndone(db, imp.id);
      return { import_id: imp.id, removed, restored, skipped };
    });
  }
}

export default new AttendanceImportService();