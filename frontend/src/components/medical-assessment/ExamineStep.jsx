import { useState } from 'react';
import { Circle, ShieldCheck } from 'lucide-react';
import { StepCard } from './shared';

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

function RevealValue({ label, value }) {
  const [revealed, setRevealed] = useState(false);
  return (
    <div className="flex items-center justify-between text-sm py-1">
      <span className="text-muted-foreground">{label}</span>
      {revealed ? (
        <span className="font-semibold text-foreground">{value}</span>
      ) : (
        <button
          type="button"
          onClick={() => setRevealed(true)}
          className="font-semibold text-blue-600 hover:underline"
        >
          Reveal
        </button>
      )}
    </div>
  );
}

function ExamCandidateCard({ candidate }) {
  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="font-semibold text-foreground">{candidate.name}</div>
          <div className="text-xs text-muted-foreground">{candidate.meta}</div>
        </div>
        <span className="inline-flex items-center gap-1.5 flex-shrink-0 rounded-md border border-amber-200 bg-amber-50 text-amber-700 px-2 py-1 text-xs font-semibold whitespace-nowrap">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> ! {candidate.status}
        </span>
      </div>
      <div className="space-y-0.5">
        {candidate.values.map((v) => <RevealValue key={v.label} label={v.label} value={v.value} />)}
      </div>
    </div>
  );
}

export function ExamineStep({ data, onNext }) {
  const { heading, subtitle, privacyNote, candidates, footerLeft } = data;

  return (
    <StepCard
      icon={Circle}
      title={heading}
      subtitle={subtitle}
      footerLeft={footerLeft}
      footerRight={
        <button type="button" onClick={onNext} className="font-semibold text-foreground hover:underline">
          Next: Review →
        </button>
      }
    >
      <PrivacyBanner note={privacyNote} />
      <div className="px-5 pb-5 grid grid-cols-1 lg:grid-cols-2 gap-4">
        {candidates.map((c) => <ExamCandidateCard key={c.name} candidate={c} />)}
      </div>
    </StepCard>
  );
}