import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Briefcase, Plus, XCircle, FileText, Send, Play, Clock } from 'lucide-react';
import { Button }   from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { StatCard }  from '@/components/cards/StatCard';

import {
  getSeekPostingsByUserId,
  submitSeekPosting,
  updateJobPosting,
  deleteJobPosting,
} from '@/api/job-posting-seek.api';
import { getJobAccountsByUserId } from '@/api/job-accounts.api';
import { hasPermission } from '@/utils/permissions';

import { SeekPostingTable }      from '@/components/job-posting/SeekPostingTable';
import { SeekFormDialog }       from '@/components/job-posting/SeekFormDialog';
import { JobPostingViewDialog } from '@/components/job-posting/JobPostingViewDialog';
import { JobPostingEditDialog } from '@/components/job-posting/JobPostingEditDialog';
import { DeleteJobPostingDialog } from '@/components/job-posting/DeleteJobPostingDialog';

export function SeekLayout() {
  const canCreate = hasPermission('Job Postings', 'Seek', 'create');
  const canEdit   = hasPermission('Job Postings', 'Seek', 'update');
  const canDelete = hasPermission('Job Postings', 'Seek', 'delete');

  // Get current user id from localStorage
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userId = user?.id;

  // ── Data ──
  const [postings, setPostings] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

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
      setAccounts((data.accounts || []).filter(a => a.portal_name === 'seek'));
    } catch (err) {
      console.error('Failed to load accounts:', err);
    }
  }, [userId]);

  useEffect(() => { fetchPostings(); fetchAccounts(); }, [fetchPostings, fetchAccounts]);

  // ── Dialog state ──
  const [createOpen,   setCreateOpen]   = useState(false);
  const [viewOpen,     setViewOpen]     = useState(false);
  const [editOpen,     setEditOpen]     = useState(false);
  const [deleteOpen,   setDeleteOpen]   = useState(false);
  const [selected,     setSelected]     = useState(null);
  const [submitting,   setSubmitting]   = useState(false);

  const openView   = (p) => { setSelected(p); setViewOpen(true); };
  const openEdit   = (p) => { setSelected(p); setEditOpen(true); };
  const openDelete = (p) => { setSelected(p); setDeleteOpen(true); };

  // ── CRUD handlers ──
  const handleCreate = async (payload) => {
    setSubmitting(true);
    try {
      await submitSeekPosting(payload);
      await fetchPostings();
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (payload) => {
    setSubmitting(true);
    try {
      await updateJobPosting(payload);
      await fetchPostings();
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (posting) => {
    setSubmitting(true);
    try {
      await deleteJobPosting({
        job_posting_id: posting.id,
        user_id: userId,
        account_id: posting.account_id,
        service: 'seek',
      });
      await fetchPostings();
    } finally {
      setSubmitting(false);
    }
  };

  const draftCount     = postings.filter(p => p.status === 'Draft').length;
  const submittedCount = postings.filter(p => p.status === 'Submitted').length;
  const runningCount   = postings.filter(p => p.status === 'Running').length;
  const expiredCount   = postings.filter(p => p.status === 'Expired').length;

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Seek Job Postings</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage your Seek job postings.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchPostings} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {canCreate && (
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Posting
            </Button>
          )}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <StatCard
          icon={<Briefcase className="h-5 w-5 text-blue-500" />}
          label="Total"
          value={postings.length}
          loading={loading}
        />
        <StatCard
          icon={<FileText className="h-5 w-5 text-gray-500" />}
          label="Draft"
          value={draftCount}
          loading={loading}
        />
        <StatCard
          icon={<Send className="h-5 w-5 text-indigo-500" />}
          label="Submitted"
          value={submittedCount}
          loading={loading}
        />
        <StatCard
          icon={<Play className="h-5 w-5 text-green-500" />}
          label="Running"
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

      {/* Table card */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">All Seek Postings</CardTitle>
          <CardDescription>
            {loading ? 'Loading…' : `${postings.length} posting${postings.length !== 1 ? 's' : ''}`}
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
            <SeekPostingTable
              postings={postings}
              loading={loading}
              onView={openView}
              onEdit={openEdit}
              onDelete={openDelete}
              canEdit={canEdit}
              canDelete={canDelete}
            />
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <SeekFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        userId={userId}
        accounts={accounts}
        onSubmit={handleCreate}
        loading={submitting}
      />

      {selected && (
        <>
          <JobPostingViewDialog
            open={viewOpen}
            onOpenChange={setViewOpen}
            posting={selected}
          />

          <JobPostingEditDialog
            open={editOpen}
            onOpenChange={setEditOpen}
            posting={selected}
            userId={userId}
            onSubmit={handleUpdate}
            loading={submitting}
          />

          <DeleteJobPostingDialog
            open={deleteOpen}
            onOpenChange={setDeleteOpen}
            posting={selected}
            onConfirm={handleDelete}
            loading={submitting}
          />
        </>
      )}
    </div>
  );
}
