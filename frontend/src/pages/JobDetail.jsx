import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Loader2, AlertTriangle, ArrowLeft, Pencil, MapPin, Building2,
  Briefcase, FileText, Workflow, Megaphone, RefreshCw, CheckCircle2, Users, ChevronUp,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';

import { getJobById } from '@/api/job.api';
import { getByJobId as getJobChannels } from '@/api/job-sourcing.api';
import { extractSeekCandidates } from '@/api/job-posting-seek.api';
import { extractLinkedinApplicants } from '@/api/linkedin.api';
import { getCandidatesByJobId } from '@/api/candidate.api';
import { formatSalaryBand, formatSinceDate, getStatusPill } from '@/lib/job-display';

export default function JobDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [channels, setChannels] = useState([]);   // core_job_sourcing rows for this job
  const [candidates, setCandidates] = useState([]); // master_candidate rows for this job
  const [candidateSearch, setCandidateSearch] = useState('');
  const [candidatePage, setCandidatePage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [syncing, setSyncing] = useState(false);
  
  const CANDIDATES_PAGE_SIZE = 6;

  const fetchJob = useCallback(async () => {
    const res = await getJobById(id);
    setJob(res.data?.job);
  }, [id]);

  const fetchChannels = useCallback(async () => {
    try {
      const res = await getJobChannels(id);
      setChannels(res.data?.postings || []);
    } catch {
      setChannels([]); // no channels / not posted
    }
  }, [id]);

  const fetchCandidates = useCallback(async () => {
    try {
      const res = await getCandidatesByJobId(id);
      setCandidates(Array.isArray(res.data?.pipelines) ? res.data.pipelines : []);
    } catch {
      setCandidates([]);
    }
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        await fetchJob();
        if (!cancelled) await Promise.all([fetchChannels(), fetchCandidates()]);
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || err.message || 'Failed to load job');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [fetchJob, fetchChannels, fetchCandidates]);

  // Re-sync re-pulls applicants for each posted platform of this job (1 per platform).
  // Seek is QUEUED — the backend marks the channel sync_state='syncing' and a worker
  // flips it to idle/error; we poll the channels to reflect that. LinkedIn is still
  // synchronous (its queue is a later step). Each extract auto-promotes to candidates.
  const LINKEDIN_SYNC_LIMIT = 100; // LinkedIn scrape needs a cap; high ≈ "all current applicants"
  const syncableChannels = channels.filter((c) => c.account_id && (c.platform === 'seek' || c.platform === 'linkedin'));
  const anySyncing = channels.some((c) => c.sync_state === 'syncing');
  const wasSyncingRef = useRef(false);

  const handleResync = async () => {
    if (syncing || anySyncing || syncableChannels.length === 0) return;
    setSyncing(true);
    try {
      // Seek: enqueue (returns immediately; backend sets sync_state='syncing').
      for (const ch of syncableChannels.filter((c) => c.platform === 'seek')) {
        await extractSeekCandidates({ account_id: ch.account_id, job_sourcing_id: ch.id });
      }
      await fetchChannels(); // surface the "syncing" badge right away
      // LinkedIn: synchronous for now (no queue/status yet).
      for (const ch of syncableChannels.filter((c) => c.platform === 'linkedin')) {
        try {
          await extractLinkedinApplicants({ account_id: ch.account_id, job_sourcing_id: ch.id, limit: LINKEDIN_SYNC_LIMIT });
        } catch (err) {
          toast.error('LinkedIn sync failed', { description: err.response?.data?.message || err.message });
        }
      }
      await fetchJob();
      await fetchChannels();
    } catch (err) {
      toast.error('Could not start re-sync', { description: err.response?.data?.message || err.message || 'Try again.' });
    } finally {
      setSyncing(false);
    }
  };

  // Poll channels while any Seek channel is syncing; on completion refresh the job
  // (candidate_count) and toast once.
  useEffect(() => {
    if (anySyncing) {
      wasSyncingRef.current = true;
      const t = setTimeout(fetchChannels, 4000);
      return () => clearTimeout(t);
    }
    if (wasSyncingRef.current) {
      wasSyncingRef.current = false;
      fetchJob();
      fetchCandidates();
      if (channels.some((c) => c.sync_state === 'error')) {
        toast.error('Re-sync finished with errors', { description: 'One or more channels failed.' });
      } else {
        toast.success('Re-sync complete', { description: 'Latest applicants pulled and added as candidates.' });
      }
    }
  }, [anySyncing, channels, fetchChannels, fetchJob, fetchCandidates]);

  useEffect(() => { setCandidatePage(1); }, [candidateSearch]);

  // TEMP preview: dummy channels so the Posting card renders before real sync data
  // exists. Flip to false (or delete this block) once postings flow from sync.
  const SHOW_DUMMY_POSTING = true;
  const dummyChannels = SHOW_DUMMY_POSTING ? [
    { id: 'dummy-seek',     platform: 'seek',     job_title: job?.job_title, status: 'Active',  last_sync: new Date(Date.now() - 2 * 3600e3).toISOString() },
    { id: 'dummy-linkedin', platform: 'linkedin', job_title: job?.job_title, status: 'Running', last_sync: new Date(Date.now() - 26 * 3600e3).toISOString() },
  ] : [];
  // Real channels drive Re-sync; dummies are display-only when there are none.
  const displayChannels = channels.length ? channels : dummyChannels;
  const isPosted = displayChannels.length > 0;

  // Candidate table: filter (name/position) → paginate.
  const filteredCandidates = (() => {
    const q = candidateSearch.trim().toLowerCase();
    if (!q) return candidates;
    return candidates.filter((c) =>
      c.candidate_name?.toLowerCase().includes(q) ||
      c.last_position?.toLowerCase().includes(q)
    );
  })();
  const candidateTotalPages = Math.max(1, Math.ceil(filteredCandidates.length / CANDIDATES_PAGE_SIZE));
  const pagedCandidates = filteredCandidates.slice(
    (candidatePage - 1) * CANDIDATES_PAGE_SIZE,
    candidatePage * CANDIDATES_PAGE_SIZE
  );

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
    <>
      {/* Sticky header — lean, mirrors JobEdit's header. Posting + Re-sync live in the aside.
          -mt-5 -mx-5 px-5 cancels <main>'s p-5 so it pins flush under the breadcrumb. */}
      <div className="sticky top-[52px] z-10 bg-background/95 backdrop-blur-sm -mt-5 -mx-5 px-5 pt-5 pb-5 border-b border-border/60 space-y-3">
        {/* Action row */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
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

        {/* Title + meta */}
        <div>
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
      </div>

      <div className="px-6 pb-6 pt-4">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] gap-6">
          {/* MAIN COLUMN */}
          <div className="space-y-4 min-w-0">
            {/* Overview / summary stats — placeholder */}
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

            {/* JD */}
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

            {/* Candidates — searchable, paginated table (counts/funnel live in Candidate Pipeline) */}
            <Card className="py-4 gap-3">
              <CardHeader>
                <CardTitle className="text-sm flex items-center justify-between gap-3 flex-wrap">
                  <span className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" /> Candidates
                    <span className="text-[10px] font-normal text-muted-foreground">{candidates.length}</span>
                  </span>
                  <Input
                    placeholder="Search candidates..."
                    value={candidateSearch}
                    onChange={(e) => setCandidateSearch(e.target.value)}
                    className="max-w-[220px] h-8 text-xs font-normal"
                  />
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {candidates.length === 0 ? (
                  <p className="py-8 text-xs text-muted-foreground text-center italic">
                    No candidates yet.
                  </p>
                ) : filteredCandidates.length === 0 ? (
                  <p className="py-8 text-xs text-muted-foreground text-center italic">
                    No candidates match your search.
                  </p>
                ) : (
                  <>
                    <Table>
                      <TableHeader className="bg-muted/40">
                        <TableRow>
                          <TableHead className="text-[10px] font-bold uppercase pl-6">Candidate</TableHead>
                          <TableHead className="text-[10px] font-bold uppercase w-[180px]">Position</TableHead>
                          <TableHead className="text-[10px] font-bold uppercase w-[170px]">Stage</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pagedCandidates.map((c) => (
                          <TableRow key={c.id} className="hover:bg-muted/30">
                            <TableCell className="text-xs font-medium pl-6 truncate" title={c.candidate_name}>
                              {c.candidate_name}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground truncate" title={c.last_position || ''}>
                              {c.last_position || '—'}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-[10px]">
                                {c.latest_stage_name || 'Not started'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    {/* Pagination */}
                    <div className="flex items-center justify-between gap-2 px-6 py-3 border-t">
                      <span className="text-[10px] text-muted-foreground">
                        {(candidatePage - 1) * CANDIDATES_PAGE_SIZE + 1}–
                        {Math.min(candidatePage * CANDIDATES_PAGE_SIZE, filteredCandidates.length)} of {filteredCandidates.length}
                      </span>
                      <div className="flex items-center gap-1">
                        <Button variant="outline" size="sm" className="h-7 text-xs" disabled={candidatePage <= 1} onClick={() => setCandidatePage((p) => p - 1)}>
                          Previous
                        </Button>
                        <span className="text-[11px] text-muted-foreground px-1">
                          {candidatePage} / {candidateTotalPages}
                        </span>
                        <Button variant="outline" size="sm" className="h-7 text-xs" disabled={candidatePage >= candidateTotalPages} onClick={() => setCandidatePage((p) => p + 1)}>
                          Next
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ASIDE — sticky posting panel (mirrors JobEdit's aside).
              Offset accounts for the breadcrumb (52px) + the sticky page header. */}
          <aside className="hidden lg:block">
            <div className="sticky top-[207px] space-y-3">
              <Card className="py-4 gap-3">
                <CardHeader>
                  <CardTitle className="text-sm flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2">
                      <Megaphone className="h-4 w-4 text-primary" /> Posting
                    </span>
                    {isPosted && (
                      <span className="text-[10px] font-normal text-muted-foreground">
                        {displayChannels.length} channel{displayChannels.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Posted status + Re-sync */}
                  <div className="flex items-center justify-between gap-2">
                    {isPosted ? (
                      <span className="text-[11px] flex items-center gap-1.5 text-emerald-600">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Posted
                      </span>
                    ) : (
                      <span className="text-[11px] text-muted-foreground">Not posted</span>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs"
                      onClick={handleResync}
                      disabled={syncing || anySyncing || syncableChannels.length === 0}
                      title={syncableChannels.length === 0 ? 'No syncable postings' : 'Pull latest applicants from all posted platforms'}
                    >
                      {(syncing || anySyncing)
                        ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                        : <RefreshCw className="h-3.5 w-3.5 mr-1.5" />}
                      {(syncing || anySyncing) ? 'Syncing…' : 'Re-sync'}
                    </Button>
                  </div>

                  {/* Channel list */}
                  {displayChannels.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">
                      Not posted to any channel yet.
                    </p>
                  ) : (
                    <div className="space-y-2.5 pt-1 border-t">
                      {displayChannels.map((ch) => (
                        <div key={ch.id} className="space-y-1 pt-2.5 first:pt-1">
                          <div className="flex items-center justify-between gap-2">
                            <Badge variant="outline" className="text-[10px] uppercase tracking-wide capitalize">
                              {ch.platform}
                            </Badge>
                            <Badge variant="outline" className={`text-[10px] uppercase tracking-wide ${getStatusPill(ch.status)}`}>
                              {ch.status}
                            </Badge>
                          </div>
                          <p className="text-xs truncate" title={ch.job_title}>{ch.job_title}</p>
                          {ch.sync_state === 'syncing' ? (
                            <p className="text-[10px] text-primary flex items-center gap-1">
                              <Loader2 className="h-2.5 w-2.5 animate-spin" /> Syncing…
                            </p>
                          ) : ch.sync_state === 'error' ? (
                            <p className="text-[10px] text-red-500">Sync failed</p>
                          ) : (
                            <p className="text-[10px] text-muted-foreground">
                              {ch.last_sync ? `synced ${formatSinceDate(ch.last_sync)}` : 'never synced'}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Pipeline — links to this job's Candidate Pipeline */}
              <Card className="py-4 gap-3">
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Workflow className="h-4 w-4 text-primary" /> Pipeline
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    {(job.candidate_count ?? 0)} candidate{(job.candidate_count ?? 0) === 1 ? '' : 's'} in this job's pipeline.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full text-xs"
                    onClick={() => navigate(`/candidate-pipeline/${id}`)}
                  >
                    <Workflow className="h-3.5 w-3.5 mr-1.5" /> Open Candidate Pipeline
                  </Button>
                </CardContent>
              </Card>

              <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1 px-2"
              >
                <ChevronUp className="h-3 w-3" /> Back to top
              </button>
            </div>
          </aside>
        </div>
      </div>
    </>
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
