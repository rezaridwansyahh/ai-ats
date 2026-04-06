import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { RefreshCw, Briefcase, XCircle, FileText, Send, Play, Clock, Search } from 'lucide-react';
import { Button }   from '@/components/ui/button';
import { Input }    from '@/components/ui/input';
import { Label }    from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { StatCard }  from '@/components/cards/StatCard';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useSort } from '@/hooks/useSort';
import { TablePagination } from '@/components/shared/TablePagination';

import {
  getSeekPostingsByUserId,
  getSeekPostingFull,
  submitSeekPosting,
  updateJobPosting,
  deleteJobPosting,
  getSeekJobStatus,
} from '@/api/job-posting-seek.api';
import { getJobAccountsByUserId } from '@/api/job-accounts.api';
import { hasPermission } from '@/utils/permissions';

import { SeekPostingTable }      from '@/components/job-posting/SeekPostingTable';
import { JobPostingViewDialog }  from '@/components/job-posting/JobPostingViewDialog';
import { JobPostingEditDialog }  from '@/components/job-posting/JobPostingEditDialog';
import { DeleteJobPostingDialog } from '@/components/job-posting/DeleteJobPostingDialog';
import { CandidatesDialog }       from '@/components/job-posting/CandidatesDialog';

const WORK_OPTIONS = ['On-site', 'Hybrid', 'Remote'];
const WORK_TYPES   = ['Full-time', 'Part-time', 'Contract', 'Casual'];
const PAY_TYPES    = ['Hourly', 'Monthly', 'Annually'];
const CURRENCIES   = ['AUD', 'HKD', 'IDR', 'MYR', 'NZD', 'PHP', 'SGD', 'THB', 'USD'];
const DISPLAY_OPTS = ['Show', 'Hide'];
const STATUS_OPTIONS = ['Draft', 'Submitted', 'Running', 'Active', 'Expired'];

