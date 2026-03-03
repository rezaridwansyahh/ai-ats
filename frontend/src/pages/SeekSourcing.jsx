import { useState, useEffect, useCallback } from 'react';
import {
  RefreshCw, Briefcase, Clock,
  Play, XCircle, Users,
} from 'lucide-react';
import { Button }   from '@/components/ui/button';
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

import { SourcingTable } from '@/components/job-sourcing/SourcingTable';

import {
  getSeekPostingsByUserId,
  getSeekPostingFull,
  syncSeekJobPosts,
  extractSeekCandidates,
} from '@/api/job-posting-seek.api';
import { getJobAccountsByUserId } from '@/api/job-accounts.api';

const STATUS_COLORS = {
  Draft:       'bg-gray-100 text-gray-700',
  Submitted:   'bg-blue-100 text-blue-700',
  Running:     'bg-green-100 text-green-700',
  Expired:     'bg-red-100 text-red-700',
  Kedaluwarsa: 'bg-red-100 text-red-700',
  Active:      'bg-green-100 text-green-700',
};

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
  const expiredCount    = postings.filter(p => p.status === 'Expired' || p.status === 'Kedaluwarsa').length;

  return (
    <div className="flex flex-col gap-6 p-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Job Sourcing</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            View and sync your Seek job ads. Import candidates from active postings.
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchPostings} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              size="sm"
              onClick={handleSync}
              disabled={syncing || !accountId}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
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
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Seek Job Ads</CardTitle>
          <CardDescription>
            {loading ? 'Loading…' : `${postings.length} job ad${postings.length !== 1 ? 's' : ''} found`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="flex flex-col items-center gap-2 py-16 text-destructive">
              <XCircle className="h-8 w-8" />
              <p className="text-sm font-medium">{error}</p>
              <Button variant="outline" size="sm" onClick={fetchPostings}>Try again</Button>
            </div>
          ) : (
            <SourcingTable
              postings={postings}
              loading={loading}
              onView={openView}
              onImportCv={handleExtractCandidates}
              extractingId={extractingId}
            />
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
