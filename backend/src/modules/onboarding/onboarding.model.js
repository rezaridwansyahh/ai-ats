import getDb from '../../config/postgres.js';

class OnboardingModel {
  // Get single onboarding detail by ID
  async getById(onboarding_id, company_id) {
    const query = `
      SELECT
        ob.*,
        mc.name as candidate_name,
        ma.email as candidate_email,
        cj.job_title,
        co.position_title,
        buddy.name as buddy_name,
        mgr.name as manager_name
      FROM candidate_onboarding ob
      JOIN master_candidate mc ON ob.candidate_id = mc.id
      LEFT JOIN master_applicant ma ON mc.applicant_id = ma.id
      JOIN core_job cj ON ob.job_id = cj.id
      JOIN candidate_offer co ON ob.offer_id = co.id
      LEFT JOIN master_users buddy ON ob.buddy_user_id = buddy.id
      LEFT JOIN master_users mgr ON ob.manager_user_id = mgr.id
      WHERE ob.id = $1 AND ob.company_id = $2
    `;

    const result = await getDb().query(query, [onboarding_id, company_id]);
    return result.rows[0];
  }

  // Get all onboarding for company (workboard)
  async getWorkboard(company_id) {
    const query = `
      SELECT
        ob.id,
        ob.candidate_id,
        ob.job_id,
        ob.candidate_name,
        ob.position_title,
        ob.start_date,
        ob.current_stage,
        ob.onboarding_status,
        ob.probation_end_date,
        ob.created_at,
        cj.job_title,
        COUNT(DISTINCT ocl.id) FILTER (WHERE ocl.status = 'done') as checklist_done,
        COUNT(DISTINCT ocl.id) as checklist_total,
        COUNT(DISTINCT om.id) FILTER (WHERE om.status = 'done') as milestones_done,
        COUNT(DISTINCT om.id) as milestones_total
      FROM candidate_onboarding ob
      JOIN core_job cj ON ob.job_id = cj.id
      LEFT JOIN onboarding_checklist_item ocl ON ob.id = ocl.onboarding_id
      LEFT JOIN onboarding_milestone om ON ob.id = om.onboarding_id
      WHERE ob.company_id = $1
      GROUP BY ob.id, cj.job_title
      ORDER BY ob.start_date DESC, ob.created_at DESC
    `;

    const result = await getDb().query(query, [company_id]);
    return result.rows;
  }

  // Get onboarding by job
  async getByJob(job_id, company_id) {
    const query = `
      SELECT
        ob.id,
        ob.candidate_id,
        ob.candidate_name,
        ob.position_title,
        ob.start_date,
        ob.current_stage,
        ob.onboarding_status,
        ob.created_at
      FROM candidate_onboarding ob
      WHERE ob.job_id = $1 AND ob.company_id = $2
      ORDER BY ob.start_date DESC
    `;

    const result = await getDb().query(query, [job_id, company_id]);
    return result.rows;
  }

