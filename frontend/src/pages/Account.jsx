import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, KeyRound, Plus, XCircle } from 'lucide-react';
import { Button }   from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner'
import { Badge }    from '@/components/ui/badge';

import { getJobAccounts, createJobAccount, updateJobAccount, deleteJobAccount, getJobAccountsByUserId } from '@/api/job-accounts.api';
import { checkConnection, syncSeekJobPosts } from '@/api/job-posting-seek.api';

import { hasPermission } from '@/utils/permissions';

import { AccountFormDialog }   from '@/components/job-account/AccountFormDialog';
import { DeleteAccountDialog } from '@/components/job-account/DeleteAccountDialog';

import linkedin from '@/assets/logos/linkedin.png';
import seek from '@/assets/logos/seek.png';
import glints from '@/assets/logos/glints.png';
import instagram from '@/assets/logos/instagram.png';
import facebook from '@/assets/logos/facebook.png';
import whatsapp from '@/assets/logos/whatsapp.png';

const LOGOS = { linkedin, seek, glints, instagram, facebook, whatsapp };

const PUBLIC_CHANNELS = [
  { id: 'linkedin', name: 'LinkedIn' },
  { id: 'seek', name: 'Seek' },
  { id: 'glints', name: 'Glints' }
];

const PRIVATE_CHANNELS = [
  { id: 'instagram', name: 'Instagram' },
  { id: 'facebook', name: 'Facebook' },
  { id: 'whatsapp', name: 'WhatsApp' }
];

