import { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, AlertTriangle, Sparkles } from 'lucide-react';
import ReportViewA from '@/components/assessment-a/report/ReportView';
import ReportViewB from '@/components/assessment-b/report/ReportView';
import ReportViewC from '@/components/assessment-c/report/ReportView';
import ReportViewD from '@/components/assessment-d/report/ReportView';
import { unpackAssessorState, packAssessorState } from '@/components/assessment/assessor-state';
import {
  updateAssessmentReport,
  regenerateNarrative,
  getAssessmentResultById,
} from '@/api/assessment-battery-result.api';
import ReportViewInsights from '@/components/assessment-insights/report/ReportView';
import ReportViewTKI from '@/components/assessment-tki/report/ReportView';
import {
  unpackAssessorState as unpackGeneric,
  packAssessorState   as packGeneric,
} from '@/components/assessment/assessor-state';
import {
  unpackAssessorState as unpackInsights,
  packAssessorState   as packInsights,
} from '@/components/assessment-insights/report/assessor-state';
import {
  unpackAssessorState as unpackTKI,
  packAssessorState   as packTKI,
} from '@/components/assessment-tki/report/assessor-state';

// Per-assessment annotation shapes (notes/ratings/meta differ across Insights, TKI, A-D).
// Pick the codec by assessment_id at render time.
const INSIGHTS_ASSESSMENT_ID = 5;
const TKI_ASSESSMENT_ID      = 6;
function pickCodec(result) {
  switch (result?.assessment_id) {
    case INSIGHTS_ASSESSMENT_ID: return { unpack: unpackInsights, pack: packInsights };
    case TKI_ASSESSMENT_ID:      return { unpack: unpackTKI,      pack: packTKI      };
    default:                     return { unpack: unpackGeneric,  pack: packGeneric  };
  }
}

// Debounce window — mirrors the value in the retired AssessmentDetailDialog.
const SAVE_DEBOUNCE_MS = 600;
// Poll cadence + cap for Battery A AI report generation.
const POLL_INTERVAL_MS = 5000;
const POLL_MAX_ATTEMPTS = 12; // ~60s total

