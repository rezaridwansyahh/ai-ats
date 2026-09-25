import { X, Sparkles, Check, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

/**
 * Shared, battery-agnostic report UI primitives.
 * Used by assessment-a/b/c/d's ReportView.jsx and CandidateReportView.jsx.
 *
 * Why this file exists: these components were previously copy-pasted at the
 * bottom of every ReportView/CandidateReportView file (8 copies total across
 * 4 batteries x 2 view modes). A single "make section headers neutral"
 * change meant editing 8 files. Now it's this one.
 */

// ── Score chips (used in the top "Quick Score Chips" row) ──

export function ChipScore({ label, value, sub, verdict, badge }) {
  return (
    <div
      className="rounded-xl border-[1.5px] p-3.5 px-4 relative overflow-hidden"
      style={{ background: verdict.bg, borderColor: verdict.br, color: verdict.color }}
    >
      <div className="text-[10px] font-bold uppercase tracking-wider mb-1">{label}</div>
      <div className="font-serif text-2xl font-bold leading-none">
        {value}
        <span className="text-sm font-medium"> /10</span>
      </div>
      <div className="text-[10.5px] mt-1 opacity-75">{sub}</div>
      <div
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold mt-1"
        style={{ background: verdict.color + '20', color: verdict.color }}
      >
        {badge ? badge : `${verdict.emoji} ${verdict.label}`}
      </div>
    </div>
  );
}

export function ChipEmpty({ label }) {
  return (
    <div className="rounded-xl border-[1.5px] border-slate-200 bg-slate-50 p-3.5 px-4 text-slate-400">
      <div className="text-[10px] font-bold uppercase tracking-wider mb-1">{label}</div>
      <div className="font-serif text-base">—</div>
      <div className="text-[10.5px]">Data tidak lengkap</div>
    </div>
  );
}

export function Chip({ vd }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border"
      style={{ background: vd.bg, borderColor: vd.br, color: vd.color }}
    >
      {vd.emoji} {vd.label}
    </span>
  );
}

// ── Section shell (neutral version) ──
// `color`/`bg` props are intentionally accepted-but-ignored so existing call
// sites like <SectionCard num="I" ... color="#0A6E5C" bg="#EDF7F5"> keep
// working untouched during migration; the visual accent now lives entirely
// in NEUTRAL_SECTION_THEME below. Once every call site is confirmed neutral,
// feel free to drop the unused color/bg props from call sites.

export const NEUTRAL_SECTION_THEME = {
  header: 'bg-slate-50 border-slate-100',
  headerEmphasized: 'bg-slate-100 border-slate-200',
  badge: 'border-slate-300 text-slate-600',
  badgeEmphasized: 'bg-slate-700 border-slate-700 text-white',
  border: 'border-slate-200',
  borderEmphasized: 'border-slate-300',
};

export function SectionCard({ num, title, subtitle, emphasized, children }) {
  const t = NEUTRAL_SECTION_THEME;
  return (
    <div className={`bg-white rounded-xl shadow-sm overflow-hidden border ${emphasized ? t.borderEmphasized : t.border}`}>
      <div className={`flex items-center gap-3.5 px-4 py-3 border-b ${emphasized ? t.headerEmphasized : t.header}`}>
        <div
          className={`w-9 h-9 rounded-full grid place-items-center font-serif text-[15px] font-bold flex-shrink-0 border-2 ${
            emphasized ? t.badgeEmphasized : t.badge
          }`}
        >
          {num}
        </div>
        <div className="flex-1">
          <div className="font-serif text-lg font-semibold leading-tight text-slate-800">{title}</div>
          <div className="text-[11px] font-medium text-slate-500 mt-0.5">{subtitle}</div>
        </div>
      </div>
      <div className="px-5 pb-5 pt-4">{children}</div>
    </div>
  );
}

// ── Narrative textarea block (with AI generate button) ──
// `label` is passed in from each battery's own NARR_LABELS map, since the
// wording can differ per battery even though the shell is identical.

export function NarrativeBlock({ id, label, state, setNarr, onGenerate, generating, onCancel }) {
  return (
    <div className="mt-3.5">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800">{label}</span>
        {onGenerate && (
          generating ? (
            <Button size="sm" variant="ghost" onClick={onCancel} className="h-6 px-2 text-[10.5px] text-red-700 hover:text-red-900">
              <X className="h-3 w-3 mr-1" /> Hentikan
            </Button>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              onClick={onGenerate}
              className="h-6 px-2 text-[10.5px] text-teal-700 hover:text-teal-900 hover:bg-teal-50"
            >
              <Sparkles className="h-3 w-3 mr-1" /> Generate AI
            </Button>
          )
        )}
      </div>
      <Textarea
        value={state['edit_' + id] || ''}
        onChange={(e) => setNarr(id, e.target.value)}
        placeholder="Tuliskan interpretasi psikologis di sini..."
        className="min-h-[90px] bg-gradient-to-br from-emerald-50/50 to-teal-50/30 border-teal-200 focus-visible:ring-teal-500"
      />
    </div>
  );
}

// ── Recruiter verdict buttons ──
const RECRUITER_OPTS = [
  { val: 'sesuai', label: 'Sesuai', icon: Check, cls: 'bg-green-50 border-green-500 text-green-700' },
  { val: 'pertimbangkan', label: 'Perlu Dipertimbangkan', icon: AlertTriangle, cls: 'bg-amber-50 border-amber-500 text-amber-700' },
  { val: 'tidak', label: 'Tidak Sesuai', icon: X, cls: 'bg-red-50 border-red-500 text-red-700' },
];
 
export function RecruiterRating({ section, current, onSet }) {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-md px-4 py-3 mt-3">
      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">Penilaian Rekruter:</div>
      <div className="flex gap-2 flex-wrap">
        {RECRUITER_OPTS.map((o) => {
          const active = current === o.val;
          const Icon = o.icon;
          return (
            <button
              key={o.val}
              onClick={() => onSet(section, o.val)}
              className={[
                'inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-bold border-[1.5px] transition',
                active ? o.cls : 'bg-white border-slate-200 text-slate-600 hover:border-teal-400',
              ].join(' ')}
            >
              <Icon className="h-3.5 w-3.5" />
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
 