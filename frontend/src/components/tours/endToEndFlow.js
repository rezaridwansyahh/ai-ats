// End-to-end wizard flow — chains the four existing per-page tours together
// into one continuous walkthrough that follows the user across pages.
//
// Each segment reuses the SAME step array already used by that page's solo
// "Take the tour" button — no new step content, just a route + those steps.
// When the last step of a segment finishes, the controller (EndToEndTour.jsx)
// automatically navigates to the next segment's route and continues.

import {
    JOB_MANAGEMENT_LIST_STEPS,
    PIPELINE_LIST_STEPS,
    TALENT_POOL_STEPS,
    AI_SCREENING_WORKBOARD_STEPS,
    BG_CHECK_WORKBOARD_STEPS,
    PSYCH_ASSESSMENT_STEPS,
    OFFER_CONTRACT_WORKBOARD_STEPS,
    //TODO: INTERVIEW_WORKBOARD_STEPS
} from './tourSteps';

export const END_TO_END_FLOW = [
    {
        route: '/sourcing/job-management',
        steps: JOB_MANAGEMENT_LIST_STEPS,
        suppressSoloTourKey: 'job-management-list',
    },
    {
        route: '/candidate/pipeline',
        steps: PIPELINE_LIST_STEPS,
        suppressSoloTourKey: 'pipeline-list',
    },
    {
        route: '/sourcing/talent-pool',
        steps: TALENT_POOL_STEPS,
        suppressSoloTourKey: 'talent-pool',
    },
    {
        route: '/selection/ai-screening',
        steps: AI_SCREENING_WORKBOARD_STEPS,
        suppressSoloTourKey: 'ai-screening-workboard',
    },
    {
        route: '/selection/psych-assessment',
        steps: PSYCH_ASSESSMENT_STEPS,
        suppressSoloTourKey: 'psych-assessment',
    },
    // TODO: Interview segment goes here once InterviewWorkboard.jsx has a
    // tour built for it (route: '/selection/interview').
    {
        route: '/selection/background-check',
        steps: BG_CHECK_WORKBOARD_STEPS,
        suppressSoloTourKey: 'bg-check-workboard',
    },
    {
        route: '/selection/offer-contract',
        steps: OFFER_CONTRACT_WORKBOARD_STEPS,
        suppressSoloTourKey: 'offer-contract-workboard',
    },
];