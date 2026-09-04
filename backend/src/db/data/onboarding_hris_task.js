export const onboardingHrisTasks = [
  {
    id: 1,
    onboarding_id: 2, // <-- confirm this matches a real candidate_onboarding.id
    task_code: 'PAYROLL_PROFILE',
    task_title: 'Create payroll profile',
    task_description: 'Provision the hire in the payroll system with bank and tax details.',
    status: 'completed',
    integration_data: {},
    error_message: null,
    retry_count: 0,
    executed_at: '2026-09-01 09:00:00+07',
    completed_at: '2026-09-01 09:02:00+07',
  },
  {
    id: 2,
    onboarding_id: 2,
    task_code: 'BPJS_REGISTER',
    task_title: 'Register BPJS Kesehatan & Ketenagakerjaan',
    task_description: 'Submit BPJS registration using the checklist-provided documents.',
    status: 'pending',
    integration_data: {},
    error_message: null,
    retry_count: 0,
    executed_at: null,
    completed_at: null,
  },
];

export default onboardingHrisTasks;