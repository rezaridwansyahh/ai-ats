import { useEffect, useState, useCallback, useRef } from 'react';
import { loadCardData, saveCardData, clearCardData, SKEY } from './utils/storage';
import { computeTKI, fmtDateID } from './utils/scoring';
import { createParticipantByEmail } from '@/api/participant.api';
import { submitAssessment } from '@/api/assessment-battery-result.api';
import Setup from './candidate/Setup';
import Intro from './candidate/Intro';
import TKITest from './candidate/TKITest';
import Complete from './candidate/Complete';
import ReportView from './report/ReportView';

// Screens: setup | intro | test | complete | report
const ASSESSMENT_ID_TKI = 6;

export default function CandidateCard({ allowViewReport = true } = {}) {
  const storageKey = SKEY;

  const initial = (() => {
    const data = loadCardData(storageKey);
    return {
      profile: data?.profile || null,
      results: data?.results || {},
      screen: data?.profile ? 'intro' : 'setup',
    };
  })();

  const [screen, setScreen] = useState(initial.screen);
  const [profile, setProfile] = useState(initial.profile);
  const [results, setResults] = useState(initial.results);
  const [tabSwitches, setTabSwitches] = useState(0);
  const [submitStatus, setSubmitStatus] = useState('idle');
  const [submitError, setSubmitError] = useState(null);
  const submitOnceRef = useRef(false);

  useEffect(() => {
    if (profile) saveCardData(profile, results, storageKey);
  }, [profile, results, storageKey]);

  // Tab-switch detector while taking the test (logged into the report).
  useEffect(() => {
    const handler = () => {
      if (document.hidden && screen === 'test') setTabSwitches((n) => n + 1);
    };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
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
    setProfile({ ...newProfile, participant_id: data?.participant?.id ?? null });
    goTo('intro');
  }, [goTo]);

  const handleReset = useCallback(() => {
    if (!window.confirm('Reset semua data dan progres asesmen ini?')) return;
    clearCardData(storageKey);
    setProfile(null);
    setResults({});
    setTabSwitches(0);
    setSubmitStatus('idle');
    setSubmitError(null);
    submitOnceRef.current = false;
    goTo('setup');
  }, [goTo, storageKey]);

  const handleTestComplete = useCallback((answers) => {
    const r = computeTKI(answers);
    setResults({ tki: { ...r, date: fmtDateID(), tabSwitches } });
    goTo('complete');
  }, [tabSwitches, goTo]);

  // Submit pre-computed result + summary (matches the backend hasPrecomputed path).
  const submitResults = useCallback(async () => {
    const r = results.tki;
    if (!r) return;
    if (!profile?.participant_id) {
      setSubmitStatus('error');
      setSubmitError('Participant ID belum tersedia. Silakan ulangi pengisian data peserta dari awal.');
      return;
    }
    setSubmitStatus('submitting');
    setSubmitError(null);
    try {
      await submitAssessment({
        participant_id: profile.participant_id,
        assessment_id: ASSESSMENT_ID_TKI,
        results: { by_subtest: { tki: r } },
        summary: {
          dominant: r.dominant,
          secondary: r.secondary,
          scores: r.scores,
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

  // ── Routing ──
  if (screen === 'setup') return <Setup initial={profile} onSubmit={handleSetupSubmit} />;

  if (screen === 'intro') {
    return <Intro onStart={() => goTo('test')} onBack={handleReset} />;
  }

  if (screen === 'test') {
    return <TKITest onComplete={handleTestComplete} onAbort={() => goTo('intro')} />;
  }

  if (screen === 'complete') {
    return (
      <Complete
        profile={profile}
        onViewReport={results.tki && allowViewReport ? () => goTo('report') : null}
        onRestart={handleReset}
        submitStatus={submitStatus}
        submitError={submitError}
        onRetrySubmit={submitResults}
      />
    );
  }

  if (screen === 'report') {
    if (!results.tki) {
      goTo('complete');
      return null;
    }
    return <ReportView profile={profile} result={results.tki} onClose={() => goTo('complete')} />;
  }

  return null;
}
