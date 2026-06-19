import { useState, useEffect, useRef, useMemo } from 'react';
import {
  Loader2, AlertTriangle, CheckCircle, Search, Clock, RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { getSourcing } from '@/api/sourcing.api';

const POLL_INTERVAL_MS = 3000;

const STATUS_COLORS = {
  Pending:    'bg-gray-50 text-gray-600 border-gray-200',
  Processing: 'bg-blue-50 text-blue-600 border-blue-200',
  Done:       'bg-emerald-50 text-emerald-600 border-emerald-200',
  Failed:     'bg-red-50 text-red-600 border-red-200',
};

export default function SearchResults({ sourcingId, onRetry }) {
  const [sourcing, setSourcing]       = useState(null);
  const [recruits, setRecruits]       = useState([]);  // fixed: was 'recruites'
  const [error, setError]             = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const pollRef                       = useRef(null);

  // ── Polling ────────────────────────────────────────────────────
  useEffect(() => {
    if (!sourcingId) return;
    let stopped = false;

    const poll = async () => {
      try {
        const { data } = await getSourcing(sourcingId);
        if (stopped) return;
        setSourcing(data.sourcing);
        setRecruits(data.recruites || []); // API key kept as-is until backend fixes typo
        if (data.sourcing?.status === 'Done' || data.sourcing?.status === 'Failed') {
          clearInterval(pollRef.current);
          pollRef.current = null;
        }
      } catch (err) {
        if (stopped) return;
        setError(err.response?.data?.message || err.message || 'Failed to fetch results');
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };

    poll();
    pollRef.current = setInterval(poll, POLL_INTERVAL_MS);

    return () => {
      stopped = true;
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [sourcingId]);

  const status    = sourcing?.status;
  const isRunning = status === 'Pending' || status === 'Processing';
  const isDone    = status === 'Done';
  const isFailed  = status === 'Failed';

  // ── Client-side filter ─────────────────────────────────────────
  const filteredRecruits = useMemo(() => {
    if (!searchQuery.trim()) return recruits;
    const q = searchQuery.toLowerCase();
    return recruits.filter(r =>
      r.name?.toLowerCase().includes(q) ||
      r.skill?.toLowerCase().includes(q) ||
      r.job_title?.toLowerCase().includes(q)
    );
  }, [recruits, searchQuery]);

  return (
    <div className="space-y-4">

      {/* ── Status banner ── */}
      <Card>
        <CardContent className="py-4 px-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                {isRunning && <Loader2 className="h-5 w-5 text-primary animate-spin" />}
                {isDone    && <CheckCircle className="h-5 w-5 text-emerald-600" />}
                {isFailed  && <AlertTriangle className="h-5 w-5 text-red-600" />}
                {!status   && <Clock className="h-5 w-5 text-muted-foreground" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold">
                    {isRunning && 'Searching LinkedIn...'}
                    {isDone    && 'Search complete'}
                    {isFailed  && 'Search failed'}
                    {!status   && 'Loading...'}
                  </h3>
                  {status && (
                    <Badge
                      variant="outline"
                      className={`text-[10px] px-2 py-0 ${STATUS_COLORS[status] || ''}`}
                    >
                      {status}
                    </Badge>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {isRunning && 'This may take up to 2 minutes. Results will appear when ready.'}
                  {isDone    && `Found ${recruits.length} candidate${recruits.length === 1 ? '' : 's'}.`}
                  {isFailed  && (sourcing?.error_message || 'An unknown error occurred. Try searching again.')}
                </p>
              </div>
            </div>
            {isFailed && (
              <Button size="sm" variant="outline" className="text-xs" onClick={onRetry}>
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Retry
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Search criteria summary ── */}
      {sourcing && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold">Search Criteria</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1.5">
              {['job_title', 'location', 'skill', 'company', 'school', 'year_graduate', 'industry', 'keyword']
                .filter(k => sourcing[k])
                .map(k => (
                  <Badge key={k} variant="outline" className="text-[10px] px-2 py-0.5">
                    <span className="text-muted-foreground mr-1">
                      {k.replace('_', ' ')}:
                    </span>
                    <span className="font-semibold">{String(sourcing[k])}</span>
                  </Badge>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Polling error ── */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg border border-red-200 bg-red-50 text-sm text-red-600">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ── Candidates table — only shown when Done ── */}
      {isDone && (
        <Card>
          <CardHeader className="pb-3 border-b">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <CardTitle className="text-sm shrink-0">
                Candidates
                <span className="ml-2 text-[11px] font-normal text-muted-foreground">
                  {filteredRecruits.length} of {recruits.length}
                </span>
              </CardTitle>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <Input
                  placeholder="Search by name, skill, or title..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-7 text-xs h-8 w-[260px]"
                />
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {recruits.length === 0 ? (
              <p className="text-center py-10 text-xs text-muted-foreground">
                No candidates found. Try adjusting your search criteria.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table className="table-fixed w-full">
                  <TableHeader className="bg-muted/40">
                    <TableRow>
                      <TableHead className="w-[30%] text-[10px] font-bold uppercase pl-6">Name</TableHead>
                      <TableHead className="w-[30%] text-[10px] font-bold uppercase">Position</TableHead>
                      <TableHead className="w-[30%] text-[10px] font-bold uppercase">Skill</TableHead>
                      <TableHead className="w-[10%] text-[10px] font-bold uppercase text-right pr-6">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRecruits.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-xs text-muted-foreground">
                          No candidates match your search.
                        </TableCell>
                      </TableRow>
                    ) : filteredRecruits.map(r => (
                      <TableRow
                        key={r.id}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        {/* Name — no icon, matches table style across the app */}
                        <TableCell className="text-xs pl-6">
                          <div className="font-semibold truncate">{r.name}</div>
                        </TableCell>

                        {/* Position — no icon */}
                        <TableCell className="text-xs truncate">
                          {r.job_title || '—'}
                        </TableCell>

                        {/* Skill */}
                        <TableCell className="text-xs truncate text-muted-foreground">
                          {r.skill || '—'}
                        </TableCell>

                        {/* Action — TODO: wire up when add-to-pool endpoint is ready */}
                        <TableCell className="text-right pr-6">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-[11px] h-7 px-2.5"
                            disabled
                            title="Coming soon"
                          >
                            Add
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

    </div>
  );
}