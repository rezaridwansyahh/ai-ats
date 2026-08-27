// Dummy onboarding seed data, tied to the two accepted offers in
// candidate-offer.js (offer_id 2 and 4 — the only candidates with
// accepted_at populated, so the only ones who'd legitimately have an
// onboarding record).
//
// Checklist / day-1 schedule / milestone / probation check-in items mirror
// exactly what OnboardingService.createOnboarding()'s default templates
// generate for a real record — not invented content.
//
// Irfan (onboarding id 1) is staged further along (Day 1-30, some milestones
// done) and Kevin (onboarding id 2) is still fresh (Pre-boarding, nothing
// started yet), so the workboard's stage filters and progress bars have
// something to show.

export const candidateOnboarding = [
  {
    id: 1,
    company_id: 1,
    candidate_id: 6,   // Irfan Maulana
    job_id: 1,         // Senior Frontend Engineer
    offer_id: 2,
    candidate_name: 'Irfan Maulana',
    position_title: 'Senior Frontend Engineer',
    start_date: '2026-06-15',
    probation_duration_days: 90,
    probation_end_date: '2026-09-13',
    current_stage: 'day-1-30',
    onboarding_status: 'in-progress',
    buddy_user_id: null,
    buddy_name: 'Ayu Pratiwi',
    manager_user_id: null,
    manager_name: 'Budi Santoso',
    preboarding_completed_at: '2026-06-14T10:00:00Z',
    day_one_started_at: '2026-06-15T09:00:00Z',
    probation_started_at: '2026-06-15T09:00:00Z',
    confirmed_at: null,
    terminated_at: null,
  },
  {
    id: 2,
    company_id: 1,
    candidate_id: 10,  // Kevin Wijaya
    job_id: 2,         // Backend Engineer
    offer_id: 4,
    candidate_name: 'Kevin Wijaya',
    position_title: 'Backend Engineer',
    start_date: '2026-06-22',
    probation_duration_days: 90,
    probation_end_date: '2026-09-20',
    current_stage: 'pre-boarding',
    onboarding_status: 'pending',
    buddy_user_id: null,
    buddy_name: null,
    manager_user_id: null,
    manager_name: null,
    preboarding_completed_at: null,
    day_one_started_at: null,
    probation_started_at: null,
    confirmed_at: null,
    terminated_at: null,
  },
];

// ==================== CHECKLIST ITEMS ====================
// Irfan (onboarding_id 1): 6 of 7 done. Kevin (onboarding_id 2): nothing started.

export const onboardingChecklistItems = [
  // Irfan — mostly done
  { id: 1, onboarding_id: 1, label: 'KTP (re-verified vs BG check)', category: 'document', owner: 'Candidate', status: 'done', sort_order: 1, completed_at: '2026-06-10T09:00:00Z' },
  { id: 2, onboarding_id: 1, label: 'NPWP', category: 'document', owner: 'Candidate', status: 'done', sort_order: 2, completed_at: '2026-06-10T09:05:00Z' },
  { id: 3, onboarding_id: 1, label: 'BPJS Kesehatan number', category: 'document', owner: 'Candidate', status: 'done', sort_order: 3, completed_at: '2026-06-11T09:00:00Z' },
  { id: 4, onboarding_id: 1, label: 'Bank account', category: 'document', owner: 'Candidate', status: 'done', sort_order: 4, completed_at: '2026-06-11T09:10:00Z' },
  { id: 5, onboarding_id: 1, label: 'Equipment form', category: 'document', owner: 'Candidate', status: 'done', sort_order: 5, completed_at: '2026-06-12T14:00:00Z' },
  { id: 6, onboarding_id: 1, label: 'Emergency contact', category: 'document', owner: 'Candidate', status: 'notStarted', sort_order: 6, completed_at: null },
  { id: 7, onboarding_id: 1, label: 'Welcome kit', category: 'document', owner: 'IT/Ops', status: 'done', sort_order: 7, completed_at: '2026-06-13T11:00:00Z' },

  // Kevin — nothing started
  { id: 8, onboarding_id: 2, label: 'KTP (re-verified vs BG check)', category: 'document', owner: 'Candidate', status: 'notStarted', sort_order: 1, completed_at: null },
  { id: 9, onboarding_id: 2, label: 'NPWP', category: 'document', owner: 'Candidate', status: 'notStarted', sort_order: 2, completed_at: null },
  { id: 10, onboarding_id: 2, label: 'BPJS Kesehatan number', category: 'document', owner: 'Candidate', status: 'notStarted', sort_order: 3, completed_at: null },
  { id: 11, onboarding_id: 2, label: 'Bank account', category: 'document', owner: 'Candidate', status: 'notStarted', sort_order: 4, completed_at: null },
  { id: 12, onboarding_id: 2, label: 'Equipment form', category: 'document', owner: 'Candidate', status: 'notStarted', sort_order: 5, completed_at: null },
  { id: 13, onboarding_id: 2, label: 'Emergency contact', category: 'document', owner: 'Candidate', status: 'notStarted', sort_order: 6, completed_at: null },
  { id: 14, onboarding_id: 2, label: 'Welcome kit', category: 'document', owner: 'IT/Ops', status: 'notStarted', sort_order: 7, completed_at: null },
];

