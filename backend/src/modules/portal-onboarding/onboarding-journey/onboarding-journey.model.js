import getDb from '../../../config/postgres.js';

class OnboardingJourneyModel {
  async getPreboardingComplete(onboarding_id) {
    const query = `
      SELECT preboarding_completed_at AS occurred_at
      FROM candidate_onboarding
      WHERE id = $1 AND preboarding_completed_at IS NOT NULL
    `;
    const result = await getDb().query(query, [onboarding_id]);
    return result.rows[0] || null;
  }

  async getDayOneStarted(onboarding_id) {
    const query = `
      SELECT day_one_started_at AS occurred_at
      FROM candidate_onboarding
      WHERE id = $1 AND day_one_started_at IS NOT NULL
    `;
    const result = await getDb().query(query, [onboarding_id]);
    return result.rows[0] || null;
  }

  async getProbationStarted(onboarding_id) {
    const query = `
      SELECT probation_started_at AS occurred_at
      FROM candidate_onboarding
      WHERE id = $1 AND probation_started_at IS NOT NULL
    `;
    const result = await getDb().query(query, [onboarding_id]);
    return result.rows[0] || null;
  }

  async getConfirmed(onboarding_id) {
    const query = `
      SELECT confirmed_at AS occurred_at
      FROM candidate_onboarding
      WHERE id = $1 AND confirmed_at IS NOT NULL
    `;
    const result = await getDb().query(query, [onboarding_id]);
    return result.rows[0] || null;
  }

  async getTerminated(onboarding_id) {
    const query = `
      SELECT terminated_at AS occurred_at
      FROM candidate_onboarding
      WHERE id = $1 AND terminated_at IS NOT NULL
    `;
    const result = await getDb().query(query, [onboarding_id]);
    return result.rows[0] || null;
  }

  async getChecklistDone(onboarding_id) {
    const query = `
      SELECT id AS ref_id, label AS title, completed_at AS occurred_at
      FROM onboarding_checklist_item
      WHERE onboarding_id = $1 AND completed_at IS NOT NULL
    `;
    const result = await getDb().query(query, [onboarding_id]);
    return result.rows;
  }

  async getMilestonesDone(onboarding_id) {
    const query = `
      SELECT id AS ref_id, item_label AS title, completed_at AS occurred_at
      FROM onboarding_milestone
      WHERE onboarding_id = $1 AND completed_at IS NOT NULL
    `;
    const result = await getDb().query(query, [onboarding_id]);
    return result.rows;
  }

  async getLmsModulesDone(candidate_onboarding_id) {
    const query = `
      SELECT lp.id AS ref_id, lm.title AS title, lp.completed_at AS occurred_at
      FROM lms_progress lp
      JOIN lms_module lm ON lm.id = lp.module_id
      WHERE lp.candidate_onboarding_id = $1 AND lp.completed_at IS NOT NULL
    `;
    const result = await getDb().query(query, [candidate_onboarding_id]);
    return result.rows;
  }

  async getAssessmentsDone(candidate_onboarding_id) {
    const query = `
      SELECT oar.id AS ref_id, oa.name AS title, oar.completed_at AS occurred_at
      FROM onboarding_assessment_result oar
      JOIN onboarding_assessment oa ON oa.id = oar.assessment_id
      WHERE oar.candidate_onboarding_id = $1 AND oar.completed_at IS NOT NULL
    `;
    const result = await getDb().query(query, [candidate_onboarding_id]);
    return result.rows;
  }

  async getCheckinsDone(onboarding_id) {
    const query = `
      SELECT id AS ref_id, checkin_title AS title, completed_at AS occurred_at
      FROM onboarding_probation_checkin
      WHERE onboarding_id = $1 AND completed_at IS NOT NULL
    `;
    const result = await getDb().query(query, [onboarding_id]);
    return result.rows;
  }

  async getHrisTasksDone(onboarding_id) {
    const query = `
      SELECT id AS ref_id, task_title AS title, completed_at AS occurred_at
      FROM onboarding_hris_task
      WHERE onboarding_id = $1 AND completed_at IS NOT NULL
    `;
    const result = await getDb().query(query, [onboarding_id]);
    return result.rows;
  }

  async getWelcomeMessageSent(onboarding_id) {
    const query = `
      SELECT id AS ref_id, from_name AS title, created_at AS occurred_at
      FROM onboarding_welcome_message
      WHERE onboarding_id = $1
    `;
    const result = await getDb().query(query, [onboarding_id]);
    return result.rows;
  }
}

export default new OnboardingJourneyModel();