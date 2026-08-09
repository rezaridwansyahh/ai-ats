// Step definitions for react-joyride, one set per page.
// Each `target` matches a `data-tour="..."` attribute on the real DOM elements.
// skipBeacon: true is set on every step (react-joyride v3 field name — was
// `disableBeacon` in v2) so tooltips appear immediately, no click needed.


/* ── Candidate Pipeline list page: /candidate-pipeline ── */
export const PIPELINE_LIST_STEPS = [
  {
    target: '[data-tour="job-search"]',
    title: 'Find a job fast',
    content: 'Type a job title here to filter the list below instantly.',
    placement: 'bottom',
    skipBeacon: true,
  },
  {
    target: '[data-tour="job-table"]',
    title: 'Your active jobs',
    content:
      'Only Active jobs show up here. Click any row to open that job\u2019s candidate pipeline and see who\u2019s in which stage.',
    placement: 'top',
    skipBeacon: true,
  },
  {
    target: '[data-tour="job-activity-header"]',
    title: 'Keep an eye on activity',
    content:
      'A red "0 active" badge means a job has no candidates moving through its pipeline right now \u2014 worth checking on.',
    placement: 'left',
    skipBeacon: true,
  },
];

/* ── Candidate Pipeline detail page: /candidate-pipeline/:id ── */
export const PIPELINE_DETAIL_STEPS = [
  {
    target: '[data-tour="back-to-pipeline"]',
    title: 'Heads up',
    content: 'You can always jump back to the full job list from here.',
    placement: 'bottom',
    skipBeacon: true,
  },
  {
    target: '[data-tour="job-summary"]',
    title: 'Job snapshot',
    content: 'Hired count and how many candidates are currently sitting in this role\u2019s pipeline.',
    placement: 'bottom',
    skipBeacon: true,
  },
  {
    target: '[data-tour="candidate-search"]',
    title: 'Search candidates',
    content: 'Filter the list below by candidate name.',
    placement: 'bottom',
    skipBeacon: true,
  },
  {
    target: '[data-tour="stage-filter"]',
    title: 'Filter by stage',
    content: 'Narrow the list to candidates in one specific stage, like Interview or Background Check.',
    placement: 'bottom',
    skipBeacon: true,
  },
  {
    target: '[data-tour="exp-filter"]',
    title: 'Filter by experience',
    content: 'Only show candidates within a certain years-of-experience range.',
    placement: 'bottom',
    skipBeacon: true,
  },
  {
    target: '[data-tour="sort-experience"]',
    title: 'Sort by experience',
    content: 'Click here to sort candidates by experience \u2014 most experienced first, then least, then back to default order.',
    placement: 'bottom',
    skipBeacon: true,
  },
  {
    target: '[data-tour="candidate-table"]',
    title: 'Candidates by stage',
    content: 'Click any candidate to open their full profile and see their progress through the pipeline.',
    placement: 'top',
    skipBeacon: true,
  },
];

/* ── Job Management list page: /sourcing/job-management ── */
export const JOB_MANAGEMENT_LIST_STEPS = [
  {
    target: '[data-tour="job-mgmt-stats"]',
    title: 'Your hiring snapshot',
    content: 'A quick overview: total applicants, jobs posted, how many are open, and how many are still drafts.',
    placement: 'bottom',
    skipBeacon: true,
  },
  {
    target: '[data-tour="job-mgmt-create-btn"]',
    title: 'Start a new job',
    content: 'Click here to open the New Job form and post a fresh requisition.',
    placement: 'bottom',
    skipBeacon: true,
  },
  {
    target: '[data-tour="job-mgmt-tabs"]',
    title: 'Filter by status',
    content: 'Switch between All, Live, Drafts, Paused, and Closed jobs.',
    placement: 'bottom',
    skipBeacon: true,
  },
  {
    target: '[data-tour="job-mgmt-search"]',
    title: 'Search jobs',
    content: 'Look up a job by its role name or job code.',
    placement: 'bottom',
    skipBeacon: true,
  },
  {
    target: '[data-tour="job-mgmt-status-filter"]',
    title: 'Filter by exact status',
    content: 'Narrow the list down to one specific status, like Active or Expired.',
    placement: 'bottom',
    skipBeacon: true,
  },
  {
    target: '[data-tour="job-mgmt-table"]',
    title: 'Manage your jobs',
    content: 'Click any row — or the Open button — to view or continue editing that job. Draft rows take you straight back into the form.',
    placement: 'top',
    skipBeacon: true,
  },
];

/* ── Talent Pool page: /sourcing/talent-pool ──
   Step 0 is a lightweight "sacrificial" step targeting the static page
   header instead of the stat cards directly. react-joyride's internal
   target-mount check sometimes reports "not mounted" for the very first
   step on pages with heavier grid/card layouts, even though the element
   is genuinely in the DOM — see debug logs from 2026-07-XX investigation.
   Starting on a simpler, always-immediately-rendered target absorbs that
   hiccup so step 2 (the real stats step) lands reliably every time. */
