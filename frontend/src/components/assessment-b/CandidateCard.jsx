import { useEffect, useState, useCallback, useRef } from 'react';
import { loadCardData, saveCardData, clearCardData, SKEY } from './utils/storage';
import { fmtDateID } from './utils/scoring';
import { calc3Pillar } from './report/report-utils';
import { createParticipantByEmail } from '@/api/participant.api';
import { submitAssessment } from '@/api/assessment-battery-result.api';
import Setup from './candidate/Setup';
import Overview from './candidate/Overview';
import Intro from './candidate/Intro';
import TKTest from './candidate/TKTest';
import EPPSTest from './candidate/EPPSTest';
import HollandTest from './candidate/HollandTest';
import PAPITest from './candidate/PAPITest';
import TestDone from './candidate/TestDone';
import Complete from './candidate/Complete';

// Screens: setup | overview | tk_intro | tk | epps_intro | epps | holland_intro | holland | papi_intro | papi | done_<n> | complete
const TESTS = ['tk', 'epps', 'holland', 'papi'];
const ASSESSMENT_ID_BATTERY_B = 2;

export default function CandidateCard({
  mode = 'standalone',
  prefilledProfile = null,
  onPortalSubmit = null,
  portalHash = null,
} = {}) {
  const isPortal = mode === 'portal';
  // Scope localStorage per portal session so multiple invitations in the same browser don't collide.
  const storageKey = isPortal && portalHash ? `${SKEY}::portal::${portalHash}` : SKEY;

  // Lazy initialization from localStorage
  const initial = (() => {
    const data = loadCardData(storageKey);
    if (isPortal && prefilledProfile) {
      return {
        profile: data?.profile || prefilledProfile,
        results: data?.results || {},
        screen: 'overview',
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
  const [submitStatus, setSubmitStatus] = useState('idle'); // idle | submitting | success | error
  const [submitError, setSubmitError] = useState(null);
  const submitOnceRef = useRef(false);

  // Persist whenever profile or results change
  useEffect(() => {
    if (profile) saveCardData(profile, results, storageKey);
  }, [profile, results, storageKey]);

  // Tab-switch detector during tests
  useEffect(() => {
    const handler = () => {
      if (document.hidden && ['tk', 'epps', 'holland', 'papi'].includes(screen)) {
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
    const { data } = await createParticipantByEmail({
      name: newProfile.name,
      email: newProfile.email,
      position: newProfile.position,
      department: newProfile.department,
      education: newProfile.education,
      date_birth: newProfile.date_birth,
    });
    const merged = { ...newProfile, participant_id: data?.participant?.id ?? null };
    setProfile(merged);
    goTo('overview');
  }, [goTo]);

  const handleReset = useCallback(() => {
    if (!window.confirm('Reset semua data dan progres Battery B?')) return;
    clearCardData(storageKey);
    if (!isPortal) setProfile(null);
    setResults({});
    setTabSwitches(0);
    setSubmitStatus('idle');
    setSubmitError(null);
    submitOnceRef.current = false;
    goTo(isPortal ? 'overview' : 'setup');
  }, [goTo, storageKey, isPortal]);

  const submitResults = useCallback(async () => {
    // In portal mode the backend resolves participant_id from the session JWT.
    if (!isPortal && !profile?.participant_id) {
      setSubmitStatus('error');
      setSubmitError('Participant ID belum tersedia. Silakan ulangi pengisian data peserta dari awal.');
      return;
    }
    setSubmitStatus('submitting');
    setSubmitError(null);
    try {
      const pillars = calc3Pillar(results);
      const payload = {
        results: {
          by_subtest: {
            tk:      results.tk      ?? null,
            epps:    results.epps    ?? null,
            holland: results.holland ?? null,
            papi:    results.papi    ?? null,
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
          participant_id: profile.participant_id,
          assessment_id: ASSESSMENT_ID_BATTERY_B,
          ...payload,
        });
      }
      setSubmitStatus('success');
    } catch (e) {
      // 409 = participant already has a completed row for this assessment → treat as success.
      if (e?.response?.status === 409) {
        setSubmitStatus('success');
        return;
      }
      setSubmitStatus('error');
      setSubmitError(e?.response?.data?.message || e?.message || 'Gagal mengirim hasil ke server.');
    }
  }, [profile?.participant_id, results, isPortal, onPortalSubmit]);

  // Auto-submit once when the candidate first reaches the complete screen.
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

  // Routing
  if (screen === 'setup') return <Setup initial={profile} onSubmit={handleSetupSubmit} />;

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
        onComplete={(res) => handleTestSubmit('tk', res, 'Tes 1 — Kemampuan Kognitif', 'epps_intro')}
        onAbort={() => goTo('overview')}
      />
    );
  }
  if (screen === 'epps') {
    return (
      <EPPSTest
        onComplete={(res) => handleTestSubmit('epps', res, 'Tes 2 — Kepribadian', 'holland_intro')}
        onAbort={() => goTo('overview')}
      />
    );
  }
  if (screen === 'holland') {
    return (
      <HollandTest
        onComplete={(res) => handleTestSubmit('holland', res, 'Tes 3 — Minat Kerja', 'papi_intro')}
        onAbort={() => goTo('overview')}
      />
    );
  }
  if (screen === 'papi') {
    return (
      <PAPITest
        onComplete={(res) => handleTestSubmit('papi', res, 'Tes 4 — Preferensi Kerja', 'complete')}
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
        submitStatus={submitStatus}
        submitError={submitError}
        onRetrySubmit={submitResults}
      />
    );
  }

  return null;
}
