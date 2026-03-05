import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  RefreshCw, Briefcase, Clock,
  Play, XCircle, Users, Search,
} from 'lucide-react';
import { Button }   from '@/components/ui/button';
import { Input }    from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge }    from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { StatCard } from '@/components/cards/StatCard';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { useSort } from '@/hooks/useSort';
import { TablePagination } from '@/components/shared/TablePagination';

import { SourcingTable } from '@/components/job-sourcing/SourcingTable';

import {
  getSeekPostingsByUserId,
  getSeekPostingFull,
  syncSeekJobPosts,
  extractSeekCandidates,
} from '@/api/job-posting-seek.api';
import { getJobAccountsByUserId } from '@/api/job-accounts.api';

const STATUS_COLORS = {
  Draft:       'bg-[var(--warning-bg)] text-[#A16207]',
  Submitted:   'bg-[var(--info-bg)] text-[#1E40AF]',
  Running:     'bg-[var(--success-bg)] text-[#16A34A]',
  Expired:     'bg-[var(--error-bg)] text-[#9A3412]',
  Active:      'bg-[var(--success-bg)] text-[#16A34A]',
};

const STATUS_OPTIONS = ['Draft', 'Submitted', 'Running', 'Active', 'Expired'];

function Field({ label, value }) {
  if (value === null || value === undefined || value === '') return null;
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm">{value}</span>
    </div>
  );
}

