import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { updateAssessmentReport } from '@/api/assessment-battery-result.api';
import ReportView from '@/components/assessment-b/report/ReportView';
import { unpackAssessorState, packAssessorState } from './assessor-state';

const SAVE_DEBOUNCE_MS = 600;

const SUBTEST_META = {
  GI:      { label: 'Tes Kemampuan Kognitif (GI)', color: '#0A6E5C' },
  KA:      { label: 'Kecepatan & Akurasi (KA)',    color: '#DB2777' },
  BigFive: { label: 'Kepribadian (Big Five)',      color: '#7C3AED' },
  DISC:    { label: 'Gaya Kerja (DISC)',           color: '#0369A1' },
  Holland: { label: 'Minat Kerja (Holland)',       color: '#059669' },
};

const BATTERY_A_SUBTESTS = ['GI', 'KA', 'BigFive', 'DISC', 'Holland'];

const BIGFIVE_LABELS = { E: 'Extraversion', A: 'Agreeableness', C: 'Conscientiousness', N: 'Neuroticism', O: 'Openness' };
const DISC_LABELS    = { D: 'Dominance', I: 'Influence', S: 'Steadiness', C: 'Conscientiousness' };
const HOLLAND_LABELS = { R: 'Realistic', I: 'Investigative', A: 'Artistic', S: 'Social', E: 'Enterprising', C: 'Conventional' };

function formatDate(iso) {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
}

const PILLARS = [
  { key: 'cognitive',     label: 'Cognitive' },
  { key: 'personality',   label: 'Personality' },
  { key: 'work_attitude', label: 'Work Attitude' },
  { key: 'overall',       label: 'Overall' },
];

function pillarBadge(score, threshold) {
  if (score == null) return { label: '—', cls: 'bg-slate-100 text-slate-500 border-slate-200' };
  if (score >= threshold)      return { label: 'Pass',   cls: 'bg-green-100 text-green-700 border-green-200' };
  if (score >= threshold - 15) return { label: 'Warn',   cls: 'bg-amber-100 text-amber-700 border-amber-200' };
  return { label: 'Failed', cls: 'bg-red-100 text-red-700 border-red-200' };
}

export function AssessmentDetailDialog({ open, onOpenChange, result }) {
  if (!result) return null;

  const isBatteryB = result.assessment_code === 'myralix_battery_b';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl max-h-[92vh] overflow-y-auto p-0">
        {isBatteryB
          ? <BatteryBView result={result} onClose={() => onOpenChange(false)} />
          : <BatteryAView result={result} />}
      </DialogContent>
    </Dialog>
  );
}

// ── Battery B ──────────────────────────────────────────────────────────