// ==================== DAY 1 SCHEDULE ====================
// Only Irfan has reached Day 1; Kevin's schedule exists but is unstarted.

export const onboardingDayOneSchedule = [
  { id: 1, onboarding_id: 1, time: '09:00', activity: 'HR welcome', sort_order: 1, completed: true },
  { id: 2, onboarding_id: 1, time: '10:00', activity: 'Team introduction', sort_order: 2, completed: true },
  { id: 3, onboarding_id: 1, time: '12:00', activity: 'Team lunch', sort_order: 3, completed: true },
  { id: 4, onboarding_id: 1, time: '14:00', activity: '1:1 with manager', sort_order: 4, completed: true },
  { id: 5, onboarding_id: 1, time: '16:00', activity: 'Setup & access', sort_order: 5, completed: true },

  { id: 6, onboarding_id: 2, time: '09:00', activity: 'HR welcome', sort_order: 1, completed: false },
  { id: 7, onboarding_id: 2, time: '10:00', activity: 'Team introduction', sort_order: 2, completed: false },
  { id: 8, onboarding_id: 2, time: '12:00', activity: 'Team lunch', sort_order: 3, completed: false },
  { id: 9, onboarding_id: 2, time: '14:00', activity: '1:1 with manager', sort_order: 4, completed: false },
  { id: 10, onboarding_id: 2, time: '16:00', activity: 'Setup & access', sort_order: 5, completed: false },
];

// ==================== MILESTONES ====================
// Irfan: Week 1 done, Week 2 in progress. Kevin: nothing started (hasn't started yet).