export default function SeekSourcingPage() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userId = user?.id;

  // ── Data ──
  const [postings, setPostings]   = useState([]);
  const [accounts, setAccounts]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [accountId, setAccountId] = useState('');

  // ── Sync state ──
  const [syncing, setSyncing]     = useState(false);
  const [lastSync, setLastSync]   = useState(null);

  // ── View modal state ──
  const [viewOpen, setViewOpen]     = useState(false);
  const [selected, setSelected]     = useState(null);
  const [fullData, setFullData]     = useState(null);
  const [loadingFull, setLoadingFull] = useState(false);

  // ── Extract state ──
  const [extractingId, setExtractingId] = useState(null);

  const fetchPostings = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await getSeekPostingsByUserId(userId);
      setPostings(data.postings || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load postings');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const fetchAccounts = useCallback(async () => {
    if (!userId) return;
    try {
      const { data } = await getJobAccountsByUserId(userId);
      const seekAccounts = (data.accounts || []).filter(a => a.portal_name === 'seek');
      setAccounts(seekAccounts);
      if (seekAccounts.length === 1) {
        setAccountId(String(seekAccounts[0].id));
      }
    } catch (err) {
      console.error('Failed to load accounts:', err);
    }
  }, [userId]);

  useEffect(() => { fetchPostings(); fetchAccounts(); }, [fetchPostings, fetchAccounts]);

  // ── Sync handler ──
  const handleSync = async () => {
    if (!accountId) return;
    setSyncing(true);
    try {
      await syncSeekJobPosts(Number(accountId));
      setLastSync(new Date());
      await fetchPostings();
    } catch (err) {
      console.error('Sync failed:', err);
    } finally {
      setSyncing(false);
    }
  };

  // ── Extract candidates handler ──
  const handleExtractCandidates = async (posting) => {
    setExtractingId(posting.id);
    try {
      await extractSeekCandidates({
        account_id: posting.account_id,
        job_posting_id: posting.id,
      });
      await fetchPostings();
    } catch (err) {
      console.error('Extract candidates failed:', err);
    } finally {
      setExtractingId(null);
    }
  };

  // ── View modal handler ──
  const openView = (posting) => {
    setSelected(posting);
    setFullData(null);
    setViewOpen(true);
    setLoadingFull(true);
    getSeekPostingFull(posting.id)
      .then(({ data }) => setFullData(data.fullPosting))
      .catch(() => setFullData(null))
      .finally(() => setLoadingFull(false));
  };

  const viewData = fullData || selected;

  // ── Stats ──
  const totalCandidates = postings.reduce((sum, p) => sum + (p.candidate_count || 0), 0);
  const runningCount    = postings.filter(p => p.status === 'Running' || p.status === 'Active').length;
  const expiredCount    = postings.filter(p => p.status === 'Expired').length;

  // ── Search, filter, sort, pagination ──
  const { toggle, apply, SortIcon } = useSort();
  const [search,       setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page,         setPage]         = useState(1);
  const [pageSize,     setPageSize]     = useState(10);

  useEffect(() => { setPage(1); }, [search, statusFilter]);

  const filtered = useMemo(() =>
    postings.filter((p) => {
      const matchSearch = !search || p.job_title?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'all' || p.status === statusFilter;
      return matchSearch && matchStatus;
    }),
  [postings, search, statusFilter]);

  const sorted     = useMemo(() => apply(filtered), [filtered, apply]);
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage   = Math.min(page, totalPages);
  const paginated  = sorted.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <div className="flex flex-col gap-5 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Job Sourcing</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            View and sync your Seek job ads. Import candidates from active postings.
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchPostings} disabled={loading}>
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              size="sm"
              onClick={handleSync}
              disabled={syncing || !accountId}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing…' : 'Sync'}
            </Button>
          </div>
          {lastSync && (
            <span className="text-xs text-muted-foreground">
              Last synced: {lastSync.toLocaleString()}
            </span>
          )}
        </div>
      </div>

      {/* Account selector */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">Account:</span>
          <Select value={accountId} onValueChange={setAccountId}>
            <SelectTrigger className="w-[220px] h-8 text-xs">
              <SelectValue placeholder="Select Seek account" />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((acc) => (
                <SelectItem key={acc.id} value={String(acc.id)}>
                  {acc.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 stagger-children">
        <StatCard
          icon={<Briefcase className="h-5 w-5 text-blue-500" />}
          label="Total Jobs"
          value={postings.length}
          loading={loading}
        />
        <StatCard
          icon={<Users className="h-5 w-5 text-violet-500" />}
          label="Total Candidates"
          value={totalCandidates}
          loading={loading}
        />
        <StatCard
          icon={<Play className="h-5 w-5 text-green-500" />}
          label="Active"
          value={runningCount}
          loading={loading}
        />
        <StatCard
          icon={<Clock className="h-5 w-5 text-red-500" />}
          label="Expired"
          value={expiredCount}
          loading={loading}
        />
      </div>

      {/* Job Sourcing Table */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Seek Job Ads</CardTitle>
          <CardDescription className="text-xs">
            {loading ? 'Loading…' : `${filtered.length} of ${postings.length} job ad${postings.length !== 1 ? 's' : ''} found`}
          </CardDescription>

          <div className="flex flex-col sm:flex-row gap-2.5 mt-3">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by job title..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-8 text-sm"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[150px] h-8 text-sm">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          {error ? (
            <div className="flex flex-col items-center gap-2 py-16 text-destructive">
              <XCircle className="h-8 w-8" />
              <p className="text-sm font-medium">{error}</p>
              <Button variant="outline" size="sm" onClick={fetchPostings}>Try again</Button>
            </div>
          ) : (
            <>
              <SourcingTable
                postings={paginated}
                loading={loading}
                onView={openView}
                onImportCv={handleExtractCandidates}
                extractingId={extractingId}
                toggle={toggle}
                SortIcon={SortIcon}
              />

              <TablePagination
                page={safePage}
                totalPages={totalPages}
                totalItems={sorted.length}
                pageSize={pageSize}
                setPage={setPage}
                setPageSize={setPageSize}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Job Posting Details</DialogTitle>
            <DialogDescription>{viewData?.job_title}</DialogDescription>
          </DialogHeader>

          {loadingFull ? (
            <div className="space-y-3 py-4">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-6 w-full" />)}
            </div>
          ) : viewData ? (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Job Title" value={viewData.job_title} />
                <Field label="Status" value={
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[viewData.status] ?? 'bg-muted text-muted-foreground'}`}>
                    {viewData.status}
                  </span>
                } />
                <Field label="Seek ID" value={viewData.seek_id} />
                <Field label="Platform" value={
                  <Badge variant="default">seek</Badge>
                } />
                <Field label="Candidates" value={viewData.candidate_count != null ? viewData.candidate_count : null} />
                <Field label="Location" value={viewData.job_location} />
                <Field label="Work Option" value={viewData.work_option} />
                <Field label="Work Type" value={viewData.work_type} />
                <Field label="Currency" value={viewData.currency} />
                <Field label="Pay Type" value={viewData.pay_type} />
                <Field label="Pay Min" value={viewData.pay_min} />
                <Field label="Pay Max" value={viewData.pay_max} />
                <Field label="Pay Display" value={viewData.pay_display} />
                <Field label="Created Date (Seek)" value={viewData.created_date_seek} />
                <Field label="Created By" value={viewData.created_by} />
                {viewData.created_at && (
                  <Field label="Synced At" value={new Date(viewData.created_at).toLocaleString()} />
                )}
              </div>

              {/* Job Description */}
              {viewData.job_desc && (
                <div className="flex flex-col gap-1 border-t pt-4">
                  <span className="text-xs text-muted-foreground">Job Description</span>
                  <div
                    className="text-sm prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: viewData.job_desc }}
                  />
                </div>
              )}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">No data available.</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
