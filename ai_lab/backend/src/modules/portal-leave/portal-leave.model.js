import getDb from '../../config/postgres.js';

class PortalLeaveModel {
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

  async getByToken(token) {
    const result = await getDb().query(`
      SELECT r.id, r.nik, r.jenis, r.alasan, r.status,
             to_char(r.tgl_mulai, 'YYYY-MM-DD')   AS tgl_mulai,
             to_char(r.tgl_selesai, 'YYYY-MM-DD') AS tgl_selesai,
             r.token_expires_at,
             (r.token_expires_at IS NOT NULL AND r.token_expires_at < NOW()) AS expired,
             e.nama AS karyawan_nama, e.jabatan, e.divisi,
             e.atasan AS atasan_nik, a.nama AS atasan_nama
      FROM leave_request r
      JOIN master_employee e ON e.nik = r.nik
      LEFT JOIN master_employee a ON a.nik = e.atasan
      WHERE r.token = $1::uuid
    `, [token]);
    return result.rows[0];
  }

  async getHolidays() {
    const result = await getDb().query(`SELECT value FROM attendance_setting WHERE key = 'hari_libur'`);
    return result.rows[0]?.value ?? [];
  }

  async decide(db, id, { status, catatan, decided_by }) {
    const result = await db.query(`
      UPDATE leave_request
      SET status = $2, catatan_atasan = $3, decided_by = $4, decided_at = NOW()
      WHERE id = $1
        AND status = 'Menunggu atasan'
        AND (token_expires_at IS NULL OR token_expires_at > NOW())
      RETURNING decided_at
    `, [id, status, catatan, decided_by]);
    return result.rows[0];
  }

  async insertDays(db, nik, dates, status) {
    const result = await db.query(`
      INSERT INTO attendance_day (nik, tgl, status, source)
      SELECT $1, d, $3, 'pengajuan'
      FROM unnest($2::date[]) AS d
      ON CONFLICT (nik, tgl) DO NOTHING
    `, [nik, dates, status]);
    return result.rowCount;
  }
}

export default new PortalLeaveModel();