  // Create new onboarding record
  async create(data) {
    const {
      company_id,
      candidate_id,
      job_id,
      offer_id,
      candidate_name,
      position_title,
      start_date,
      probation_duration_days = 90,
      buddy_user_id = null,
      manager_user_id = null,
    } = data;

    const probation_end_date = new Date(start_date);
    probation_end_date.setDate(probation_end_date.getDate() + probation_duration_days);

    const query = `
      INSERT INTO candidate_onboarding (
        company_id,
        candidate_id,
        job_id,
        offer_id,
        candidate_name,
        position_title,
        start_date,
        probation_duration_days,
        probation_end_date,
        buddy_user_id,
        manager_user_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;

    const result = await getDb().query(query, [
      company_id,
      candidate_id,
      job_id,
      offer_id,
      candidate_name,
      position_title,
      start_date,
      probation_duration_days,
      probation_end_date,
      buddy_user_id,
      manager_user_id,
    ]);

    return result.rows[0];
  }

  // Update onboarding stage/status
  async updateStageStatus(onboarding_id, company_id, data) {
    const { current_stage, onboarding_status } = data;

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (current_stage) {
      updates.push(`current_stage = $${paramCount++}`);
      values.push(current_stage);
    }

    if (onboarding_status) {
      updates.push(`onboarding_status = $${paramCount++}`);
      values.push(onboarding_status);
    }

    updates.push(`updated_at = NOW()`);
    values.push(onboarding_id, company_id);

    const query = `
      UPDATE candidate_onboarding
      SET ${updates.join(', ')}
      WHERE id = $${paramCount++} AND company_id = $${paramCount++}
      RETURNING *
    `;

    const result = await getDb().query(query, values);
    return result.rows[0];
  }

  // ==================== CHECKLIST ITEMS ====================

  async getChecklistItems(onboarding_id) {
    const query = `
      SELECT * FROM onboarding_checklist_item
      WHERE onboarding_id = $1
      ORDER BY sort_order, id
    `;

    const result = await getDb().query(query, [onboarding_id]);
    return result.rows;
  }

  async createChecklistItem(onboarding_id, data) {
    const { label, category = 'document', owner = 'Candidate', status = 'notStarted', sort_order = 0 } = data;

    const query = `
      INSERT INTO onboarding_checklist_item (
        onboarding_id, label, category, owner, status, sort_order
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const result = await getDb().query(query, [onboarding_id, label, category, owner, status, sort_order]);
    return result.rows[0];
  }

  async updateChecklistItem(item_id, data) {
    const { status, notes, completed_at } = data;

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (status) {
      updates.push(`status = $${paramCount++}`);
      values.push(status);
    }

    if (notes !== undefined) {
      updates.push(`notes = $${paramCount++}`);
      values.push(notes);
    }

    if (completed_at) {
      updates.push(`completed_at = $${paramCount++}`);
      values.push(completed_at);
    }

    values.push(item_id);

    const query = `
      UPDATE onboarding_checklist_item
      SET ${updates.join(', ')}
      WHERE id = $${paramCount++}
      RETURNING *
    `;

    const result = await getDb().query(query, values);
    return result.rows[0];
  }

  // ==================== DAY ONE SCHEDULE ====================

  async getDayOneSchedule(onboarding_id) {
    const query = `
      SELECT * FROM onboarding_day_one_schedule
      WHERE onboarding_id = $1
      ORDER BY sort_order, time
    `;

    const result = await getDb().query(query, [onboarding_id]);
    return result.rows;
  }

  async createScheduleItem(onboarding_id, data) {
    const { time, activity, sort_order = 0 } = data;

    const query = `
      INSERT INTO onboarding_day_one_schedule (onboarding_id, time, activity, sort_order)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

    const result = await getDb().query(query, [onboarding_id, time, activity, sort_order]);
    return result.rows[0];
  }

  // ==================== MILESTONES ====================

  async getMilestones(onboarding_id) {
    const query = `
      SELECT * FROM onboarding_milestone
      WHERE onboarding_id = $1
      ORDER BY week_number, sort_order
    `;

    const result = await getDb().query(query, [onboarding_id]);
    return result.rows;
  }

  async createMilestone(onboarding_id, data) {
    const { week_label, week_number, item_label, status = 'notStarted', sort_order = 0 } = data;

    const query = `
      INSERT INTO onboarding_milestone (
        onboarding_id, week_label, week_number, item_label, status, sort_order
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const result = await getDb().query(query, [onboarding_id, week_label, week_number, item_label, status, sort_order]);
    return result.rows[0];
  }

  async updateMilestone(milestone_id, data) {
    const { status, completed_at } = data;

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (status) {
      updates.push(`status = $${paramCount++}`);
      values.push(status);
    }

    if (completed_at) {
      updates.push(`completed_at = $${paramCount++}`);
      values.push(completed_at);
    }

    values.push(milestone_id);

    const query = `
      UPDATE onboarding_milestone
      SET ${updates.join(', ')}
      WHERE id = $${paramCount++}
      RETURNING *
    `;

    const result = await getDb().query(query, values);
    return result.rows[0];
  }

  // ==================== PROBATION CHECK-INS ====================

  async getProbationCheckins(onboarding_id) {
    const query = `
      SELECT * FROM onboarding_probation_checkin
      WHERE onboarding_id = $1
      ORDER BY checkin_code
    `;

    const result = await getDb().query(query, [onboarding_id]);
    return result.rows;
  }

  async createProbationCheckin(onboarding_id, data) {
    const { checkin_code, checkin_title, scheduled_date, status = 'awaiting' } = data;

    const query = `
      INSERT INTO onboarding_probation_checkin (
        onboarding_id, checkin_code, checkin_title, scheduled_date, status
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const result = await getDb().query(query, [onboarding_id, checkin_code, checkin_title, scheduled_date, status]);
    return result.rows[0];
  }

  async updateProbationCheckin(checkin_id, data) {
    const { status, manager_note, completed_at } = data;

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (status) {
      updates.push(`status = $${paramCount++}`);
      values.push(status);
    }

    if (manager_note !== undefined) {
      updates.push(`manager_note = $${paramCount++}`);
      values.push(manager_note);
    }

    if (completed_at) {
      updates.push(`completed_at = $${paramCount++}`);
      values.push(completed_at);
    }

    values.push(checkin_id);

    const query = `
      UPDATE onboarding_probation_checkin
      SET ${updates.join(', ')}
      WHERE id = $${paramCount++}
      RETURNING *
    `;

    const result = await getDb().query(query, values);
    return result.rows[0];
  }

  // ==================== WELCOME MESSAGE ====================

  async getWelcomeMessage(onboarding_id) {
    const query = `
      SELECT * FROM onboarding_welcome_message
      WHERE onboarding_id = $1
    `;

    const result = await getDb().query(query, [onboarding_id]);
    return result.rows[0];
  }

  async createWelcomeMessage(onboarding_id, data) {
    const { from_user_id, from_name, message_text } = data;

    const query = `
      INSERT INTO onboarding_welcome_message (onboarding_id, from_user_id, from_name, message_text)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (onboarding_id) DO UPDATE
      SET from_user_id = EXCLUDED.from_user_id,
          from_name = EXCLUDED.from_name,
          message_text = EXCLUDED.message_text,
          created_at = NOW()
      RETURNING *
    `;

    const result = await getDb().query(query, [onboarding_id, from_user_id, from_name, message_text]);
    return result.rows[0];
  }
}

export default new OnboardingModel();
