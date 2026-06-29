import { useEffect, useState, useCallback, useRef } from 'react';
import { loadCardData, saveCardData, clearCardData, SKEY } from './utils/storage';
import { computeTKI, fmtDateID } from './utils/scoring';
import { updatePortalParticipant } from '@/api/portal-assessment.api';
import { submitAssessment, updateAssessmentReport } from '@/api/assessment-battery-result.api';
import { unpackAssessorState, packAssessorState } from './report/assessor-state';
import Setup from './candidate/Setup';
import Briefing from './candidate/Briefing';
import Intro from './candidate/Intro';
import TKITest from './candidate/TKITest';
import Complete from './candidate/Complete';
import ReportView from './report/ReportView';

// Screens: setup | briefing | intro | test | complete | report
const ASSESSMENT_ID_TKI = 6;
const SAVE_DEBOUNCE_MS = 600;

export default function CandidateCard({
  mode = 'standalone',
  prefilledProfile = null,
  onPortalSubmit = null,
  portalHash = null,
  allowViewReport = true,
} = {}) {
  const isPortal = mode === 'portal';
  // Scope localStorage per portal session so multiple invitations in the same browser don't collide.
  const storageKey = isPortal && portalHash ? `${SKEY}::portal::${portalHash}` : SKEY;

  // TKI ReportView is the HR-only editor (no separate CandidateReportView). Force-off
  // in portal mode so kandidat never sees HR-editable fields.
  const showReportButton = !isPortal && allowViewReport;

  const initial = (() => {
    const data = loadCardData(storageKey);
    if (isPortal && prefilledProfile) {
      const savedProfile = data?.profile || null;
      return {
        profile: savedProfile || prefilledProfile,
        results: data?.results || {},
        screen: savedProfile?.confirmed ? 'intro' : 'setup',
      };
    }
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

  // ── HR-annotation state (standalone only) ──
  const [resultRow, setResultRow] = useState(null);
  const [assessorState, setAssessorState] = useState({});
  const [isDirty, setIsDirty] = useState(false);
  const [saveStatus, setSaveStatus] = useState('idle');
  const [saveError, setSaveError] = useState(null);
  const latestStateRef = useRef(assessorState);
  useEffect(() => { latestStateRef.current = assessorState; }, [assessorState]);
  const pendingSaveRef = useRef(null);

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
    if (isPortal) {
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
    if (!window.confirm('Reset semua data dan progres asesmen ini?')) return;
    clearCardData(storageKey);
    if (!isPortal) setProfile(null);
    setResults({});
    setTabSwitches(0);
    setSubmitStatus('idle');
    setSubmitError(null);
    setResultRow(null);
    setAssessorState({});
    setIsDirty(false);
    setSaveStatus('idle');
    setSaveError(null);
    submitOnceRef.current = false;
    goTo(isPortal ? 'intro' : 'setup');
  }, [goTo, storageKey, isPortal]);

  const handleTestComplete = useCallback((answers) => {
    const r = computeTKI(answers);
    setResults({ tki: { ...r, date: fmtDateID(), tabSwitches } });
    goTo('complete');
  }, [tabSwitches, goTo]);

  // Submit pre-computed result + summary. Portal hands off to onPortalSubmit (flips session
  // to 'completed'); standalone posts to /assessment-battery-result and captures the row id
  // so HR can PUT annotations against /:id/report.
  const submitResults = useCallback(async () => {
    const r = results.tki;
    if (!r) return;
    setSubmitStatus('submitting');
    setSubmitError(null);
    try {
      const payload = {
        results: { by_subtest: { tki: r } },
        summary: {
          dominant: r.dominant,
          secondary: r.secondary,
          scores: r.scores,
        },
      };

      if (isPortal && onPortalSubmit) {
        await onPortalSubmit(payload);
        // Portal: don't capture the row — kandidat shouldn't see HR-editable fields.
      } else {
        const res = await submitAssessment({
          assessment_id: ASSESSMENT_ID_TKI,
          ...payload,
        });
        const row = res?.data?.result ?? res?.data ?? null;
        if (row) {
          setResultRow(row);
          setAssessorState(unpackAssessorState(row));
        }
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

  // ── HR-annotation save loop (standalone only — resultRow.id is never set in portal) ──
  const doSave = useCallback(async () => {
    if (!resultRow?.id) return { ok: false };
    setSaveStatus('saving');
    setSaveError(null);
    try {
      await updateAssessmentReport(resultRow.id, packAssessorState(latestStateRef.current, resultRow.summary));
      setSaveStatus('saved');
      setIsDirty(false);
      return { ok: true };
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || 'Gagal menyimpan anotasi.';
      setSaveStatus('error');
      setSaveError(msg);
      throw new Error(msg);
    }
  }, [resultRow]);

  useEffect(() => {
    if (!resultRow?.id || !isDirty) return undefined;
    if (pendingSaveRef.current) clearTimeout(pendingSaveRef.current);
    pendingSaveRef.current = setTimeout(() => { doSave().catch(() => {}); }, SAVE_DEBOUNCE_MS);
    return () => { if (pendingSaveRef.current) clearTimeout(pendingSaveRef.current); };
  }, [assessorState, isDirty, resultRow?.id, doSave]);

  const updateAssessor = useCallback((patch) => {
    setAssessorState((prev) => ({ ...prev, ...patch }));
    setIsDirty(true);
  }, []);

  const saveAssessorNow = useCallback(async () => {
    if (pendingSaveRef.current) {
      clearTimeout(pendingSaveRef.current);
      pendingSaveRef.current = null;
    }
    return doSave();
  }, [doSave]);

  // ── Routing ──
  if (screen === 'setup') {
    return <Setup initial={profile} onSubmit={handleSetupSubmit} emailReadOnly={isPortal} />;
  }

  if (screen === 'briefing') {
    return <Briefing profile={profile} onStart={() => goTo('intro')} />;
  }

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
        onViewReport={results.tki && showReportButton ? () => goTo('report') : null}
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
    return (
      <>
        <SaveStatusBadge status={saveStatus} error={saveError} canSave={!!resultRow?.id} />
        <ReportView
          profile={profile}
          results={results}
          state={assessorState}
          updateState={resultRow?.id ? updateAssessor : undefined}
          saveNow={resultRow?.id ? saveAssessorNow : undefined}
          onClose={() => goTo('complete')}
        />
      </>
    );
  }

  return null;
}

function SaveStatusBadge({ status, error, canSave }) {
  if (!canSave) {
    return (
      <div className="max-w-[1100px] mx-auto px-4 pt-2 flex justify-end no-print">
        <span className="text-[10px] font-bold px-2 py-1 rounded-full border bg-slate-50 text-slate-500 border-slate-200">
          Read-only · hasil belum tersimpan di server
        </span>
      </div>
    );
  }
  if (status === 'idle') return null;
  const cls = {
    saving: 'bg-amber-50 text-amber-700 border-amber-200',
    saved:  'bg-green-100 text-green-700 border-green-200',
    error:  'bg-red-100 text-red-700 border-red-200',
  }[status];
  const label = {
    saving: 'Menyimpan…',
    saved:  'Tersimpan',
    error:  'Gagal Simpan',
  }[status];
  return (
    <div className="max-w-[1100px] mx-auto px-4 pt-2 flex justify-end no-print">
      <span
        title={status === 'error' ? error || '' : ''}
        className={`text-[10px] font-bold px-2 py-1 rounded-full border ${cls}`}
      >
        {label}
      </span>
    </div>
  );
}
