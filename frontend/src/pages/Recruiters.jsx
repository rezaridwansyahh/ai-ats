import { useMemo, useState, useEffect, useCallback } from 'react';
import { RefreshCw, Users, XCircle, Plus } from 'lucide-react';
import { Button }      from '@/components/ui/button';
import { Input }       from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { getRecruiters, createRecruiter, updateRecruiter, deleteRecruiter } from '@/api/recruiter.api';
import { hasPermission } from '@/utils/permissions';

import { useSort }              from '@/hooks/useSort';
import { StatCard }             from '@/components/cards/StatCard';
import { RecruiterTable }       from '@/components/recruiter/RecruiterTable';
import { UserPagination }       from '@/components/user-management/UserPagination';
import { RecruiterFormDialog }  from '@/components/recruiter/RecruiterFormDialog';
import { DeleteRecruiterDialog } from '@/components/recruiter/DeleteRecruiterDialog';

const PAGE_SIZE = 10;

export default function RecruitersPage() {
  const canCreate = hasPermission('Users', 'Recruiters', 'create');
  const canEdit   = hasPermission('Users', 'Recruiters', 'update');
  const canDelete = hasPermission('Users', 'Recruiters', 'delete');

  // ── Data fetching ──
  const [recruiters, setRecruiters] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);

  const fetchRecruiters = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await getRecruiters();
      setRecruiters(data.recruiters || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load recruiters');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRecruiters(); }, [fetchRecruiters]);

  // ── Sorting ──
  const { toggle, apply, SortIcon } = useSort();

  // ── Filters & pagination ──
  const [search, setSearch] = useState('');
  const [page, setPage]     = useState(1);

  useEffect(() => { setPage(1); }, [search]);

  const filtered = useMemo(() =>
    recruiters.filter((r) => {
      const haystack = `${r.name ?? ''} ${r.email ?? ''}`.toLowerCase();
      return !search || haystack.includes(search.toLowerCase());
    }),
  [recruiters, search]);

  const sorted     = useMemo(() => apply(filtered), [filtered, apply]);
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const paginated  = sorted.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  // ── Stats ──
  const activeCount     = recruiters.filter(r => r.status === 'Active').length;
  const onboardingCount = recruiters.filter(r => r.status === 'Onboarding').length;

  // ── CRUD dialogs ──
  const [formOpen, setFormOpen]             = useState(false);
  const [deleteOpen, setDeleteOpen]         = useState(false);
  const [selectedRec, setSelectedRec]       = useState(null);
  const [submitting, setSubmitting]         = useState(false);

  const openCreate = () => {
    setSelectedRec(null);
    setFormOpen(true);
  };

  const openEdit = (rec) => {
    setSelectedRec(rec);
    setFormOpen(true);
  };

  const openDelete = (rec) => {
    setSelectedRec(rec);
    setDeleteOpen(true);
  };

  const handleCreateOrUpdate = async (payload, recId) => {
    setSubmitting(true);
    try {
      if (recId) {
        await updateRecruiter(recId, payload);
      } else {
        await createRecruiter(payload);
      }
      await fetchRecruiters();
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (recId) => {
    setSubmitting(true);
    try {
      await deleteRecruiter(recId);
      await fetchRecruiters();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-5 animate-fade-in-up">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Recruiters</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage recruiter accounts and set hiring permissions.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchRecruiters} disabled={loading}>
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {canCreate && (
            <Button size="sm" onClick={openCreate}>
              <Plus className="h-3.5 w-3.5" />
              Add Recruiter
            </Button>
          )}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 stagger-children">
        <StatCard
          icon={<Users className="h-5 w-5 text-blue-500" />}
          label="Total Recruiters"
          value={recruiters.length}
          loading={loading}
        />
        <StatCard
          icon={<Users className="h-5 w-5 text-emerald-500" />}
          label="Active"
          value={activeCount}
          loading={loading}
        />
        <StatCard
          icon={<Users className="h-5 w-5 text-amber-500" />}
          label="Onboarding"
          value={onboardingCount}
          loading={loading}
        />
      </div>

      {/* Table card */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">All Recruiters</CardTitle>
          <CardDescription className="text-xs mt-0">
            {loading ? 'Loading...' : `${filtered.length} of ${recruiters.length} recruiter${recruiters.length !== 1 ? 's' : ''}`}
          </CardDescription>

          <div className="pt-2">
            <Input
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm h-8 text-sm"
            />
          </div>
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          {error ? (
            <div className="flex flex-col items-center gap-2 py-16 text-red-500">
              <XCircle className="h-8 w-8" />
              <p className="text-sm font-medium">{error}</p>
              <Button variant="outline" size="sm" onClick={fetchRecruiters}>Try again</Button>
            </div>
          ) : (
            <>
              <RecruiterTable
                paginated={paginated}
                loading={loading}
                currentPage={safePage}
                toggle={toggle}
                SortIcon={SortIcon}
                onEdit={openEdit}
                onDelete={openDelete}
                canEdit={canEdit}
                canDelete={canDelete}
              />

              <UserPagination
                page={safePage}
                totalPages={totalPages}
                totalItems={sorted.length}
                pageSize={PAGE_SIZE}
                setPage={setPage}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* CRUD Dialogs */}
      <RecruiterFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        recruiter={selectedRec}
        onSubmit={handleCreateOrUpdate}
        loading={submitting}
      />

      {selectedRec && (
        <DeleteRecruiterDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          recruiter={selectedRec}
          onConfirm={handleDelete}
          loading={submitting}
        />
      )}
    </div>
  );
}
