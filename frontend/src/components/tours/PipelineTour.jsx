import { useEffect, useState, useCallback } from "react";
import { Joyride, STATUS, EVENTS } from "react-joyride";
import { CLICK_THROUGH_OPTIONS, CLICK_THROUGH_STYLES } from "./tourTheme";

const STORAGE_PREFIX = 'myralix.tour.seen.';

export function usePipelineTour(tourKey) {
  const [run, setRun] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem(STORAGE_PREFIX + tourKey);
    if (!seen) {
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

export default function PipelineTour({ steps, tourKey, run, setRun, markSeen, locale, onEvent }) {
  // Default behavior: stop + mark this solo tour as seen when finished/skipped.
  // EndToEndTour overrides this via `onEvent` to advance to the next page
  // segment instead of stopping outright.
  const defaultHandleEvent = (data) => {
    const { status, type } = data;
    // A step whose data-tour target isn't in the DOM (missing/renamed
    // attribute, or hidden behind loading/conditional render) fires this
    // event. Without handling it, Joyride keeps the tour "running" —
    // overlay stays up, but no tooltip ever renders, leaving the user
    // stuck on a grey screen with no visible way out.
    if (type === EVENTS.TARGET_NOT_FOUND) {
      setRun(false);
      markSeen();
      return;
    }
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
      disableOverlayClose
      onEvent={onEvent || defaultHandleEvent}
      options={CLICK_THROUGH_OPTIONS}
      locale={{ back: 'Back', close: 'Close', last: 'Done', next: 'Next', skip: 'Skip tour', ...locale }}
      styles={CLICK_THROUGH_STYLES}
    />
  );
}