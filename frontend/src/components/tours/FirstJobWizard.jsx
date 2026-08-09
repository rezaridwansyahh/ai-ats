import { useState, useEffect, useCallback } from 'react';
import { Joyride, STATUS } from 'react-joyride';
import { Sparkles, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useActionGatedTour } from './useActionGatedTour';
import { ACTION_GATED_OPTIONS, ACTION_GATED_STYLES } from './tourTheme';
/**
 * FirstJobWizard
 * -------------------------------------------------------------------------
 * Action-based guided setup for JobEditPage — DIFFERENT from PipelineTour.
 *
 * PipelineTour = "look here, now look here" explainer, advances on a Next click.
 * FirstJobWizard = advances automatically the moment the user actually DOES
 * the real thing (types a title, fills required fields, publishes) — no
 * Next button on these steps at all. Each step's `isDone(ctx)` checks REAL
 * form/job state passed in from JobEditPage, not a click event.
 *
 * Unlike the first version, this does NOT auto-launch silently. It shows an
 * opt-in prompt card first ("Start guided setup" / "No thanks, I'll explore
 * myself") so someone who prefers to figure the form out on their own can
 * dismiss it in one click and never see it again, instead of the wizard
 * forcing a locked-step walkthrough on everyone by default.
 *
 * Must be rendered INSIDE JobEditPage (not standalone like PipelineTour),
 * since it needs live access to `form`, `job`, `hasStages`, etc. to know
 * when a step has actually been completed.
 */

const STORAGE_KEY = 'myralix.tour.seen.first-job-wizard';

const STEPS = [
  {
    target: '[data-wizard="job-title"]',
    title: "Let's create your first job",
    content: 'Start by typing a job title. We\u2019ll save your draft automatically as you go.',
    placement: 'bottom',
    isDone: (ctx) => !!ctx.form?.job_title?.trim(),
  },
  {
    target: '[data-wizard="basics-card"]',
    title: 'Fill in the basics',
    content: 'Company, location, work type, seniority, and pay range \u2014 fill these in below. We\u2019ll move on automatically once they\u2019re all set.',
    placement: 'right',
    onEnter: (helpers) => helpers.setStep(0),
    isDone: (ctx) => ctx.missingRequiredBasics.length === 0 && ctx.invalidUrlFields.length === 0,
  },
  {
    target: '[data-wizard="jd-card"]',
    title: 'Describe the role',
    content: 'Write a short summary, list responsibilities, and add at least one required skill. Try AI Generate for a head start.',
    placement: 'right',
    onEnter: (helpers) => helpers.setStep(1),
    isDone: (ctx) => ctx.missingRequiredJD.length === 0,
  },
  {
    target: '[data-wizard="pipeline-card"]',
    title: 'Set up your hiring pipeline',
    content: 'Pick a template or build your own stages \u2014 this is how candidates move through your process.',
    placement: 'right',
    onEnter: (helpers) => helpers.setStep(2),
    isDone: (ctx) => ctx.hasStages,
  },
  {
    target: '[data-wizard="publish-btn"]',
    title: "You're ready!",
    content: 'Everything required is filled in. Click Publish job to make it live.',
    placement: 'left',
    isDone: (ctx) => ctx.isPublished,
  },
];

export function useFirstJobWizard() {
  const [run, setRun] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  // Show the opt-in PROMPT (not the wizard itself) on first-ever visit.
  useEffect(() => {
    const seen = localStorage.getItem(STORAGE_KEY);
    if (!seen) {
      const t = setTimeout(() => setShowPrompt(true), 600);
      return () => clearTimeout(t);
    }
  }, []);

  const markSeen = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, '1');
  }, []);

  // User clicked "Start guided setup" on the prompt card.
  const accept = useCallback(() => {
    setShowPrompt(false);
    setRun(true);
  }, []);

  // User clicked "No thanks, I'll explore myself" — dismiss for good.
  const decline = useCallback(() => {
    setShowPrompt(false);
    markSeen();
  }, [markSeen]);

  // Manually re-trigger the prompt later (e.g. a "Guided setup" button).
  const restart = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setShowPrompt(true);
  }, []);

  return { run, setRun, markSeen, restart, showPrompt, accept, decline };
}

// The opt-in banner shown before the wizard runs. Purely presentational —
// all state lives in useFirstJobWizard above.
export function FirstJobWizardPrompt({ onAccept, onDecline }) {
  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardContent className="p-4 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-3">
          <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold">New here? Let us walk you through creating your first job.</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              We'll guide you step by step \u2014 you can skip anytime.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="ghost" size="sm" className="text-xs" onClick={onDecline}>
            <X className="h-3.5 w-3.5 mr-1" /> No thanks, I'll explore myself
          </Button>
          <Button size="sm" className="text-xs" onClick={onAccept}>
            <Sparkles className="h-3.5 w-3.5 mr-1" /> Start guided setup
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function FirstJobWizard({
  form, job, hasStages, isPublished, missingRequiredBasics,
  missingRequiredJD, invalidUrlFields, setStep, run, setRun,
  markSeen
}) {
  const ctx = { form, job, hasStages, isPublished, missingRequiredBasics, invalidUrlFields };

  const { stepIndex }= useActionGatedTour(STEPS, ctx, {
    run, setRun, markSeen,
    deps: [form, job, hasStages, isPublished, missingRequiredBasics, invalidUrlFields],
    onStepEnter: (helpers, step) => {
      step.onEnter?.({ setStep});
    },
  });

  const handleEvent = (data) => {
    if (data.status === STATUS.SKIPPED) {
      setRun(false);
      markSeen();
    }
  };

  if(!run) return null;

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
      locale={{ skip: 'Skip guided setup' }}
      styles={ACTION_GATED_STYLES}
    />
  );
}