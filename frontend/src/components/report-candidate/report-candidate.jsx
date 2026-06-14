import { useState, useEffect, useRef, useMemo } from 'react';
import {
  Plus, Loader2, Pencil, Trash2, Upload, Sparkles, X, Star, Check,
  Bold, Italic, Underline, List, ListOrdered, Link, Bot,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';

const PAGE_SIZE = 10;

export default function ReportCandidate({ candidates, loading, selectedCandidate, onSelectCandidate }) {
  // Search, filter & pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);

  const filteredCandidates = useMemo(() => {
    return candidates.filter(candidate => {
      const matchesSearch = !searchQuery || candidate.candidate_name?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [candidates, searchQuery]);

  const totalPages = Math.ceil(filteredCandidates.length / PAGE_SIZE);
  const paginatedCandidates = filteredCandidates.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [searchQuery]);

  return (
    <div className='space-y-5'>
      {/* Job List — outside any Card, rounded table block */}
      <div className="space-y-3">
        {/* Toolbar: search + status filter on the left, New Job on the right */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <Input
              placeholder="Search jobs..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="max-w-[250px] text-xs"
            />
          </div>
        </div>

        {/* Rounded table block — overflow-x-auto lets narrow viewports scroll
            instead of cramping the columns when one cell's content is long. */}
        <div className="rounded-xl border overflow-hidden bg-card">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : filteredCandidates.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-10">
                {candidates.length === 0 ? 'No jobs created yet. Click "New Job" to get started.' : 'No jobs match your search.'}
              </p>
            ) : (
              <Table className="min-w-[1180px] table-fixed">
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead className="text-[10px] font-bold uppercase w-[150px] pl-6">Candidate Name</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase w-[200px]">Job</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase w-[160px]">Position</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase w-[200px]">Address</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase w-[200px]">Email</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase w-[200px]">Latest Stage</TableHead>
                  </TableRow>
                </TableHeader>
              <TableBody>
                {paginatedCandidates.map(candidate => {
                  // Every job is now click-through (Draft → edit, others → detail).
                  // Selection-mode (when selectedJob prop is set) still works for the legacy
                  // wizard flow that called this component as a step in the old page.

                  const handleRowClick = () => {
                    // Parent owns navigation now — passes the whole job.
                    onSelectCandidate?.(candidate);
                  };

                  // Prevent row-level select from firing when clicking action icons.
                  const stop = (e) => e.stopPropagation();

                  return (
                    <TableRow
                      key={candidate.id}
                      onClick={handleRowClick}
                      className={'transition-colors cursor-pointer hover:bg-muted/30'}
                    >
                      <TableCell className="text-xs pl-6">
                        <div className="font-medium truncate">{candidate.candidate_name}</div>
                        
                      </TableCell>
                      <TableCell>
                        <div className="text-xs font-mono truncate">{candidate.job_title}</div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground truncate" title={candidate.last_position || ''}>
                        {candidate.last_position || ''}
                      </TableCell>
                      <TableCell className="text-xs font-mono truncate">
                        {candidate.address || ''}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-semibold`}>
                          {candidate.candidate_email}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs font-mono truncate">
                        {candidate.latest_stage_name || ''}
                      </TableCell>
                    </TableRow>
                  );
                })}
                </TableBody>
              </Table>
            )}
          </div>
        </div>

        {/* Pagination \u2014 sibling of the table block, outside the rounded border */}
        <div className="flex flex-col items-center gap-2 pt-1">
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" className="h-7 text-xs" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
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
            <Button variant="outline" size="sm" className="h-7 text-xs" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
              Next
            </Button>
          </div>
          <span className="text-[10px] text-muted-foreground">
            {filteredCandidates.length > 0
              ? `Showing ${(page - 1) * PAGE_SIZE + 1}\u2013${Math.min(page * PAGE_SIZE, filteredCandidates.length)} of ${filteredCandidates.length}`
              : 'No results'}
          </span>
        </div>
      </div>
    </div>
  )
}