import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';

import { getJobs } from '@/api/job.api';
import {
  getRoleClass, formatSalaryBand, formatSinceDate, getStatusPill,
} from '@/lib/job-display';

const PAGE_SIZE = 5;

// Job list for Candidate Pipeline. Mirrors the Job Management table; clicking a
// row navigates straight to that job's pipeline detail (no select-then-next step).
export default function CandidatePipeline() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setJobsLoading(true);
      try {
        const res = await getJobs();
        const list = res.data?.jobs || res.data || [];
        if (!cancelled) setJobs(Array.isArray(list) ? list : []);
      } catch {
        if (!cancelled) setJobs([]);
      } finally {
        if (!cancelled) setJobsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Candidate Pipeline only operates on Active jobs — drafts/finished jobs have no
  // running pipeline to drill into.
  const filteredJobs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return jobs.filter((job) => {
      if (job.status !== 'Active') return false;
      return !q || job.job_title?.toLowerCase().includes(q);
    });
  }, [jobs, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredJobs.length / PAGE_SIZE));
  const paginatedJobs = filteredJobs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [searchQuery]);

  return (
    <div className="space-y-3">
      {/* Title + search */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-sm font-bold">Select a job</h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Only Active jobs are shown. Click a row to open its pipeline.
          </p>
        </div>
        <Input
          placeholder="Search jobs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-[250px] text-xs"
          disabled={jobsLoading}
        />
      </div>

      {/* Rounded table block */}
      <div className="rounded-xl border overflow-hidden bg-card">
        <div className="overflow-x-auto">
          {jobsLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : filteredJobs.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-10">
              {jobs.some((j) => j.status === 'Active')
                ? 'No active jobs match your search.'
                : 'No active jobs available.'}
            </p>
          ) : (
            <Table className="min-w-[1080px] table-fixed">
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="text-[10px] font-bold uppercase w-[280px] pl-6">Job</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase w-[130px]">Level</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase w-[160px]">Location</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase w-[200px]">Salary</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase w-[110px]">Status</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase w-[200px]">Activity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedJobs.map((job) => {
                  const role = getRoleClass(job);
                  const since = formatSinceDate(job.sla_start_date || job.created_at);
                  const activeCount = job.candidate_count ?? 0;
                  const statusPill = getStatusPill(job.status);

                  return (
                    <TableRow
                      key={job.id}
                      onClick={() => navigate(`/candidate-pipeline/${job.id}`)}
                      className="transition-colors cursor-pointer hover:bg-muted/30"
                    >
                      <TableCell className="text-xs pl-6">
                        <div className="font-medium truncate">{job.job_title}</div>
                        <div className="text-[11px] text-muted-foreground truncate">
                          {(job.company || '—')}
                          {job.work_type ? ` · ${job.work_type}` : ''}
                          {job.work_option ? ` · ${job.work_option}` : ''}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-semibold ${role.pill}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${role.dot}`} />
                          {role.label}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground truncate" title={job.job_location || ''}>
                        {job.job_location || '—'}
                      </TableCell>
                      <TableCell className="text-xs font-mono truncate" title={formatSalaryBand(job)}>
                        {formatSalaryBand(job)}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-semibold ${statusPill}`}>
                          {job.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full border bg-card text-[10px] font-mono font-semibold">
                            {activeCount} active
                          </span>
                          {since && (
                            <span className="text-[11px] text-muted-foreground">since {since}</span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      {/* Pagination */}
      {filteredJobs.length > 0 && (
        <div className="flex flex-col items-center gap-2 pt-1">
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" className="h-7 text-xs" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            {(() => {
              const pages = [];
              pages.push(1);
              if (page > 3) pages.push('...');
              for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
                pages.push(i);
              }
              if (page < totalPages - 2) pages.push('...');
              if (totalPages > 1) pages.push(totalPages);
              return pages.map((p, idx) =>
                p === '...' ? (
                  <span key={`dots-${idx}`} className="text-xs text-muted-foreground px-1">...</span>
                ) : (
                  <Button
                    key={p}
                    variant={page === p ? 'default' : 'outline'}
                    size="sm"
                    className="h-7 w-7 text-xs p-0"
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </Button>
                )
              );
            })()}
            <Button variant="outline" size="sm" className="h-7 text-xs" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
          <span className="text-[10px] text-muted-foreground">
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filteredJobs.length)} of {filteredJobs.length}
          </span>
        </div>
      )}
    </div>
  );
}
