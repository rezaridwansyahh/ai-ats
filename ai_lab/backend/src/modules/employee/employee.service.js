import Employee, { WRITABLE } from './employee.model.js';

const STATUS = ['PKWTT', 'PKWT', 'Magang'];
const AKTIF = ['Aktif', 'Keluar'];
const DATE_FIELDS = ['tgl_lahir', 'tgl_masuk', 'akhir_kontrak', 'tgl_keluar'];

const bad = (message) => ({ status: 400, message });

const toId = (id) => {
  const n = Number(id);
  if (!Number.isInteger(n) || n < 1) throw bad('Invalid employee id');
  return n;
};

const isRealDate = (v) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const d = new Date(`${v}T00:00:00Z`);
  return !isNaN(d) && d.toISOString().slice(0, 10) === v; // rejects 2026-02-31
};

// Trim strings, ''
function clean(body) {
  const f = {};
  for (const [k, v] of Object.entries(body ?? {})) {
    if (!WRITABLE.includes(k)) continue;
    f[k] = typeof v === 'string' ? (v.trim() === '' ? null : v.trim()) : v;
  }
  if ('status' in f && !STATUS.includes(f.status)) throw bad(`status must be one of: ${STATUS.join(', ')}`);
  if ('aktif' in f && !AKTIF.includes(f.aktif)) throw bad(`aktif must be one of: ${AKTIF.join(', ')}`);
  for (const k of DATE_FIELDS) {
    if (f[k] != null && !isRealDate(f[k])) throw bad(`${k} must be a valid date (YYYY-MM-DD)`);
  }
  return f;
}

class EmployeeService {
  async getAll() {
    return await Employee.getAll();
  }

  async getById(id) {
    const employee = await Employee.getById(toId(id));
    if (!employee) throw { status: 404, message: 'Employee not found' };
    return employee;
  }

  async create(body) {
    const fields = clean(body);
    if (!fields.nik || !fields.nama) throw bad('nik and nama are required');
    return await Employee.create(fields);
  }

  async update(id, body) {
    const employee = await this.getById(id);
    const fields = clean(body);
    if (Object.keys(fields).length === 0) throw bad('No valid fields to update');
    if (('nik' in fields && !fields.nik) || ('nama' in fields && !fields.nama)) throw bad('nik and nama cannot be empty');
    return await Employee.update(employee.id, fields);
  }

  async delete(id) {
    const employee = await this.getById(id);
    await Employee.delete(employee.id);
    return employee;
  }
}

export default new EmployeeService();