import { useEffect, useState, useCallback } from 'react';
import { loadCardData, loadReportState, saveReportState, clearReportState } from './utils/storage';
import ReportSetup from './report/ReportSetup';
import ReportView from './report/ReportView';

export default function Report() {
  const initial = (() => {
    const card = loadCardData();
    return {
      profile: card?.profile || null,
      results: card?.results || {},
      hasCardData: !!card?.profile,
      state: loadReportState(),
    };
  })();

  const [screen, setScreen] = useState('setup'); // setup | report
  const [profile, setProfile] = useState(initial.profile);
  const [results, setResults] = useState(initial.results);
  const [state, setState] = useState(initial.state);
  const [hasCardData] = useState(initial.hasCardData);

  // Persist state
  useEffect(() => {
    saveReportState(state);
  }, [state]);

  const updateState = useCallback((patch) => {
    setState((s) => ({ ...s, ...patch }));
  }, []);

  const handleBuild = useCallback((reportProfile, manualOverrides) => {
    setProfile(reportProfile);
    if (manualOverrides) {
      setResults((prev) => ({ ...prev, ...manualOverrides }));
    }
    setScreen('report');
    window.scrollTo(0, 0);
  }, []);

  const handleResetAnnotations = useCallback(() => {
    if (!window.confirm('Hapus semua catatan rekruter dan narasi?')) return;
    clearReportState();
    setState({});
  }, []);

  if (screen === 'setup') {
    return (
      <ReportSetup
        hasCardData={hasCardData}
        profile={profile}
        results={results}
        state={state}
        updateState={updateState}
        onBuild={handleBuild}
      />
    );
  }

  return (
    <ReportView
      profile={profile}
      results={results}
      state={state}
      updateState={updateState}
      onBackToSetup={() => setScreen('setup')}
      onResetAnnotations={handleResetAnnotations}
    />
  );
}
