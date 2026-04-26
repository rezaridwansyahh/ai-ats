import getDb from '../../config/postgres.js';

class SkillAliasModel {
  async getAll() {
    const result = await getDb().query(
      `SELECT alias, canonical FROM master_skill_alias ORDER BY alias ASC`
    );
    return result.rows;
  }

  async upsert(alias, canonical) {
    const result = await getDb().query(
      `INSERT INTO master_skill_alias (alias, canonical)
       VALUES ($1, $2)
       ON CONFLICT (alias) DO UPDATE SET canonical = EXCLUDED.canonical
       RETURNING *`,
      [alias.toLowerCase(), canonical]
    );
    return result.rows[0];
  }

  async delete(alias) {
    const result = await getDb().query(
      `DELETE FROM master_skill_alias WHERE alias = $1 RETURNING *`,
      [alias.toLowerCase()]
    );
    return result.rows[0];
  }
}

export default new SkillAliasModel();
