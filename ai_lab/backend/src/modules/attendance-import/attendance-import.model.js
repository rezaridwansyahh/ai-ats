import getDb from '../../config/postgres.js';

class AttendanceImportModel {
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
    const result = await db.query(`
      SELECT nik, nama
      FROM master_employee
      WHERE nik IS NOT NULL
      ORDER BY id ASC
    `);
    return result.rows;
  }

  async getPinMap(db = getDb()) {
    const result = await db.query(`SELECT pin, nik FROM pin_mapping`);
    return new Map(result.rows.map((r) => [r.pin, r.nik]));
  }

  async getDays(db = getDb(), from, to) {
    const result = await db.query(`
      SELECT nik,
             to_char(tgl, 'YYYY-MM-DD')      AS tgl,
             status,
             to_char(jam_masuk, 'HH24:MI:SS')  AS jam_masuk,
             to_char(jam_pulang, 'HH24:MI:SS') AS jam_pulang,
             ket, source, import_id
      FROM attendance_day
      WHERE tgl BETWEEN $1 AND $2
    `, [from, to]);
    return result.rows;
  }

  async getSavedMappings(db = getDb()) {
    const result = await db.query(`
      SELECT mapping
      FROM attendance_import
      WHERE mapping IS NOT NULL
      ORDER BY id DESC
      LIMIT 20
    `);
    return result.rows.map((r) => r.mapping);
  }

  async createImport(db, fileName, mapping, undo) {
    const result = await db.query(`
      INSERT INTO attendance_import (file_name, mapping, undo)
      VALUES ($1, $2, $3)
      RETURNING id
    `, [fileName, JSON.stringify(mapping), JSON.stringify(undo)]);
    return result.rows[0].id;
  }

  async savePin(db, pin, nik) {
    await db.query(`
      INSERT INTO pin_mapping (pin, nik)
      VALUES ($1, $2)
      ON CONFLICT (pin) DO UPDATE SET nik = EXCLUDED.nik
    `, [pin, nik]);
  }

  async upsertDay(db, d, importId) {
    await db.query(`
      INSERT INTO attendance_day (nik, tgl, status, jam_masuk, jam_pulang, source, import_id)
      VALUES ($1, $2, 'Hadir', $3, $4, 'mesin', $5)
      ON CONFLICT (nik, tgl) DO UPDATE
      SET status = 'Hadir', jam_masuk = EXCLUDED.jam_masuk, jam_pulang = EXCLUDED.jam_pulang,
          ket = NULL, source = 'mesin', import_id = EXCLUDED.import_id, updated_at = NOW()
    `, [d.nik, d.tgl, d.jam_masuk, d.jam_pulang, importId]);
  }

  async getImport(id) {
    const result = await getDb().query(`
      SELECT id, undo, undone_at,
             created_at < NOW() - INTERVAL '24 hours' AS expired
      FROM attendance_import
      WHERE id = $1
    `, [id]);
    return result.rows[0];
  }

  async deleteDay(db, nik, tgl, importId) {
    const result = await db.query(`
      DELETE FROM attendance_day
      WHERE nik = $1 AND tgl = $2 AND import_id = $3
    `, [nik, tgl, importId]);
    return result.rowCount;
  }

  async restoreDay(db, nik, tgl, importId, old) {
    const result = await db.query(`
      UPDATE attendance_day
      SET status = $4, jam_masuk = $5, jam_pulang = $6, ket = $7, source = $8, import_id = $9, updated_at = NOW()
      WHERE nik = $1 AND tgl = $2 AND import_id = $3
    `, [nik, tgl, importId, old.status, old.jam_masuk, old.jam_pulang, old.ket, old.source, old.import_id]);
    return result.rowCount;
  }

  async markUndone(db, id) {
    await db.query(`UPDATE attendance_import SET undone_at = NOW() WHERE id = $1`, [id]);
  }
}

export default new AttendanceImportModel();