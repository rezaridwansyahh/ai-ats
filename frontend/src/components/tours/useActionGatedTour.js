import { useState, useEffect, useRef } from 'react';

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

  useEffect(() => {
    if (!run) return;
    const step = STEPS[stepIndex];
    if (!step || enteredRef.current.has(stepIndex)) return;
    enteredRef.current.add(stepIndex);
    onStepEnter?.({ setStep: (i) => setStepIndex(i) }, step, stepIndex);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run, stepIndex]);

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
      return onComplete(finish);
    }
    finish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run, stepIndex, ...(deps || [])]);

  return { stepIndex };
}