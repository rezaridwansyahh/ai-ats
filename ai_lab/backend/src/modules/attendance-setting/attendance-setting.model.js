import getDb from '../../config/postgres.js';

class AttendanceSettingModel {
  async getAll() {
    const result = await getDb().query(`
      SELECT key, value
      FROM attendance_setting
    `);
    return Object.fromEntries(result.rows.map((r) => [r.key, r.value]));
  }

  async upsertMany(settings) {
    const keys = Object.keys(settings);
    const values = keys.map((k) => JSON.stringify(settings[k]));

    await getDb().query(`
      INSERT INTO attendance_setting (key, value)
      SELECT k, v::jsonb
      FROM unnest($1::text[], $2::text[]) AS t(k, v)
      ON CONFLICT (key) DO UPDATE
      SET value = EXCLUDED.value, updated_at = NOW()
    `, [keys, values]);
  }
}

export default new AttendanceSettingModel();