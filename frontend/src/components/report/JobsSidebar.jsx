import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export default function JobsSidebar({ jobs, loading, selectedJobId, onSelectJob }) {
  return (
    <Card className="p-2 h-fit sticky top-4">
      <div className="px-2 py-1.5 flex items-center justify-between">
        <span className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">
          Positions
        </span>
        <span className="text-[10px] font-bold text-muted-foreground">· {jobs.length}</span>
      </div>

      {loading ? (
        <div className="px-2 py-4 text-center text-[11px] text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin inline mr-1" />Loading…
        </div>
      ) : jobs.length === 0 ? (
        <div className="px-2 py-4 text-center text-[11px] text-muted-foreground italic">
          No jobs found.
        </div>
      ) : (
        <ul className="space-y-0.5">
          {jobs.map((j) => (
            <JobRow
              key={j.job_id}
              label={j.job_title}
              count={j.total}
              active={selectedJobId === j.job_id}
              onClick={() => onSelectJob(j.job_id)}
            />
          ))}
        </ul>
      )}
    </Card>
  );
}

function JobRow({ label, count, active, onClick }) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className={[
          'w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-md text-left transition-colors',
          active
            ? 'bg-primary/10 text-primary'
            : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
        ].join(' ')}
      >
        <span className={`text-xs truncate ${active ? 'font-bold' : 'font-medium'}`}>{label}</span>
        <span className={`text-[10px] font-bold ${active ? 'text-primary' : 'text-muted-foreground'}`}>
          {count}
        </span>
      </button>
    </li>
  );
}
