import path from 'path';
import { Readable } from 'stream';
import ExcelJS from 'exceljs';
import ImportModel from './employee-import.model.js';
import Employee from '../employee/employee.model.js';
import aiService from '../../shared/services/ai.service.js';
import { EXPORT_COLUMNS, referenceDate } from '../employee/employee.service.js';
import { isRealDate } from '../../shared/utils/date.util.js';

const MAX_ROWS = 2000;
const bad = (message) => ({ status: 400, message });

const FIELDS = EXPORT_COLUMNS.map((c) => c.key);
const LABEL = Object.fromEntries(EXPORT_COLUMNS.map((c) => [c.key, c.header]));
const FIELD_HELP = {
  nik: 'employee ID number (NIK internal, e.g. CS26001)',
  nama: 'full name',
  jk: 'gender',
  tgl_lahir: 'date of birth',
  pendidikan: 'highest education',
  divisi: 'division / department',
  jabatan: 'job title / position',
  level: 'job level / grade',
  atasan: 'NIK of the direct manager',
  lokasi: 'work location / office',
  status: 'employment type: PKWTT (permanent / tetap), PKWT (contract / kontrak) or Magang (intern)',
  tgl_masuk: 'hire / join date',
  akhir_kontrak: 'contract end date',
  aktif: 'active or left the company (Aktif / Keluar)',
  tgl_keluar: 'date the employee left',
  alasan: 'reason for leaving',
  email: 'work email',
};

const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9]/g, '');

const TEMPLATE = {};
for (const c of EXPORT_COLUMNS) {
  TEMPLATE[norm(c.header)] = c.key;
  TEMPLATE[norm(c.key)] = c.key;
}

const JK = { l: 'Laki-laki', lakilaki: 'Laki-laki', pria: 'Laki-laki', male: 'Laki-laki', m: 'Laki-laki', p: 'Perempuan', perempuan: 'Perempuan', wanita: 'Perempuan', female: 'Perempuan', f: 'Perempuan' };
const PENDIDIKAN = { sd: 'SD/SMP', smp: 'SD/SMP', sdsmp: 'SD/SMP', sma: 'SMA/SMK', smk: 'SMA/SMK', smasmk: 'SMA/SMK', slta: 'SMA/SMK', d3: 'D3', diii: 'D3', diploma3: 'D3', s1: 'S1', sarjana: 'S1', strata1: 'S1', s2: 'S2', magister: 'S2', strata2: 'S2', s3: 'S3', doktor: 'S3', strata3: 'S3' };
const STATUS = { pkwtt: 'PKWTT', tetap: 'PKWTT', permanent: 'PKWTT', pkwt: 'PKWT', kontrak: 'PKWT', contract: 'PKWT', magang: 'Magang', intern: 'Magang', internship: 'Magang' };
const AKTIF = { aktif: 'Aktif', active: 'Aktif', y: 'Aktif', ya: 'Aktif', yes: 'Aktif', 1: 'Aktif', true: 'Aktif', keluar: 'Keluar', nonaktif: 'Keluar', n: 'Keluar', tidak: 'Keluar', no: 'Keluar', resign: 'Keluar', 0: 'Keluar', false: 'Keluar' };


const text = (max) => (raw) => (raw.length > max ? { error: `maksimal ${max} karakter` } : { value: raw });
const code = (max) => (raw) => {
  const v = raw.replace(/\s+/g, '').toUpperCase();
  return v.length > max ? { error: `maksimal ${max} karakter` } : { value: v };
};
const pick = (table, label) => (raw) => {
  const v = table[norm(raw)];
  return v ? { value: v } : { error: `"${raw}" bukan ${label} yang dikenal` };
};
const email = (raw) =>
  raw.length <= 255 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw) ? { value: raw } : { error: `"${raw}" bukan email yang valid` };