export const TALENT_POOL_STEPS = [
  {
    target: '[data-tour="talent-pool-header"]',
    title: 'Welcome to Talent Pool',
    content: 'This is where every candidate you\u2019ve saved lives \u2014 searchable, filterable, and ready to add to any open job.',
    placement: 'bottom',
    skipBeacon: true,
  },
  {
    target: '[data-tour="talent-stats"]',
    title: 'Your talent pool at a glance',
    content: 'Total applicants, how many joined this week, position categories, and average experience across everyone saved.',
    placement: 'bottom',
    skipBeacon: true,
  },
  {
    target: '[data-tour="talent-clear-all"]',
    title: 'All candidates',
    content: 'This always shows everyone. Click it anytime to clear your filters and start fresh.',
    placement: 'right',
    skipBeacon: true,
  },
  {
    target: '[data-tour="talent-min-score"]',
    title: 'Filter by score',
    content: 'Drag to only show candidates above a certain score, based on their most recent assessment across any job.',
    placement: 'right',
    skipBeacon: true,
  },
  {
    target: '[data-tour="talent-city-chips"]',
    title: 'Filter by city',
    content: 'Click a city to instantly narrow the list to candidates based there.',
    placement: 'right',
    skipBeacon: true,
  },
  {
    target: '[data-tour="talent-skill-chips"]',
    title: 'Filter by skill',
    content: 'Same idea — click a skill to filter down to candidates who have it.',
    placement: 'right',
    skipBeacon: true,
  },
  {
    target: '[data-tour="talent-search-form"]',
    title: 'Search by position or education',
    content: 'Type into either field and hit Search to narrow things down further.',
    placement: 'bottom',
    skipBeacon: true,
  },
  {
    target: '[data-tour="talent-table"]',
    title: 'Browse candidates',
    content: 'Everyone matching your filters shows up here, with their skills, location, and latest score.',
    placement: 'top',
    skipBeacon: true,
  },
  {
    target: '[data-tour="talent-action-header"]',
    title: 'Add to a job',
    content: 'Click "Add" on any candidate to assign them to one of your active job openings.',
    placement: 'left',
    skipBeacon: true,
  },
];

/* ── AI Screening workboard: /selection/ai-screening ── */
export const AI_SCREENING_WORKBOARD_STEPS = [
  {
    target: '[data-tour="screening-page-header"]',
    title: 'Welcome to AI Screening',
    content: 'Every candidate moving through Parse, Match, and Q&A across all your open jobs, in one place.',
    placement: 'bottom',
    skipBeacon: true,
  },
  {
    target: '[data-tour="screening-stage-chips"]',
    title: 'Filter by stage',
    content: 'Click any stage \u2014 Parse, Match, Q&A, or Ready \u2014 to see only candidates currently at that step.',
    placement: 'bottom',
    skipBeacon: true,
  },
  {
    target: '[data-tour="screening-positions-rail"]',
    title: 'Browse by position',
    content: 'Pick a specific job to narrow the candidate list down to just that role.',
    placement: 'right',
    skipBeacon: true,
  },
  {
    target: '[data-tour="screening-search"]',
    title: 'Search candidates',
    content: 'Look up anyone by name, last position, or job title.',
    placement: 'bottom',
    skipBeacon: true,
  },
  {
    target: '[data-tour="screening-candidate-list"]',
    title: 'Open a candidate',
    content: 'Click any candidate to open their screening profile and move them through Parse, Match, and Q&A.',
    placement: 'top',
    skipBeacon: true,
  },
]

/* ── AI Screening candidate detail: /selection/ai-screening/candidate/:candidateId ── */
export const AI_SCREENING_CANDIDATE_STEPS = [
  {
    target: '[data-tour="candidate-back"]',
    title: 'Heads up',
    content: 'This takes you back to this candidate\u2019s job screening page.',
    placement: 'bottom',
    skipBeacon: true,
  },
  {
    target: '[data-tour="candidate-header"]',
    title: 'Candidate overview',
    content: 'Their name, the role they applied for, and the current decision status if one has been made.',
    placement: 'bottom',
    skipBeacon: true,
  },
  {
    target: '[data-tour="candidate-engine-panel"]',
    title: 'Three steps: Parse, Match, Q&A',
    content: 'This panel walks through each stage \u2014 extracting the CV, scoring fit against the job, then sending follow-up questions.',
    placement: 'top',
    skipBeacon: true,
  },
  {
    target: '[data-tour="candidate-sidebar-action"]',
    title: 'Your next action',
    content: 'This card always shows exactly what to do next for the step you\u2019re on.',
    placement: 'left',
    skipBeacon: true,
  },
  {
    target: '[data-tour="candidate-decision"]',
    title: 'Make a decision',
    content: 'Once the candidate has responded to Q&A, you can Advance, Hold, or Reject them here.',
    placement: 'left',
    skipBeacon: true,
  },
];

