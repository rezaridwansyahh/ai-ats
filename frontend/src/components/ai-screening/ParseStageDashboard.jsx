import { useState, useMemo, useEffect } from 'react';import { Search, FileText, CheckCircle2, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TablePagination } from '@/components/shared/TablePagination';
import { StatCard } from './shared';

const PAGE_SIZE = 10;

/*
 * Job-level "Resume Parsing" dashboard.
 *
 * Simplified pass — removed everything that had no real backend behind it:
 * - "Skipped / failed" stat card (was hardcoded to 0, never changes)
 * - "Resume Parsing Engine" panel (Upload & Parse bulk / Retry Failed —
 * no working bulk-parse pipeline exists; screening.service.js's
 * parseBulk() always errors with "not implemented" per candidate,
 * even though the route itself exists)
 * - "Extracted Data Fields" placeholder card (getLaneCandidates doesn't
 * return facets, so this was just 4 empty labeled boxes)
 *
 * Individual candidates can still be parsed one at a time from their
 * profile page (ParsePanel in AIScreeningCandidatePage.jsx) — that flow
 * is real and unaffected by this cleanup.
 *
 * Data contract (unchanged):
 * pendingRows — rows still needing parse (AIScreeningPage's `parseRows`)
 * parsedRows  — rows already parsed (AIScreeningPage's `matchRows + qaRows + cohortRows`)
 * onOpen(row) — navigate to candidate detail
 */
export default function ParseStageDashboard({ pendingRows = [], parsedRows = [], onOpen }) {
  const [search, setSearch] = useState('');
  const [pendingPage, setPendingPage] = useState(1);
  const [parsedPage, setParsedPage] = useState(1);

  const total = pendingRows.length + parsedRows.length;

  const filteredPending = useMemo(() => filterRows(pendingRows, search), [pendingRows, search]);
  const filteredParsed  = useMemo(() => filterRows(parsedRows, search), [parsedRows, search]);

  // Reset to page 1 whenever search narrows/widens teh list
  useEffect(() => { setPendingPage(1); setParsedPage(1); }, [search]);

  const pendingTotalPages = Math.max(1, Math.ceil(filteredPending.length / PAGE_SIZE));
  const parsedTotalPages = Math.max(1, Math.ceil(filteredPending.length / PAGE_SIZE));
  const pendingPageClamped = Math.min(pendingPage, pendingTotalPages);
  const parsedPageClamped = Math.min(parsedPage, parsedTotalPages);

  const pagedPending = filteredPending.slice((pendingPageClamped - 1) * PAGE_SIZE , pendingPageClamped * PAGE_SIZE);
  const pagedParsed = filteredParsed.slice((pendingPageClamped - 1) * PAGE_SIZE , parsedPageClamped * PAGE_SIZE);
  

  return (
    <div className="space-y-4 p-4">
      {/* Stats row — only real, changeable numbers */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard label="Total candidates" value={total} />
        <StatCard label="Parsed" value={parsedRows.length} tone={parsedRows.length > 0 ? 'default' : 'muted'} />
        <StatCard label="Pending" value={pendingRows.length} tone={pendingRows.length > 0 ? 'default' : 'muted'} />
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="Search name or last position…"
          className="pl-8 h-8 text-xs"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Two-column pending / parsed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <StageList
          title="Pending parse"
          listId="pending"
          icon={Clock}
          rows={pagedPending}
          totalRows={filteredPending.length}
          onOpen={onOpen}
          emptyText="Nothing waiting on parse."
          page={pendingPageClamped}
          totalPages={pendingTotalPages}
          setPage={setPendingPage}
        />
        <StageList
          title="Parsed ✓"
          listId="parsed"
          icon={CheckCircle2}
          rows={pagedParsed}
          totalRows={filteredParsed.length}
          onOpen={onOpen}
          tone="success"
          emptyText="No candidates parsed yet."
          page={parsedPageClamped}
          totalPages={parsedTotalPages}
          setPage={setParsedPage}
        />
      </div>

      {/* Pointer to the real, working per-candidate parse flow */}
      <p className="text-[11px] text-muted-foreground text-center italic">
        To parse a candidate's CV, open their profile and use Parse there.
      </p>
    </div>
  );
}

function filterRows(rows, search) {
  const q = search.trim().toLowerCase();
  if (!q) return rows;
  return rows.filter(
    (r) =>
      (r.applicant_name || '').toLowerCase().includes(q) ||
      (r.last_position || '').toLowerCase().includes(q)
  );
}

function StageList({ title, listId, icon: Icon, rows, totalRows, onOpen, tone, emptyText, page, totalPages, setPage }) {
  return (
    <Card>
      <CardHeader className={`pb-2 ${tone === 'success' ? 'bg-emerald-50/50' : ''}`}>
        <CardTitle className="text-xs flex items-center gap-2">
          <Icon className={`h-3.5 w-3.5 ${tone === 'success' ? 'text-emerald-600' : 'text-muted-foreground'}`} />
          {title}
          <Badge variant="secondary" className="text-[10px] font-mono">{totalRows}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {rows.length === 0 ? (
          <p className="py-8 text-center text-xs text-muted-foreground italic">{emptyText}</p>
        ) : (
          <Table className="table-fixed w-full">
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="w-[45%] text-[10px] font-bold uppercase pl-4">Candidate</TableHead>
                <TableHead className="w-[55%] text-[10px] font-bold uppercase">Last position</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r, index) => {
                // Combine list context, data ID, and array index for absolute uniqueness
                const rowId = r.screening_id ?? r.applicant_id ?? 'unknown';
                const uniqueKey = `${listId}-${rowId}-${index}`;

                return (
                  <TableRow
                    key={uniqueKey}
                    className="cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => onOpen(r)}
                  >
                    <TableCell className="text-xs pl-4 overflow-hidden">
                      <div className="font-medium truncate" title={r.applicant_name || `#${r.applicant_id}`}>
                        {r.applicant_name || `#${r.applicant_id}`}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground truncate overflow-hidden" title={r.last_position || '—'}>
                      {r.last_position || '—'}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
        {totalPages > 1 && (
          <div className="p-3 border-t">
            <TablePagination 
              page={page}
              totalPages={totalPages}
              totalItems={totalRows}
              pageSize={PAGE_SIZE}
              setPage={setPage}
              setPageSize={() => {}}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}