function parseDate(raw) {
  const fail = { error: `"${raw}" bukan tanggal yang valid` };
  let m;
  let v;
  if ((m = raw.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ].*)?$/))) v = `${m[1]}-${m[2]}-${m[3]}`;
  else if ((m = raw.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/))) v = `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  else if (/^\d{5}$/.test(raw) && +raw > 20000 && +raw < 60000) v = new Date(Date.UTC(1899, 11, 30 + +raw)).toISOString().slice(0, 10);
  else return fail;
  return isRealDate(v) ? { value: v } : fail;
}

const NORMALIZE = {
  nik: code(30), nama: text(255), jk: pick(JK, 'jenis kelamin'), tgl_lahir: parseDate,
  pendidikan: pick(PENDIDIKAN, 'jenjang pendidikan'), divisi: text(100), jabatan: text(255), level: text(50),
  atasan: code(30), lokasi: text(100), status: pick(STATUS, 'status karyawan'), tgl_masuk: parseDate,
  akhir_kontrak: parseDate, aktif: pick(AKTIF, 'status aktif'), tgl_keluar: parseDate, alasan: text(50), email,
};

const cellText = (v) => {
  if (v == null) return '';
  if (v instanceof Date) return v.toISOString().slice(0, 10); // date cells (UTC midnight)
  if (typeof v === 'object') {
    if (Array.isArray(v.richText)) return v.richText.map((t) => t.text).join('').trim();
    if ('result' in v) return cellText(v.result); // formula
    if ('text' in v) return cellText(v.text); // hyperlink
    return '';
  }
  return String(v).trim();
};

async function parseSheet(file) {
  const ext = path.extname(file.originalname).toLowerCase();
  const wb = new ExcelJS.Workbook();
  let ws;
  try {
    if (ext === '.csv') {
      const firstLine = file.buffer.toString('utf8', 0, 4000).split('\n')[0];
      const delimiter = (firstLine.match(/;/g) || []).length > (firstLine.match(/,/g) || []).length ? ';' : ',';
      ws = await wb.csv.read(Readable.from(file.buffer), { map: (v) => (v === '' ? null : v), parserOptions: { delimiter } });
    } else {
      await wb.xlsx.load(file.buffer);
      ws = wb.worksheets[0];
    }
  } catch {
    throw bad('The file could not be read. Is it a valid .xlsx or .csv?');
  }
  if (!ws) throw bad('The file has no sheet');

  const colCount = ws.columnCount;
  const textsOf = (n) => Array.from({ length: colCount }, (_, i) => cellText(ws.getRow(n).getCell(i + 1).value));

  let headerRow = 0;
  for (let n = 1; n <= Math.min(ws.rowCount, 10); n++) {
    if (textsOf(n).filter(Boolean).length >= 2) { headerRow = n; break; }
  }
  if (!headerRow) throw bad('No header row found in the first 10 rows');

  const seen = {};
  const headers = textsOf(headerRow).map((h) => {
    h = h.replace(/^\uFEFF/, '').trim(); 
    if (!h) return null;
    seen[h] = (seen[h] || 0) + 1;
    return seen[h] > 1 ? `${h} (${seen[h]})` : h;
  });

  const rows = [];
  for (let n = headerRow + 1; n <= ws.rowCount; n++) {
    const texts = textsOf(n);
    if (!texts.some(Boolean)) continue;
    const cells = {};
    headers.forEach((h, i) => { if (h) cells[h] = texts[i]; });
    rows.push({ row: n, cells }); 
    if (rows.length > MAX_ROWS) throw bad(`Too many rows (maximum ${MAX_ROWS})`);
  }
  if (!rows.length) throw bad('The file has no data rows');
  return { headers: headers.filter(Boolean), rows };
}
function sampleValues(rows, header) {
  const out = [];
  for (const r of rows) {
    const v = r.cells[header];
    if (v) out.push(v.includes('@') ? '(email)' : v.slice(0, 40));
    if (out.length === 3) break;
  }
  return out;
}

function checkMapping(mapping) {
  if (!mapping || typeof mapping !== 'object' || Array.isArray(mapping)) throw bad('mapping is required');
  const used = new Set();
  for (const f of Object.values(mapping)) {
    if (f == null) continue;
    if (!FIELDS.includes(f)) throw bad(`Unknown field "${f}" in mapping`);
    if (used.has(f)) throw bad(`Field "${f}" is mapped to more than one column`);
    used.add(f);
  }
  if (!used.has('nama')) throw bad('A column must be mapped to nama');
}

function toRecord(row, mapping) {
  const data = {}, problems = [];
  for (const [header, field] of Object.entries(mapping)) {
    if (!field) continue;
    const raw = (row.cells[header] ?? '').trim();
    if (!raw) continue; 
    const { value, error } = NORMALIZE[field](raw);
    if (error) problems.push({ field, error });
    else data[field] = value;
  }
  return { data, problems };
}

function diff(existing, data, skipKeys) {
  const changes = {};
  for (const [k, v] of Object.entries(data)) {
    if (skipKeys.includes(k)) continue;
    if ((existing[k] ?? '') !== v) changes[k] = { old: existing[k] ?? null, new: v };
  }
  return changes;
}

function buildPlan(existing, rows, mapping, decisions) {
  const byNik = new Map(), byName = new Map();
  const add = (map, key, e) => map.set(key, [...(map.get(key) ?? []), e]);
  for (const e of existing) {
    add(byNik, e.nik.toUpperCase(), e);
    add(byName, e.nama.trim().toLowerCase(), e);
  }

  const seen = new Set(), items = [], issues = [];

  for (const row of rows) {
    const { data, problems } = toRecord(row, mapping);
    const item = { row: row.row, nik: data.nik ?? '', nama: data.nama ?? '', data, action: 'insert' };
    const decision = decisions[row.row];
    const issue = (kind, message, extra = {}) => issues.push({ row: row.row, nik: item.nik, nama: item.nama, kind, message, ...extra });
    const forceSkip = (kind, message) => { item.action = 'skip'; issue(kind, message); items.push(item); };

    problems.forEach((p) => issue('invalid_value', `${LABEL[p.field]}: ${p.error}, kolom ini diabaikan`, { field: p.field }));

    if (!data.nama) { forceSkip('missing_name', 'Nama kosong, baris dilewati'); continue; }

    if (data.nik) {
      if (seen.has(data.nik)) { forceSkip('nik_dup_in_file', `NIK ${data.nik} muncul lebih dari sekali di file, baris ini dilewati`); continue; }
      seen.add(data.nik);
    }

    let target = null, skipKeys = ['nik'];
    const hits = data.nik ? byNik.get(data.nik) ?? [] : [];
    if (hits.length > 1) {
      forceSkip('nik_ambiguous', `NIK ${data.nik} dipakai ${hits.length} karyawan di database, perbaiki NIK-nya dulu`);
      continue;
    }
    if (hits.length === 1) {
      target = hits[0];
    } else {
      const same = (byName.get(data.nama.toLowerCase()) ?? []).filter((e) => e.nik.toUpperCase() !== (data.nik ?? ''));
      if (same.length) {
        const one = same.length === 1 ? same[0] : null;
        issue('same_name', `Nama sama dengan ${same.map((e) => `${e.nik} (${e.jabatan ?? '-'})`).join(', ')}, tapi NIK berbeda. Orang yang sama?`, {
          choices: one ? ['separate', 'merge'] : ['separate'],
          existing: same.map((e) => ({ id: e.id, nik: e.nik, jabatan: e.jabatan })),
          merge_changes: one ? diff(one, data, ['nik', 'nama']) : null,
        });
        if (one && decision === 'merge') { target = one; skipKeys = ['nik', 'nama']; }
      }
    }

    if (target) {
      item.target = target;
      item.changes = diff(target, data, skipKeys);
      item.action = Object.keys(item.changes).length ? 'update' : 'unchanged';
    }
    if (decision === 'skip') item.action = 'skip';
    items.push(item);
  }

  const counts = { insert: 0, update: 0, unchanged: 0, skip: 0 };
  items.forEach((i) => { counts[i.action]++; });
  return { items, issues, counts };
}

const parseJson = (raw, name, fallback) => {
  if (raw == null || raw === '') return fallback;
  try { return JSON.parse(raw); } catch { throw bad(`${name} must be valid JSON`); }
};

async function prepare(file, body) {
  if (!file) throw bad('file is required');
  const mapping = parseJson(body?.mapping, 'mapping', null);
  checkMapping(mapping);
  const raw = parseJson(body?.decisions, 'decisions', {});
  const decisions = {};
  for (const [row, d] of Object.entries(raw ?? {})) if (d === 'skip' || d === 'merge') decisions[row] = d;
  const { rows } = await parseSheet(file);
  return { rows, mapping, decisions };
}

class EmployeeImportService {
  async preview(file) {
    if (!file) throw bad('file is required');
    const { headers, rows } = await parseSheet(file);

    const mapping = headers.map((h) => {
      const field = TEMPLATE[norm(h)] ?? null;
      return { header: h, field, confidence: field ? 1 : 0, source: field ? 'template' : null };
    });
    const taken = new Set();
    for (const m of mapping) {
      if (m.field && taken.has(m.field)) Object.assign(m, { field: null, confidence: 0, source: null }); // first column wins
      else if (m.field) taken.add(m.field);
    }

    let ai_error = null;
    const unmapped = mapping.filter((m) => !m.field);
    const free = FIELDS.filter((k) => !taken.has(k));
    if (unmapped.length && free.length) {
      try {
        const result = await aiService.mapEmployeeColumns(
          unmapped.map((m) => ({ header: m.header, samples: sampleValues(rows, m.header) })),
          free.map((k) => ({ key: k, description: FIELD_HELP[k] })),
        );
        for (const r of result) {
          const m = mapping.find((x) => x.header === r.header);
          if (m) Object.assign(m, { field: r.field, confidence: r.confidence, source: 'ai' });
        }
      } catch (err) {
        ai_error = err.message; 
      }
    }

    return {
      file_name: file.originalname,
      total_rows: rows.length,
      fields: FIELDS.map((k) => ({ key: k, label: LABEL[k] })),
      mapping,
      sample_rows: rows.slice(0, 5),
      ai_used: mapping.some((m) => m.source === 'ai'),
      ai_error,
    };
  }

  async validate(file, body) {
    const { rows, mapping, decisions } = await prepare(file, body);
    const plan = buildPlan(await ImportModel.getEmployees(), rows, mapping, decisions);

    const changes = [];
    for (const i of plan.items) {
      if (i.action !== 'update') continue;
      for (const [field, c] of Object.entries(i.changes)) changes.push({ row: i.row, nik: i.target.nik, nama: i.target.nama, field, old: c.old, new: c.new });
    }
    return {
      total_rows: rows.length,
      counts: plan.counts,
      issues: plan.issues,
      changes,
      inserts: plan.items.filter((i) => i.action === 'insert').map((i) => ({ row: i.row, nik: i.nik, nama: i.nama })),
    };
  }

  async commit(file, body) {
    const { rows, mapping, decisions } = await prepare(file, body);

    return await ImportModel.transaction(async (db) => {
      const plan = buildPlan(await ImportModel.getEmployees(db), rows, mapping, decisions);
      const importId = await ImportModel.createImport(db, file.originalname);

      for (const item of plan.items) {
        if (item.action === 'insert') {
          const data = { ...item.data };
          if (!data.nik) data.nik = await Employee.nextNik((data.tgl_masuk || referenceDate()).slice(2, 4), db);
          await ImportModel.insertEmployee(db, data, importId);
        } else if (item.action === 'update') {
          await ImportModel.updateEmployee(db, item.target.id, item.changes, importId);
        }
      }
      return { import_id: importId, ...plan.counts };
    });
  }
}

export default new EmployeeImportService();