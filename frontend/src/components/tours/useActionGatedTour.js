import { useState, useEffect, useRef } from 'react';

/**
 * useActionGatedTour
 * -------------------------------------------------------------------------
 * Shared engine for "action-gated" wizards — tours that advance when the
 * user actually DOES something (checked via isDone(ctx) on each step),
 * not when they click a Next button. Used by FirstJobWizard and
 * CvUploadWizard, which otherwise duplicated this same advance/complete
 * logic with only small differences.
 *
 * STEPS: array of { isDone(ctx), onEnter?(helpers) }
 * ctx: plain object with the latest state values to check isDone against
 *   (build a NEW object each render — this hook expects that and takes
 *   its own dependencies from the flattened fields inside options.deps,
 *   not from ctx itself, to avoid re-running every render).
 *
 * options:
 *   run, setRun, markSeen   — required, same as before
 *   deps                    — required array: the flattened values ctx is
 *                             built from (e.g. [form, job, hasStages]).
 *                             Passed straight into the internal useEffect's
 *                             dependency array.
 *   onStepEnter(helpers)    — optional, called once per step when it's
 *                             first reached. Default: no-op.
 *                             (FirstJobWizard uses this to switch form tabs.)
 *   canAdvanceTo(nextIndex, ctx) — optional, default () => true. Return
 *                             false to hold at the current step even
 *                             though isDone() is true. (CvUploadWizard
 *                             uses this to wait for the success modal to
 *                             close before showing the last step.)
 *   onComplete(finish)      — optional. Called when the last step becomes
 *                             done. Must call finish() when ready to
 *                             actually close the tour. Default: calls
 *                             finish() immediately. (CvUploadWizard uses
 *                             this to wait FINAL_STEP_DISPLAY_MS first.)
 *
 * Returns: { stepIndex }
 */
export function useActionGatedTour(STEPS, ctx, {
  run,
  setRun,
  markSeen,
  deps,
  onStepEnter,
  canAdvanceTo,
  onComplete,
}) {
  const [stepIndex, setStepIndex] = useState(0);
  const enteredRef = useRef(new Set());

  // Fire onStepEnter once per step, the moment it's reached.
  useEffect(() => {
    if (!run) return;
    const step = STEPS[stepIndex];
    if (!step || enteredRef.current.has(stepIndex)) return;
    enteredRef.current.add(stepIndex);
    onStepEnter?.({ setStep: (i) => setStepIndex(i) }, step, stepIndex);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run, stepIndex]);

  // Core advance/complete logic.
  useEffect(() => {
    if (!run) return;
    const step = STEPS[stepIndex];
    if (!step) return;
    if (!step.isDone(ctx)) return;

    const isLastStep = stepIndex === STEPS.length - 1;

    if (!isLastStep) {
      const nextIndex = stepIndex + 1;
      if (canAdvanceTo && !canAdvanceTo(nextIndex, ctx)) return;
      setStepIndex(nextIndex);
      return;
    }

    const finish = () => {
      setRun(false);
      markSeen();
    };

    if (onComplete) {
      // onComplete may return a cleanup fn (e.g. clearTimeout) — pass it
      // straight through so React can run it on unmount/re-run.
      return onComplete(finish);
    }
    finish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run, stepIndex, ...(deps || [])]);

  return { stepIndex };
}