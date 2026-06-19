import { useState, useEffect, useMemo } from 'react';
import { Plus, Loader2, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { getRoleClass, formatSalaryBand, formatSinceDate } from '@/lib/job-display';
import { StatusBadge } from '@/components/common';

const STATUS_OPTIONS = ['Draft', 'Active', 'Running', 'Expired', 'Failed', 'Blocked'];
const PAGE_SIZE = 10;

export default function JobCreation({
  jobs,
  loading,
  onDeleteJob,
  onSelectJob,
  onNewJob,
}) {
  // ── Search, filter & pagination ────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);

  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      const matchesSearch =
        !searchQuery ||
        job.job_title?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === 'all' || job.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [jobs, searchQuery, statusFilter]);

  const totalPages = Math.ceil(filteredJobs.length / PAGE_SIZE);
  const paginatedJobs = filteredJobs.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  // Reset to page 1 whenever filters change
  useEffect(() => { setPage(1); }, [searchQuery, statusFilter]);

  // ── Handlers ───────────────────────────────────────────────────
  const handleDeleteClick = (e, job) => {
    e.stopPropagation();
    if (window.confirm(`Delete "${job.job_title}"? This cannot be undone.`)) {
      onDeleteJob(job.id);
    }
  };

  const handleEditClick = (e, job) => {
    e.stopPropagation();
    onSelectJob?.(job);
  };

  // ── Render ─────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* Job List — outside any Card, rounded table block */}
      <div className="space-y-3">
        {/* Toolbar: search + status filter on the left, New Job on the right */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <Input
              placeholder="Search candidates..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="max-w-[250px] text-xs"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px] text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button size="sm" onClick={() => onNewJob?.()}>
            <Plus className="h-4 w-4 mr-1.5" /> New Job
          </Button>
        </div>

        {/* Table block */}
        <div className="rounded-xl border overflow-hidden bg-card">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : filteredJobs.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-10">
                {jobs.length === 0
                  ? 'No jobs created yet. Click "New Job" to get started.'
                  : 'No jobs match your search.'}
              </p>
            ) : (
              <Table className="min-w-[1180px] table-fixed">
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead className="text-[10px] font-bold uppercase w-[280px] pl-6">Job</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase w-[130px]">Level</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase w-[160px]">Location</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase w-[200px]">Salary</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase w-[110px]">Status</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase w-[200px]">Activity</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase text-right w-[100px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedJobs.map(job => {
                    const role = getRoleClass(job);
                    const since = formatSinceDate(job.sla_start_date || job.created_at);
                    const activeCount = job.candidate_count ?? 0;

                    return (
                      <TableRow
                        key={job.id}
                        onClick={() => onSelectJob?.(job)}
                        className="cursor-pointer hover:bg-muted/30 transition-colors"
                      >
                        {/* Job title + meta */}
                        <TableCell className="text-xs pl-6">
                          <div className="font-medium truncate">{job.job_title}</div>
                          <div className="text-[11px] text-muted-foreground truncate">
                            {job.company || '—'}
                            {job.work_type   ? ` · ${job.work_type}`   : ''}
                            {job.work_option ? ` · ${job.work_option}` : ''}
                          </div>
                        </TableCell>

                        {/* Seniority pill */}
                        <TableCell>
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-semibold ${role.pill}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${role.dot}`} />
                            {role.label}
                          </span>
                        </TableCell>

                        {/* Location */}
                        <TableCell
                          className="text-xs text-muted-foreground truncate"
                          title={job.job_location || ''}
                        >
                          {job.job_location || '—'}
                        </TableCell>

                        {/* Salary */}
                        <TableCell
                          className="text-xs font-mono truncate"
                          title={formatSalaryBand(job)}
                        >
                          {formatSalaryBand(job)}
                        </TableCell>

                        {/* Status badge */}
                        <TableCell>
                          <StatusBadge
                            label={job.status}
                            variant={
                              job.status === 'Active'  ? 'success' :
                              job.status === 'Draft'   ? 'muted'   :
                              job.status === 'Expired' ? 'danger'  :
                              job.status === 'Blocked' ? 'danger'  : 'muted'
                            }
                            dot
                          />
                        </TableCell>

                        {/* Activity */}
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <StatusBadge
                              label={`${activeCount} active`}
                              variant="muted"
                              className="font-mono"
                            />
                            {since && (
                              <span className="text-[11px] text-muted-foreground">
                                since {since}
                              </span>
                            )}
                          </div>
                        </TableCell>

                        {/* Actions — stopPropagation so row click doesn't fire */}
                        <TableCell className="text-right" onClick={e => e.stopPropagation()}>
                          <div className="inline-flex items-center gap-1">
                            <Button
                              disabled={job.status === 'Active'}
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={e => handleEditClick(e, job)}
                              title="Edit"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              disabled={job.status === 'Active'}
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-red-500 hover:text-red-600"
                              onClick={e => handleDeleteClick(e, job)}
                              title="Delete"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
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
        {totalPages > 1 && (
          <div className="flex flex-col items-center gap-2 pt-1">
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
              >
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
                    <span key={`dots-${idx}`} className="text-xs text-muted-foreground px-1">
                      ...
                    </span>
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
                  ),
                );
              })()}

              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                Next
              </Button>
            </div>

            <span className="text-[10px] text-muted-foreground">
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filteredJobs.length)} of {filteredJobs.length}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}