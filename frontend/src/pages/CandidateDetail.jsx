import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Check, Loader2, Printer, Save, FileText, Wand2, ClipboardCheck, ThumbsUp, Pause, ThumbsDown } from 'lucide-react';
import SetupTab from '@/components/candidate-detail/SetupTab';
import TakeTab from '@/components/candidate-detail/TakeTab';
import ScoreDecideTab from '@/components/candidate-detail/ScoreDecideTab';
import { STEPS } from '@/components/candidate-detail/steps';
import { BATTERIES, getInitials } from '@/lib/batteries';
import { getCandidateById, addCandidateStage } from '@/api/candidate.api';
import { getSessionsFromCandidate } from '@/api/session.api';
import { getResultFromCandidate } from '@/api/assessment-battery-result.api';

export default function CandidateDetailPage() {
  const navigate = useNavigate();
  const { jobId, participantId: candidateIdParam } = useParams();
  const candidateId = Number(candidateIdParam);

  const [candidate, setCandidate]   = useState(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);

  const [activeKey, setActiveKey]   = useState('setup');
  const [battery, setBattery]       = useState(null);
  const [existingSessions, setExistingSessions] = useState([]);

  const restoredOnceRef   = useRef(false);
  const restoredDecideRef = useRef(false);

  const [latestResult, setLatestResult] = useState(null);

  // Save bridge: ScoreDecideTab writes its doSave fn here; sidebar button calls it.
  const saveNowRef = useRef(null);
  const [decideSaveStatus, setDecideSaveStatus] = useState('idle'); // idle|saving|saved|error

  // finalRec bridge: ScoreDecideTab writes {get,set} here; sidebar reads/writes.
  const finalRecRef = useRef({ get: () => null, set: () => {} });
  const [sidebarFinalRec, setSidebarFinalRec] = useState(null);
  const [advanceStatus, setAdvanceStatus] = useState('idle'); // idle|loading|done|error

  /* ── Fetch candidate ─────────────────────────────────────────── */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getCandidateById(candidateId);
        if (!cancelled) setCandidate(res.data?.pipeline || null);
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.message || err.message || 'Failed to load candidate');
          setCandidate(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [candidateId]);

  /* ── Restore session state ───────────────────────────────────── */
  useEffect(() => {
    if (!candidateId) return undefined;
    restoredOnceRef.current   = false;
    restoredDecideRef.current = false;
    let cancelled = false;
    (async () => {
      try {
        const res = await getSessionsFromCandidate({
          candidate_id: candidateId,
          job_id: jobId ? Number(jobId) : undefined,
        });
        if (cancelled) return;
        const sessions = res.data?.sessions ?? [];
        setExistingSessions(sessions);
        if (sessions.length > 0 && !restoredOnceRef.current) {
          setBattery(sessions[0].battery);
          setActiveKey('take');
          restoredOnceRef.current = true;
        }
      } catch { /* silent */ }
    })();
    return () => { cancelled = true; };
  }, [candidateId, jobId]);

  /* ── Fetch latest result ─────────────────────────────────────── */
  useEffect(() => {
    if (!candidateId || !battery) { setLatestResult(null); return undefined; }
    let cancelled = false;
    (async () => {
      try {
        const res = await getResultFromCandidate({ candidate_id: candidateId, battery });
        if (!cancelled) setLatestResult(res.data?.result ?? null);
      } catch {
        if (!cancelled) setLatestResult(null);
      }
    })();
    return () => { cancelled = true; };
  }, [candidateId, battery]);

  /* ── Auto-advance to Score & Decide when result completed ────── */
  useEffect(() => {
    if (latestResult?.status === 'completed' && !restoredDecideRef.current) {
      restoredDecideRef.current = true;
      setActiveKey('decide');
    }
  }, [latestResult]);

  /* ── Seed sidebarFinalRec from stored assessor_state on load ─── */
  useEffect(() => {
    const stored = latestResult?.assessor_state?.finalRec ?? null;
    setSidebarFinalRec(stored);
    setAdvanceStatus('idle');
  }, [latestResult?.id]);

  /* ── Derived state ───────────────────────────────────────────── */
  const subtestStatus = useMemo(() => {
    const by = latestResult?.results?.by_subtest;
    if (!by || !battery) return {};
    const out = {};
    (BATTERIES[battery]?.tests || []).forEach((t) => {
      out[t.key] = by[t.key] != null ? 'scored' : 'invited';
    });
    return out;
  }, [latestResult, battery]);

  const completed = useMemo(() => ({
    setup: !!battery,
    take:  latestResult?.status === 'completed',
    decide: false,
  }), [battery, latestResult]);

  const lockedBattery = existingSessions[0]?.battery ?? null;

  /* ── Loading / error ─────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-xs text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> Loading candidate…
      </div>
    );
  }
  if (error || !candidate) {
    return (
      <div className="py-20 text-center text-xs text-muted-foreground">
        {error || 'Candidate not found.'}
      </div>
    );
  }

  const candidateView = {
    id:        candidate.id,
    name:      candidate.candidate_name || candidate.name || '—',
    role:      candidate.last_position  || '—',
    email:     candidate.email          || '—',
    education: candidate.education      || '—',
  };

  const latestStage = candidate.latest_stage ?? null;

  const handleSendInvitation = () => setActiveKey('take');
  const handleRevoke = (sessionId) =>
    setExistingSessions((prev) => prev.filter((s) => s.id !== sessionId));

  /* ── finalRec: sidebar pick + save + optional advance ── */
  const handleFinalRec = (val) => {
    setSidebarFinalRec(val);
    finalRecRef.current.set?.(val);   // propagates into ScoreDecideTab → debounced save
  };

  const handleAdvance = async () => {
    if (!latestStage) return;
    setAdvanceStatus('loading');
    try {
      // Save any pending annotations first so the backend state is consistent.
      await saveNowRef.current?.();
      await addCandidateStage(candidateId, latestStage, 'advance');
      setAdvanceStatus('done');
      setTimeout(() => setAdvanceStatus('idle'), 3000);
    } catch {
      setAdvanceStatus('error');
    }
  };

  /* ── Navigation guard ───────────────────────────────────
     Score & Decide requires a completed result.
     Everything else is freely accessible.             ── */
  const handleNavigate = (targetKey) => {
    if (targetKey === activeKey) return;
    if (targetKey === 'decide' && !completed.take) return;
    setActiveKey(targetKey);
  };

  /* ── Save handler for sidebar button ────────────────────────── */
  const handleSaveNow = async () => {
    if (!saveNowRef.current) return;
    setDecideSaveStatus('saving');
    try {
      await saveNowRef.current();
      setDecideSaveStatus('saved');
      setTimeout(() => setDecideSaveStatus('idle'), 2000);
    } catch {
      setDecideSaveStatus('error');
    }
  };

  return (
    <>
      {/* ── Sticky Header ─────────────────────────────────────── */}
      <div className="sticky top-[52px] z-10 bg-background/95 backdrop-blur-sm -mt-5 -mx-5 px-5 pt-5 pb-4 border-b border-border/60">
        <Button
          variant="ghost"
          size="sm"
          className="text-xs -ml-2 w-fit"
          onClick={() => navigate('/selection/assessment')}
        >
          <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back to candidates
        </Button>

        <div className="flex items-center gap-3 mt-2 flex-wrap">
          <div className="h-11 w-11 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0 text-sm">
            {getInitials(candidateView.name)}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-bold tracking-tight truncate">{candidateView.name}</h1>
            <div className="text-[11px] text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5">
              <span>{candidateView.role}</span>
              {battery && <span>· Battery {battery}</span>}
              {candidateView.email && <span>· {candidateView.email}</span>}
            </div>
          </div>
          {completed.take && (
            <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
              Assessment Completed
            </span>
          )}
        </div>
      </div>

      {/* ── Two-column layout ─────────────────────────────────── */}
      <div className="px-6 pb-6 pt-4">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_260px] gap-6">

          {/* Main content */}
          <div className="min-w-0 space-y-4">
            <div key={activeKey} className="animate-fade-in-up">
              {activeKey === 'setup' && (
                <SetupTab
                  selectedBattery={battery}
                  onSelectBattery={setBattery}
                  onSendInvitation={handleSendInvitation}
                  lockedBattery={lockedBattery}
                />
              )}
              {activeKey === 'take' && (
                <TakeTab
                  battery={battery}
                  subtestStatus={subtestStatus}
                  candidateId={candidateId}
                  jobId={jobId}
                  existingSessions={existingSessions}
                  onSessionsChange={setExistingSessions}
                  onRevoke={handleRevoke}
                />
              )}
              {activeKey === 'decide' && (
                <ScoreDecideTab
                  key={latestResult?.id ?? `no-result-${battery ?? 'none'}`}
                  candidate={candidateView}
                  battery={battery}
                  result={latestResult}
                  onJumpToTab={setActiveKey}
                  saveNowRef={saveNowRef}
                  onSaveStatusChange={setDecideSaveStatus}
                  finalRecRef={finalRecRef}
                  onFinalRecChange={setSidebarFinalRec}
                />
              )}
            </div>

            {/* Step paginator */}
            <StepPaginator
              activeKey={activeKey}
              onSelect={handleNavigate}
              completed={completed}
            />
          </div>

          {/* Sticky Sidebar */}
          <aside>
            <div className="sticky top-[184px] space-y-3">
              {activeKey === 'decide' && completed.take && (
                <TindakLanjutCard
                  finalRec={sidebarFinalRec}
                  onPick={handleFinalRec}
                  onAdvance={handleAdvance}
                  advanceStatus={advanceStatus}
                  hasStage={!!latestStage}
                />
              )}
              <AssessmentActionCard
                activeKey={activeKey}
                completed={completed}
                battery={battery}
                onSelect={handleNavigate}
                saveStatus={decideSaveStatus}
                onSaveNow={handleSaveNow}
              />
              <AssessmentStepsNav
                activeKey={activeKey}
                onSelect={handleNavigate}
                completed={completed}
              />
            </div>
          </aside>

        </div>
      </div>
    </>
  );
}

