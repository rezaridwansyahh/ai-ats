import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, KeyRound, Plus, XCircle } from 'lucide-react';
import { Button }   from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { StatCard }  from '@/components/cards/StatCard';

import { getJobAccounts, createJobAccount, updateJobAccount, deleteJobAccount } from '@/api/job-accounts.api';
import { getUsers } from '@/api/users.api';
import { hasPermission } from '@/utils/permissions';

import { AccountTable }        from '@/components/job-account/AccountTable';
import { AccountFormDialog }   from '@/components/job-account/AccountFormDialog';
import { DeleteAccountDialog } from '@/components/job-account/DeleteAccountDialog';

export default function AccountPage() {
  const canCreate = hasPermission('Job Postings', 'Seek', 'create') || hasPermission('Job Postings', 'LinkedIn', 'create');
  const canEdit   = hasPermission('Job Postings', 'Seek', 'update') || hasPermission('Job Postings', 'LinkedIn', 'update');
  const canDelete = hasPermission('Job Postings', 'Seek', 'delete') || hasPermission('Job Postings', 'LinkedIn', 'delete');

  // ── Data ──
  const [accounts, setAccounts] = useState([]);
  const [users,    setUsers]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await getJobAccounts();
      setAccounts(data.accounts || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load job accounts');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const { data } = await getUsers();
      setUsers(data.users || []);
    } catch (err) {
      console.error('Failed to load users:', err);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
    fetchUsers();
  }, [fetchAccounts, fetchUsers]);

  // ── Dialog state ──
  const [formOpen,         setFormOpen]         = useState(false);
  const [deleteOpen,       setDeleteOpen]       = useState(false);
  const [selectedAccount,  setSelectedAccount]  = useState(null);
  const [submitting,       setSubmitting]       = useState(false);

  const openCreate = () => { setSelectedAccount(null); setFormOpen(true); };
  const openEdit   = (account) => { setSelectedAccount(account); setFormOpen(true); };
  const openDelete = (account) => { setSelectedAccount(account); setDeleteOpen(true); };

  // ── CRUD handlers ──
  const handleCreateOrUpdate = async (payload, accountId) => {
    setSubmitting(true);
    try {
      if (accountId) {
        await updateJobAccount(accountId, payload);
      } else {
        await createJobAccount(payload);
      }
      await fetchAccounts();
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (accountId) => {
    setSubmitting(true);
    try {
      await deleteJobAccount(accountId);
      await fetchAccounts();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Job Accounts</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage job portal credentials for users.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchAccounts} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {canCreate && (
            <Button size="sm" onClick={openCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Add Account
            </Button>
          )}
        </div>
      </div>

      {/* Stat card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard
          icon={<KeyRound className="h-5 w-5 text-orange-500" />}
          label="Total Accounts"
          value={accounts.length}
          loading={loading}
        />
      </div>

      {/* Table card */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">All Job Accounts</CardTitle>
          <CardDescription>
            {loading ? 'Loading…' : `${accounts.length} account${accounts.length !== 1 ? 's' : ''}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="flex flex-col items-center gap-2 py-16 text-destructive">
              <XCircle className="h-8 w-8" />
              <p className="text-sm font-medium">{error}</p>
              <Button variant="outline" size="sm" onClick={fetchAccounts}>Try again</Button>
            </div>
          ) : (
            <AccountTable
              accounts={accounts}
              loading={loading}
              onEdit={openEdit}
              onDelete={openDelete}
              canEdit={canEdit}
              canDelete={canDelete}
            />
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <AccountFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        account={selectedAccount}
        users={users}
        onSubmit={handleCreateOrUpdate}
        loading={submitting}
      />

      {selectedAccount && (
        <DeleteAccountDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          account={selectedAccount}
          onConfirm={handleDelete}
          loading={submitting}
        />
      )}
    </div>
  );
}
