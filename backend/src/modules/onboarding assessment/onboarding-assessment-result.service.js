import getDb from '../../config/postgres.js';
import OnboardingAssessmentResultModel from './onboarding-assessment-result.model.js';

const BATTERY_BY_ASSESSMENT_ID = { 1: 'T', 2: 'I' };
const ASSESSMENT_ID_BY_BATTERY = { T: 1, I: 2 };

class OnboardingAssessmentResultService {
  _resolveId(battery) {
    const id = ASSESSMENT_ID_BY_BATTERY[battery];
    if (!id) throw { status: 404, message: `Unknown battery: ${battery}` };
    return id;
  }

  async getResultsForOnboarding(candidate_onboarding_id) {
    const rows = await OnboardingAssessmentResultModel.getByOnboardingId(candidate_onboarding_id);
    return rows.map((r) => ({ ...r, battery: BATTERY_BY_ASSESSMENT_ID[r.assessment_id] }));
  }

  async getByBattery(candidate_onboarding_id, battery) {
    const assessment_id = this._resolveId(battery);
    const row = await OnboardingAssessmentResultModel.getLatestByOnboardingAssessment(
      candidate_onboarding_id, assessment_id
    );
    return row ? { ...row, battery } : null;
  }

  async submit({ candidate_onboarding_id, battery, results, summary, started_at }) {
    if (!candidate_onboarding_id) throw { status: 400, message: 'candidate_onboarding_id is required' };
    if (!battery) throw { status: 400, message: 'battery is required' };
    if (!results || !summary) throw { status: 400, message: 'results and summary are required (precomputed)' };

    const assessment_id = this._resolveId(battery);

    const client = await getDb().connect();
    try {
      await client.query('BEGIN');

      const existing = await OnboardingAssessmentResultModel.getForUpdate(client, candidate_onboarding_id, assessment_id);
      if (existing?.status === 'completed') {
        throw { status: 409, message: 'This assessment has already been completed.' };
      }

      const completed_at = new Date().toISOString();
      const row = existing
        ? await OnboardingAssessmentResultModel.update(client, existing.id, {
            status: 'completed', results, summary,
            started_at: existing.started_at || started_at || null,
            completed_at,
          })
        : await OnboardingAssessmentResultModel.create(client, {
            candidate_onboarding_id, assessment_id, status: 'completed',
            results, summary, started_at: started_at || null, completed_at,
          });

      await client.query('COMMIT');
      return { ...row, battery };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}

export default new OnboardingAssessmentResultService();