/* ── Background Check workboard: /selection/background-check ── */
export const BG_CHECK_WORKBOARD_STEPS =[
  {
    target: '[data-tour="bgcheck-page-header"]',
    title: 'Welcome to Background Check',
    content: 'Every candidate moving through claims verification, consent, and the final verdict, across all your open jobs.',
    placement: 'bottom',
    skipBeacon: true,
  },
  {
    target: '[data-tour="bgcheck-status-chips"]',
    title: 'Filter by stage',
    content: 'Click any stage \u2014 Claims, Consent, Tracker, Verdict, or Ready \u2014 to see only candidates currently at that step.',
    placement: 'bottom',
    skipBeacon: true
  },
  {
    target: '[data-tour="bgcheck-positions-rail"]',
    title: 'Browse by position',
    content: 'Click a job to open its own background check board.',
    placement: 'right',
    skipBeacon: true,
  },
  {
    target: '[data-tour="bgcheck-search"]',
    title: 'Search candidates',
    content: 'Look up anyone by name, last position, or job title',
    placement: 'bottom',
    skipBeacon: true,
  },
  {
    target: '[data-tour="bgcheck-candidate-list"]',
    title: 'Open a candidate',
    content: 'Click any candidate to open their background check details.',
    placement: 'top',
    skipBeacon: true,
  },
];

/* ── Psych Assessment page: /selection/psych-assessment ── */
export const PSYCH_ASSESSMENT_STEPS = [
  {
    target: '[data-tour="psych-page-header"]',
    title: 'Welcome to Psych Assesment',
    content: 'Track every candidate through Setup, Take, and Score & Decide across all your open jobs.',
    placement: 'bottom',
    skipBeacon: true,
  },
  {
    target: '[data-tour="psych-step-filter"]',
    title: 'Filter by step',
    content: 'Click Setup, Take, or Score & Decide to see only candidates currently at that step.',
    placement: 'bottom',
    skipBeacon: true,
  },
  {
    target: '[data-tour="psych-positions-rail"]',
    title: 'Browse by position',
    content: 'Pick a job to see just its candidates.',
    placement: 'right',
    skipBeacon: true,
  },
  {
    target: '[data-tour="psych-search"]',
    title: 'Search candidates',
    content: 'Look up anyone by name, role, or email.',
    placement: 'bottom',
    skipBeacon: true,
  },
  {
    target: '[data-tour="psych-candidate-list"]',
    title: 'Open a candidate',
    content: 'Click any candidate to review or continue their psychological assessment.',
    placement: 'top',
    skipBeacon: true,
  },
];

/* ── Offer & Contract workboard: /selection/offer-contract ── */
export const OFFER_CONTRACT_WORKBOARD_STEPS = [
  {
    target: '[data-tour="offer-page-header"]',
    title: 'Welcome to Offer & Contract',
    content: 'Every candidate moving from offer through signed contract, across all your open jobs.',
    placement: 'bottom',
    skipBeacon: true,
  },
  {
    target: '[data-tour="offer-status-chips"]',
    title: 'Filter by status',
    content: 'Click any status — Draft, Sent, Negotiating, Accepted, Rejected, or Signed — to see only candidates at that stage.',
    placement: 'bottom',
    skipBeacon: true,
  },
  {
    target: '[data-tour="offer-positions-rail"]',
    title: 'Browse by position',
    content: 'Click a job to open its own offer workboard.',
    placement: 'right',
    skipBeacon: true,
  },
  {
    target: '[data-tour="offer-search"]',
    title: 'Search candidates',
    content: 'Look up anyone by name, position, or job title.',
    placement: 'bottom',
    skipBeacon: true,
  },
  {
    target: '[data-tour="offer-candidate-list"]',
    title: 'Open a candidate',
    content: 'Click any candidate to review their remuneration package, offer letter, contract, and e-signature status.',
    placement: 'top',
    skipBeacon: true,
  },
]

/* ── Offer & Contract candidate detail: /selection/offer-contract/candidate/:id ── */
export const OFFER_CONTRACT_DETAIL_STEPS = [
  {
    target: '[data-tour="offer-job-context"]',
    title: 'Job snapshot',
    content: 'A quick look at the role this offer belongs to, and how many hires are still needed.',
    placement: 'bottom',
    skipBeacon: true,
  },
  {
    target: '[data-tour="offer-step-rail"]',
    title: 'Five steps to a signed hire',
    content: 'Remuneration, Offer Letter, Contract, E-Signature, and Pipeline \u2014 click any step to jump straight to it.',
    placement: 'bottom',
    skipBeacon: true,
  },
];