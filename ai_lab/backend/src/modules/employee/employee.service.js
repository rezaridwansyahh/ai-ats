import Employee, { WRITABLE } from './employee.model.js';
import aiService from '../../shared/services/ai.service.js';
import { daysBetween, addMonths, isRealDate, today } from '../../shared/utils/date.util.js';
import ExcelJS from 'exceljs';

const EXPORT_COLUMNS = [
  { header: 'NIK Internal', key: 'nik', width: 12 },
  { header: 'Nama Lengkap', key: 'nama', width: 24 },
  { header: 'Jenis Kelamin', key: 'jk', width: 14 },
  { header: 'Tanggal Lahir', key: 'tgl_lahir', width: 14 },
  { header: 'Pendidikan Terakhir', key: 'pendidikan', width: 18 },
  { header: 'Divisi', key: 'divisi', width: 22 },
  { header: 'Jabatan', key: 'jabatan', width: 26 },
  { header: 'Level Jabatan', key: 'level', width: 14 },
  { header: 'NIK Atasan Langsung', key: 'atasan', width: 18 },
  { header: 'Lokasi Kerja', key: 'lokasi', width: 22 },
  { header: 'Status Karyawan', key: 'status', width: 15 },
  { header: 'Tanggal Masuk', key: 'tgl_masuk', width: 14 },
  { header: 'Tanggal Akhir Kontrak', key: 'akhir_kontrak', width: 20 },
  { header: 'Status Aktif', key: 'aktif', width: 12 },
  { header: 'Tanggal Keluar', key: 'tgl_keluar', width: 14 },
  { header: 'Alasan Keluar', key: 'alasan', width: 18 },
  { header: 'Email Kantor', key: 'email', width: 36 },
];


const STATUS = ['PKWTT', 'PKWT', 'Magang'];
const AKTIF = ['Aktif', 'Keluar'];
const DATE_FIELDS = ['tgl_lahir', 'tgl_masuk', 'akhir_kontrak', 'tgl_keluar'];

const bad = (message) => ({ status: 400, message });

const toId = (id) => {
  const n = Number(id);
  if (!Number.isInteger(n) || n < 1) throw bad('Invalid employee id');
  return n;
};

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

const referenceDate = () => {
  const env = process.env.REFERENCE_DATE;
  return /^\d{4}-\d{2}-\d{2}$/.test(env ?? '') ? env : today();
};

function buildFacts(e, ref = referenceDate()) {
  const active = e.aktif === 'Aktif';
  const facts = {
    tanggal_acuan: ref,
    jabatan: e.jabatan,
    divisi: e.divisi,
    level: e.level,
    lokasi: e.lokasi,
    status_karyawan: e.status,
    status_aktif: e.aktif,
    tgl_masuk: e.tgl_masuk,
    masa_kerja_tahun: e.tgl_masuk
      ? Math.round((daysBetween(e.tgl_masuk, active ? ref : e.tgl_keluar || ref) / 365.25) * 10) / 10
      : null,
  };

  if (active && e.akhir_kontrak) {
    const left = daysBetween(ref, e.akhir_kontrak);
    facts.kontrak = {
      akhir_kontrak: e.akhir_kontrak,
      kondisi: left < 0 ? 'sudah lewat' : left <= 30 ? 'segera berakhir (30 hari atau kurang)' : left <= 60 ? 'perlu perhatian (31-60 hari)' : 'aman (lebih dari 60 hari)',
    };
  }

  if (active && e.status === 'PKWTT' && e.tgl_masuk) {
    const end = addMonths(e.tgl_masuk, 3); 
    facts.masa_percobaan = { berakhir: end, sedang_berjalan: daysBetween(ref, end) >= 0 };
  }

  if (!active) facts.keluar = { tgl_keluar: e.tgl_keluar, alasan: e.alasan };

  const missing = [];
  if (!e.pendidikan) missing.push('pendidikan');
  if (!e.divisi) missing.push('divisi');
  if (!e.tgl_lahir) missing.push('tanggal lahir');
  if (!e.tgl_masuk) missing.push('tanggal masuk');
  if (e.status !== 'PKWTT' && !e.akhir_kontrak) missing.push('akhir kontrak');
  if (!active && !e.tgl_keluar) missing.push('tanggal keluar');
  facts.data_belum_lengkap = missing;

  return facts;
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
    if (!fields.nama) throw bad('nama is required');
    if (!fields.nik) {
      const year = (fields.tgl_masuk || referenceDate()).slice(2, 4);
      fields.nik = await Employee.nextNik(year);
    }
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

  async getSummary(id) {
    const employee = await this.getById(id);
    return (await Employee.getSummary(employee.id)) ?? null;
  }

  async summarize(id) {
    const employee = await this.getById(id);
    const summary = await aiService.summarizeEmployee(buildFacts(employee));
    return await Employee.saveSummary(employee.id, summary);
  }

  async scanDocument(file) {
    if (!file) throw bad('file is required');
    return await aiService.extractEmployeeFromDocument(file.buffer, file.originalname, file.mimetype);
  }

  async exportXlsx() {
    const employees = await Employee.getAll();

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Karyawan', { views: [{ state: 'frozen', ySplit: 1 }] }); // header row stays visible
    ws.columns = EXPORT_COLUMNS;
    ws.getRow(1).font = { bold: true };

    for (const e of employees) {
      const row = {};
      for (const { key } of EXPORT_COLUMNS) {
        const v = e[key];
        row[key] = v && DATE_FIELDS.includes(key) ? new Date(`${v}T00:00:00Z`) : v ?? null;
      }
      const added = ws.addRow(row);
      for (const k of DATE_FIELDS) added.getCell(k).numFmt = 'yyyy-mm-dd';
    }

    ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: EXPORT_COLUMNS.length } };

    return {
      buffer: Buffer.from(await wb.xlsx.writeBuffer()),
      filename: `employees_${today()}.xlsx`,
    };
  }

}

export default new EmployeeService();