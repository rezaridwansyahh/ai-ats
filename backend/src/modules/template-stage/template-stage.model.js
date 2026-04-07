import getDb from "../../config/postgres.js";

class TemplateStageModel {
  async getAll() {
    const result = await getDb().query(
      `SELECT id, name FROM master_template_stage ORDER BY id`
    );
    return result.rows;
  }

  async getById(id) {
    const result = await getDb().query(
      `SELECT id, name FROM master_template_stage WHERE id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  async getStagesByTemplateId(templateId) {
    const result = await getDb().query(`
      SELECT
        rs.id,
        rs.stage_order,
        rs.name,
        rs.stage_type_id,
        rsc.name AS category
      FROM recruitment_stage rs
      JOIN recruitment_stage_category rsc ON rsc.id = rs.stage_type_id
      WHERE rs.master_id = $1
      ORDER BY rs.stage_order ASC
    `, [templateId]);
    return result.rows;
  }
}

export default new TemplateStageModel();
