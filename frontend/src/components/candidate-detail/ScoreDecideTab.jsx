import { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import ReportViewA from '@/components/assessment-a/report/ReportView';
import ReportViewB from '@/components/assessment-b/report/ReportView';
import ReportViewC from '@/components/assessment-c/report/ReportView';
import ReportViewD from '@/components/assessment-d/report/ReportView';
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
import { updateAssessmentReport } from '@/api/assessment-battery-result.api';

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

// Tab 3: per-battery ReportView with editable assessor annotations (debounced auto-save).
// Falls back to an empty-state card when no result row exists yet.
//
// Save strategy: a state-watching effect debounces 600ms after the user stops editing.
// `isDirty` gates the save so the initial seed doesn't fire a no-op write.
//
// Re-seed strategy: parent passes key={result?.id} so a new result row remounts the
// component — the lazy initializer below re-reads from the new row. No setState-in-effect.
export default function ScoreDecideTab({ candidate, battery, result, onJumpToTab }) {
  const hasResults = !!result?.results?.by_subtest;

  const codec = pickCodec(result);
  const [state, setState]           = useState(() => (result ? codec.unpack(result) : {}));
  const [isDirty, setIsDirty]       = useState(false);
  const [saveStatus, setSaveStatus] = useState('idle'); // idle | saving | saved | error
  const [saveError, setSaveError]   = useState(null);

  // Refs so the manual save uses the latest state (not the closure at timer-set time).
  const latestStateRef = useRef(state);
  latestStateRef.current = state;
  const pendingRef = useRef(null);

  const doSave = async () => {
    if (!result?.id) return { ok: false };
    setSaveStatus('saving');
    setSaveError(null);
    try {
      await updateAssessmentReport(result.id, codec.pack(latestStateRef.current, result.summary));
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

  // Debounced auto-save. Skips when there's nothing to save (idle / clean state).
  useEffect(() => {
    if (!result?.id || !isDirty) return undefined;
    if (pendingRef.current) clearTimeout(pendingRef.current);
    pendingRef.current = setTimeout(() => { doSave().catch(() => {}); }, SAVE_DEBOUNCE_MS);
    return () => { if (pendingRef.current) clearTimeout(pendingRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, isDirty, result?.id, result?.summary]);

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
    name:       result.participant_name      ?? candidate?.name      ?? '—',
    position:   result.participant_position  ?? candidate?.role      ?? '—',
    department: result.participant_department ?? '—',
    education:  result.participant_education  ?? candidate?.education ?? '—',
    email:      result.participant_email     ?? candidate?.email     ?? '—',
    date_birth: result.participant_date_birth ?? null,
    date:       result.assessment_date ?? null,
  };
  const subtestResults = result.results.by_subtest;
  const reportProps = { profile, results: subtestResults, state, updateState, saveNow };

  return (
    <div>
      <SaveStatusBadge status={saveStatus} error={saveError} />
      {renderReportView(result, battery, reportProps)}
    </div>
  );
}

// Dispatch prefers `result.assessment_id` (decoupled from the battery_type ENUM, which
// doesn't include 'I'). Falls back to the battery code for A/B/C/D.
function renderReportView(result, battery, props) {
  if (result?.assessment_id === INSIGHTS_ASSESSMENT_ID) return <ReportViewInsights {...props} />;
  if (result?.assessment_id === TKI_ASSESSMENT_ID)      return <ReportViewTKI {...props} />;
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