/* ── Sidebar: Tindak Lanjut (decision + advance) ─────────────────── */
const TINDAK_OPTIONS = [
  { val: 'direkomendasikan', label: 'Advance', icon: ThumbsUp,   cls: 'border-emerald-500 bg-emerald-50 text-emerald-700', activeCls: 'bg-emerald-600 text-white border-emerald-600' },
  { val: 'evaluasi',         label: 'Hold',    icon: Pause,       cls: 'border-amber-400  bg-amber-50  text-amber-700',   activeCls: 'bg-amber-500  text-white border-amber-500'  },
  { val: 'tidak',            label: 'Reject',  icon: ThumbsDown,  cls: 'border-rose-400   bg-rose-50   text-rose-700',    activeCls: 'bg-rose-600   text-white border-rose-600'   },
];

function TindakLanjutCard({ finalRec, onPick, onAdvance, advanceStatus, hasStage }) {
  return (
    <Card>
      <CardContent className="p-3 space-y-2.5">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Decision
        </p>

        {/* Pick buttons */}
        <div className="space-y-1.5">
          {TINDAK_OPTIONS.map(({ val, label, icon: Icon, cls, activeCls }) => {
            const active = finalRec === val;
            return (
              <button
                key={val}
                type="button"
                onClick={() => onPick(val)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs font-semibold border transition-colors ${
                  active ? activeCls : `${cls} hover:opacity-90`
                }`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                {label}
                {active && <Check className="h-3 w-3 ml-auto" />}
              </button>
            );
          })}
        </div>

        {/* Advance stage button — only enabled when direkomendasikan */}
        {finalRec === 'direkomendasikan' && (
          <Button
            size="sm"
            className="w-full text-xs"
            onClick={onAdvance}
            disabled={!hasStage || advanceStatus === 'loading' || advanceStatus === 'done'}
          >
            {advanceStatus === 'loading' ? (
              <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Advancing…</>
            ) : advanceStatus === 'done' ? (
              <><Check className="h-3.5 w-3.5 mr-1.5" /> Stage Advanced</>
            ) : (
              <>Advance Stage <ArrowRight className="h-3.5 w-3.5 ml-1.5" /></>
            )}
          </Button>
        )}

        {advanceStatus === 'error' && (
          <p className="text-[10px] text-rose-600 leading-snug">Failed to advance — try again.</p>
        )}
        {!hasStage && finalRec === 'direkomendasikan' && (
          <p className="text-[10px] text-amber-600 leading-snug">No pipeline stage configured for this candidate.</p>
        )}
      </CardContent>
    </Card>
  );
}

/* ── Sidebar: contextual action card ─────────────────────────────── */
function AssessmentActionCard({ activeKey, completed, battery, onSelect, saveStatus, onSaveNow }) {
  if (activeKey === 'setup') {
    return (
      <Card>
        <CardContent className="p-3 space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Next Step
          </p>
          <Button
            size="sm"
            className="w-full text-xs"
            onClick={() => onSelect('take')}
            disabled={!battery}
          >
            Continue to Take <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
          </Button>
          {!battery && (
            <p className="text-[10px] text-amber-600 leading-snug">
              Select a battery above first.
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  if (activeKey === 'take') {
    return (
      <Card>
        <CardContent className="p-3 space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Next Step
          </p>
          <Button
            size="sm"
            className="w-full text-xs"
            onClick={() => onSelect('decide')}
            disabled={!completed.take}
          >
            Go to Score & Decide <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
          </Button>
          {!completed.take && (
            <p className="text-[10px] text-muted-foreground leading-snug">
              Awaiting candidate to complete all subtests.
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  if (activeKey === 'decide') {
    return (
      <Card>
        <CardContent className="p-3 space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Actions
          </p>
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs"
            onClick={onSaveNow}
            disabled={saveStatus === 'saving'}
          >
            {saveStatus === 'saving'
              ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Saving…</>
              : <><Save className="h-3.5 w-3.5 mr-1.5" />Save Now</>}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs"
            onClick={() => window.print()}
          >
            <Printer className="h-3.5 w-3.5 mr-1.5" /> Print / Save PDF
          </Button>
          {saveStatus === 'saved' && (
            <p className="text-[10px] text-emerald-600 flex items-center gap-1">
              <Check className="h-3 w-3" /> Saved successfully
            </p>
          )}
          {saveStatus === 'error' && (
            <p className="text-[10px] text-rose-600 leading-snug">
              Failed to save — try again.
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  return null;
}

/* ── Sidebar: vertical steps navigator ───────────────────────────── */
const STEP_ICONS = { setup: FileText, take: Wand2, decide: ClipboardCheck };

function AssessmentStepsNav({ activeKey, onSelect, completed }) {
  const activeIdx = STEPS.findIndex((s) => s.key === activeKey);

  const canGo = (targetIdx) => {
    const targetKey = STEPS[targetIdx]?.key;
    if (targetKey === 'decide') return !!completed.take;
    return true; // setup + take always accessible
  };

  return (
    <Card>
      <CardContent className="p-3 space-y-1">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">Steps</p>
        {STEPS.map((step, i) => {
          const isActive = activeKey === step.key;
          const isDone   = completed[step.key];
          const locked   = !canGo(i);
          const Icon     = STEP_ICONS[step.key];
          return (
            <button
              key={step.key}
              type="button"
              disabled={locked}
              onClick={() => !locked && onSelect(step.key)}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'hover:bg-muted/50 text-foreground'
              }`}
            >
              <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-semibold shrink-0 ${
                isDone
                  ? 'bg-emerald-500 text-white'
                  : isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
              }`}>
                {isDone ? <Check className="h-3 w-3" /> : (i + 1)}
              </span>
              {Icon && <Icon className={`h-3.5 w-3.5 shrink-0 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />}
              <span className="flex-1 min-w-0 leading-tight">
                <span className={`block text-xs truncate ${isActive ? 'font-semibold' : 'font-medium'}`}>{step.label}</span>
                <span className="block text-[9px] text-muted-foreground truncate">{step.caption}</span>
              </span>
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
}

/* ── Bottom step paginator ────────────────────────────────────────── */
function StepPaginator({ activeKey, onSelect, completed }) {
  const activeIdx = STEPS.findIndex((s) => s.key === activeKey);

  const canGo = (targetIdx) => {
    if (targetIdx < 0 || targetIdx >= STEPS.length) return false;
    const targetKey = STEPS[targetIdx]?.key;
    if (targetKey === 'decide') return !!completed.take;
    return true; // setup + take always accessible
  };

  return (
    <div className="border-t border-border/60 pt-4 space-y-2">
      <div className="flex items-center justify-center gap-1.5">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          disabled={activeIdx <= 0}
          onClick={() => onSelect(STEPS[activeIdx - 1].key)}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>

        {STEPS.map((step, i) => {
          const isActive = i === activeIdx;
          const isDone   = completed[step.key];
          const locked   = !canGo(i);
          return (
            <button
              key={step.key}
              type="button"
              disabled={locked}
              onClick={() => !locked && onSelect(step.key)}
              title={locked ? 'Complete the current step first' : step.label}
              className={`h-8 w-8 rounded-md text-xs font-semibold flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : isDone
                    ? 'border border-emerald-300 text-emerald-700 hover:bg-emerald-50'
                    : 'border border-border text-muted-foreground hover:bg-muted/60'
              }`}
            >
              {i + 1}
            </button>
          );
        })}

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          disabled={!canGo(activeIdx + 1)}
          onClick={() => canGo(activeIdx + 1) && onSelect(STEPS[activeIdx + 1].key)}
        >
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
      <p className="text-center text-[11px] text-muted-foreground">
        Step {activeIdx + 1} of {STEPS.length} · {STEPS[activeIdx]?.label}
      </p>
    </div>
  );
}