function BatteryBView({ result, onClose }) {
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

  const initialState = useMemo(() => unpackAssessorState(result), [result.id]);
  const [state, setState] = useState(initialState);
  const [saveStatus, setSaveStatus] = useState('idle'); // idle | saving | saved | error
  const [saveError, setSaveError] = useState(null);

  // Re-seed state when a different row is opened.
  useEffect(() => {
    setState(unpackAssessorState(result));
    setSaveStatus('idle');
    setSaveError(null);
  }, [result.id]);

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

  return (
    <>
      <DialogHeader className="px-6 pt-6 pb-3 border-b sticky top-0 bg-white z-10">
        <div className="flex items-start justify-between gap-3 pr-8">
          <div>
            <DialogTitle className="text-lg">{result.participant_name ?? '—'}</DialogTitle>
            <DialogDescription className="text-xs">
              {result.assessment_name ?? 'Battery B'} · {formatDate(result.assessment_date)}
            </DialogDescription>
          </div>
          <SaveStatusBadge status={saveStatus} error={saveError} />
        </div>
      </DialogHeader>
      <div className="px-2 py-2">
        <ReportView
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

// ── Battery A (legacy summary view, unchanged behavior) ────────────────

function BatteryAView({ result }) {
  const summary    = result.summary ?? {};
  const bySubtest  = result.results?.by_subtest ?? {};
  const isComplete = result.status === 'completed';
  const bigfiveSummary = summary.bigfive_avg
    ? Object.entries(summary.bigfive_avg).map(([k, v]) => `${k}:${v}`).join(' · ')
    : null;

  return (
    <div className="p-6 space-y-4">
      <DialogHeader>
        <div className="flex items-start justify-between gap-3 pr-8">
          <div>
            <DialogTitle className="text-lg">{result.participant_name ?? '—'}</DialogTitle>
            <DialogDescription className="text-xs">
              {result.assessment_name ?? '—'} · {formatDate(result.assessment_date)}
            </DialogDescription>
          </div>
          <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${
            isComplete
              ? 'bg-green-100 text-green-700 border-green-200'
              : 'bg-amber-100 text-amber-700 border-amber-200'
          }`}>
            {isComplete ? 'Selesai' : 'Berlangsung'}
          </span>
        </div>
      </DialogHeader>

      <section className="rounded-xl border p-4 bg-slate-50/40">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Data Peserta</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Field label="Nama"          value={result.participant_name} />
          <Field label="Email"         value={result.participant_email} />
          <Field label="Posisi"        value={result.participant_position} />
          <Field label="Departemen"    value={result.participant_department} />
          <Field label="Pendidikan"    value={result.participant_education} />
          <Field label="Tanggal Lahir" value={formatDate(result.participant_date_birth)} />
        </div>
      </section>

      <section>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Skor 3-Pilar</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {PILLARS.map((p) => {
            const score     = summary.pillars?.[p.key] ?? null;
            const threshold = summary.pillar_thresholds?.[p.key] ?? 70;
            const badge     = pillarBadge(score, threshold);
            const isOverall = p.key === 'overall';
            return (
              <div
                key={p.key}
                className={`rounded-lg border p-4 text-center ${isOverall ? 'bg-emerald-50/60 border-emerald-200' : 'bg-white'}`}
              >
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">{p.label}</p>
                <p className={`font-bold leading-none ${isOverall ? 'text-3xl text-emerald-800' : 'text-2xl text-slate-800'}`}>
                  {score ?? '—'}
                  <span className="text-xs text-muted-foreground font-medium">/100</span>
                </p>
                <span className={`inline-flex items-center mt-2 px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.cls}`}>
                  {badge.label}
                </span>
                <p className="text-[9px] text-muted-foreground mt-1">Min {threshold}</p>
              </div>
            );
          })}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
          <StatChip label="Komposit TK"    value={summary.tk_composite != null ? `${summary.tk_composite}/10` : null} color="#DB2777" />
          <StatChip label="DISC Dominant"  value={summary.disc_dominant} color="#0369A1" />
          <StatChip label="Holland Code"   value={summary.holland_code3} color="#059669" />
        </div>
        {bigfiveSummary && (
          <p className="text-xs text-muted-foreground mt-2">
            <span className="font-semibold text-slate-700">Big Five:</span> {bigfiveSummary}
          </p>
        )}
      </section>

      <section className="space-y-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Rincian per Sub-Tes</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {BATTERY_A_SUBTESTS.map((k) => (
            <div key={k}>{renderBatteryASubtest(k, bySubtest[k])}</div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className="text-sm">{value || '—'}</span>
    </div>
  );
}

function StatChip({ label, value, color = '#0A6E5C' }) {
  return (
    <div className="rounded-lg border p-3" style={{ borderColor: `${color}33`, background: `${color}0D` }}>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{label}</p>
      <p className="text-xl font-bold" style={{ color }}>{value ?? '—'}</p>
    </div>
  );
}

function Bar({ value, max, color }) {
  const pct = max ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return (
    <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

function CognitiveCard({ subtest, data }) {
  const meta = SUBTEST_META[subtest];
  if (!data) {
    return (
      <div className="rounded-lg border p-4 bg-slate-50/60">
        <p className="text-xs font-semibold mb-1" style={{ color: meta.color }}>{meta.label}</p>
        <p className="text-xs text-muted-foreground">Belum dikerjakan</p>
      </div>
    );
  }
  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold" style={{ color: meta.color }}>{meta.label}</p>
        <span className="text-xs font-bold" style={{ color: meta.color }}>{data.percent ?? 0}%</span>
      </div>
      <p className="text-xs text-muted-foreground mb-2">{data.points ?? 0} / {data.max ?? 0} poin</p>
      <Bar value={data.points ?? 0} max={data.max ?? 1} color={meta.color} />
    </div>
  );
}

function BigFiveCard({ data }) {
  const meta = SUBTEST_META.BigFive;
  if (!data) {
    return (
      <div className="rounded-lg border p-4 bg-slate-50/60">
        <p className="text-xs font-semibold mb-1" style={{ color: meta.color }}>{meta.label}</p>
        <p className="text-xs text-muted-foreground">Belum dikerjakan</p>
      </div>
    );
  }
  const avg = data.avg ?? {};
  return (
    <div className="rounded-lg border p-4">
      <p className="text-xs font-semibold mb-3" style={{ color: meta.color }}>{meta.label}</p>
      <div className="space-y-2">
        {Object.entries(BIGFIVE_LABELS).map(([k, label]) => (
          <div key={k}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-700">{label}</span>
              <span className="font-mono font-semibold" style={{ color: meta.color }}>
                {avg[k] != null ? avg[k].toFixed(2) : '—'}
              </span>
            </div>
            <Bar value={avg[k] ?? 0} max={5} color={meta.color} />
          </div>
        ))}
      </div>
    </div>
  );
}

function DiscCard({ data }) {
  const meta = SUBTEST_META.DISC;
  if (!data) {
    return (
      <div className="rounded-lg border p-4 bg-slate-50/60">
        <p className="text-xs font-semibold mb-1" style={{ color: meta.color }}>{meta.label}</p>
        <p className="text-xs text-muted-foreground">Belum dikerjakan</p>
      </div>
    );
  }
  const most  = data.most  ?? {};
  const least = data.least ?? {};
  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold" style={{ color: meta.color }}>{meta.label}</p>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${meta.color}1A`, color: meta.color }}>
          Dominant: {data.dominant ?? '—'}
        </span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {Object.entries(DISC_LABELS).map(([k, label]) => (
          <div key={k} className="text-center">
            <p className="text-[10px] uppercase text-muted-foreground">{label}</p>
            <p className="text-sm font-bold" style={{ color: meta.color }}>{most[k] ?? 0}</p>
            <p className="text-[10px] text-muted-foreground">L: {least[k] ?? 0}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function HollandCard({ data }) {
  const meta = SUBTEST_META.Holland;
  if (!data) {
    return (
      <div className="rounded-lg border p-4 bg-slate-50/60">
        <p className="text-xs font-semibold mb-1" style={{ color: meta.color }}>{meta.label}</p>
        <p className="text-xs text-muted-foreground">Belum dikerjakan</p>
      </div>
    );
  }
  const counts = data.counts ?? {};
  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold" style={{ color: meta.color }}>{meta.label}</p>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full font-mono" style={{ background: `${meta.color}1A`, color: meta.color }}>
          Kode: {data.code3 ?? '—'}
        </span>
      </div>
      <div className="grid grid-cols-6 gap-2">
        {Object.entries(HOLLAND_LABELS).map(([k, label]) => (
          <div key={k} className="text-center">
            <p className="text-[10px] uppercase text-muted-foreground">{k}</p>
            <p className="text-sm font-bold" style={{ color: meta.color }}>{counts[k] ?? 0}</p>
            <p className="text-[9px] text-muted-foreground leading-tight">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function renderBatteryASubtest(key, data) {
  if (key === 'GI' || key === 'KA') return <CognitiveCard subtest={key} data={data} />;
  if (key === 'BigFive') return <BigFiveCard data={data} />;
  if (key === 'DISC')    return <DiscCard data={data} />;
  if (key === 'Holland') return <HollandCard data={data} />;
  return null;
}
