import getDb from '../../config/postgres.js';

export const WRITABLE = [
  'nik', 'nama', 'jk', 'tgl_lahir', 'pendidikan', 'divisi', 'jabatan', 'level', 'atasan',
  'lokasi', 'status', 'tgl_masuk', 'akhir_kontrak', 'aktif', 'tgl_keluar', 'alasan', 'email',
];

const pick = (fields) => Object.fromEntries(Object.entries(fields).filter(([k]) => WRITABLE.includes(k)));

class EmployeeModel {
  async getAll() {
    const result = await getDb().query(`
      SELECT *
      FROM master_employee
      ORDER BY id ASC
    `);
    return result.rows;
  }

  async getById(id) {
    const result = await getDb().query(`
      SELECT *
      FROM master_employee
      WHERE id = $1
    `, [id]);
    return result.rows[0];
  }

  async create(fields) {
    const data = pick(fields);
    const keys = Object.keys(data);

    const result = await getDb().query(`
      INSERT INTO master_employee (${keys.join(', ')})
      VALUES (${keys.map((_, i) => `$${i + 1}`).join(', ')})
      RETURNING *
    `, Object.values(data));
    return result.rows[0];
  }

  async update(id, fields) {
    const data = pick(fields);
    const keys = Object.keys(data);
    const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');

    const result = await getDb().query(`
      UPDATE master_employee
      SET ${setClause}, updated_at = NOW()
      WHERE id = $${keys.length + 1}
      RETURNING *
    `, [...Object.values(data), id]);
    return result.rows[0];
  }

  async delete(id) {
    const result = await getDb().query(`
      DELETE FROM master_employee
      WHERE id = $1
      RETURNING *
    `, [id]);
    return result.rows[0];
  }
}

export default new EmployeeModel();