import { useState, useEffect, useMemo } from 'react';
import { Loader2, Trash2, SlidersHorizontal, Bookmark, MapPin, ChevronRight } from 'lucide-react';
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

const TABS = [
  { key: 'all',    label: 'All',    match: () => true },
  { key: 'live',   label: 'Live',   match: s => s === 'Active' || s === 'Running' },
  { key: 'draft',  label: 'Drafts', match: s => s === 'Draft' },
  { key: 'paused', label: 'Paused', match: s => s === 'Blocked' },
  { key: 'closed', label: 'Closed', match: s => s === 'Expired' || s === 'Failed' },
];

/**
 * Placeholder cell for columns with no backing data yet. Dashed + muted
 * so it reads clearly as "not real" rather than a broken value.
 * TODO: swap for real bindings once these fields exist on the job object
 * (job_code) or the relevant endpoint returns non-empty data
 * (cities, headcount, channels via job-posting; owner via recruiter).
 */
function TemplateTag({ label }) {
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-md border border-dashed text-[10px] text-muted-foreground/60 italic"
      title="Not yet wired to backend"
    >
      {label || '—'}
    </span>
  );
}

export default function JobCreation({
  jobs,
  loading,
  onDeleteJob,
  onSelectJob,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('all');
  const [page, setPage] = useState(1);

  const tabCounts = useMemo(() => {
    const counts = {};
    TABS.forEach(tab => {
      counts[tab.key] = jobs.filter(j => tab.match(j.status)).length;
    });
    return counts;
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    const tab = TABS.find(t => t.key === activeTab) ?? TABS[0];
    return jobs.filter(job => {
      const matchesTab = tab.match(job.status);
      const matchesSearch =
        !searchQuery ||
        job.job_title?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === 'all' || job.status === statusFilter;
      return matchesTab && matchesSearch && matchesStatus;
    });
  }, [jobs, searchQuery, statusFilter, activeTab]);

  const totalPages = Math.ceil(filteredJobs.length / PAGE_SIZE);
  const paginatedJobs = filteredJobs.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  useEffect(() => { setPage(1); }, [searchQuery, statusFilter, activeTab]);

  const handleDeleteClick = (e, job) => {
    e.stopPropagation();
    if (window.confirm(`Delete "${job.job_title}"? This cannot be undone.`)) {
      onDeleteJob(job.id);
    }
  };

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        {/* Status tab strip */}
        <div className="flex items-center gap-1 border-b overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors -mb-px flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === tab.key
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                activeTab === tab.key ? 'bg-emerald-100 text-emerald-800' : 'bg-muted text-muted-foreground'
              }`}>
                {tabCounts[tab.key]}
              </span>
            </button>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3 flex-wrap">
            <Input
              placeholder="Search by role or job code..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full sm:max-w-[280px] text-xs rounded-lg"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px] text-xs rounded-lg"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            {/* Stub buttons — not yet wired to real filter/view-saving logic */}
            <Button variant="outline" size="sm" className="rounded-lg text-xs" disabled>
              <SlidersHorizontal className="h-3.5 w-3.5 mr-1.5" /> Filters
            </Button>
            <Button variant="outline" size="sm" className="rounded-lg text-xs" disabled>
              <Bookmark className="h-3.5 w-3.5 mr-1.5" /> Saved views
            </Button>
          </div>
        </div>

        {/* Table block */}
        <div className="rounded-2xl border overflow-hidden bg-card shadow-sm">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center py-14">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : filteredJobs.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-14">
                {jobs.length === 0
                  ? 'No jobs created yet. Click "Create new job" to get started.'
                  : 'No jobs match your search.'}
              </p>
            ) : (
              /* table-fixed + percentage widths (same pattern as TalentPoolPage):
                 columns scale with the table's actual width instead of being
                 pinned to a px sum. Lowest-priority columns (Cities, Headcount,
                 Channels, Owner) also collapse away below lg/xl so the visible
                 columns stay readable instead of getting squeezed thin. */
              <Table className="table-fixed w-full">
                <TableHeader className="bg-muted/30">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[22%] text-[10px] font-bold uppercase tracking-wide text-muted-foreground pl-6 py-3">Role</TableHead>
                    <TableHead className="w-[9%] text-[10px] font-bold uppercase tracking-wide text-muted-foreground py-3">Status</TableHead>
                    <TableHead className="hidden lg:table-cell w-[14%] text-[10px] font-bold uppercase tracking-wide text-muted-foreground py-3">Cities</TableHead>
                    <TableHead className="w-[15%] text-[10px] font-bold uppercase tracking-wide text-muted-foreground py-3">Salary</TableHead>
                    <TableHead className="hidden xl:table-cell w-[9%] text-[10px] font-bold uppercase tracking-wide text-muted-foreground py-3">Headcount</TableHead>
                    <TableHead className="w-[15%] text-[10px] font-bold uppercase tracking-wide text-muted-foreground py-3">Applicants</TableHead>
                    <TableHead className="hidden xl:table-cell w-[10%] text-[10px] font-bold uppercase tracking-wide text-muted-foreground py-3">Channels</TableHead>
                    <TableHead className="hidden lg:table-cell w-[6%] text-[10px] font-bold uppercase tracking-wide text-muted-foreground py-3">Owner</TableHead>
                    <TableHead className="w-[12%] text-[10px] font-bold uppercase text-right pr-6 py-3" />
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
                        className="cursor-pointer hover:bg-muted/20 transition-colors border-b last:border-b-0"
                      >
                        {/* Role — title + job code (template) + real meta */}
                        <TableCell className="text-xs pl-6 py-3.5">
                          <div className="font-semibold truncate">{job.job_title}</div>
                          <div className="text-[11px] text-muted-foreground truncate mt-0.5 flex items-center gap-1.5 min-w-0">
                            <span className="shrink-0"><TemplateTag label="JOB-CODE" /></span>
                            <span className="truncate">
                              {job.work_type   ? job.work_type   : ''}
                              {job.work_option ? ` · ${job.work_option}` : ''}
                            </span>
                          </div>
                        </TableCell>

                        {/* Status badge */}
                        <TableCell className="py-3.5">
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

                        {/* Cities — TEMPLATE: real job_location shown as one pin tag, no multi-city data. Hidden below lg. */}
                        <TableCell className="hidden lg:table-cell py-3.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {job.job_location ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] text-muted-foreground">
                                <MapPin className="h-2.5 w-2.5" /> {job.job_location}
                              </span>
                            ) : (
                              <TemplateTag />
                            )}
                          </div>
                        </TableCell>

                        {/* Salary */}
                        <TableCell
                          className="text-xs font-mono truncate py-3.5"
                          title={formatSalaryBand(job)}
                        >
                          {formatSalaryBand(job)}
                        </TableCell>

                        {/* Headcount — TEMPLATE: no field exists. Hidden below xl. */}
                        <TableCell className="hidden xl:table-cell py-3.5">
                          <TemplateTag label="—/—" />
                        </TableCell>

                        {/* Applicants — real, candidate_count */}
                        <TableCell className="py-3.5 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap min-w-0">
                            <StatusBadge
                              label={`${activeCount} active`}
                              variant="muted"
                              className="font-mono shrink-0"
                            />
                            {since && (
                              <span className="text-[11px] text-muted-foreground truncate">
                                since {since}
                              </span>
                            )}
                          </div>
                        </TableCell>

                        {/* Channels — TEMPLATE: job-posting endpoint returns empty. Hidden below xl. */}
                        <TableCell className="hidden xl:table-cell py-3.5">
                          <TemplateTag />
                        </TableCell>

                        {/* Owner — TEMPLATE: no recruiter/owner field on job. Hidden below lg. */}
                        <TableCell className="hidden lg:table-cell py-3.5">
                          <span
                            className="flex items-center justify-center h-6 w-6 rounded-full border border-dashed text-[9px] text-muted-foreground/60 italic"
                            title="Not yet wired to backend"
                          >
                            —
                          </span>
                        </TableCell>

                        {/* Actions — single Open button (per mockup) + delete, stopPropagation so row click doesn't double-fire */}
                        <TableCell className="text-right pr-6 py-3.5" onClick={e => e.stopPropagation()}>
                          <div className="inline-flex items-center gap-1.5 flex-nowrap">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 rounded-lg text-xs px-2.5"
                              onClick={() => onSelectJob?.(job)}
                            >
                              Open <ChevronRight className="h-3 w-3 ml-1" />
                            </Button>
                            <Button
                              disabled={job.status === 'Active'}
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 rounded-lg text-red-500 hover:text-red-600"
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
            <div className="flex items-center gap-1 flex-wrap justify-center">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs rounded-lg"
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
                      className="h-7 w-7 text-xs p-0 rounded-lg"
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
                className="h-7 text-xs rounded-lg"
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