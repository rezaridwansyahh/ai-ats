import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { updateAssessmentReport } from '@/api/assessment-battery-result.api';
import ReportViewA from '@/components/assessment-a/report/ReportView';
import ReportViewB from '@/components/assessment-b/report/ReportView';
import ReportViewC from '@/components/assessment-c/report/ReportView';
import ReportViewD from '@/components/assessment-d/report/ReportView';
import { unpackAssessorState, packAssessorState } from './assessor-state';

const SAVE_DEBOUNCE_MS = 600;

function formatDate(iso) {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
}

export function AssessmentDetailDialog({ open, onOpenChange, result }) {
  if (!result) return null;

  const code = result.assessment_code;
  const isBatteryB = code === 'myralix_battery_b';
  const isBatteryC = code === 'myralix_battery_c';
  const isBatteryD = code === 'myralix_battery_d';
  const ReportView = isBatteryD ? ReportViewD : isBatteryC ? ReportViewC : isBatteryB ? ReportViewB : ReportViewA;
  const fallbackTitle = isBatteryD ? 'Battery D' : isBatteryC ? 'Battery C' : isBatteryB ? 'Battery B' : 'Battery A';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl max-h-[92vh] overflow-y-auto p-0">
        <BatteryReportContainer
          result={result}
          ReportView={ReportView}
          fallbackTitle={fallbackTitle}
          onClose={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

// Shared dialog wrapper for both batteries. The only battery-specific bit is the ReportView
// component passed in — state shape, persistence, and dialog chrome are identical.
function BatteryReportContainer({ result, ReportView, fallbackTitle, onClose }) {
  const profile = useMemo(() => ({
    name:       result.participant_name,
    email:      result.participant_email,
    position:   result.participant_position,
    department: result.participant_department,
    education:  result.participant_education,
    date_birth: result.participant_date_birth,
    date:       formatDate(result.assessment_date),
  }), [result]);

  const results = result.results?.by_subtest || {};

  const [state, setState] = useState(() => unpackAssessorState(result));
  const [saveStatus, setSaveStatus] = useState('idle'); // idle | saving | saved | error
  const [saveError, setSaveError] = useState(null);

  // Re-seed state when a different row is opened.
  useEffect(() => {
    setState(unpackAssessorState(result));
    setSaveStatus('idle');
    setSaveError(null);
  }, [result.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced PUT — fires SAVE_DEBOUNCE_MS after the last edit.
  const pendingRef = useRef(null);
  const latestStateRef = useRef(state);
  latestStateRef.current = state;

  const flushSave = async () => {
    setSaveStatus('saving');
    setSaveError(null);
    try {
      const body = packAssessorState(latestStateRef.current, result.summary);
      await updateAssessmentReport(result.id, body);
      setSaveStatus('saved');
    } catch (e) {
      setSaveStatus('error');
      setSaveError(e?.response?.data?.message || e?.message || 'Gagal menyimpan anotasi.');
    }
  };

  const updateState = (patch) => {
    setState((prev) => ({ ...prev, ...patch }));
    if (pendingRef.current) clearTimeout(pendingRef.current);
    pendingRef.current = setTimeout(flushSave, SAVE_DEBOUNCE_MS);
  };

  // Flush pending save on unmount/dialog close.
  useEffect(() => () => {
    if (pendingRef.current) {
      clearTimeout(pendingRef.current);
      flushSave();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const Report = ReportView;

  return (
    <>
      <DialogHeader className="px-6 pt-6 pb-3 border-b sticky top-0 bg-white z-10">
        <div className="flex items-start justify-between gap-3 pr-8">
          <div>
            <DialogTitle className="text-lg">{result.participant_name ?? '—'}</DialogTitle>
            <DialogDescription className="text-xs">
              {result.assessment_name ?? fallbackTitle} · {formatDate(result.assessment_date)}
            </DialogDescription>
          </div>
          <SaveStatusBadge status={saveStatus} error={saveError} />
        </div>
      </DialogHeader>
      <div className="px-2 py-2">
        <Report
          profile={profile}
          results={results}
          state={state}
          updateState={updateState}
          onClose={onClose}
        />
      </div>
    </>
  );
}

function SaveStatusBadge({ status, error }) {
  if (status === 'saving') {
    return (
      <span className="text-[10px] font-bold px-2 py-1 rounded-full border bg-amber-50 text-amber-700 border-amber-200">
        Menyimpan…
      </span>
    );
  }
  if (status === 'saved') {
    return (
      <span className="text-[10px] font-bold px-2 py-1 rounded-full border bg-green-100 text-green-700 border-green-200">
        Tersimpan
      </span>
    );
  }
  if (status === 'error') {
    return (
      <span title={error || ''} className="text-[10px] font-bold px-2 py-1 rounded-full border bg-red-100 text-red-700 border-red-200">
        Gagal Simpan
      </span>
    );
  }
  return null;
}
