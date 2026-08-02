import { useEffect, useState, useCallback } from 'react';
import { Joyride, STATUS } from 'react-joyride';

/**
 * PipelineTour
 * -------------------------------------------------------------------------
 * A first-visit guided walkthrough, reused across multiple pages
 * (Candidate Pipeline, Job Management, Talent Pool, ...).
 * Built against react-joyride@3.2.0 (v3 API — see react-joyride.com/docs/migration).
 *
 * Usage:
 *   <PipelineTour steps={SOME_STEPS} tourKey="some-page" run={run} setRun={setRun} markSeen={markSeen} />
 *
 * `tourKey` lets different pages remember their own "seen" state independently.
 *
 * To let users replay a tour manually, expose a "Take the tour" button that
 * calls the `restart()` function returned by the `usePipelineTour` hook below.
 */

const STORAGE_PREFIX = 'myralix.tour.seen.';

export function usePipelineTour(tourKey) {
  const [run, setRun] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem(STORAGE_PREFIX + tourKey);
    if (!seen) {
      // Delay so the page has finished rendering / async data has loaded
      // before Joyride tries to find its target elements in the DOM.
      const t = setTimeout(() => setRun(true), 1200);
      return () => clearTimeout(t);
    }
  }, [tourKey]);

  const markSeen = useCallback(() => {
    localStorage.setItem(STORAGE_PREFIX + tourKey, '1');
  }, [tourKey]);

  const restart = useCallback(() => {
    localStorage.removeItem(STORAGE_PREFIX + tourKey);
    setRun(true);
  }, [tourKey]);

  return { run, setRun, markSeen, restart };
}

export default function PipelineTour({ steps, tourKey, run, setRun, markSeen }) {
  // V3: callback -> onEvent, and event data no longer carries `status` for
  // every event type — status is only present on tour-level lifecycle events.
  const handleEvent = (data) => {
    const { status } = data;
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      setRun(false);
      markSeen();
    }
  };

  if (!steps || steps.length === 0) return null;

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      scrollToFirstStep
      onEvent={handleEvent}
      options={{
        showProgress: true,
        buttons: ['skip', 'back', 'primary'],
        overlayClickAction: 'close',
        scrollOffset: 100, // accounts for sticky top headers so targets don't scroll underneath them
        primaryColor: '#0f766e',
        textColor: '#1f2937',
        backgroundColor: '#ffffff',
        arrowColor: '#ffffff',
        overlayColor: 'rgba(15, 23, 42, 0.55)',
        zIndex: 9999,
      }}
      locale={{ back: 'Back', close: 'Close', last: 'Done', next: 'Next', skip: 'Skip tour' }}
      styles={{
        tooltip: {
          borderRadius: 12,
          fontSize: 13,
          padding: 16,
        },
        tooltipTitle: {
          fontSize: 14,
          fontWeight: 700,
        },
        buttonPrimary: {
          backgroundColor: '#0f766e',
          borderRadius: 8,
          fontSize: 12,
          padding: '8px 14px',
          outline: 'none',
          boxShadow: '0 0 0 2px rgba(15, 118, 110, 0.3)',
        },
        buttonBack: {
          fontSize: 12,
          color: '#6b7280',
          outline: 'none',
        },
        buttonSkip: {
          fontSize: 12,
          color: '#6b7280',
          outline: 'none',
        },
      }}
    />
  );
}