import { useState, useEffect, useCallback } from 'react';
import { Joyride, STATUS } from 'react-joyride';
import { useActionGatedTour } from './useActionGatedTour';
import { ACTION_GATED_OPTIONS, ACTION_GATED_STYLES } from './tourTheme';
/**
 * CvUploadWizard
 * -------------------------------------------------------------------------
 * Action-based, like FirstJobWizard — NOT an explainer tour like PipelineTour.
 * Three steps: select a file, click Upload & Parse, then a final
 * informational step pointing at the Upload History panel. Steps 1–2 use
 * `isDone(ctx)` to check REAL state from CvUploadCard (`file`, `successData`)
 * rather than a Joyride Next click — matching "help user do the thing"
 * rather than "look here, look here". Step 3 has no action to gate on (the
 * history panel is passive), so it auto-completes on mount and instead
 * gets a short display delay before auto-closing, so the user has time to
 * actually read it.
 *
 * Must be rendered INSIDE CvUploadCard (not standalone), since it needs
 * live access to that component's `file` and `successData` state.
 */

const STORAGE_KEY = 'myralix.tour.seen.cv-upload-wizard';

// How long the final (informational) step stays open before auto-closing.
const FINAL_STEP_DISPLAY_MS = 4000;

const STEPS = [
  {
    target: '[data-wizard="cv-dropzone"]',
    title: 'Add a CV to the talent pool',
    content: 'Click here (or drag a file in) to select a PDF or ZIP of resumes to upload.',
    placement: 'bottom',
    isDone: (ctx) => !!ctx.file,
  },
  {
    target: '[data-wizard="cv-upload-btn"]',
    title: 'Upload & Parse',
    content: 'Click this button to submit the file. We\u2019ll extract candidate details automatically.',
    placement: 'top',
    isDone: (ctx) => !!ctx.successData,
  },
  {
    target: '[data-wizard="cv-history"]',
    title: 'Track your upload',
    content: 'Your file shows up here with live status \u2014 Processing, Done, or Failed \u2014 so you always know what happened.',
    placement: 'left',
    // Informational only — nothing for the user to actively "do" here, but
    // this step's target sits behind the success modal, so it can't fire
    // until that modal has been dismissed (ctx.historyVisible), or the
    // tooltip would render hidden behind the modal's overlay and never
    // actually be seen.
    isDone: (ctx) => !!ctx.historyVisible,
  },
];

export function useCvUploadWizard() {
  const [run, setRun] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem(STORAGE_KEY);
    if (!seen) {
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

export default function CvUploadWizard({ file, successData, historyVisible, run, setRun, markSeen }) {
  const ctx = { file, successData, historyVisible };

  const { stepIndex } = useActionGatedTour(STEPS, ctx, {
    run, setRun, markSeen,
    deps: [file, successData, historyVisible],
    canAdvanceTo: (nextIndex, ctx) => {
      const nextIsLast = nextIndex === STEPS.length - 1;
      // Same reasoning as before: don't advance to the last step (history
      // panel) until the success modal is dismissed, or its tooltip would
      // render hidden behind the modal overlay.
      if (nextIsLast && !ctx.historyVisible) return false;
      return true;
    },
    onComplete: (finish) => {
      const t = setTimeout(finish, FINAL_STEP_DISPLAY_MS);
      return () => clearTimeout(t);
    },
  });

  const handleEvent = (data) => {
    if (data.status === STATUS.SKIPPED) {
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