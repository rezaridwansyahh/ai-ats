import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import {
  Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/common';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { AccountBanner } from '@/components/source-management/AccountBanner';
import { JOB_STATUS_VARIANT } from '@/constants/job-status';
import { getByAccountId } from '@/api/job-sourcing.api';
import { extractSeekCandidates } from '@/api/job-posting-seek.api';
import { toast } from 'sonner';

const STATUS_OPTIONS = ['Draft', 'Active', 'Running', 'Expired', 'Failed'];
const SYNC_VARIANT = { idle: 'muted', syncing: 'warning', error: 'danger' };
const SYNC_LABEL   = { idle: 'Idle', syncing: 'Syncing…', error: 'Error' };
const PAGE_SIZE = 10;
// Poll while any row is mid-sync, since extraction runs async in a BullMQ
// worker — this is the only way the row's sync_state/last_sync updates
// without the user manually refreshing.
const POLL_INTERVAL_MS = 4000;

/**
 * ListSourceStep — Step 2 of Source Management.
 * Lists core_job_sourcing rows scoped to the selected account (Step 1).
 *
 * Re-sync (candidate extraction) is scoped PER ROW, not one blanket button
 * for the whole account — a single sourcing can have a large number of
 * candidates, so triggering extraction for every sourcing under an account
 * at once would be slow/heavy. Each row fires its own
 * POST /seek/candidates/rpa/extract, which the backend already tracks via
 * core_job_sourcing.sync_state (idle/syncing/error) per row.
 */
export default function ListSourceStep({ selectedAccount }) {
  const [sources, setSources]   = useState([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  // Set of source ids currently being re-synced — drives per-row disabled/spinner state.
  const [syncingIds, setSyncingIds] = useState(new Set());

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);

  const fetchSources = useCallback(async ({ silent = false } = {}) => {
    if (!selectedAccount?.id) { setSources([]); return; }
    if (!silent) setLoading(true);
    setError(null);
    try {
      const res = await getByAccountId(selectedAccount.id);
      setSources(res.data.postings || []);
    } catch (err) {
      if (!silent) setError(err.response?.data?.message || err.message || 'Failed to load sources');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [selectedAccount?.id]);

  useEffect(() => { fetchSources(); }, [fetchSources]);

  // ── Poll quietly while anything is mid-sync ──────────────────────────
  const hasSyncingRows = sources.some(s => s.sync_state === 'syncing');
  const pollRef = useRef(null);
  useEffect(() => {
    if (!hasSyncingRows) return;
    pollRef.current = setInterval(() => fetchSources({ silent: true }), POLL_INTERVAL_MS);
    return () => clearInterval(pollRef.current);
  }, [hasSyncingRows, fetchSources]);

  const filteredSources = useMemo(() => {
    return sources.filter(source => {
      const matchesSearch = !searchQuery || source.job_title?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || source.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [sources, searchQuery, statusFilter]);

  const totalPages = Math.ceil(filteredSources.length / PAGE_SIZE);
  const paginatedSources = filteredSources.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleRefresh = async () => {
    setRefreshing(true);
    try { await fetchSources(); } finally { setRefreshing(false); }
  };

  const handleResyncRow = async (source) => {
    if (!selectedAccount?.id || syncingIds.has(source.id)) return;
    setSyncingIds(prev => new Set(prev).add(source.id));
    try {
      await extractSeekCandidates({ account_id: selectedAccount.id, job_sourcing_id: source.id });
      toast.success(`Re-sync queued for "${source.job_title}"`);
      // Backend marks sync_state='syncing' synchronously before responding — refetch to show it.
      await fetchSources({ silent: true });
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to queue re-sync');
    } finally {
      setSyncingIds(prev => { const next = new Set(prev); next.delete(source.id); return next; });
    }
  };

  if (!selectedAccount) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertTriangle className="h-10 w-10 text-amber-400 mb-3" />
        <h3 className="text-lg font-bold mb-1">No Account Selected</h3>
        <p className="text-sm text-muted-foreground">Go back to Step 1 and select a connected account first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <AccountBanner account={selectedAccount} step={2} />

      {/* ── Prerequisite Warning ── */}
      <div className="flex items-center gap-2 px-4 py-3 rounded-lg border-l-[3px] border-amber-400 bg-amber-50/60 text-[11px] text-muted-foreground">
        <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
        <span>
          Each sourcing has its own <strong>Re-Sync</strong> — syncing pulls candidates for that
          one posting, so run it per row rather than all at once.
        </span>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg border border-red-200 bg-red-50 text-sm text-red-600">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <Card data-tour="source-mgmt-source-table">
        <CardHeader className="pb-3 space-y-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <CardTitle className="text-sm">
              Sources for this account
              {!loading && (
                <span className="ml-2 text-[11px] font-normal text-muted-foreground">
                  {filteredSources.length} {filteredSources.length === 1 ? 'result' : 'results'}
                </span>
              )}
            </CardTitle>
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
          <div className="flex items-center gap-3">
            <Input
              placeholder="Search by job title..."
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setPage(1); }}
              className="max-w-[250px] text-xs"
            />
            <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(1); }}>
              <SelectTrigger className="w-[150px] text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table className="table-fixed w-full">
            <TableCaption>Job sourcings synced from {selectedAccount.email}.</TableCaption>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead>Job Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Linked to a job?</TableHead>
                <TableHead>Sync</TableHead>
                <TableHead>Last Sync</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10">
                    <Loader2 className="h-4 w-4 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : paginatedSources.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-xs text-muted-foreground">
                    {sources.length === 0
                      ? 'No sourcings found for this account yet. Try Refresh.'
                      : 'No sourcings match your filters.'}
                  </TableCell>
                </TableRow>
              ) : paginatedSources.map(source => {
                const isSyncing = source.sync_state === 'syncing' || syncingIds.has(source.id);
                return (
                  <TableRow key={source.id}>
                    <TableCell className="font-medium truncate">{source.job_title}</TableCell>
                    <TableCell>
                      <StatusBadge
                        label={source.status}
                        variant={JOB_STATUS_VARIANT[source.status] ?? 'muted'}
                        dot
                      />
                    </TableCell>
                    <TableCell>
                      {source.job_post_id ? (
                        <StatusBadge label="Linked" variant="success" />
                      ) : (
                        <StatusBadge label="Not linked" variant="muted" />
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        label={SYNC_LABEL[source.sync_state] ?? 'Idle'}
                        variant={SYNC_VARIANT[source.sync_state] ?? 'muted'}
                        dot
                      />
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {source.last_sync ? new Date(source.last_sync).toLocaleString() : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs h-7 px-2.5"
                        disabled={isSyncing}
                        onClick={() => handleResyncRow(source)}
                      >
                        {isSyncing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Re-Sync'}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
            <TableFooter></TableFooter>
          </Table>

          <div className="flex flex-col items-center gap-2 pt-3 border-t mt-3">
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
              {filteredSources.length > 0
                ? `Showing ${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, filteredSources.length)} of ${filteredSources.length}`
                : 'No results'}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