export default function AccountPage() {
  const canCreate = hasPermission('Job Postings', 'Seek', 'create') || hasPermission('Job Postings', 'LinkedIn', 'create');
  const canEdit   = hasPermission('Job Postings', 'Seek', 'update') || hasPermission('Job Postings', 'LinkedIn', 'update');
  const canDelete = hasPermission('Job Postings', 'Seek', 'delete') || hasPermission('Job Postings', 'LinkedIn', 'delete');

  // ── Data ──
  const [accounts, setAccounts] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  const [user] = useState(JSON.parse(localStorage.getItem('user')));

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await getJobAccountsByUserId(user.id);
      setAccounts(data.accounts || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load job accounts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    async function fetch() {
      await fetchAccounts()
    }

    fetch()
  }, [fetchAccounts]);

  // ── Dialog state ──
  const [formOpen,         setFormOpen]         = useState(false);
  const [deleteOpen,       setDeleteOpen]       = useState(false);
  const [selectedAccount,  setSelectedAccount]  = useState(null);
  const [selectedPlatform,  setSelectedPlatform]  = useState(null);
  const [submitting,       setSubmitting]       = useState(false);


  const openConfigure = (platform, account) => {
    setSelectedAccount(account || null);
    setSelectedPlatform(platform);
    setFormOpen(true);
  };

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
        </div>
      </div>

      {/* Public Channel */}
      <Card className="py-0 gap-0">
        <CardHeader className="border-b !pb-0 flex items-center h-15">
          <CardTitle className="flex justify-between items-center w-full">
            <div>
              Public Channels
            </div>
            <div className="text-xs text-gray-400">
              Direct API publishing — applications flow back automatically
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {PUBLIC_CHANNELS.map((channels) => {
            const account = accounts.find(acc => acc.portal_name === channels.id);

            return (
              <div key={channels.id} className="flex justify-between items-center w-full border-b last:border-b-0">
                <div className="flex items-center gap-10">
                  <div className="flex items-center gap-3 py-3 border-b last:border-b-0">
                    <div className="h-10 w-10 rounded-lg flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                      <img src={LOGOS[channels.id]} />
                    </div>
                    <div className="flex-1 min-w-80">
                      <span className="text-sm font-semibold">{channels.name}</span>
                      <div className="text-xs text-gray-400">
                        Account: {account ? account?.email : '-'}
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">
                      Last Connection: {account?.last_connect || '-'}
                    </div>
                    <div className="text-xs text-gray-400">
                      Last Sync: {account?.last_sync || '-'}
                    </div>
                  </div>
                </div>

                <div className="flex gap-5">
                  <div className="min-w-45 inline">
                    <div className='flex justify-between'>
                      <div className="text-xs text-gray-400 mr-5">
                        Status :
                      </div>
                      <div className="flex items-center">
                        { account?.status_connection === 'Connected' ?
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-emerald-50 text-emerald-600 border-emerald-200">
                            Connected
                          </Badge> :
                          account?.status_connection === 'Re-connecting' ? 
                            <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-gray-50 text-gray-600 border-gray-200">
                              Re-connecting...
                            </Badge> :
                              <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-red-50 text-red-600 border-red-200">
                                {account?.status_connection || 'Not Connected'}
                              </Badge>
                          }
                      </div>
                    </div>
                    <div className='flex justify-between'>
                      <div className="text-xs text-gray-400 mr-5">
                        Sync Status :
                      </div>
                      <div className="flex items-center">
                        { account?.status_sync === 'Sync' ?
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-emerald-50 text-emerald-600 border-emerald-200">
                            Synced
                          </Badge> :
                          account?.status_sync === 'Re-sync' ? 
                            <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-gray-50 text-gray-600 border-gray-200">
                              Re-syncing...
                            </Badge> :
                              <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-red-50 text-red-600 border-red-200">
                                {account?.status_sync || 'Not sync'}
                              </Badge>
                          }
                      </div>
                    </div>
                  </div>

                  <Button disabled={!account || account?.status_connection !== 'Connected'} onClick={() => toast.promise(syncSeekJobPosts(account.id), { position: "top-center", loading: 'Connection Queued', success: 'Queued Created', error: 'Queued Error' })}>
                    Sync
                  </Button>
                  <Button disabled={!account || account?.status_connection === 'Re-connecting'} onClick={() => toast.promise(checkConnection(account.id), { position: "top-center", loading: 'Connection Queued', success: 'Queued Created', error: 'Queued Error' })}>
                    Re-connect
                  </Button>
                  <Button onClick={() => openConfigure(channels.id, account)}>
                    Configure
                  </Button>
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Private Channels */}
      <Card className="py-0 gap-0">
        <CardHeader className="border-b !pb-0 flex items-center h-15">
          <CardTitle className="flex justify-between items-center w-full">
            <div>
              Private Channels
            </div>
            <div className="text-xs text-gray-400">
              Social sharing & broadcast channels
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {PRIVATE_CHANNELS.map((channels) => {
            const account = accounts.find(acc => acc.portal_name === channels.id);

            return (
              <div key={channels.id} className="flex justify-between items-center w-full border-b last:border-b-0">
                <div className="flex items-center gap-10">
                  <div key={channels.id} className="flex items-center gap-3 py-3">
                    <div className="h-10 w-10 rounded-lg flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                      <img src={LOGOS[channels.id]} />

                    </div>
                    <div className="flex-1 min-w-20">
                      <span className="text-sm font-semibold">{channels.name}</span>
                      <div className="">
                        {account ?
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-emerald-50 text-emerald-600 border-emerald-200">
                            {account.condition || 'Connected'} {/* still dummy db wrong */}
                          </Badge> :
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-red-50 text-red-600 border-red-200">
                            Not Connected
                          </Badge>
                        }
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400">
                    Last Connection: {account?.last_connect || '-'}
                  </div>
                </div>

                <div className="flex gap-5">
                  <Button disabled={!account} onClick={() => toast.promise(new Promise(resolve => setTimeout(resolve, 3000)))}>
                    Re-connect
                  </Button>
                  <Button onClick={() => openConfigure(channels.id, account)}>
                    Configure
                  </Button>
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <AccountFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        account={selectedAccount}
        user={user}
        platform={selectedPlatform}
        onSubmit={handleCreateOrUpdate}
        loading={submitting}
      />
    </div>
  );
}