export default function SeekPage() {
  const canCreate = hasPermission('Job Postings', 'Seek', 'create');
  const canEdit   = hasPermission('Job Postings', 'Seek', 'update');
  const canDelete = hasPermission('Job Postings', 'Seek', 'delete');

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
  const [viewOpen,        setViewOpen]        = useState(false);
  const [editOpen,        setEditOpen]        = useState(false);
  const [deleteOpen,      setDeleteOpen]      = useState(false);
  const [candidatesOpen,  setCandidatesOpen]  = useState(false);
  const [selected,        setSelected]        = useState(null);
  const [submitting,      setSubmitting]      = useState(false);

  const formRef = useRef(null);

  const openView           = (p) => { setSelected(p); setViewOpen(true); };
  const openEdit           = (p) => { setSelected(p); setEditOpen(true); };
  const openDelete         = (p) => { setSelected(p); setDeleteOpen(true); };
  const openViewCandidates = (p) => { setSelected(p); setCandidatesOpen(true); };

  // ── Inline form state ──
  const [formAccountId,   setFormAccountId]   = useState('');
  const [formJobTitle,    setFormJobTitle]     = useState('');
  const [formJobDesc,     setFormJobDesc]      = useState('');
  const [formJobLocation, setFormJobLocation]  = useState('');
  const [formWorkOption,  setFormWorkOption]   = useState('');
  const [formWorkType,    setFormWorkType]     = useState('');
  const [formPayType,     setFormPayType]      = useState('');
  const [formCurrency,    setFormCurrency]     = useState('');
  const [formMin,         setFormMin]          = useState('');
  const [formMax,         setFormMax]          = useState('');
  const [formDisplay,     setFormDisplay]      = useState('');
  const [formError,       setFormError]        = useState('');

  // Auto-select account if only one
  useEffect(() => {
    if (accounts.length === 1) setFormAccountId(String(accounts[0].id));
  }, [accounts]);

  const handleDuplicate = async (posting) => {
    try {
      const { data } = await getSeekPostingFull(posting.id);
      const full = data.posting || data;
      setFormJobTitle(full.job_title || '');
      setFormJobDesc(full.job_desc || '');
      setFormJobLocation(full.job_location || '');
      setFormWorkOption(full.work_option || '');
      setFormWorkType(full.work_type || '');
      setFormPayType(full.pay_type || '');
      setFormCurrency(full.currency || '');
      setFormMin(full.pay_min != null ? String(full.pay_min) : '');
      setFormMax(full.pay_max != null ? String(full.pay_max) : '');
      setFormDisplay(full.pay_display || '');
      setFormError('');
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (err) {
      console.error('Failed to load posting for duplicate:', err);
    }
  };

  const resetForm = () => {
    setFormAccountId(accounts.length === 1 ? String(accounts[0].id) : '');
    setFormJobTitle('');
    setFormJobDesc('');
    setFormJobLocation('');
    setFormWorkOption('');
    setFormWorkType('');
    setFormPayType('');
    setFormCurrency('');
    setFormMin('');
    setFormMax('');
    setFormDisplay('');
    setFormError('');
  };

  const pollJobStatus = async (queueJobId) => {
    const MAX_POLLS = 30;
    for (let i = 0; i < MAX_POLLS; i++) {
      await new Promise(r => setTimeout(r, 2000));
      try {
        const { data } = await getSeekJobStatus(queueJobId);
        if (data.state === 'completed') return { success: true };
        if (data.state === 'failed') return { success: false, error: data.failedReason };
      } catch {
        // polling error, keep trying
      }
    }
    return { success: false, error: 'Timed out waiting for job to complete' };
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formAccountId) { setFormError('Please select an account'); return; }
    if (!formJobTitle.trim()) { setFormError('Job title is required'); return; }

    setSubmitting(true);
    try {
      const { data } = await submitSeekPosting({
        user_id: userId,
        account_id: Number(formAccountId),
        service: 'seek',
        dataForm: {
          job_title:    formJobTitle.trim(),
          job_desc:     formJobDesc.trim()     || null,
          job_location: formJobLocation.trim() || null,
          work_option:  formWorkOption          || null,
          work_type:    formWorkType            || null,
          pay_type:     formPayType             || null,
          currency:     formCurrency            || null,
          pay_min:      formMin ? Number(formMin) : null,
          pay_max:      formMax ? Number(formMax) : null,
          pay_display:  formDisplay             || null,
        },
      });

      const queueJobId = data.jobPost?.id;
      if (queueJobId) {
        const result = await pollJobStatus(queueJobId);
        if (result.success) {
          resetForm();
        } else {
          setFormError(result.error || 'Seek posting failed');
        }
      }
      await fetchPostings();
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || 'Something went wrong');
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

  const sorted    = useMemo(() => apply(filtered), [filtered, apply]);
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage   = Math.min(page, totalPages);
  const paginated  = sorted.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <div className="flex flex-col gap-5 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Seek Job Postings</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Create and manage your Seek job postings.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchPostings} disabled={loading}>
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Inline Creation Form */}
      {canCreate && (
        <Card ref={formRef} className="border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Create New Job Posting</CardTitle>
            <CardDescription className="text-xs">
              Fill in the details below to submit a new Seek job posting via RPA.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-5">
              {/* Account Selection */}
              <div className="flex flex-col gap-2">
                <Label>Seek Account <span className="text-destructive">*</span></Label>
                {accounts.length === 0 ? (
                  <p className="text-sm text-destructive">No Seek accounts found. Please add one first.</p>
                ) : (
                  <Select value={formAccountId} onValueChange={setFormAccountId}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select account" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map((acc) => (
                        <SelectItem key={acc.id} value={String(acc.id)}>
                          {acc.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Job Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="seek-title">Job Title <span className="text-destructive">*</span></Label>
                  <Input
                    id="seek-title"
                    placeholder="e.g. Software Engineer"
                    value={formJobTitle}
                    onChange={(e) => setFormJobTitle(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="seek-location">Location</Label>
                  <Input
                    id="seek-location"
                    placeholder="e.g. Melbourne, VIC"
                    value={formJobLocation}
                    onChange={(e) => setFormJobLocation(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="seek-desc">Job Description</Label>
                <Textarea
                  id="seek-desc"
                  placeholder="Describe the role..."
                  rows={3}
                  value={formJobDesc}
                  onChange={(e) => setFormJobDesc(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex flex-col gap-2">
                  <Label>Work Option</Label>
                  <Select value={formWorkOption} onValueChange={setFormWorkOption}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {WORK_OPTIONS.map((o) => (
                        <SelectItem key={o} value={o}>{o}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Work Type</Label>
                  <Select value={formWorkType} onValueChange={setFormWorkType}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {WORK_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Currency</Label>
                  <Select value={formCurrency} onValueChange={setFormCurrency}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Pay Type</Label>
                  <Select value={formPayType} onValueChange={setFormPayType}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {PAY_TYPES.map((p) => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="seek-min">Pay Min</Label>
                  <Input
                    id="seek-min"
                    type="number"
                    placeholder="e.g. 60000"
                    value={formMin}
                    onChange={(e) => setFormMin(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="seek-max">Pay Max</Label>
                  <Input
                    id="seek-max"
                    type="number"
                    placeholder="e.g. 90000"
                    value={formMax}
                    onChange={(e) => setFormMax(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Display on Ad</Label>
                  <Select value={formDisplay} onValueChange={setFormDisplay}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {DISPLAY_OPTS.map((d) => (
                        <SelectItem key={d} value={d}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {formError && <p className="text-sm text-destructive">{formError}</p>}

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Reset
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Submitting…' : 'Submit Posting'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 stagger-children">
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
      <Card className="border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">All Seek Postings</CardTitle>
          <CardDescription className="text-xs">
            {loading ? 'Loading…' : `${filtered.length} of ${postings.length} posting${postings.length !== 1 ? 's' : ''}`}
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
              <SeekPostingTable
                postings={paginated}
                loading={loading}
                onView={openView}
                onEdit={openEdit}
                onDelete={openDelete}
                onDuplicate={canCreate ? handleDuplicate : undefined}
                onViewCandidates={openViewCandidates}
                canEdit={canEdit}
                canDelete={canDelete}
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

      {/* Dialogs */}

      <CandidatesDialog
        open={candidatesOpen}
        onOpenChange={setCandidatesOpen}
        posting={selected}
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
