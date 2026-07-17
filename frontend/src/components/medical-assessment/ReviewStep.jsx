import { useState } from 'react';
import { FileText, ShieldCheck } from 'lucide-react';
import { StepCard, StatusPill } from './shared';

const VERDICT_TONE = {
  fit:          { pill: 'border-emerald-200 bg-emerald-50 text-emerald-700', dot: 'bg-emerald-600', label: '✓ Fit' },
  fitWithNote:  { pill: 'border-amber-200  bg-amber-50  text-amber-700',    dot: 'bg-amber-500',   label: '! Fit w/ note' },
  unfit:        { pill: 'border-rose-200   bg-rose-50   text-rose-700',    dot: 'bg-rose-600',    label: '✕ Unfit' },
};

function PrivacyBanner({ note }) {
  return (
    <div className="mx-5 mb-4 flex items-center justify-between gap-4 rounded-lg bg-foreground text-background px-4 py-3">
      <div className="flex items-start gap-2.5 text-sm">
        <ShieldCheck className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <span className="font-bold text-amber-400">MD-02 · Privacy mode</span> — {note}
        </p>
      </div>
      <button type="button" className="flex-shrink-0 text-xs font-semibold border border-background/30 rounded-md px-3 py-1.5 hover:bg-background/10">
        Audit log
      </button>
    </div>
  );
}

function RevealFindings({ findings }) {
  const [revealed, setRevealed] = useState(false);
  if (revealed) {
    return <span className="text-foreground">{findings}</span>;
  }
  return (
    <button type="button" onClick={() => setRevealed(true)} className="font-semibold text-blue-600 hover:underline">
      Reveal
    </button>
  );
}

export function ReviewStep({ data, onNext }) {
  const { heading, subtitle, privacyNote, rows, footerLeft } = data;

  return (
    <StepCard
      icon={FileText}
      title={heading}
      subtitle={subtitle}
      footerLeft={footerLeft}
      footerRight={
        <button type="button" onClick={onNext} className="font-semibold text-foreground hover:underline">
          Next: Decide →
        </button>
      }
    >
      <PrivacyBanner note={privacyNote} />
      <table className="w-full text-sm">
        <thead className="bg-muted/30 border-b">
          <tr className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
            <th className="px-5 py-2.5 text-left">Candidate</th>
            <th className="px-5 py-2.5 text-left">Findings (Dr. only)</th>
            <th className="px-5 py-2.5 text-left">Reviewer</th>
            <th className="px-5 py-2.5 text-left">Verdict</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.candidate} className="border-b last:border-b-0">
              <td className="px-5 py-3.5 font-semibold text-foreground whitespace-nowrap">{r.candidate}</td>
              <td className="px-5 py-3.5 max-w-xs"><RevealFindings findings={r.findings} /></td>
              <td className="px-5 py-3.5 text-muted-foreground whitespace-nowrap">{r.reviewer}</td>
              <td className="px-5 py-3.5"><StatusPill status={r.verdict} toneMap={VERDICT_TONE} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </StepCard>
  );
}