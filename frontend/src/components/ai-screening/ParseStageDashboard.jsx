import { useState, useMemo } from 'react';
import {
  Upload, RefreshCw, Search, FileText, CheckCircle2, Clock, Sparkles,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatCard } from './shared';

/*
 * Job-level "Resume Parsing" dashboard — mirrors the Resume Parsing mockup.
 *
 * Data contract (all props come straight from AIScreeningPage's existing state,
 * no new API calls introduced here):
 *   pendingRows — rows still needing parse (AIScreeningPage's `parseRows`)
 *   parsedRows  — rows already parsed (AIScreeningPage's `matchRows + qaRows + cohortRows`)
 *   onOpen(row) — navigate to candidate detail (already wired in AIScreeningPage)
 *
 * 🚧 TODO(backend): everything under "Resume Parsing Engine" below is a UI mock.
 * There is currently no bulk-upload or bulk-parse endpoint — per-candidate parsing
 * only exists today via extractFacetsFromFile / extractFacetsFromText on the
 * candidate page (AIScreeningCandidate.jsx > ParsePanel). Wire these buttons up
 * once/if a job-level bulk parse endpoint exists.
 */
export default function ParseStageDashboard({ pendingRows = [], parsedRows = [], onOpen }) {
  const [search, setSearch] = useState('');

  const total = pendingRows.length + parsedRows.length;

  const filteredPending = useMemo(() => filterRows(pendingRows, search), [pendingRows, search]);
  const filteredParsed  = useMemo(() => filterRows(parsedRows, search), [parsedRows, search]);

  // 🚧 TODO(backend): "skipped/failed" parses aren't tracked anywhere yet.
  // Hardcoded to 0 so the stat card isn't lying — swap for real data once
  // the parse pipeline reports failures.
  const skippedCount = 0;

  return (
    <div className="space-y-4 p-4">
      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total candidates" value={total} />
        <StatCard label="Parsed" value={parsedRows.length} tone={parsedRows.length > 0 ? 'default' : 'muted'} />
        <StatCard label="Pending" value={pendingRows.length} tone={pendingRows.length > 0 ? 'default' : 'muted'} />
        <StatCard label="Skipped / failed" value={skippedCount} tone="danger" hint="🚧 not tracked yet" />
      </div>

      {/* Resume Parsing Engine — UI shell only, see file header note */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-primary" /> Resume Parsing Engine
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-2">
          {/* 🚧 TODO(backend): no bulk-upload endpoint yet */}
          <Button size="sm" variant="outline" className="text-xs" disabled title="TODO: wire to a bulk upload/parse endpoint">
            <Upload className="h-3.5 w-3.5 mr-1.5" /> Upload & Parse (bulk)
          </Button>
          {/* 🚧 TODO(backend): no retry-failed endpoint yet */}
          <Button size="sm" variant="outline" className="text-xs" disabled title="TODO: wire to a retry-failed-parses endpoint">
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Retry Failed
          </Button>
          <span className="text-[10px] text-muted-foreground italic ml-1">
            Individual candidates can already be parsed one at a time from their profile page.
          </span>
        </CardContent>
      </Card>

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
          icon={Clock}
          rows={filteredPending}
          onOpen={onOpen}
          emptyText="Nothing waiting on parse."
        />
        <StageList
          title="Parsed ✓"
          icon={CheckCircle2}
          rows={filteredParsed}
          onOpen={onOpen}
          tone="success"
          emptyText="No candidates parsed yet."
        />
      </div>

      {/*
        🚧 TODO(backend): "Extracted Data Fields" summary in the mockup aggregates
        skills/education/experience across all parsed candidates. The lane-candidate
        endpoint doesn't return `facets`, only name/last_position/address — so this
        card is a static placeholder until either:
          (a) getLaneCandidates starts including facets, or
          (b) a dedicated aggregate endpoint is added.
      */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">
            Extracted Data Fields <span className="normal-case font-normal">(🚧 placeholder — needs facets in API response)</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-muted-foreground">
          <div className="p-2 rounded-md border bg-muted/20">Personal info</div>
          <div className="p-2 rounded-md border bg-muted/20">Work experience</div>
          <div className="p-2 rounded-md border bg-muted/20">Education</div>
          <div className="p-2 rounded-md border bg-muted/20">Skills & languages</div>
        </CardContent>
      </Card>
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

function StageList({ title, icon: Icon, rows, onOpen, tone, emptyText }) {
  return (
    <Card>
      <CardHeader className={`pb-2 ${tone === 'success' ? 'bg-emerald-50/50' : ''}`}>
        <CardTitle className="text-xs flex items-center gap-2">
          <Icon className={`h-3.5 w-3.5 ${tone === 'success' ? 'text-emerald-600' : 'text-muted-foreground'}`} />
          {title}
          <Badge variant="secondary" className="text-[10px] font-mono">{rows.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {rows.length === 0 ? (
          <p className="py-8 text-center text-xs text-muted-foreground italic">{emptyText}</p>
        ) : (
          <Table className="w-full">
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="text-[10px] font-bold uppercase pl-4">Candidate</TableHead>
                <TableHead className="text-[10px] font-bold uppercase">Last position</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow
                  key={r.screening_id ?? r.applicant_id}
                  className="cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => onOpen(r)}
                >
                  <TableCell className="text-xs pl-4">
                    <div className="font-medium truncate">{r.applicant_name || `#${r.applicant_id}`}</div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground truncate">{r.last_position || '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}