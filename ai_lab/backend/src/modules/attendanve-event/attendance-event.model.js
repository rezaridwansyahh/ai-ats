import getDb from '../../config/postgres.js';

const TZ = 'Asia/Jakarta';
const OFFSET = '+07:00';

class AttendanceEventModel {
  async getEmployee(nik) {
    const result = await getDb().query(`
      SELECT nik, nama, jabatan, lokasi, aktif
      FROM master_employee
      WHERE nik = $1
    `, [nik]);
    return result.rows[0];
  }

  async isDuplicate(nik, type, ts, db = getDb()) {
    const result = await db.query(`
      SELECT 1
      FROM attendance_scan
      WHERE nik = $1 AND type = $2
        AND time > $3::timestamptz - INTERVAL '2 minutes'
        AND time < $3::timestamptz + INTERVAL '2 minutes'
      LIMIT 1
    `, [nik, type, ts]);
    return result.rowCount > 0;
  }

  async recordPunch(p) {
    const client = await getDb().connect();
    try {
      await client.query('BEGIN');
      await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [p.nik]);

      if (await this.isDuplicate(p.nik, p.type, p.ts, client)) {
        await client.query('COMMIT');
        return { duplicate: true };
      }

      const scan = await client.query(`
        INSERT INTO attendance_scan (nik, time, type, geo_status, geo_label, geo_accuracy)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING to_char(time AT TIME ZONE $7::text, 'YYYY-MM-DD') AS tgl
      `, [p.nik, p.ts, p.type, p.geoStatus, p.geoLabel, p.accM, TZ]);
      const tgl = scan.rows[0].tgl;

      const times = await client.query(`
        SELECT to_char(MIN((time AT TIME ZONE $3::text)::time) FILTER (WHERE type = 'in'),  'HH24:MI:SS') AS first_in,
               to_char(MAX((time AT TIME ZONE $3::text)::time) FILTER (WHERE type = 'out'), 'HH24:MI:SS') AS last_out
        FROM attendance_scan
        WHERE nik = $1 AND (time AT TIME ZONE $3::text)::date = $2::date
      `, [p.nik, tgl, TZ]);

      const day = await client.query(`
        INSERT INTO attendance_day (nik, tgl, status, jam_masuk, jam_pulang, source)
        VALUES ($1, $2, 'Hadir', $3, $4, 'pwa')
        ON CONFLICT (nik, tgl) DO UPDATE
        SET jam_masuk = EXCLUDED.jam_masuk, jam_pulang = EXCLUDED.jam_pulang, updated_at = NOW()
        WHERE attendance_day.source = 'pwa'
      `, [p.nik, tgl, times.rows[0].first_in, times.rows[0].last_out]);

      await client.query('COMMIT');
      return { duplicate: false, conflict: day.rowCount === 0, tgl };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async getToday(nik) {
    const result = await getDb().query(`
      SELECT to_char(time AT TIME ZONE $2::text, 'YYYY-MM-DD"T"HH24:MI:SS') || $3::text AS ts,
             to_char(time AT TIME ZONE $2::text, 'HH24:MI') AS time,
             type, geo_status, geo_label, geo_accuracy
      FROM attendance_scan
      WHERE nik = $1 AND (time AT TIME ZONE $2::text)::date = (NOW() AT TIME ZONE $2::text)::date
      ORDER BY attendance_scan.time ASC
    `, [nik, TZ, OFFSET]);
    return result.rows;
  }

  async getTodayDate() {
    const result = await getDb().query(`SELECT to_char(NOW() AT TIME ZONE $1::text, 'YYYY-MM-DD') AS today`, [TZ]);
    return result.rows[0].today;
  }
}

export default new AttendanceEventModel();