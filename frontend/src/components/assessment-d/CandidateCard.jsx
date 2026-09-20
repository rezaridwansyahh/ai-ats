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
import SJTTest from './candidate/SJTTest';
import PFTest from './candidate/PFTest';
import MSDTTest from './candidate/MSDTTest';
import PAPILTest from './candidate/PAPILTest';
import TestDone from './candidate/TestDone';
import Complete from './candidate/Complete';

// Screens: setup | overview | tk_intro | tk | sjt_intro | sjt | pf_intro | pf | msdt_intro | msdt | papil_intro | papil | done_<n> | complete
const TESTS = ['tk', 'sjt', 'pf', 'msdt', 'papil'];
const ASSESSMENT_ID_BATTERY_D = 4;
const TIMED_SCREENS = ['tk', 'sjt']; // only TK + SJT have timers — others are untimed auto-advance

export default function CandidateCard({
  mode = 'standalone',
  prefilledProfile = null,
  onPortalSubmit = null,
  portalHash = null,
} = {}) {
  const isPortal = mode === 'portal';
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
  const [doneInfo, setDoneInfo] = useState(null);
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

  // Tab-switch detector during any test screen
  useEffect(() => {
    const handler = () => {
      if (document.hidden && TESTS.includes(screen)) {
        setTabSwitches((n) => n + 1);
      }
    };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, [screen]);

  // Block context menu / common copy shortcuts during timed tests (TK + SJT)
  useEffect(() => {
    const isTimed = TIMED_SCREENS.includes(screen);
    const ctxBlock = (e) => isTimed && e.preventDefault();
    const keyBlock = (e) => {
      if (isTimed && (e.ctrlKey || e.metaKey) && ['c', 'v', 'u', 's'].includes(e.key.toLowerCase())) {
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
    if (!window.confirm('Reset semua data dan progres Battery D?')) return;
    clearCardData(storageKey);
    if (!isPortal) setProfile(null);
    setResults({});
    setTabSwitches(0);
    setSubmitStatus('idle');
    setSubmitError(null);
    submitOnceRef.current = false;
    goTo(isPortal ? 'overview' : 'setup');
  }, [goTo, storageKey, isPortal]);

  // Battery D scoring lives entirely on the client (TK weighted composite, SJT 6 competencies → 5 senior profiles,
  // 16PF 16 sten factors, MSDT 8 styles + TO/RO/E, PAPI-L 20 dim Role+Need).
  const submitResults = useCallback(async () => {
    setSubmitStatus('submitting');
    setSubmitError(null);
    try {
      const pillars = calc3Pillar(results);
      const payload = {
        results: {
          by_subtest: {
            tk:    results.tk    ?? null,
            sjt:   results.sjt   ?? null,
            pf:    results.pf    ?? null,
            msdt:  results.msdt  ?? null,
            papil: results.papil ?? null,
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
          tk_composite:  results.tk?.composite   ?? null,
          sjt_profile:   results.sjt?.profile    ?? null,
          msdt_dominant: results.msdt?.dominant  ?? null,
        },
      };

      if (isPortal && onPortalSubmit) {
        await onPortalSubmit(payload);
      } else {
        await submitAssessment({
          assessment_id: ASSESSMENT_ID_BATTERY_D,
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
    return (
      <Overview
        profile={profile}
        results={results}
        tests={TESTS}
        onPick={(t) => goTo(t + '_intro')}
        onReset={handleReset}
        onSeeComplete={() => goTo('complete')}
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
        assessmentCode="myralix_battery_d"
        portalHash={isPortal ? portalHash : null}
        onComplete={(res) => handleTestSubmit('tk', res, 'Tes 1 — Kemampuan Kognitif', 'sjt_intro')}
        onAbort={() => goTo('overview')}
      />
    );
  }
  if (screen === 'sjt') {
    return (
      <SJTTest
        resultId={resultId}
        assessmentCode="myralix_battery_d"
        portalHash={isPortal ? portalHash : null}
        onComplete={(res) => handleTestSubmit('sjt', res, 'Tes 2 — Penilaian Situasional', 'pf_intro')}
        onAbort={() => goTo('overview')}
      />
    );
  }
  if (screen === 'pf') {
    return (
      <PFTest
        resultId={resultId}
        assessmentCode="myralix_battery_d"
        portalHash={isPortal ? portalHash : null}
        onComplete={(res) => handleTestSubmit('pf', res, 'Tes 3 — Kepribadian 16PF', 'msdt_intro')}
        onAbort={() => goTo('overview')}
      />
    );
  }
  if (screen === 'msdt') {
    return (
      <MSDTTest
        resultId={resultId}
        assessmentCode="myralix_battery_d"
        portalHash={isPortal ? portalHash : null}
        onComplete={(res) => handleTestSubmit('msdt', res, 'Tes 4 — Gaya Kepemimpinan MSDT', 'papil_intro')}
        onAbort={() => goTo('overview')}
      />
    );
  }
  if (screen === 'papil') {
    return (
      <PAPILTest
        resultId={resultId}
        assessmentCode="myralix_battery_d"
        portalHash={isPortal ? portalHash : null}
        onComplete={(res) => handleTestSubmit('papil', res, 'Tes 5 — Preferensi Kepemimpinan PAPI-L', 'complete')}
        onAbort={() => goTo('overview')}
      />
    );
  }

  if (screen.startsWith('done_') && doneInfo) {
    const isLast = doneInfo.num === 5;
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
        submitStatus={submitStatus}
        submitError={submitError}
        onRetrySubmit={submitResults}
      />
    );
  }

  return null;
}
