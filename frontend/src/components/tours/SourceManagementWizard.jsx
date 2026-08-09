import { STATUS, Joyride } from 'react-joyride';
import { useState, useEffect, useCallback } from 'react';
import { useActionGatedTour } from './useActionGatedTour';
import { ACTION_GATED_OPTIONS, ACTION_GATED_STYLES } from './tourTheme';

/**
 * SourceManagementWizard
 * -------------------------------------------------------------------------
 * Action-based, like FirstJobWizard/CvUploadWizard — NOT an explainer tour
 * like PipelineTour. Four steps, one per stage of SourceManagementPage's
 * own stepper (Job Select, List Source, Source Setup, List Candidate).
 *
 * Unlike FirstJobWizard, gating here doesn't check form field validity —
 * it checks `ctx.activeStep`, the SAME state that drives which step
 * component SourceManagementPage actually renders. This matters because
 * each step's target element (job list, source table, threshold card,
 * candidate table) only exists in the DOM once activeStep reaches it —
 * so a step's isDone can only become true after its target has already
 * been reached and shown to the user.
 *
 * The last step (List Candidate) is informational only — nothing to
 * actively "do" there — so like CvUploadWizard, it auto-completes and
 * gets a short display delay before auto-closing instead of an instant
 * dismiss.
 *
 * Must be rendered INSIDE SourceManagementPage, since it needs live
 * access to that component's `activeStep` state.
 */

const STORAGE_KEY = 'myralix.tour.seen.source-management-wizard';

const FINAL_STEPS_DISPLAY_MS = 4000;

const STEPS = [
    {
        target: '[data-tour="source-mgmt-job-list"]',
        title: 'Pick a job',
        content: 'Select an active job to source candidate for. We\u2019ll move on automatically once you\u2019ve picked one.',
        placement: 'top',
        isDone: (ctx) => ctx.activeStep > 0,
    },
    {
        target: '[data-tour="source-mgmt-source-table"]',
        title: 'Review your sources',
        content: 'Every place this job has been posted \u2014 LinkedIn, Seek, internal \u2014 with its sync status. Click "Next: Source Setup" above when you\u2019re ready.',
        placement: 'top',
        isDone: (ctx) => ctx.activeStep > 1,
    },
    {
        target: '[data-tour="source-mgmt-threshold"]',
        title: 'Set your screening threshold',
        content: 'Drag the range to decide which AI screening scores should surface as candidates. Click "Next: List Candidate" when you\u2019re done.',
        placement: 'top',
        isDone: (ctx) => ctx.activeStep > 2,
    },
    {
        target: '[data-tour="source-mgmt-candidate-table"]',
        title: 'Your sourced candidates',
        content: 'Everyone who cleared your threshold shows up here, ready to add to this job\u2019s pipeline.',
        placement: 'top',
        // Informational only — nothing to gate on beyond having arrived here.
        isDone: () => true,
    },
];

export function useSourceManagementWizard(){
    const [run, setRun] = useState(false);

    useEffect(() => {
        const seen = localStorage.getItem(STORAGE_KEY);
        if (!seen){
            const t = setTimeout(() => setRun(true), 1000);
            return () => clearTimeout(t);
        }
    }, []);

    const markSeen = useCallback(() => {
        localStorage.setItem(STORAGE_KEY, '1');
    }, []);

    const restart = useCallback(() => {
        localStorage.removeItem(STORAGE_KEY);
        setRun(true);
    }, []);

    return { run, setRun, markSeen, restart };
}

export default function SourceManagementWizard({ activeStep, run, setRun, markSeen}){
    const ctx = { activeStep };
    
    const { stepIndex } = useActionGatedTour(STEPS, ctx, {
        run, setRun, markSeen,
        deps: [activeStep],
        onComplete: (finish) => {
            const t = setTimeout(finish, FINAL_STEPS_DISPLAY_MS);
            return () => clearTimeout(t);
        },
    });

    const handleEvent = (data) => {
        if(data.status === STATUS.SKIPPED) {
            setRun(false);
            markSeen();
        }
    };

    if (!run) return null;

    return (
        <Joyride
        steps={STEPS.map((s) => ({
            target: s.target,
            title: s.title,
            content: s.content,
            placement: s.placement,
            skipBeacon: true,
            spotlightClicks: true,
            hideFooter: true,
        }))}
        stepIndex={stepIndex}
        run={run}
        continuous
        scrollToFirstStep
        onEvent={handleEvent}
        options={ACTION_GATED_OPTIONS}
        locale={{ skip: 'Skip' }}
        styles={ACTION_GATED_STYLES}
        />
    );

}