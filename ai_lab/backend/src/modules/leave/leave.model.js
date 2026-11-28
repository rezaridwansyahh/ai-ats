import getDb from '../../config/postgres.js';

class LeaveModel {
  async getSettings() {
    const result = await getDb().query(`SELECT key, value FROM attendance_setting`);
    return Object.fromEntries(result.rows.map((r) => [r.key, r.value]));
  }

  async getAll({ status = null, nik = null } = {}) {
    const result = await getDb().query(`
      SELECT r.id, r.nik, r.jenis, r.alasan, r.status, r.catatan_atasan, r.decided_at, r.token_expires_at,
             to_char(r.tgl_mulai, 'YYYY-MM-DD')   AS tgl_mulai,
             to_char(r.tgl_selesai, 'YYYY-MM-DD') AS tgl_selesai,
             e.nama, e.divisi,
             (SELECT COUNT(DISTINCT o.nik)::int
                FROM leave_request o
                JOIN master_employee oe ON oe.nik = o.nik
               WHERE o.id <> r.id AND o.nik <> r.nik AND o.status <> 'Ditolak'
                 AND oe.divisi = e.divisi
                 AND o.tgl_mulai <= r.tgl_selesai AND o.tgl_selesai >= r.tgl_mulai) AS bersamaan
      FROM leave_request r
      JOIN master_employee e ON e.nik = r.nik
      WHERE ($1::text IS NULL OR r.status = $1)
        AND ($2::text IS NULL OR r.nik = $2)
      ORDER BY (r.status = 'Menunggu atasan') DESC, r.tgl_mulai ASC, r.id ASC
    `, [status, nik]);
    return result.rows;
  }

  async getById(id) {
    const result = await getDb().query(`
      SELECT id, nik, status, token, token_expires_at,
             (token_expires_at IS NOT NULL AND token_expires_at < NOW()) AS expired
      FROM leave_request
      WHERE id = $1
    `, [id]);
    return result.rows[0];
  }

  async getEmployee(nik) {
    const result = await getDb().query(`
      SELECT nik, nama, aktif, atasan FROM master_employee WHERE nik = $1
    `, [nik]);
    return result.rows[0];
  }

  async countOverlap(nik, from, to) {
    const result = await getDb().query(`
      SELECT COUNT(*)::int AS n
      FROM leave_request
      WHERE nik = $1 AND status <> 'Ditolak' AND tgl_mulai <= $3 AND tgl_selesai >= $2
    `, [nik, from, to]);
    return result.rows[0].n;
  }

  async create({ nik, jenis, tgl_mulai, tgl_selesai, alasan }) {
    const result = await getDb().query(`
      INSERT INTO leave_request (nik, jenis, tgl_mulai, tgl_selesai, alasan, token_expires_at)
      VALUES ($1, $2, $3, $4, $5, NOW() + INTERVAL '72 hours')
      RETURNING id, token, token_expires_at
    `, [nik, jenis, tgl_mulai, tgl_selesai, alasan]);
    return result.rows[0];
  }

  async regenerateToken(id) {
    const result = await getDb().query(`
      UPDATE leave_request
      SET token = gen_random_uuid(), token_expires_at = NOW() + INTERVAL '72 hours'
      WHERE id = $1 AND status = 'Menunggu atasan'
      RETURNING token, token_expires_at
    `, [id]);
    return result.rows[0];
  }

  async getEmployees(nik = null) {
    const result = await getDb().query(`
      SELECT nik, nama, divisi, to_char(tgl_masuk, 'YYYY-MM-DD') AS tgl_masuk
      FROM master_employee
      WHERE nik IS NOT NULL
        AND (($1::text IS NULL AND aktif = 'Aktif') OR nik = $1)
      ORDER BY nama ASC
    `, [nik]);
    return result.rows;
  }

  async getBalances(tahun, nik = null) {
    const result = await getDb().query(`
      SELECT nik, terpakai_awal, penyesuaian, catatan
      FROM leave_balance
      WHERE tahun = $1 AND ($2::text IS NULL OR nik = $2)
    `, [tahun, nik]);
    return result.rows;
  }

  async getUsedCuti(from, to, nik = null) {
    const result = await getDb().query(`
      SELECT nik, COUNT(*)::int AS n
      FROM attendance_day
      WHERE status = 'Cuti' AND tgl BETWEEN $1 AND $2 AND ($3::text IS NULL OR nik = $3)
      GROUP BY nik
    `, [from, to, nik]);
    return result.rows;
  }

  async getApprovedCuti(from, to, nik = null) {
    const result = await getDb().query(`
      SELECT nik,
             to_char(tgl_mulai, 'YYYY-MM-DD')   AS tgl_mulai,
             to_char(tgl_selesai, 'YYYY-MM-DD') AS tgl_selesai
      FROM leave_request
      WHERE status = 'Disetujui' AND jenis = 'Cuti tahunan'
        AND tgl_selesai >= $1 AND tgl_mulai <= $2
        AND ($3::text IS NULL OR nik = $3)
    `, [from, to, nik]);
    return result.rows;
  }

  async upsertBalance(nik, tahun, { terpakai_awal, penyesuaian, catatan }) {
    const result = await getDb().query(`
      INSERT INTO leave_balance (nik, tahun, terpakai_awal, penyesuaian, catatan)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (nik, tahun) DO UPDATE
      SET terpakai_awal = EXCLUDED.terpakai_awal, penyesuaian = EXCLUDED.penyesuaian,
          catatan = EXCLUDED.catatan, updated_at = NOW()
      RETURNING nik, tahun, terpakai_awal, penyesuaian, catatan
    `, [nik, tahun, terpakai_awal, penyesuaian, catatan]);
    return result.rows[0];
  }
}

export default new LeaveModel();