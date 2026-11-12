import { Briefcase } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatSalaryBand, formatSinceDate } from '@/lib/job-display';

function StatTile({ label, value, mono }) {
  return (
    <div className="rounded-lg border bg-card px-3 py-2">
      <div className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`mt-0.5 text-sm font-semibold ${mono ? 'font-mono' : ''}`}>{value}</div>
    </div>
  );
}

export default function OverviewCard({ job }) {
  return (
    <Card className="py-4 gap-3">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Briefcase className="h-4 w-4 text-primary" /> Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatTile label="Candidates" value={job.candidate_count ?? '—'} />
          <StatTile label="Salary band" value={formatSalaryBand(job)} mono />
          <StatTile label="SLA start" value={formatSinceDate(job.sla_start_date) || '—'} mono />
          <StatTile label="SLA end" value={formatSinceDate(job.sla_end_date) || '—'} mono />
        </div>
      </CardContent>
    </Card>
  );
}
