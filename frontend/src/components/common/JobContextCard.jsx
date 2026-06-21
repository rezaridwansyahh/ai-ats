import { Briefcase, FileText, GitBranch } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export function JobContextCard({ job, navigate }) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-4 flex-wrap py-4">
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Job</div>
            <span className="text-sm font-bold text-foreground mt-0.5">
              {job.id} · {job.title}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-6 text-xs">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Status</div>
            <div className="font-semibold">{job.status}</div>
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Hired</div>
            <div className="font-semibold">{job.hired}</div>
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Deadline</div>
            <div className="font-semibold">{job.deadline}</div>
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Days Open</div>
            <div className="font-semibold text-emerald-700">{job.daysOpen}d</div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={() => navigate('/sourcing/job-management')}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md border border-border hover:bg-muted/50 transition-colors"
          >
            <FileText className="h-3.5 w-3.5" /> Job page
          </button>
          <button
            type="button"
            onClick={() => navigate('/candidate-pipeline')}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md border border-border hover:bg-muted/50 transition-colors"
          >
            <GitBranch className="h-3.5 w-3.5" /> Pipeline
          </button>
        </div>
      </CardContent>
    </Card>
  );
}