import getDb from '../../config/postgres.js';

class AttendanceModel {
  async getActiveEmployees() {
    const result = await getDb().query(`
      SELECT nik, nama, divisi, lokasi, to_char(tgl_masuk, 'YYYY-MM-DD') AS masuk
      FROM master_employee
      WHERE aktif = 'Aktif'
      ORDER BY id ASC
    `);
    return result.rows;
  }

  async getDays(from, to) {
    const result = await getDb().query(`
      SELECT nik,
             to_char(tgl, 'YYYY-MM-DD')        AS tgl,
             status,
             to_char(jam_masuk, 'HH24:MI')     AS jam_masuk,
             to_char(jam_pulang, 'HH24:MI')    AS jam_pulang
      FROM attendance_day
      WHERE tgl BETWEEN $1 AND $2
    `, [from, to]);
    return result.rows;
  }

  async getLatestMonth() {
    const result = await getDb().query(`
      SELECT to_char(date_trunc('month', MAX(tgl)), 'YYYY-MM-DD') AS month_start,
             to_char(date_trunc('month', MAX(tgl)) + INTERVAL '1 month - 1 day', 'YYYY-MM-DD') AS month_end
      FROM attendance_day
    `);
    return result.rows[0].month_start ? result.rows[0] : null;
  }
}

export default new AttendanceModel();