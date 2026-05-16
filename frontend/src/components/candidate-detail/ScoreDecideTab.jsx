import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import ReportViewA from '@/components/assessment-a/report/ReportView';
import ReportViewB from '@/components/assessment-b/report/ReportView';
import ReportViewC from '@/components/assessment-c/report/ReportView';
import ReportViewD from '@/components/assessment-d/report/ReportView';
import { unpackAssessorState, packAssessorState } from '@/components/assessment/assessor-state';
import { updateAssessmentReport } from '@/api/assessment-battery-result.api';

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

  const [state, setState]           = useState(() => (result ? unpackAssessorState(result) : {}));
  const [isDirty, setIsDirty]       = useState(false);
  const [saveStatus, setSaveStatus] = useState('idle'); // idle | saving | saved | error
  const [saveError, setSaveError]   = useState(null);

  // Debounced auto-save. Skips when there's nothing to save (idle / clean state).
  useEffect(() => {
    if (!result?.id || !isDirty) return undefined;
    const timer = setTimeout(async () => {
      setSaveStatus('saving');
      setSaveError(null);
      try {
        await updateAssessmentReport(result.id, packAssessorState(state, result.summary));
        setSaveStatus('saved');
        setIsDirty(false);
      } catch (e) {
        setSaveStatus('error');
        setSaveError(e?.response?.data?.message || e?.message || 'Gagal menyimpan anotasi.');
      }
    }, SAVE_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [state, isDirty, result?.id, result?.summary]);

  const updateState = (patch) => {
    setState((prev) => ({ ...prev, ...patch }));
    setIsDirty(true);
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
  const reportProps = { profile, results: subtestResults, state, updateState };

  return (
    <div>
      <SaveStatusBadge status={saveStatus} error={saveError} />
      {renderReportView(battery, reportProps)}
    </div>
  );
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
