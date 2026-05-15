import { getInitials } from '@/lib/batteries';

export default function CandidateRow({ candidate, onClick }) {
  const name = candidate.candidate_name || candidate.name || '—';
  const role = candidate.last_position  || '—';

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border bg-card hover:bg-muted/40 hover:border-primary/30 transition-colors text-left"
    >
      <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
        {getInitials(name)}
      </div>
      <div className="min-w-0">
        <div className="text-sm font-bold truncate">{name}</div>
        <div className="text-[11px] text-muted-foreground truncate">{role}</div>
      </div>
    </button>
  );
}
