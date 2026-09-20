import { useEffect, useState, useCallback, useRef } from 'react';
import { loadCardData, saveCardData, clearCardData, SKEY } from './utils/storage';
import { fmtDateID } from './utils/scoring';
import { calc3Pillar } from './report/report-utils';
import { updatePortalParticipant, startPortalAssessment } from '@/api/portal-assessment.api';
import { submitAssessment } from '@/api/assessment-battery-result.api';
import Setup from './candidate/Setup';
import Briefing from './candidate/Briefing';
import Overview from './candidate/Overview';
import Intro from './candidate/Intro';
import TKTest from './candidate/TKTest';
import BigFiveTest from './candidate/BigFiveTest';
import DISCTest from './candidate/DISCTest';
import HollandTest from './candidate/HollandTest';
import TestDone from './candidate/TestDone';
import Complete from './candidate/Complete';
import CandidateReportView from './report/CandidateReportView';

// Screens: setup | overview | tk_intro | tk | bigfive_intro | bigfive | disc_intro | disc | holland_intro | holland | done_<n> | complete | report
const TESTS = ['tk', 'bigfive', 'disc', 'holland'];
const ASSESSMENT_ID_BATTERY_A = 1;

export default function CandidateCard({
  mode = 'standalone',
  prefilledProfile = null,
  onPortalSubmit = null,
  portalHash = null,
  allowViewReport = true, // Toggle to show/hide "View Report" button (can be disabled in future)
} = {}) {
  const isPortal = mode === 'portal';
  // Scope localStorage per portal session so multiple invitations in the same browser don't collide.
  const storageKey = isPortal && portalHash ? `${SKEY}::portal::${portalHash}` : SKEY;

  const initial = (() => {
    const data = loadCardData(storageKey);
    if (isPortal && prefilledProfile) {
      const savedProfile = data?.profile || null;
      return {
        profile: savedProfile || prefilledProfile,
        results: data?.results || {},
        // Invited candidates fill the participant-data form (image 2) first; skip it
        // only once they've confirmed their data this session.
        screen: savedProfile?.confirmed ? 'overview' : 'setup',
      };
    }
    return {
      profile: data?.profile || null,
      results: data?.results || {},
      screen: data?.profile ? 'overview' : 'setup',
    };
  })();

  const [screen, setScreen] = useState(initial.screen);
  const [profile, setProfile] = useState(initial.profile);
  const [results, setResults] = useState(initial.results);
  const [tabSwitches, setTabSwitches] = useState(0);
  const [doneInfo, setDoneInfo] = useState(null); // { num, label, next }
  const [submitStatus, setSubmitStatus] = useState('idle');
  const [submitError, setSubmitError] = useState(null);
  const [resultId, setResultId] = useState(null);
  const submitOnceRef = useRef(false);

  // Creates (or re-fetches, idempotently) the result row as soon as the candidate
  // confirms their profile — before any subtest begins — so per-answer/per-subtest
  // saves have a real result_id from the very first question, not just at final
  // submit. Portal mode only: standalone mode has no candidate_id to resolve from.
  useEffect(() => {
    if (!isPortal || !profile?.confirmed || resultId) return;
    let cancelled = false;
    (async () => {
      try {
        const { data } = await startPortalAssessment(portalHash);
        if (!cancelled) setResultId(data?.result?.id ?? null);
      } catch {
        // Answer/score persistence is a resilience nicety, not required for the
        // candidate to complete the test — final submit() still works without it.
      }
    })();
    return () => { cancelled = true; };
  }, [isPortal, profile?.confirmed, portalHash, resultId]);

  useEffect(() => {
    if (profile) saveCardData(profile, results, storageKey);
  }, [profile, results, storageKey]);

  // Tab-switch detector during tests
  useEffect(() => {
    const handler = () => {
      if (document.hidden && TESTS.includes(screen)) {
        setTabSwitches((n) => n + 1);
      }
    };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, [screen]);

  // Block context menu / common copy shortcuts during TK
  useEffect(() => {
    const ctxBlock = (e) => screen === 'tk' && e.preventDefault();
    const keyBlock = (e) => {
      if (screen === 'tk' && (e.ctrlKey || e.metaKey) && ['c', 'v', 'u', 's'].includes(e.key.toLowerCase())) {
        e.preventDefault();
      }
    };
    document.addEventListener('contextmenu', ctxBlock);
    document.addEventListener('keydown', keyBlock);
    return () => {
      document.removeEventListener('contextmenu', ctxBlock);
      document.removeEventListener('keydown', keyBlock);
    };
  }, [screen]);

  const goTo = useCallback((next) => {
    setScreen(next);
    window.scrollTo(0, 0);
  }, []);

  const handleSetupSubmit = useCallback(async (newProfile) => {
    if (isPortal) {
      // Portal: update the participant the invitation already created (bound to the
      // session). Email is the verified invitation key and isn't editable here.
      const { data } = await updatePortalParticipant(portalHash, {
        name: newProfile.name,
        position: newProfile.position,
        department: newProfile.department,
        education: newProfile.education,
        date_birth: newProfile.date_birth,
      });
      setProfile({
        ...newProfile,
        participant_id: data?.participant?.id ?? prefilledProfile?.participant_id ?? null,
        confirmed: true,
      });
      goTo('briefing');
      return;
    }
    setProfile({ ...newProfile });
    goTo('briefing');
  }, [goTo, isPortal, portalHash, prefilledProfile]);

  const handleReset = useCallback(() => {
    if (!window.confirm('Reset semua data dan progres Battery A?')) return;
    clearCardData(storageKey);
    if (!isPortal) setProfile(null);
    setResults({});
    setTabSwitches(0);
    setSubmitStatus('idle');
    setSubmitError(null);
    submitOnceRef.current = false;
    goTo(isPortal ? 'overview' : 'setup');
  }, [goTo, storageKey, isPortal]);

  // Battery A scoring lives entirely on the client (Big Five traits, DISC line1/2/3,
  // Holland code3 + consistency, TK composite). Send `results` + `summary` JSONB
  // matching Battery B's submission contract.
  const submitResults = useCallback(async () => {
    setSubmitStatus('submitting');
    setSubmitError(null);
    try {
      const pillars = calc3Pillar(results);
      const payload = {
        results: {
          by_subtest: {
            tk:      results.tk      ?? null,
            bigfive: results.bigfive ?? null,
            disc:    results.disc    ?? null,
            holland: results.holland ?? null,
          },
        },
        summary: {
          pillars: {
            cognitive:     pillars.cognitive,
            personality:   pillars.personality,
            work_attitude: pillars.workAttitude,
            overall:       pillars.overall,
          },
          pillar_thresholds: { cognitive: 70, personality: 65, work_attitude: 70, overall: 70 },
          tk_composite:  results.tk?.composite  ?? null,
          holland_code3: results.holland?.code3 ?? null,
        },
      };

      if (isPortal && onPortalSubmit) {
        await onPortalSubmit(payload);
      } else {
        await submitAssessment({
          assessment_id: ASSESSMENT_ID_BATTERY_A,
          ...payload,
        });
      }
      setSubmitStatus('success');
    } catch (e) {
      if (e?.response?.status === 409) {
        setSubmitStatus('success');
        return;
      }
      setSubmitStatus('error');
      setSubmitError(e?.response?.data?.message || e?.message || 'Gagal mengirim hasil ke server.');
    }
  }, [profile, results, isPortal, onPortalSubmit]);

  useEffect(() => {
    if (screen === 'complete' && !submitOnceRef.current && submitStatus === 'idle') {
      submitOnceRef.current = true;
      submitResults();
    }
  }, [screen, submitStatus, submitResults]);

  const handleTestSubmit = useCallback((key, result, label, next) => {
    setResults((prev) => ({ ...prev, [key]: { ...result, date: fmtDateID(), tabSwitches } }));
    const num = TESTS.indexOf(key) + 1;
    setDoneInfo({ num, label, next });
    goTo('done_' + num);
  }, [tabSwitches, goTo]);

  // ── Routing ──
  if (screen === 'setup') return <Setup initial={profile} onSubmit={handleSetupSubmit} emailReadOnly={isPortal} />;

  if (screen === 'briefing') return <Briefing profile={profile} onStart={() => goTo('overview')} />;

  if (screen === 'overview') {
    const allDone = TESTS.every((t) => results[t]);
    return (
      <Overview
        profile={profile}
        results={results}
        tests={TESTS}
        onPick={(t) => goTo(t + '_intro')}
        onReset={handleReset}
        onSeeComplete={() => goTo('complete')}
        onViewReport={allDone && allowViewReport ? () => goTo('report') : null}
      />
    );
  }

  if (screen.endsWith('_intro')) {
    const test = screen.replace('_intro', '');
    return <Intro test={test} onStart={() => goTo(test)} onBack={() => goTo('overview')} />;
  }

  if (screen === 'tk') {
    return (
      <TKTest
        resultId={resultId}
        assessmentCode="myralix_battery_a"
        portalHash={isPortal ? portalHash : null}
        onComplete={(res) => handleTestSubmit('tk', res, 'Tes 1 — Kemampuan Kognitif', 'bigfive_intro')}
        onAbort={() => goTo('overview')}
      />
    );
  }
  if (screen === 'bigfive') {
    return (
      <BigFiveTest
        resultId={resultId}
        assessmentCode="myralix_battery_a"
        portalHash={isPortal ? portalHash : null}
        onComplete={(res) => handleTestSubmit('bigfive', res, 'Tes 2 — Kepribadian', 'disc_intro')}
        onAbort={() => goTo('overview')}
      />
    );
  }
  if (screen === 'disc') {
    return (
      <DISCTest
        resultId={resultId}
        assessmentCode="myralix_battery_a"
        portalHash={isPortal ? portalHash : null}
        onComplete={(res) => handleTestSubmit('disc', res, 'Tes 3 — Gaya Kerja', 'holland_intro')}
        onAbort={() => goTo('overview')}
      />
    );
  }
  if (screen === 'holland') {
    return (
      <HollandTest
        resultId={resultId}
        assessmentCode="myralix_battery_a"
        portalHash={isPortal ? portalHash : null}
        onComplete={(res) => handleTestSubmit('holland', res, 'Tes 4 — Minat Kerja', 'complete')}
        onAbort={() => goTo('overview')}
      />
    );
  }

  if (screen.startsWith('done_') && doneInfo) {
    const isLast = doneInfo.num === 4;
    return (
      <TestDone
        num={doneInfo.num}
        label={doneInfo.label}
        isLast={isLast}
        onNext={() => goTo(doneInfo.next)}
        onBack={() => goTo('overview')}
      />
    );
  }

  if (screen === 'complete') {
    return (
      <Complete
        profile={profile}
        results={results}
        tests={TESTS}
        onBack={() => goTo('overview')}
        onContinue={(t) => goTo(t + '_intro')}
        onViewReport={allowViewReport ? () => goTo('report') : null}
        submitStatus={submitStatus}
        submitError={submitError}
        onRetrySubmit={submitResults}
      />
    );
  }

  if (screen === 'report') {
    const allDone = TESTS.every((t) => results[t]);
    if (!allDone) {
      goTo('complete');
      return null;
    }
    return (
      <CandidateReportView
        profile={profile}
        results={results}
        onClose={() => goTo('complete')}
      />
    );
  }

  return null;
}
