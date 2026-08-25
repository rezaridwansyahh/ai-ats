import OnboardingLmsModel from './onboarding-lms.model.js';

class OnboardingLmsService {
  async getPhases(company_id) {
    return OnboardingLmsModel.getPhases(company_id);
  }

  async createPhase(company_id, data) {
    return OnboardingLmsModel.createPhase(company_id, data);
  }

  async updatePhase(phase_id, company_id, data) {
    const updated = await OnboardingLmsModel.updatePhase(phase_id, company_id, data);
    if (!updated) {
      throw { status: 404, message: 'Phase not found' };
    }
    return updated;
  }

  async getModulesByPhase(phase_id, company_id) {
    const phase = await OnboardingLmsModel.getPhaseById(phase_id, company_id);
    if (!phase) {
      throw { status: 404, message: 'Phase not found' };
    }
    return OnboardingLmsModel.getModulesByPhase(phase_id);
  }

  async createModule(phase_id, company_id, created_by, data) {
    const phase = await OnboardingLmsModel.getPhaseById(phase_id, company_id);
    if (!phase) {
      throw { status: 404, message: 'Phase not found' };
    }
    return OnboardingLmsModel.createModule(phase_id, created_by, data);
  }

  async updateModule(module_id, data) {
    if (data.status && !['draft', 'published'].includes(data.status)) {
      throw { status: 400, message: 'status must be draft or published' };
    }
    const updated = await OnboardingLmsModel.updateModule(module_id, data);
    if (!updated) {
      throw { status: 404, message: 'Module not found' };
    }
    return updated;
  }

  async getContent(module_id) {
    const module = await OnboardingLmsModel.getModuleById(module_id);
    if (!module) {
      throw { status: 404, message: 'Module not found' };
    }
    return OnboardingLmsModel.getContent(module_id);
  }

  async createContent(module_id, data) {
    const module = await OnboardingLmsModel.getModuleById(module_id);
    if (!module) {
      throw { status: 404, message: 'Module not found' };
    }
    if (!['video', 'quiz', 'pdf', 'slides'].includes(data.content_type)) {
      throw { status: 400, message: 'content_type must be video, quiz, pdf, or slides' };
    }
    return OnboardingLmsModel.createContent(module_id, data);
  }

  async updateContent(content_id, data) {
    if (data.content_type && !['video', 'quiz', 'pdf', 'slides'].includes(data.content_type)) {
      throw { status: 400, message: 'content_type must be video, quiz, pdf, or slides' };
    }
    const updated = await OnboardingLmsModel.updateContent(content_id, data);
    if (!updated) {
      throw { status: 404, message: 'Content item not found' };
    }
    return updated;
  }

  async getHireCurriculum(candidate_onboarding_id, company_id) {
    const rows = await OnboardingLmsModel.getHireCurriculum(candidate_onboarding_id, company_id);

    const phasesById = new Map();

    for (const row of rows) {
      if (!phasesById.has(row.phase_id)) {
        phasesById.set(row.phase_id, {
          id: row.phase_id,
          seq: row.phase_seq,
          label: row.phase_label,
          dayOffsetStart: row.day_offset_start,
          dayOffsetEnd: row.day_offset_end,
          modules: [],
        });
      }

      if (row.module_id) {
        phasesById.get(row.phase_id).modules.push({
          id: row.module_id,
          title: row.title,
          category: row.category,
          durationMin: row.duration_min,
          status: row.status,
          score: row.score,
          startedAt: row.started_at,
          completedAt: row.completed_at,
        });
      }
    }

    return Array.from(phasesById.values()).map(phase => ({
      ...phase,
      status: this.derivePhaseStatus(phase.modules),
    }));
  }

  derivePhaseStatus(modules) {
    if (modules.length === 0) return 'locked';
    if (modules.every(m => m.status === 'done')) return 'done';
    if (modules.every(m => m.status === 'locked')) return 'locked';
    return 'active';
  }

  async updateHireProgress(candidate_onboarding_id, module_id, data) {
    const module = await OnboardingLmsModel.getModuleById(module_id);
    if (!module) {
      throw { status: 404, message: 'Module not found' };
    }
    if (!['locked', 'todo', 'active', 'done'].includes(data.status)) {
      throw { status: 400, message: 'status must be locked, todo, active, or done' };
    }

    const existing = await OnboardingLmsModel.getHireModuleProgress(candidate_onboarding_id, module_id);
    const completed_at = data.status === 'done' ? new Date() : null;
    const started_at = existing?.started_at ?? (data.status !== 'locked' ? new Date() : null);

    return OnboardingLmsModel.upsertHireProgress(candidate_onboarding_id, module_id, {
      ...data,
      started_at,
      completed_at,
    });
  }
}

export default new OnboardingLmsService();