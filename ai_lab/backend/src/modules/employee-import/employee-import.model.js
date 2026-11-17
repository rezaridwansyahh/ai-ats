import getDb from '../../config/postgres.js';
import { WRITABLE } from '../employee/employee.model.js';

class EmployeeImportModel {
  async transaction(fn) {
    const client = await getDb().connect();
    try {
      await client.query('BEGIN');
      const out = await fn(client);
      await client.query('COMMIT');
      return out;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async getEmployees(db = getDb()) {
    const result = await db.query(`SELECT * FROM master_employee ORDER BY id ASC`);
    return result.rows;
  }

  async createImport(db, fileName) {
    const result = await db.query(`INSERT INTO employee_import (file_name) VALUES ($1) RETURNING id`, [fileName]);
    return result.rows[0].id;
  }

  async insertEmployee(db, data, importId) {
    const keys = Object.keys(data).filter((k) => WRITABLE.includes(k));
    await db.query(`
      INSERT INTO master_employee (${keys.join(', ')}, import_id)
      VALUES (${keys.map((_, i) => `$${i + 1}`).join(', ')}, $${keys.length + 1})
    `, [...keys.map((k) => data[k]), importId]);
  }

  async updateEmployee(db, id, changes, importId) {
    const keys = Object.keys(changes).filter((k) => WRITABLE.includes(k));
    if (keys.length === 0) return;

    await db.query(`
      UPDATE master_employee
      SET ${keys.map((k, i) => `${k} = $${i + 1}`).join(', ')}, updated_at = NOW()
      WHERE id = $${keys.length + 1}
    `, [...keys.map((k) => changes[k].new), id]);

    const old_value = {}, new_value = {};
    for (const k of keys) {
      old_value[k] = changes[k].old ?? null;
      new_value[k] = changes[k].new;
    }
    await db.query(`
      INSERT INTO employee_change (employee_id, import_id, old_value, new_value)
      VALUES ($1, $2, $3, $4)
    `, [id, importId, JSON.stringify(old_value), JSON.stringify(new_value)]);
  }
}

export default new EmployeeImportModel();