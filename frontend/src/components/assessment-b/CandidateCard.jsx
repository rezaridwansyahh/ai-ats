import { useEffect, useState, useCallback } from 'react';
import { loadCardData, saveCardData, clearCardData } from './utils/storage';
import { fmtDateID } from './utils/scoring';
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

export default function CandidateCard() {
  // Lazy initialization from localStorage
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
  const [doneInfo, setDoneInfo] = useState(null); // { num, label, next }

  // Persist whenever profile or results change
  useEffect(() => {
    if (profile) saveCardData(profile, results);
  }, [profile, results]);

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

  const handleSetupSubmit = useCallback((newProfile) => {
    setProfile(newProfile);
    goTo('overview');
  }, [goTo]);

  const handleReset = useCallback(() => {
    if (!window.confirm('Reset semua data dan progres Battery B?')) return;
    clearCardData();
    setProfile(null);
    setResults({});
    setTabSwitches(0);
    goTo('setup');
  }, [goTo]);

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
      />
    );
  }

  return null;
}
