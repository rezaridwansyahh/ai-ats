import getDb from '../../config/postgres.js';
import OnboardingAssessmentResultModel from './onboarding-assessment-result.model.js';

const ONBOARDING_ASSESSMENT_CATALOG = {
  1: { code: 'onboarding_tki',     name: 'Conflict-Handling Mode Profile', milestone: 'pre', duration_minutes: 10 },
  2: { code: 'onboarding_insight', name: 'Work Personality Profile',       milestone: 'pre', duration_minutes: 15 },
};

const ASSESSMENT_ID_BY_CODE = Object.fromEntries(
  Object.entries(ONBOARDING_ASSESSMENT_CATALOG).map(([id, v]) => [v.code, Number(id)])
);

class OnboardingAssessmentResultService {
  getCatalog() {
    return Object.entries(ONBOARDING_ASSESSMENT_CATALOG).map(([id, v]) => ({
      assessment_id: Number(id),
      ...v,
    }));
  }

  _resolveId(assessment_code) {
    const id = ASSESSMENT_ID_BY_CODE[assessment_code];
    if (!id) throw { status: 404, message: `Unknown assessment: ${assessment_code}` };
    return id;
  }

  async getResultsForOnboarding(candidate_onboarding_id) {
    const rows = await OnboardingAssessmentResultModel.getByOnboardingId(candidate_onboarding_id);
    return rows.map((r) => ({ ...r, ...ONBOARDING_ASSESSMENT_CATALOG[r.assessment_id] }));
  }

  async getByCode(candidate_onboarding_id, assessment_code) {
    const assessment_id = this._resolveId(assessment_code);
    const row = await OnboardingAssessmentResultModel.getLatestByOnboardingAssessment(
      candidate_onboarding_id, assessment_id
    );
    return row ? { ...row, ...ONBOARDING_ASSESSMENT_CATALOG[assessment_id] } : null;
  }

  async submit({ candidate_onboarding_id, assessment_code, results, summary, started_at }) {
    if (!candidate_onboarding_id) throw { status: 400, message: 'candidate_onboarding_id is required' };
    if (!assessment_code) throw { status: 400, message: 'assessment_code is required' };
    if (!results || !summary) {
      throw { status: 400, message: 'results and summary are required (precomputed)' };
    }

    const assessment_id = this._resolveId(assessment_code);

    const client = await getDb().connect();
    try {
      await client.query('BEGIN');

      const existing = await OnboardingAssessmentResultModel.getForUpdate(
        client, candidate_onboarding_id, assessment_id
      );
      if (existing?.status === 'completed') {
        throw { status: 409, message: 'This assessment has already been completed.' };
      }

      const completed_at = new Date().toISOString();
      const row = existing
        ? await OnboardingAssessmentResultModel.update(client, existing.id, {
            status: 'completed',
            results,
            summary,
            started_at: existing.started_at || started_at || null,
            completed_at,
          })
        : await OnboardingAssessmentResultModel.create(client, {
            candidate_onboarding_id,
            assessment_id,
            status: 'completed',
            results,
            summary,
            started_at: started_at || null,
            completed_at,
          });

      await client.query('COMMIT');
      return { ...row, ...ONBOARDING_ASSESSMENT_CATALOG[assessment_id] };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}

export default new OnboardingAssessmentResultService();