import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Loader2, AlertTriangle, ArrowLeft, Pencil, MapPin, Building2,
  Briefcase, FileText, Workflow, Megaphone, Sparkles,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import { getJobById } from '@/api/job.api';
import { formatSalaryBand, formatSinceDate, getStatusPill } from '@/lib/job-display';

export default function JobDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getJobById(id);
        if (!cancelled) setJob(res.data?.job);
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || err.message || 'Failed to load job');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg border border-red-200 bg-red-50 text-sm text-red-600">
          <AlertTriangle className="h-4 w-4" />
          {error || 'Job not found'}
        </div>
      </div>
    );
  }

  const required  = Array.isArray(job.required_skills)  ? job.required_skills  : [];
  const preferred = Array.isArray(job.preferred_skills) ? job.preferred_skills : [];

  return (
    <div className="p-6 max-w-[1100px]">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-2 flex-wrap mb-4">
        <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate('/sourcing/job-management')}>
          <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back to Jobs
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="text-xs"
          onClick={() => navigate(`/sourcing/job-management/${id}/edit`)}
        >
          <Pencil className="h-3.5 w-3.5 mr-1.5" /> Edit
        </Button>
      </div>

      {/* Header */}
      <div className="mb-5">
        <div className="flex items-center gap-3 mb-1.5 flex-wrap">
          <h1 className="text-2xl font-bold tracking-tight">{job.job_title}</h1>
          <Badge variant="outline" className={`text-[10px] uppercase tracking-wide ${getStatusPill(job.status)}`}>
            {job.status}
          </Badge>
        </div>
        <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1">
          {job.company && <span className="flex items-center gap-1"><Building2 className="h-3 w-3" /> {job.company}</span>}
          {job.job_location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {job.job_location}</span>}
          {job.work_type && <span>{job.work_type}</span>}
          {job.work_option && <span>· {job.work_option}</span>}
          {job.seniority_level && <span>· {job.seniority_level}</span>}
          {job.created_at && <span>· opened {formatSinceDate(job.created_at)}</span>}
        </div>
      </div>

      <div className="space-y-4">
        {/* Overview / summary stats — placeholder */}
        <Card>
          <CardHeader className="pb-3">
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

        {/* JD */}
        <Card>
          <CardHeader className="pb-3">
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

        {/* Pipeline placeholder — Phase 2 will hydrate with stats */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Workflow className="h-4 w-4 text-primary" /> Pipeline
            </CardTitle>
          </CardHeader>
          <CardContent className="py-6 text-xs text-muted-foreground text-center italic">
            Per-stage candidate breakdown and time-to-fill stats land in Phase 2.
            Use <span className="font-semibold not-italic">Selection → AI Screening</span> for now.
          </CardContent>
        </Card>

        {/* Posting placeholder */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-primary" /> Posting
            </CardTitle>
          </CardHeader>
          <CardContent className="py-6 text-xs text-muted-foreground text-center italic">
            Channel-level publish status will land here in Phase 2.
          </CardContent>
        </Card>

        {/* Rubric flag if present */}
        {job.rubric && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" /> AI Matching rubric
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Rubric is configured. Open this job in <span className="font-semibold">AI Screening</span> to view weights and rerun matching.
              </p>
              <Button
                size="sm"
                variant="outline"
                className="text-xs mt-2"
                onClick={() => navigate(`/selection/ai-screening/job/${id}`)}
              >
                Open in AI Screening
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function StatTile({ label, value, mono }) {
  return (
    <div className="rounded-lg border bg-card px-3 py-2">
      <div className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`mt-0.5 text-sm font-semibold ${mono ? 'font-mono' : ''}`}>{value}</div>
    </div>
  );
}

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
