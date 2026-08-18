import { useState, useEffect, useMemo, useCallback } from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';
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
import { syncSeekJobPosts } from '@/api/job-posting-seek.api';
import { toast } from 'sonner';

const STATUS_OPTIONS = ['Draft', 'Active', 'Running', 'Expired', 'Failed'];
const PAGE_SIZE = 10;

/**
 * ListSourceStep — Step 2 of Source Management.
 * Lists core_job_sourcing rows scoped to the selected account (Step 1) —
 * i.e. every job posting Sync has pulled in from that platform account,
 * whether or not it's linked to a core_job created in this app yet.
 */
export default function ListSourceStep({ selectedAccount }) {
  const [sources, setSources]   = useState([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [syncing, setSyncing]   = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);

  const fetchSources = useCallback(async () => {
    if (!selectedAccount?.id) { setSources([]); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await getByAccountId(selectedAccount.id);
      setSources(res.data.postings || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load sources');
      setSources([]);
    } finally {
      setLoading(false);
    }
  }, [selectedAccount?.id]);

  useEffect(() => { fetchSources(); }, [fetchSources]);

  const filteredSources = useMemo(() => {
    return sources.filter(source => {
      const matchesSearch = !searchQuery || source.job_title?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || source.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [sources, searchQuery, statusFilter]);

  const totalPages = Math.ceil(filteredSources.length / PAGE_SIZE);
  const paginatedSources = filteredSources.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [searchQuery, statusFilter]);

  const handleResync = async () => {
    if (!selectedAccount?.id || syncing) return;
    setSyncing(true);
    try {
      await toast.promise(syncSeekJobPosts(selectedAccount.id), {
        position: 'top-center',
        loading: 'Queuing sync…',
        success: 'Sync queued — this list will update once it finishes.',
        error: 'Failed to queue sync',
      });
    } finally {
      setSyncing(false);
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
          Showing sourcings synced from this account. Data may be stale — click{' '}
          <strong>Re-Sync</strong> below to pull the latest from the platform.
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
            <Button variant="outline" size="sm" onClick={handleResync} disabled={syncing}>
              {syncing ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : null}
              Re-Sync
            </Button>
          </div>
          <div className="flex items-center gap-3">
            <Input
              placeholder="Search by job title..."
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
        </CardHeader>
        <CardContent>
          <Table className="table-fixed w-full">
            <TableCaption>Job sourcings synced from {selectedAccount.email}.</TableCaption>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead>Job Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Linked to a job?</TableHead>
                <TableHead>Last Sync</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-10">
                    <Loader2 className="h-4 w-4 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : paginatedSources.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-10 text-xs text-muted-foreground">
                    {sources.length === 0
                      ? 'No sourcings found for this account yet. Try Re-Sync.'
                      : 'No sourcings match your filters.'}
                  </TableCell>
                </TableRow>
              ) : paginatedSources.map(source => (
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
                  <TableCell className="text-xs text-muted-foreground">
                    {source.last_sync ? new Date(source.last_sync).toLocaleString() : '—'}
                  </TableCell>
                </TableRow>
              ))}
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
