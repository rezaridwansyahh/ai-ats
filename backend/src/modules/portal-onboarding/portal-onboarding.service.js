import jwt from 'jsonwebtoken';
import PortalOnboardingModel from './portal-onboarding.model.js';
import OnboardingLmsService from '../onboarding-lms/onboarding-lms.service.js';

const JWT_SECRET = process.env.JWT_SECRET;

function isEmailFormat(s) {
  if (typeof s !== 'string') return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
}

class PortalOnboardingService {

  async login(email) {
    if (!isEmailFormat(email)) {
      throw { status: 400, message: 'A valid email is required.' };
    }
    const normalized = email.trim().toLowerCase();
    const row = await PortalOnboardingModel.getByEmail(normalized);
    if (!row) {
      throw { status: 404, message: 'No onboarding record found for this email.' };
    }
    const token = jwt.sign(
      { scope: 'onboarding_candidate', onboarding_id: row.onboarding_id, candidate_id: row.candidate_id },
      JWT_SECRET,
      { expiresIn: '30d' }
    );
    return { token, onboarding: this._present(row) };
  }

  async getMe(onboarding_id) {
    const row = await PortalOnboardingModel.getById(onboarding_id);
    if (!row) throw { status: 404, message: 'Onboarding record not found.' };
    return this._present(row);
  }

  async getCurriculum(onboarding_id) {
    const row = await PortalOnboardingModel.getById(onboarding_id);
    if (!row) throw { status: 404, message: 'Onboarding record not found.' };

    const phases = await OnboardingLmsService.getHireCurriculum(onboarding_id, row.company_id);

    const startDate = row.start_date ? new Date(row.start_date) : null;

    const PHASES = phases.map(p => ({
      id: p.seq,
      when: p.label,
      status: p.status, 
    }));

    const MODULES = phases.flatMap(p => {
      const due = startDate && p.dayOffsetEnd != null
        ? this._addDays(startDate, p.dayOffsetEnd)
        : null;

      return p.modules.map(m => ({
        id: m.id,
        t_en: m.title,
        t_id: m.title,
        cat: m.category,
        phase: p.seq,
        dur: m.durationMin,
        status: m.status,
        score: m.score,
        due: due ? this._formatDue(due) : null,
      }));
    });

    return { PHASES, MODULES };
  }

  _addDays(date, days) {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
  }

  _formatDue(date) {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  _present(row) {
    return {
      onboarding_id: row.onboarding_id,
      candidate_name: row.candidate_name,
      position_title: row.position_title,
      start_date: row.start_date,
      current_stage: row.current_stage,
      onboarding_status: row.onboarding_status,
    };
  }
}

export default new PortalOnboardingService();