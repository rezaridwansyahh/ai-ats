import getDb from '../../config/postgres.js';

class AttendanceRekapModel {
  async getSettings() {
    const result = await getDb().query(`SELECT key, value FROM attendance_setting`);
    return Object.fromEntries(result.rows.map((r) => [r.key, r.value]));
  }

  async getEmployees(from, to, divisi = null) {
    const result = await getDb().query(`
      SELECT nik, nama, divisi, jabatan, lokasi,
             to_char(tgl_masuk, 'YYYY-MM-DD') AS tgl_masuk,
             CASE WHEN aktif = 'Keluar' THEN to_char(tgl_keluar, 'YYYY-MM-DD') END AS tgl_keluar
      FROM master_employee
      WHERE nik IS NOT NULL
        AND (tgl_masuk IS NULL OR tgl_masuk <= $2)
        AND (aktif = 'Aktif' OR tgl_keluar >= $1)
        AND ($3::text IS NULL OR divisi = $3)
      ORDER BY nama ASC
    `, [from, to, divisi]);
    return result.rows;
  }

  async getEmployee(nik) {
    const result = await getDb().query(`
      SELECT e.nik, e.nama, e.divisi, e.jabatan, e.lokasi,
             to_char(e.tgl_masuk, 'YYYY-MM-DD') AS tgl_masuk,
             CASE WHEN e.aktif = 'Keluar' THEN to_char(e.tgl_keluar, 'YYYY-MM-DD') END AS tgl_keluar,
             b.nama AS atasan_nama
      FROM master_employee e
      LEFT JOIN master_employee b ON b.nik = e.atasan
      WHERE e.nik = $1
    `, [nik]);
    return result.rows[0];
  }

  async getDays(from, to, nik = null) {
    const result = await getDb().query(`
      SELECT nik,
             to_char(tgl, 'YYYY-MM-DD')        AS tgl,
             status,
             to_char(jam_masuk, 'HH24:MI:SS')  AS jam_masuk,
             to_char(jam_pulang, 'HH24:MI:SS') AS jam_pulang
      FROM attendance_day
      WHERE tgl BETWEEN $1 AND $2
        AND ($3::text IS NULL OR nik = $3)
    `, [from, to, nik]);
    return result.rows;
  }
}

export default new AttendanceRekapModel();