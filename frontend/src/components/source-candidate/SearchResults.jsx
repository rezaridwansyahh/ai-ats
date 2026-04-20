import { useState, useEffect, useRef, useMemo } from 'react';
import {
  Loader2, AlertTriangle, CheckCircle, Search, Clock,
  User, Briefcase, RefreshCw,
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
  const [sourcing, setSourcing] = useState(null);
  const [recruites, setRecruites] = useState([]);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const pollRef = useRef(null);

  useEffect(() => {
    if (!sourcingId) return;

    let stopped = false;

    const poll = async () => {
      try {
        const { data } = await getSourcing(sourcingId);
        if (stopped) return;
        setSourcing(data.sourcing);
        setRecruites(data.recruites || []);

        if (data.sourcing?.status === 'Done' || data.sourcing?.status === 'Failed') {
          clearInterval(pollRef.current);
          pollRef.current = null;
        }
      } catch (err) {
        if (stopped) return;
        setError(err.response?.data?.message || err.message || 'Failed to fetch sourcing');
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

  const status = sourcing?.status;
  const isRunning = status === 'Pending' || status === 'Processing';
  const isDone = status === 'Done';
  const isFailed = status === 'Failed';

  const filteredRecruites = useMemo(() => {
    if (!searchQuery) return recruites;
    const q = searchQuery.toLowerCase();
    return recruites.filter(r =>
      r.name?.toLowerCase().includes(q) ||
      r.skill?.toLowerCase().includes(q) ||
      r.job_title?.toLowerCase().includes(q)
    );
  }, [recruites, searchQuery]);

  return (
    <div className="space-y-5">
      {/* Status banner */}
      <Card>
        <CardContent className="py-4 px-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                {isRunning && <Loader2 className="h-5 w-5 text-primary animate-spin" />}
                {isDone    && <CheckCircle className="h-5 w-5 text-emerald-600" />}
                {isFailed  && <AlertTriangle className="h-5 w-5 text-red-600" />}
                {!status   && <Clock className="h-5 w-5 text-muted-foreground" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold">
                    {isRunning && 'Searching LinkedIn...'}
                    {isDone    && 'Search Complete'}
                    {isFailed  && 'Search Failed'}
                    {!status   && 'Loading...'}
                  </h3>
                  {status && (
                    <Badge variant="outline" className={`text-[10px] px-2 py-0 ${STATUS_COLORS[status] || ''}`}>
                      {status}
                    </Badge>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {isRunning && 'This may take up to 2 minutes. Results will appear when ready.'}
                  {isDone    && `Found ${recruites.length} candidate${recruites.length === 1 ? '' : 's'}.`}
                  {isFailed  && (sourcing?.error_message || 'An unknown error occurred.')}
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

      {/* Search params summary */}
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
                    <span className="text-muted-foreground mr-1">{k.replace('_', ' ')}:</span>
                    <span className="font-semibold">{String(sourcing[k])}</span>
                  </Badge>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error (polling issue) */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg border border-red-200 bg-red-50 text-sm text-red-600">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Results table */}
      {isDone && (
        <Card>
          <CardHeader className="pb-3 space-y-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Candidates Found</CardTitle>
              <span className="text-[11px] text-muted-foreground">
                {filteredRecruites.length} of {recruites.length}
              </span>
            </div>
            <div className="relative max-w-[300px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search by name, skill, or title..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-8 text-xs h-9"
              />
            </div>
          </CardHeader>
          <CardContent>
            {recruites.length === 0 ? (
              <div className="text-center py-8 text-xs text-muted-foreground">
                No candidates found matching your search criteria.
              </div>
            ) : (
              <Table className="table-fixed w-full">
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="w-[30%] text-[10px] font-bold uppercase">Name</TableHead>
                    <TableHead className="w-[30%] text-[10px] font-bold uppercase">Position</TableHead>
                    <TableHead className="w-[30%] text-[10px] font-bold uppercase">Skill</TableHead>
                    <TableHead className="w-[10%] text-[10px] font-bold uppercase text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecruites.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-6 text-xs text-muted-foreground">
                        No results match your search.
                      </TableCell>
                    </TableRow>
                  ) : filteredRecruites.map(r => (
                    <TableRow key={r.id}>
                      <TableCell className="text-xs font-medium">
                        <div className="flex items-center gap-1.5">
                          <User className="h-3 w-3 text-muted-foreground shrink-0" />
                          <span className="truncate">{r.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">
                        <div className="flex items-center gap-1.5">
                          <Briefcase className="h-3 w-3 text-muted-foreground shrink-0" />
                          <span className="truncate">{r.job_title || '—'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs truncate">{r.skill || '—'}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" className="text-[11px] h-7 px-2.5" disabled>
                          Add
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
