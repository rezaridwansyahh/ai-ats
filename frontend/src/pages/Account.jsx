import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, KeyRound, Plus, XCircle } from 'lucide-react';
import { Button }   from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { StatCard }  from '@/components/cards/StatCard';
import { Badge }    from '@/components/ui/badge';

import { getJobAccounts, createJobAccount, updateJobAccount, deleteJobAccount } from '@/api/job-accounts.api';
import { getUsers } from '@/api/users.api';
import { hasPermission } from '@/utils/permissions';

import linkedin from '@/assets/logos/linkedin.png';
import seek from '@/assets/logos/seek.png';
import glints from '@/assets/logos/glints.png';
import instagram from '@/assets/logos/instagram.png';
import facebook from '@/assets/logos/facebook.png';
import whatsapp from '@/assets/logos/whatsapp.png';

const LOGOS = { linkedin, seek, glints, instagram, facebook, whatsapp };

const PLATFORMS = [
  { id: 'linkedin', name: 'LinkedIn' },
  { id: 'seek', name: 'Seek' },
  { id: 'glints', name: 'Glints' },
  { id: 'instagram', name: 'Instagram' },
  { id: 'facebook', name: 'Facebook' },
  { id: 'whatsapp', name: 'WhatsApp' }
]

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
    <div className="flex flex-col gap-5 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Job Accounts</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage job portal credentials for users.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchAccounts} disabled={loading}>
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {canCreate && (
            <Button size="sm" onClick={openCreate}>
              <Plus className="h-3.5 w-3.5" />
              Add Account
            </Button>
          )}
        </div>
      </div>

      {/* Table card */}
      
      {PLATFORMS.map((platform) => {
        const account = accounts.find(acc => acc.portal_name === platform.id);

        return (
          <Card key={platform.id} className="py-1">
            <CardContent className="">
              <div className="flex items-center gap-3 py-3 border-b last:border-b-0">
                <div className="h-10 w-10 rounded-lg flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                  <img src={LOGOS[platform.id]} />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-semibold">{platform.name}</span>
                  <div className="mt-0.5">
                    {account ? 
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-emerald-50 text-emerald-600 border-emerald-200">
                        {account.condition}
                      </Badge> :
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-red-50 text-red-600 border-red-200">
                        Not Connected
                      </Badge>
                    }
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  );
}
