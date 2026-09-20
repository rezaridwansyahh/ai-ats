import OnboardingJourneyModel from './onboarding-journey.model.js';

class OnboardingJourneyService {
  async getJourney(onboarding_id) {
    const [
      preboardingComplete,
      dayOneStarted,
      checklistDone,
      milestonesDone,
      lmsModulesDone,
      assessmentsDone,
      checkinsDone,
      hrisTasksDone,
      welcomeMessageSent,
      probationStarted,
      confirmed,
      terminated,
    ] = await Promise.all([
      OnboardingJourneyModel.getPreboardingComplete(onboarding_id),
      OnboardingJourneyModel.getDayOneStarted(onboarding_id),
      OnboardingJourneyModel.getChecklistDone(onboarding_id),
      OnboardingJourneyModel.getMilestonesDone(onboarding_id),
      OnboardingJourneyModel.getLmsModulesDone(onboarding_id),
      OnboardingJourneyModel.getAssessmentsDone(onboarding_id),
      OnboardingJourneyModel.getCheckinsDone(onboarding_id),
      OnboardingJourneyModel.getHrisTasksDone(onboarding_id),
      OnboardingJourneyModel.getWelcomeMessageSent(onboarding_id),
      OnboardingJourneyModel.getProbationStarted(onboarding_id),
      OnboardingJourneyModel.getConfirmed(onboarding_id),
      OnboardingJourneyModel.getTerminated(onboarding_id),
    ]);

    const events = [];

    if (preboardingComplete) {
      events.push({ event_type: 'preboarding_complete', occurred_at: preboardingComplete.occurred_at });
    }
    if (dayOneStarted) {
      events.push({ event_type: 'day_one_started', occurred_at: dayOneStarted.occurred_at });
    }
    if (probationStarted) {
      events.push({ event_type: 'probation_started', occurred_at: probationStarted.occurred_at });
    }
    if (confirmed) {
      events.push({ event_type: 'confirmed', occurred_at: confirmed.occurred_at });
    }
    if (terminated) {
      events.push({ event_type: 'terminated', occurred_at: terminated.occurred_at });
    }

    // multi-row events — one journey entry per record
    checklistDone.forEach((row) => {
      events.push({ event_type: 'checklist_item_done', ref_id: row.ref_id, title: row.title, occurred_at: row.occurred_at });
    });

    milestonesDone.forEach((row) => {
      events.push({ event_type: 'milestone_done', ref_id: row.ref_id, title: row.title, occurred_at: row.occurred_at });
    });

    lmsModulesDone.forEach((row) => {
      events.push({ event_type: 'lms_module_done', ref_id: row.ref_id, title: row.title, occurred_at: row.occurred_at });
    });

    assessmentsDone.forEach((row) => {
      events.push({ event_type: 'assessment_done', ref_id: row.ref_id, title: row.title, occurred_at: row.occurred_at });
    });

    checkinsDone.forEach((row) => {
      events.push({ event_type: 'checkin_done', ref_id: row.ref_id, title: row.title, occurred_at: row.occurred_at });
    });

    hrisTasksDone.forEach((row) => {
      events.push({ event_type: 'hris_task_done', ref_id: row.ref_id, title: row.title, occurred_at: row.occurred_at });
    });

    welcomeMessageSent.forEach((row) => {
      events.push({ event_type: 'welcome_message_sent', ref_id: row.ref_id, title: row.title, occurred_at: row.occurred_at });
    });

    // most recent first
    events.sort((a, b) => new Date(b.occurred_at) - new Date(a.occurred_at));

    return events;
  }
}

export default new OnboardingJourneyService();