import { FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

function SkillRow({ label, skills, tone }) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">{label}</div>
      <div className="flex flex-wrap gap-1">
        {skills.length === 0 ? (
          <span className="text-[11px] text-muted-foreground italic">—</span>
        ) : (
          skills.map((s) => (
            <Badge
              key={s}
              variant="secondary"
              className={`text-[10px] ${tone === 'primary' ? 'bg-primary/10 text-primary' : ''}`}
            >
              {s}
            </Badge>
          ))
        )}
      </div>
    </div>
  );
}

export default function JobDescriptionCard({ job }) {
  const required  = Array.isArray(job.required_skills)  ? job.required_skills  : [];
  const preferred = Array.isArray(job.preferred_skills) ? job.preferred_skills : [];

  return (
    <Card className="py-4 gap-3">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" /> Job description
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {job.job_desc ? (
          <div className="whitespace-pre-wrap leading-relaxed">{job.job_desc}</div>
        ) : (
          <p className="text-xs text-muted-foreground italic">No description set.</p>
        )}
        {job.qualifications && (
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">
              Responsibilities & qualifications
            </div>
            <div className="whitespace-pre-wrap text-xs leading-relaxed">{job.qualifications}</div>
          </div>
        )}
        {(required.length > 0 || preferred.length > 0) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t">
            <SkillRow label="Required" skills={required} tone="primary" />
            <SkillRow label="Preferred" skills={preferred} tone="muted" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
