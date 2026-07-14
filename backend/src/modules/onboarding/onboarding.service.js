import OnboardingModel from './onboarding.model.js';

class OnboardingService {
  // Get full onboarding detail (with all nested data)
  async getOnboardingDetail(onboarding_id, company_id) {
    const onboarding = await OnboardingModel.getById(onboarding_id, company_id);

    if (!onboarding) {
      throw { status: 404, message: 'Onboarding record not found' };
    }

    // Fetch all related data
    const [checklist, schedule, milestones, probationCheckins, welcomeMessage] = await Promise.all([
      OnboardingModel.getChecklistItems(onboarding_id),
      OnboardingModel.getDayOneSchedule(onboarding_id),
      OnboardingModel.getMilestones(onboarding_id),
      OnboardingModel.getProbationCheckins(onboarding_id),
      OnboardingModel.getWelcomeMessage(onboarding_id),
    ]);

    // Calculate progress metrics
    const checklistDone = checklist.filter(item => item.status === 'done').length;
    const checklistTotal = checklist.length;
    const checklistPct = checklistTotal > 0 ? Math.round((checklistDone / checklistTotal) * 100) : 0;

    const milestonesDone = milestones.filter(m => m.status === 'done').length;
    const milestonesTotal = milestones.length;

    // Calculate days until start / days since start
    const today = new Date();
    const startDate = new Date(onboarding.start_date);
    const daysDiff = Math.ceil((startDate - today) / (1000 * 60 * 60 * 24));
    const daysUntilStart = daysDiff > 0 ? daysDiff : 0;
    const daysSinceStart = daysDiff < 0 ? Math.abs(daysDiff) : 0;

    // Group milestones by week
    const milestonesByWeek = milestones.reduce((acc, m) => {
      if (!acc[m.week_label]) {
        acc[m.week_label] = {
          title: m.week_label,
          items: []
        };
      }
      acc[m.week_label].items.push({
        label: m.item_label,
        status: m.status
      });
      return acc;
    }, {});

    const weeks = Object.values(milestonesByWeek);

    // Format response to match frontend mock structure
    return {
      id: onboarding.id,
      job: {
        id: onboarding.job_id,
        title: onboarding.job_title,
      },
      candidateName: onboarding.candidate_name,

      preBoarding: {
        startDate: new Date(onboarding.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
        daysUntilStart,
        pctComplete: checklistPct,
        checklist: checklist.map(item => ({
          label: item.label,
          status: item.status,
          owner: item.owner
        })),
        schedule: schedule.map(s => ({
          time: s.time,
          activity: s.activity
        })),
        welcomeMessage: welcomeMessage ? {
          from: welcomeMessage.from_name,
          text: welcomeMessage.message_text
        } : null,
        buddy: onboarding.buddy_name ? {
          name: onboarding.buddy_name
        } : null,
      },

      dayOneThirty: {
        dayOf: daysSinceStart > 30 ? 30 : daysSinceStart,
        totalDays: 30,
        milestonesDone,
        milestonesTotal,
        weeks,
      },

      probation: {
        checkins: probationCheckins.map(c => ({
          code: c.checkin_code,
          title: c.checkin_title,
          note: c.manager_note || '—',
          status: c.status
        }))
      }
    };
  }

  // Get workboard (all onboarding records)
  async getWorkboard(company_id) {
    const records = await OnboardingModel.getWorkboard(company_id);
    return records;
  }

  // Get onboarding by job
  async getByJob(job_id, company_id) {
    const records = await OnboardingModel.getByJob(job_id, company_id);
    return records;
  }

  // Create new onboarding with default template
  async createOnboarding(data) {
    const { company_id, candidate_id, job_id, offer_id, candidate_name, position_title, start_date } = data;

    // Create main onboarding record
    const onboarding = await OnboardingModel.create({
      company_id,
      candidate_id,
      job_id,
      offer_id,
      candidate_name,
      position_title,
      start_date,
      probation_duration_days: 90,
      buddy_user_id: data.buddy_user_id || null,
      manager_user_id: data.manager_user_id || null,
    });

    // Create default checklist items (template)
    const defaultChecklist = [
      { label: 'KTP (re-verified vs BG check)', owner: 'Candidate', sort_order: 1 },
      { label: 'NPWP', owner: 'Candidate', sort_order: 2 },
      { label: 'BPJS Kesehatan number', owner: 'Candidate', sort_order: 3 },
      { label: 'Bank account', owner: 'Candidate', sort_order: 4 },
      { label: 'Equipment form', owner: 'Candidate', sort_order: 5 },
      { label: 'Emergency contact', owner: 'Candidate', sort_order: 6 },
      { label: 'Welcome kit', owner: 'IT/Ops', sort_order: 7 },
    ];

    await Promise.all(
      defaultChecklist.map(item => OnboardingModel.createChecklistItem(onboarding.id, item))
    );

    // Create default Day 1 schedule
    const defaultSchedule = [
      { time: '09:00', activity: 'HR welcome', sort_order: 1 },
      { time: '10:00', activity: 'Team introduction', sort_order: 2 },
      { time: '12:00', activity: 'Team lunch', sort_order: 3 },
      { time: '14:00', activity: '1:1 with manager', sort_order: 4 },
      { time: '16:00', activity: 'Setup & access', sort_order: 5 },
    ];

    await Promise.all(
      defaultSchedule.map(item => OnboardingModel.createScheduleItem(onboarding.id, item))
    );

    // Create default milestones
    const defaultMilestones = [
      { week_label: 'Week 1', week_number: 1, item_label: 'Workspace + tooling access', sort_order: 1 },
      { week_label: 'Week 1', week_number: 1, item_label: 'Codebase tour', sort_order: 2 },
      { week_label: 'Week 1', week_number: 1, item_label: 'First PR (small)', sort_order: 3 },
      { week_label: 'Week 1', week_number: 1, item_label: '1:1 cadence set', sort_order: 4 },

      { week_label: 'Week 2', week_number: 2, item_label: 'Buddy weekly sync', sort_order: 5 },
      { week_label: 'Week 2', week_number: 2, item_label: 'First on-call shadow', sort_order: 6 },
      { week_label: 'Week 2', week_number: 2, item_label: 'Team retro', sort_order: 7 },
      { week_label: 'Week 2', week_number: 2, item_label: 'Goal-setting w/ manager', sort_order: 8 },

      { week_label: 'Week 3–4', week_number: 3, item_label: 'Lead a small ticket', sort_order: 9 },
      { week_label: 'Week 3–4', week_number: 3, item_label: 'First demo', sort_order: 10 },
      { week_label: 'Week 3–4', week_number: 3, item_label: 'Check-in w/ HR', sort_order: 11 },
      { week_label: 'Week 3–4', week_number: 3, item_label: 'Probation goals locked', sort_order: 12 },
    ];

    await Promise.all(
      defaultMilestones.map(item => OnboardingModel.createMilestone(onboarding.id, item))
    );

    // Create default probation check-ins
    const startDateObj = new Date(start_date);
    const d30 = new Date(startDateObj);
    d30.setDate(d30.getDate() + 30);
    const d60 = new Date(startDateObj);
    d60.setDate(d60.getDate() + 60);
    const d90 = new Date(startDateObj);
    d90.setDate(d90.getDate() + 90);

    const defaultCheckins = [
      { checkin_code: 'D30', checkin_title: '30-day check-in', scheduled_date: d30 },
      { checkin_code: 'D60', checkin_title: '60-day check-in', scheduled_date: d60 },
      { checkin_code: 'D90', checkin_title: '90-day decision', scheduled_date: d90 },
    ];

    await Promise.all(
      defaultCheckins.map(item => OnboardingModel.createProbationCheckin(onboarding.id, item))
    );

    return onboarding;
  }

  // Update checklist item status
  async updateChecklistItem(item_id, data) {
    const completed_at = data.status === 'done' ? new Date() : null;
    const updated = await OnboardingModel.updateChecklistItem(item_id, { ...data, completed_at });
    return updated;
  }

  // Update milestone status
  async updateMilestone(milestone_id, data) {
    const completed_at = data.status === 'done' ? new Date() : null;
    const updated = await OnboardingModel.updateMilestone(milestone_id, { ...data, completed_at });
    return updated;
  }

  // Update probation check-in
  async updateProbationCheckin(checkin_id, data) {
    const completed_at = data.status === 'completed' ? new Date() : null;
    const updated = await OnboardingModel.updateProbationCheckin(checkin_id, { ...data, completed_at });
    return updated;
  }

  // Add/update welcome message
  async setWelcomeMessage(onboarding_id, data) {
    const message = await OnboardingModel.createWelcomeMessage(onboarding_id, data);
    return message;
  }

  // Advance stage
  async advanceStage(onboarding_id, company_id, new_stage) {
    const updated = await OnboardingModel.updateStageStatus(onboarding_id, company_id, {
      current_stage: new_stage,
      onboarding_status: 'in-progress'
    });
    return updated;
  }

  // Confirm employee (complete probation)
  async confirmEmployee(onboarding_id, company_id) {
    const updated = await OnboardingModel.updateStageStatus(onboarding_id, company_id, {
      current_stage: 'confirmed',
      onboarding_status: 'completed'
    });
    return updated;
  }
}

export default new OnboardingService();