export const onboardingMilestones = [
  // Irfan — Week 1 done, Week 2 partial
  { id: 1, onboarding_id: 1, week_label: 'Week 1', week_number: 1, item_label: 'Workspace + tooling access', status: 'done', sort_order: 1, completed_at: '2026-06-15T16:00:00Z' },
  { id: 2, onboarding_id: 1, week_label: 'Week 1', week_number: 1, item_label: 'Codebase tour', status: 'done', sort_order: 2, completed_at: '2026-06-16T11:00:00Z' },
  { id: 3, onboarding_id: 1, week_label: 'Week 1', week_number: 1, item_label: 'First PR (small)', status: 'done', sort_order: 3, completed_at: '2026-06-18T15:00:00Z' },
  { id: 4, onboarding_id: 1, week_label: 'Week 1', week_number: 1, item_label: '1:1 cadence set', status: 'done', sort_order: 4, completed_at: '2026-06-16T14:00:00Z' },

  { id: 5, onboarding_id: 1, week_label: 'Week 2', week_number: 2, item_label: 'Buddy weekly sync', status: 'done', sort_order: 5, completed_at: '2026-06-22T10:00:00Z' },
  { id: 6, onboarding_id: 1, week_label: 'Week 2', week_number: 2, item_label: 'First on-call shadow', status: 'notStarted', sort_order: 6, completed_at: null },
  { id: 7, onboarding_id: 1, week_label: 'Week 2', week_number: 2, item_label: 'Team retro', status: 'notStarted', sort_order: 7, completed_at: null },
  { id: 8, onboarding_id: 1, week_label: 'Week 2', week_number: 2, item_label: 'Goal-setting w/ manager', status: 'notStarted', sort_order: 8, completed_at: null },

  { id: 9, onboarding_id: 1, week_label: 'Week 3-4', week_number: 3, item_label: 'Lead a small ticket', status: 'notStarted', sort_order: 9, completed_at: null },
  { id: 10, onboarding_id: 1, week_label: 'Week 3-4', week_number: 3, item_label: 'First demo', status: 'notStarted', sort_order: 10, completed_at: null },
  { id: 11, onboarding_id: 1, week_label: 'Week 3-4', week_number: 3, item_label: 'Check-in w/ HR', status: 'notStarted', sort_order: 11, completed_at: null },
  { id: 12, onboarding_id: 1, week_label: 'Week 3-4', week_number: 3, item_label: 'Probation goals locked', status: 'notStarted', sort_order: 12, completed_at: null },

  // Kevin — nothing started
  { id: 13, onboarding_id: 2, week_label: 'Week 1', week_number: 1, item_label: 'Workspace + tooling access', status: 'notStarted', sort_order: 1, completed_at: null },
  { id: 14, onboarding_id: 2, week_label: 'Week 1', week_number: 1, item_label: 'Codebase tour', status: 'notStarted', sort_order: 2, completed_at: null },
  { id: 15, onboarding_id: 2, week_label: 'Week 1', week_number: 1, item_label: 'First PR (small)', status: 'notStarted', sort_order: 3, completed_at: null },
  { id: 16, onboarding_id: 2, week_label: 'Week 1', week_number: 1, item_label: '1:1 cadence set', status: 'notStarted', sort_order: 4, completed_at: null },

  { id: 17, onboarding_id: 2, week_label: 'Week 2', week_number: 2, item_label: 'Buddy weekly sync', status: 'notStarted', sort_order: 5, completed_at: null },
  { id: 18, onboarding_id: 2, week_label: 'Week 2', week_number: 2, item_label: 'First on-call shadow', status: 'notStarted', sort_order: 6, completed_at: null },
  { id: 19, onboarding_id: 2, week_label: 'Week 2', week_number: 2, item_label: 'Team retro', status: 'notStarted', sort_order: 7, completed_at: null },
  { id: 20, onboarding_id: 2, week_label: 'Week 2', week_number: 2, item_label: 'Goal-setting w/ manager', status: 'notStarted', sort_order: 8, completed_at: null },

  { id: 21, onboarding_id: 2, week_label: 'Week 3-4', week_number: 3, item_label: 'Lead a small ticket', status: 'notStarted', sort_order: 9, completed_at: null },
  { id: 22, onboarding_id: 2, week_label: 'Week 3-4', week_number: 3, item_label: 'First demo', status: 'notStarted', sort_order: 10, completed_at: null },
  { id: 23, onboarding_id: 2, week_label: 'Week 3-4', week_number: 3, item_label: 'Check-in w/ HR', status: 'notStarted', sort_order: 11, completed_at: null },
  { id: 24, onboarding_id: 2, week_label: 'Week 3-4', week_number: 3, item_label: 'Probation goals locked', status: 'notStarted', sort_order: 12, completed_at: null },
];

// ==================== PROBATION CHECK-INS ====================
// Dates computed the same way OnboardingService does: start_date + 30/60/90 days.

export const onboardingProbationCheckins = [
  { id: 1, onboarding_id: 1, checkin_code: 'D30', checkin_title: '30-day check-in', scheduled_date: '2026-07-15', status: 'awaiting', manager_note: null, completed_at: null },
  { id: 2, onboarding_id: 1, checkin_code: 'D60', checkin_title: '60-day check-in', scheduled_date: '2026-08-14', status: 'awaiting', manager_note: null, completed_at: null },
  { id: 3, onboarding_id: 1, checkin_code: 'D90', checkin_title: '90-day decision', scheduled_date: '2026-09-13', status: 'awaiting', manager_note: null, completed_at: null },

  { id: 4, onboarding_id: 2, checkin_code: 'D30', checkin_title: '30-day check-in', scheduled_date: '2026-07-22', status: 'awaiting', manager_note: null, completed_at: null },
  { id: 5, onboarding_id: 2, checkin_code: 'D60', checkin_title: '60-day check-in', scheduled_date: '2026-08-21', status: 'awaiting', manager_note: null, completed_at: null },
  { id: 6, onboarding_id: 2, checkin_code: 'D90', checkin_title: '90-day decision', scheduled_date: '2026-09-20', status: 'awaiting', manager_note: null, completed_at: null },
];

// ==================== WELCOME MESSAGE ====================
// Only Irfan has one — Kevin hasn't reached that step yet.

export const onboardingWelcomeMessages = [
  {
    id: 1,
    onboarding_id: 1,
    from_user_id: null,
    from_name: 'Budi Santoso',
    message_text: 'Welcome to the team, Irfan! Excited to have you on the frontend squad — reach out any time before Day 1, and see you Monday.',
  },
];