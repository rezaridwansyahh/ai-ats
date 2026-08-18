import getDb from "../../config/postgres.js";

class TemplateStageModel {
  async getAll() {
    // Use sort_order if the column exists (post-migration); fall back to id order.
    try {
      const result = await getDb().query(
        `SELECT id, name, sort_order FROM master_template_stage ORDER BY sort_order ASC, id ASC`
      );
      return result.rows;
    } catch {
      const result = await getDb().query(
        `SELECT id, name FROM master_template_stage ORDER BY id ASC`
      );
      return result.rows;
    }
  }

  async getById(id) {
    const result = await getDb().query(
      `SELECT id, name, sort_order FROM master_template_stage WHERE id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  async findByName(name) {
    const result = await getDb().query(
      `SELECT id FROM master_template_stage WHERE LOWER(name) = LOWER($1)`,
      [name]
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
      FROM job_stage rs
      JOIN recruitment_stage_category rsc ON rsc.id = rs.stage_type_id
      WHERE rs.master_id = $1
      ORDER BY rs.stage_order ASC
    `, [templateId]);
    return result.rows;
  }

  async create({ name, sort_order }) {
    const result = await getDb().query(
      `INSERT INTO master_template_stage (name, sort_order)
       VALUES ($1, $2)
       RETURNING id, name, sort_order`,
      [name, sort_order ?? 0]
    );
    return result.rows[0];
  }

  async update(id, { name, sort_order }) {
    const result = await getDb().query(
      `UPDATE master_template_stage
          SET name       = COALESCE($2, name),
              sort_order = COALESCE($3, sort_order),
              updated_at = NOW()
        WHERE id = $1
        RETURNING id, name, sort_order`,
      [id, name ?? null, sort_order ?? null]
    );
    return result.rows[0] || null;
  }

  async delete(id) {
    const result = await getDb().query(
      `DELETE FROM master_template_stage WHERE id = $1 RETURNING id`,
      [id]
    );
    return result.rows[0] || null;
  }

  async getNextStageOrder(templateId) {
    const result = await getDb().query(
      `SELECT COALESCE(MAX(stage_order), 0) + 1 AS next_order
         FROM job_stage WHERE master_id = $1`,
      [templateId]
    );
    return result.rows[0].next_order;
  }

  async addStage(templateId, { name, stage_type_id, stage_order }) {
    const order = stage_order ?? await this.getNextStageOrder(templateId);
    const result = await getDb().query(
      `INSERT INTO job_stage (master_id, stage_type_id, name, stage_order)
       VALUES ($1, $2, $3, $4)
       RETURNING id, stage_order, name, stage_type_id`,
      [templateId, stage_type_id, name, order]
    );
    return result.rows[0];
  }

  async getStageById(stageId) {
    const result = await getDb().query(
      `SELECT id, master_id, stage_order, name, stage_type_id FROM job_stage WHERE id = $1`,
      [stageId]
    );
    return result.rows[0] || null;
  }

  async updateStage(stageId, { name, stage_type_id }) {
    const result = await getDb().query(
      `UPDATE job_stage
          SET name          = COALESCE($2, name),
              stage_type_id = COALESCE($3, stage_type_id),
              updated_at    = NOW()
        WHERE id = $1
        RETURNING id, stage_order, name, stage_type_id`,
      [stageId, name ?? null, stage_type_id ?? null]
    );
    return result.rows[0] || null;
  }

  async deleteStage(stageId) {
    const result = await getDb().query(
      `DELETE FROM job_stage WHERE id = $1 RETURNING id, master_id`,
      [stageId]
    );
    return result.rows[0] || null;
  }
}

export default new TemplateStageModel();
