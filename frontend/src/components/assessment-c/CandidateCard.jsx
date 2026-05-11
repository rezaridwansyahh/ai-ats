import { useEffect, useState, useCallback, useRef } from 'react';
import { loadCardData, saveCardData, clearCardData } from './utils/storage';
import { fmtDateID } from './utils/scoring';
import { calc3Pillar } from './report/report-utils';
import { createParticipantByEmail } from '@/api/participant.api';
import { submitAssessment } from '@/api/assessment-battery-result.api';
import Setup from './candidate/Setup';
import Overview from './candidate/Overview';
import Intro from './candidate/Intro';
import TKTest from './candidate/TKTest';
import EPPSTest from './candidate/EPPSTest';
import PAPITest from './candidate/PAPITest';
import SJTTest from './candidate/SJTTest';
import TestDone from './candidate/TestDone';
import Complete from './candidate/Complete';

// Screens: setup | overview | tk_intro | tk | epps_intro | epps | papi_intro | papi | sjt_intro | sjt | done_<n> | complete
const TESTS = ['tk', 'epps', 'papi', 'sjt'];
const ASSESSMENT_ID_BATTERY_C = 3;
const TIMED_SCREENS = ['tk', 'sjt']; // both timed → ctrl-block + integrity gate

export default function CandidateCard() {
  const initial = (() => {
    const data = loadCardData();
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
  const submitOnceRef = useRef(false);

  useEffect(() => {
    if (profile) saveCardData(profile, results);
  }, [profile, results]);

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
    if (!window.confirm('Reset semua data dan progres Battery C?')) return;
    clearCardData();
    setProfile(null);
    setResults({});
    setTabSwitches(0);
    setSubmitStatus('idle');
    setSubmitError(null);
    submitOnceRef.current = false;
    goTo('setup');
  }, [goTo]);

  // Battery C scoring lives entirely on the client (TK weighted composite, EPPS scales,
  // PAPI 20 dims, SJT 6 competencies → 5 leadership profiles).
  const submitResults = useCallback(async () => {
    if (!profile?.participant_id) {
      setSubmitStatus('error');
      setSubmitError('Participant ID belum tersedia. Silakan ulangi pengisian data peserta dari awal.');
      return;
    }
    setSubmitStatus('submitting');
    setSubmitError(null);
    try {
      const pillars = calc3Pillar(results);
      await submitAssessment({
        participant_id: profile.participant_id,
        assessment_id: ASSESSMENT_ID_BATTERY_C,
        results: {
          by_subtest: {
            tk:   results.tk   ?? null,
            epps: results.epps ?? null,
            papi: results.papi ?? null,
            sjt:  results.sjt  ?? null,
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
          sjt_profile:   results.sjt?.profile   ?? null,
        },
      });
      setSubmitStatus('success');
    } catch (e) {
      if (e?.response?.status === 409) {
        setSubmitStatus('success');
        return;
      }
      setSubmitStatus('error');
      setSubmitError(e?.response?.data?.message || e?.message || 'Gagal mengirim hasil ke server.');
    }
  }, [profile?.participant_id, results]);

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
        onComplete={(res) => handleTestSubmit('epps', res, 'Tes 2 — Kepribadian', 'papi_intro')}
        onAbort={() => goTo('overview')}
      />
    );
  }
  if (screen === 'papi') {
    return (
      <PAPITest
        onComplete={(res) => handleTestSubmit('papi', res, 'Tes 3 — Preferensi Kerja', 'sjt_intro')}
        onAbort={() => goTo('overview')}
      />
    );
  }
  if (screen === 'sjt') {
    return (
      <SJTTest
        onComplete={(res) => handleTestSubmit('sjt', res, 'Tes 4 — Penilaian Situasional', 'complete')}
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
