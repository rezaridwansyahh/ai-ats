import getDb from '../../config/postgres.js';

class OnboardingLmsModel {

  async getPhases(company_id) {
    const query = `
      SELECT * FROM lms_phase
      WHERE company_id = $1
      ORDER BY seq
    `;
    const result = await getDb().query(query, [company_id]);
    return result.rows;
  }

  async getPhaseById(phase_id, company_id) {
    const query = `
      SELECT * FROM lms_phase
      WHERE id = $1 AND company_id = $2
    `;
    const result = await getDb().query(query, [phase_id, company_id]);
    return result.rows[0];
  }

  async createPhase(company_id, data) {
    const { seq, label, day_offset_start, day_offset_end } = data;

    const query = `
      INSERT INTO lms_phase (company_id, seq, label, day_offset_start, day_offset_end)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const result = await getDb().query(query, [
      company_id, seq, label, day_offset_start, day_offset_end,
    ]);
    return result.rows[0];
  }

  async updatePhase(phase_id, company_id, data) {
    const { label, day_offset_start, day_offset_end, seq } = data;

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (label !== undefined) { updates.push(`label = $${paramCount++}`); values.push(label); }
    if (day_offset_start !== undefined) { updates.push(`day_offset_start = $${paramCount++}`); values.push(day_offset_start); }
    if (day_offset_end !== undefined) { updates.push(`day_offset_end = $${paramCount++}`); values.push(day_offset_end); }
    if (seq !== undefined) { updates.push(`seq = $${paramCount++}`); values.push(seq); }

    updates.push(`updated_at = NOW()`);
    values.push(phase_id, company_id);

    const query = `
      UPDATE lms_phase
      SET ${updates.join(', ')}
      WHERE id = $${paramCount++} AND company_id = $${paramCount++}
      RETURNING *
    `;

    const result = await getDb().query(query, values);
    return result.rows[0];
  }

  async getModulesByPhase(phase_id) {
    const query = `
      SELECT * FROM lms_module
      WHERE phase_id = $1
      ORDER BY sort_order, id
    `;
    const result = await getDb().query(query, [phase_id]);
    return result.rows;
  }

  async getModuleById(module_id) {
    const query = `SELECT * FROM lms_module WHERE id = $1`;
    const result = await getDb().query(query, [module_id]);
    return result.rows[0];
  }

  async createModule(phase_id, created_by, data) {
    const { title, category, duration_min, sort_order = 0 } = data;

    const query = `
      INSERT INTO lms_module (phase_id, title, category, duration_min, sort_order, created_by)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const result = await getDb().query(query, [
      phase_id, title, category, duration_min, sort_order, created_by,
    ]);
    return result.rows[0];
  }

  async updateModule(module_id, data) {
    const { title, category, duration_min, sort_order, status } = data;

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (title !== undefined) { updates.push(`title = $${paramCount++}`); values.push(title); }
    if (category !== undefined) { updates.push(`category = $${paramCount++}`); values.push(category); }
    if (duration_min !== undefined) { updates.push(`duration_min = $${paramCount++}`); values.push(duration_min); }
    if (sort_order !== undefined) { updates.push(`sort_order = $${paramCount++}`); values.push(sort_order); }
    if (status !== undefined) { updates.push(`status = $${paramCount++}`); values.push(status); }

    updates.push(`updated_at = NOW()`);
    values.push(module_id);

    const query = `
      UPDATE lms_module
      SET ${updates.join(', ')}
      WHERE id = $${paramCount++}
      RETURNING *
    `;

    const result = await getDb().query(query, values);
    return result.rows[0];
  }

  async getContent(module_id) {
    const query = `
      SELECT * FROM lms_content
      WHERE module_id = $1
      ORDER BY seq, id
    `;
    const result = await getDb().query(query, [module_id]);
    return result.rows;
  }

  async createContent(module_id, data) {
    const { seq = 0, content_type, title, payload = {} } = data;

    const query = `
      INSERT INTO lms_content (module_id, seq, content_type, title, payload)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const result = await getDb().query(query, [
      module_id, seq, content_type, title, JSON.stringify(payload),
    ]);
    return result.rows[0];
  }

  async updateContent(content_id, data) {
    const { seq, content_type, title, payload } = data;

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (seq !== undefined) { updates.push(`seq = $${paramCount++}`); values.push(seq); }
    if (content_type !== undefined) { updates.push(`content_type = $${paramCount++}`); values.push(content_type); }
    if (title !== undefined) { updates.push(`title = $${paramCount++}`); values.push(title); }
    if (payload !== undefined) { updates.push(`payload = $${paramCount++}`); values.push(JSON.stringify(payload)); }

    updates.push(`updated_at = NOW()`);
    values.push(content_id);

    const query = `
      UPDATE lms_content
      SET ${updates.join(', ')}
      WHERE id = $${paramCount++}
      RETURNING *
    `;

    const result = await getDb().query(query, values);
    return result.rows[0];
  }

  async getHireCurriculum(candidate_onboarding_id, company_id) {
    const query = `
      SELECT
        ph.id AS phase_id,
        ph.seq AS phase_seq,
        ph.label AS phase_label,
        ph.day_offset_start,
        ph.day_offset_end,
        m.id AS module_id,
        m.title,
        m.category,
        m.duration_min,
        m.sort_order,
        COALESCE(p.status, 'locked') AS status,
        p.score,
        p.started_at,
        p.completed_at
      FROM lms_phase ph
      LEFT JOIN lms_module m ON m.phase_id = ph.id AND m.status = 'published'
      LEFT JOIN lms_progress p
        ON p.module_id = m.id AND p.candidate_onboarding_id = $1
      WHERE ph.company_id = $2
      ORDER BY ph.seq, m.sort_order, m.id
    `;
    const result = await getDb().query(query, [candidate_onboarding_id, company_id]);
    return result.rows;
  }

  async getHireModuleProgress(candidate_onboarding_id, module_id) {
    const query = `
      SELECT * FROM lms_progress
      WHERE candidate_onboarding_id = $1 AND module_id = $2
    `;
    const result = await getDb().query(query, [candidate_onboarding_id, module_id]);
    return result.rows[0];
  }

  async upsertHireProgress(candidate_onboarding_id, module_id, data) {
    const { status, score, started_at, completed_at } = data;

    const query = `
      INSERT INTO lms_progress (
        candidate_onboarding_id, module_id, status, score, started_at, completed_at
      ) VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (candidate_onboarding_id, module_id) DO UPDATE
      SET status = EXCLUDED.status,
          score = COALESCE(EXCLUDED.score, lms_progress.score),
          started_at = COALESCE(lms_progress.started_at, EXCLUDED.started_at),
          completed_at = EXCLUDED.completed_at,
          updated_at = NOW()
      RETURNING *
    `;

    const result = await getDb().query(query, [
      candidate_onboarding_id, module_id, status, score, started_at, completed_at,
    ]);
    return result.rows[0];
  }
}

export default new OnboardingLmsModel();