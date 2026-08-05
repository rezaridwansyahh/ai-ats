import { useEffect, useState, useCallback } from 'react';
import { Joyride, STATUS } from 'react-joyride';

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
  const [stepIndex, setStepIndex] = useState(0);
  const ctx = { file, successData, historyVisible };

  useEffect(() => {
    if (!run) return;
    const step = STEPS[stepIndex];
    if (!step) return;
    if (!step.isDone(ctx)) return;

    const isLastStep = stepIndex === STEPS.length - 1;

    if (!isLastStep) {
      const nextIsLast = stepIndex + 1 === STEPS.length - 1;
      // The last step's target (cv-history) sits behind the success modal
      // right after upload. Advancing the index would make Joyride render
      // its tooltip immediately — hidden behind the modal overlay — so
      // hold here until the modal has actually been dismissed.
      if (nextIsLast && !ctx.historyVisible) return;
      setStepIndex((i) => i + 1);
      return;
    }

    // Last step becomes "done" once historyVisible is true (the success
    // modal has been dismissed). Give it a beat on screen before
    // auto-closing instead of instantly dismissing.
    const t = setTimeout(() => {
      setRun(false);
      markSeen();
    }, FINAL_STEP_DISPLAY_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run, stepIndex, file, successData, historyVisible]);

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
      options={{
        showProgress: true,
        buttons: ['skip'],
        overlayClickAction: 'close',
        scrollOffset: 100,
        primaryColor: '#0f766e',
        textColor: '#1f2937',
        backgroundColor: '#ffffff',
        arrowColor: '#ffffff',
        overlayColor: 'rgba(15, 23, 42, 0.45)',
        zIndex: 9999,
      }}
      locale={{ skip: 'Skip' }}
      styles={{
        tooltip: { borderRadius: 12, fontSize: 13, padding: 16 },
        tooltipTitle: { fontSize: 14, fontWeight: 700 },
        buttonSkip: { fontSize: 12, color: '#6b7280', outline: 'none' },
      }}
    />
  );
}