// Tab 3: per-battery ReportView with editable assessor annotations (debounced auto-save).
// Falls back to an empty-state card when no result row exists yet.
//
// Save strategy: a state-watching effect debounces 600ms after the user stops editing.
// `isDirty` gates the save so the initial seed doesn't fire a no-op write.
//
// Re-seed strategy: parent passes key={result?.id} so a new result row remounts the
// component — the lazy initializer below re-reads from the new row.
//
// Battery A AI pre-gen: we mirror the parent `result` into `liveResult` and poll
// /assessment-battery-result/:id while ai_report_status is pending/generating. When
// it lands on 'completed', we merge any freshly-generated section narratives into
// `state` for keys the assessor has NOT already filled in (assessor edits always win).
export default function ScoreDecideTab({ candidate, battery, result, onJumpToTab, saveNowRef, onSaveStatusChange, finalRecRef, onFinalRecChange }) {
  const hasResults = !!result?.results?.by_subtest;

  const [liveResult, setLiveResult] = useState(result);
  useEffect(() => { setLiveResult(result); }, [result]);

  const [state, setState]           = useState(() => (liveResult ? unpackAssessorState(liveResult) : {}));
  const [isDirty, setIsDirty]       = useState(false);
  const [saveStatus, setSaveStatus] = useState('idle'); // idle | saving | saved | error
  const [saveError, setSaveError]   = useState(null);

  // Refs so the manual save uses the latest state (not the closure at timer-set time).
  const latestStateRef = useRef(state);
  latestStateRef.current = state;
  const isDirtyRef = useRef(isDirty);
  isDirtyRef.current = isDirty;
  const pendingRef = useRef(null);

  const doSave = async () => {
    if (!liveResult?.id) return { ok: false };
    setSaveStatus('saving');
    setSaveError(null);
    try {
      await updateAssessmentReport(liveResult.id, packAssessorState(latestStateRef.current, liveResult.summary));
      setSaveStatus('saved');
      setIsDirty(false);
      return { ok: true };
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || 'Gagal menyimpan anotasi.';
      setSaveStatus('error');
      setSaveError(msg);
      throw new Error(msg);
    }
  };

  // Expose doSave to parent sidebar via ref.
  useEffect(() => {
    if (saveNowRef) saveNowRef.current = doSave;
  });

  // Expose finalRec getter/setter to parent sidebar via ref.
  useEffect(() => {
    if (finalRecRef) {
      finalRecRef.current = {
        get: () => latestStateRef.current.finalRec ?? null,
        set: (v) => { setState((prev) => ({ ...prev, finalRec: v })); setIsDirty(true); },
      };
    }
  });

  // Notify parent whenever finalRec changes (sidebar badge/button state).
  useEffect(() => {
    onFinalRecChange?.(state.finalRec ?? null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.finalRec]);

  // Report save status changes to parent so sidebar can show feedback.
  useEffect(() => {
    onSaveStatusChange?.(saveStatus);
  }, [saveStatus, onSaveStatusChange]);

  // Debounced auto-save. Skips when there's nothing to save (idle / clean state).
  useEffect(() => {
    if (!liveResult?.id || !isDirty) return undefined;
    if (pendingRef.current) clearTimeout(pendingRef.current);
    pendingRef.current = setTimeout(() => { doSave().catch(() => {}); }, SAVE_DEBOUNCE_MS);
    return () => { if (pendingRef.current) clearTimeout(pendingRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, isDirty, liveResult?.id, liveResult?.summary]);

  // ── Battery A AI pre-generation state machine ───────────────────────────────
  // Effective status: backend resolver maps NULL→'not_generated' for legacy rows.
  const aiStatus = battery === 'A'
    ? (liveResult?.ai_report_status || (liveResult?.status === 'completed' ? 'not_generated' : null))
    : null;

  const [pollTimedOut, setPollTimedOut] = useState(false);
  const triggeredOnceRef = useRef(false);

  // Auto-trigger regeneration on legacy rows (status='completed' but ai_report_status NULL).
  useEffect(() => {
    if (battery !== 'A' || !liveResult?.id) return;
    if (aiStatus !== 'not_generated') return;
    if (triggeredOnceRef.current) return;
    triggeredOnceRef.current = true;
    setPollTimedOut(false);
    regenerateNarrative(liveResult.id).catch(() => {
      // The poll loop will surface the failure via ai_report_status='failed'.
    });
  }, [battery, liveResult?.id, aiStatus]);

  // Reset the one-shot guard when we move to a different result row (e.g. battery switch).
  useEffect(() => { triggeredOnceRef.current = false; setPollTimedOut(false); }, [liveResult?.id, battery]);

  // Poll while AI generation is in flight. Stops on completed/failed or after the cap.
  useEffect(() => {
    if (battery !== 'A' || !liveResult?.id) return undefined;
    const isInFlight = aiStatus === 'pending' || aiStatus === 'generating' || aiStatus === 'not_generated';
    if (!isInFlight) return undefined;

    let cancelled = false;
    let attempts = 0;
    const tick = async () => {
      if (cancelled) return;
      attempts += 1;
      try {
        const res = await getAssessmentResultById(liveResult.id);
        if (cancelled) return;
        const next = res.data?.result;
        if (next) {
          setLiveResult((prev) => ({ ...prev, ...next }));
          const nextStatus = next.ai_report_status;
          if (nextStatus === 'completed' || nextStatus === 'failed') return; // stop polling
        }
      } catch {
        // Network blip — keep trying until cap.
      }
      if (attempts >= POLL_MAX_ATTEMPTS) {
        setPollTimedOut(true);
        return;
      }
      timerId = setTimeout(tick, POLL_INTERVAL_MS);
    };

    let timerId = setTimeout(tick, POLL_INTERVAL_MS);
    return () => { cancelled = true; clearTimeout(timerId); };
  }, [battery, liveResult?.id, aiStatus]);

  // Merge fresh AI narratives into state whenever we have something to show —
  // even when status='failed' the backend persists the payload so the assessor
  // has draft text to edit instead of starting from scratch. The banner still
  // tells them generation failed validation.
  // Guard rails: never overwrite assessor edits (isDirty + non-empty key check).
  useEffect(() => {
    if (battery !== 'A') return;
    if (isDirtyRef.current) return;
    const hasFreshSections = liveResult?.ai_section_narratives
      || liveResult?.narrative_report;
    if (!hasFreshSections) return;
    const fresh = unpackAssessorState(liveResult);
    setState((prev) => {
      const merged = { ...prev };
      let changed = false;
      for (const [k, v] of Object.entries(fresh)) {
        if (merged[k] == null || merged[k] === '') {
          if (merged[k] !== v) { merged[k] = v; changed = true; }
        }
      }
      return changed ? merged : prev;
    });
  }, [battery, aiStatus, liveResult]);

  const handleManualRegenerate = async () => {
    if (!liveResult?.id) return;
    setPollTimedOut(false);
    triggeredOnceRef.current = true;
    try {
      const res = await regenerateNarrative(liveResult.id);
      const next = res.data?.result;
      if (next) setLiveResult((prev) => ({ ...prev, ...next }));
    } catch {
      // Surfaced via subsequent poll → 'failed'.
    }
  };

  const updateState = (patch) => {
    setState((prev) => ({ ...prev, ...patch }));
    setIsDirty(true);
  };

  // Manual flush — cancels the pending debounce and PUTs immediately. Returns a Promise
  // so the AI hook's auto-flush and the Save button's spinner can await completion.
  const saveNow = async () => {
    if (pendingRef.current) {
      clearTimeout(pendingRef.current);
      pendingRef.current = null;
    }
    return doSave();
  };

  if (!hasResults) {
    return (
      <Card>
        <CardContent className="py-14 text-center space-y-2">
          <h3 className="text-sm font-bold">Belum diasesmen</h3>
          <p className="text-xs text-muted-foreground">
            {battery
              ? 'Tunggu kandidat menyelesaikan seluruh subtes, lalu laporan akan muncul di sini.'
              : 'Pilih battery di tab Setup terlebih dahulu.'}
          </p>
          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => onJumpToTab?.('setup')}
              className="text-[11px] font-semibold text-primary hover:underline"
            >
              ← Kembali ke Setup
            </button>
            {battery && (
              <>
                <span className="text-muted-foreground/40">·</span>
                <button
                  type="button"
                  onClick={() => onJumpToTab?.('take')}
                  className="text-[11px] font-semibold text-primary hover:underline"
                >
                  Cek status Take →
                </button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // ReportView destructures `results.tk`, `results.epps`, etc. directly — it expects
  // the `by_subtest` value, NOT the wrapping `results` object.
  const profile = {
    name:       liveResult.participant_name      ?? candidate?.name      ?? '—',
    position:   liveResult.participant_position  ?? candidate?.role      ?? '—',
    department: liveResult.participant_department ?? '—',
    education:  liveResult.participant_education  ?? candidate?.education ?? '—',
    email:      liveResult.participant_email     ?? candidate?.email     ?? '—',
    date_birth: liveResult.participant_date_birth ?? null,
    date:       liveResult.assessment_date ?? null,
  };
  const subtestResults = liveResult.results.by_subtest;
  const reportProps = { profile, results: subtestResults, state, updateState, saveNow };

  return (
    <div>
      <AiReportBanner
        status={aiStatus}
        timedOut={pollTimedOut}
        errorMsg={liveResult?.ai_report_error}
        onRegenerate={handleManualRegenerate}
      />
      {renderReportView(battery, reportProps)}
    </div>
  );
}

// Battery A AI pre-generation status banner. Renders nothing for other batteries
// or when generation is already completed.
function AiReportBanner({ status, timedOut, errorMsg, onRegenerate }) {
  if (!status || status === 'completed') return null;

  const isInFlight = status === 'pending' || status === 'generating' || status === 'not_generated';
  if (isInFlight && !timedOut) {
    return <AiGeneratingCard status={status} />;
  }
  if (isInFlight && timedOut) {
    return (
      <div className="mx-4 mt-2 flex items-center justify-between gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900">
        <span className="flex items-center gap-2">
          <AlertTriangle className="h-3.5 w-3.5" />
          Generasi AI memakan waktu lebih lama dari biasanya.
        </span>
        <button
          type="button"
          onClick={onRegenerate}
          className="inline-flex items-center gap-1 rounded border border-amber-400 bg-white px-2 py-0.5 font-semibold hover:bg-amber-100"
        >
          <Sparkles className="h-3 w-3" /> Coba Ulang
        </button>
      </div>
    );
  }
  if (status === 'failed') {
    return (
      <div className="mx-4 mt-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <AlertTriangle className="h-3.5 w-3.5" />
            Generasi laporan AI gagal validasi. Draft tetap ditampilkan — silakan periksa & edit.
          </span>
          <button
            type="button"
            onClick={onRegenerate}
            className="inline-flex items-center gap-1 rounded border border-red-300 bg-white px-2 py-0.5 font-semibold hover:bg-red-100"
          >
            <Sparkles className="h-3 w-3" /> Generate Ulang
          </button>
        </div>
        {errorMsg ? (
          <p className="mt-1 pl-5 text-[10px] text-red-600/80 font-mono break-all">{errorMsg}</p>
        ) : null}
      </div>
    );
  }
  return null;
}

// Prominent loading card shown while the Battery A pre-gen pipeline runs on the
// backend. Counts elapsed seconds in real time and animates a progress bar against
// an ~30 second expected duration so the recruiter sees the request is alive.
function AiGeneratingCard({ status }) {
  const EXPECTED_SECONDS = 30;
  const [elapsed, setElapsed] = useState(0);

  // Reset the timer whenever a new generation begins (status flips into in-flight).
  useEffect(() => {
    setElapsed(0);
    const startedAt = Date.now();
    const tick = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    }, 250);
    return () => clearInterval(tick);
  }, [status]);

  const pct = Math.min(95, Math.round((elapsed / EXPECTED_SECONDS) * 100));
  const remaining = Math.max(0, EXPECTED_SECONDS - elapsed);
  const overrun   = elapsed > EXPECTED_SECONDS;

  const subtitle = status === 'not_generated'
    ? 'Memulai generasi AI untuk laporan kandidat ini…'
    : overrun
      ? 'Sedikit lebih lama dari biasanya — menunggu respons OpenAI…'
      : `Menulis interpretasi TK, Big Five, DISC, Holland, dan 4 blok sintesis…`;

  return (
    <div className="mx-4 my-3 rounded-lg border border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100/40 p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-200/60">
          <Sparkles className="h-5 w-5 text-amber-700" />
          <span className="absolute inset-0 animate-ping rounded-full bg-amber-300/40" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <h4 className="text-sm font-bold text-amber-900">
              Laporan AI sedang disiapkan
              <span className="inline-flex w-6 justify-start font-normal">
                <DotPulse />
              </span>
            </h4>
            <span className="font-mono text-xs font-semibold text-amber-800">
              {elapsed}s {overrun ? '' : `/ ≈${EXPECTED_SECONDS}s`}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-amber-800/90">{subtitle}</p>
          <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-amber-200/60">
            <div
              className="h-full rounded-full bg-amber-500 transition-all duration-300 ease-out"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[10px] text-amber-700/80">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>
              {overrun
                ? 'Tetap menunggu di backend — tab ini akan refresh otomatis saat selesai.'
                : `Perkiraan tersisa: ${remaining}s. Halaman ini akan refresh otomatis.`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Three animated dots that cycle .  →  .. →  ... → (repeat). Pure CSS via Tailwind's
// arbitrary-value animation utilities would be neater but this stays explicit.
function DotPulse() {
  const [n, setN] = useState(1);
  useEffect(() => {
    const t = setInterval(() => setN((v) => (v % 3) + 1), 400);
    return () => clearInterval(t);
  }, []);
  return <span>{'.'.repeat(n)}</span>;
}

function renderReportView(battery, props) {
  switch (battery) {
    case 'A': return <ReportViewA {...props} />;
    case 'C': return <ReportViewC {...props} />;
    case 'D': return <ReportViewD {...props} />;
    case 'B':
    default:  return <ReportViewB {...props} />;
  }
}

function SaveStatusBadge({ status, error }) {
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
    <div className="flex justify-end px-4 pt-2">
      <span
        title={status === 'error' ? error || '' : ''}
        className={`text-[10px] font-bold px-2 py-1 rounded-full border ${cls}`}
      >
        {label}
      </span>
    </div>
  );
}
