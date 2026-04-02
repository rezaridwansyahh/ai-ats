import { useState } from 'react';
import { RefreshCw, KeyRound, Settings, Trash2, Link2 } from 'lucide-react';
import { Button }   from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// import { getJobAccounts, createJobAccount, updateJobAccount, deleteJobAccount } from '@/api/job-accounts.api';
import { hasPermission } from '@/utils/permissions';

import { AccountFormDialog }   from '@/components/job-account/AccountFormDialog';
import { DeleteAccountDialog } from '@/components/job-account/DeleteAccountDialog';

import linkedin  from '@/assets/logos/linkedin.png';
import seek      from '@/assets/logos/seek.png';
import glints    from '@/assets/logos/glints.png';
import instagram from '@/assets/logos/instagram.png';
import facebook  from '@/assets/logos/facebook.png';
import whatsapp  from '@/assets/logos/whatsapp.png';

const LOGOS = { linkedin, seek, glints, instagram, facebook, whatsapp };

const PLATFORM_GROUPS = [
  {
    label: 'Job Board API Credentials',
    subtitle: 'Direct API publishing — applications flow back automatically',
    icon: <KeyRound className="h-4 w-4" />,
    platforms: [
      { id: 'linkedin', name: 'LinkedIn Jobs',  badge: 'in', color: '#0A66C2' },
      { id: 'seek',     name: 'JobStreet / Seek', badge: 'JS', color: '#5843BE' },
      { id: 'glints',   name: 'Glints',          badge: 'G',  color: '#0A6E5C' },
    ],
  },
  {
    label: 'Social Media Accounts',
    subtitle: 'Share job postings to social platforms',
    icon: <Link2 className="h-4 w-4" />,
    platforms: [
      { id: 'instagram', name: 'Instagram', badge: 'IG', color: null },
      { id: 'facebook',  name: 'Facebook',  badge: 'FB', color: '#1877F2' },
    ],
  },
  {
    label: 'Other Channels',
    subtitle: 'Additional messaging and broadcast channels',
    icon: <Settings className="h-4 w-4" />,
    platforms: [
      { id: 'whatsapp', name: 'WhatsApp Business', badge: 'WA', color: '#25D366' },
    ],
  },
];

export default function AccountPage() {
  const canCreate = hasPermission('Job Postings', 'Seek', 'create') || hasPermission('Job Postings', 'LinkedIn', 'create');
  const canEdit   = hasPermission('Job Postings', 'Seek', 'update') || hasPermission('Job Postings', 'LinkedIn', 'update');
  const canDelete = hasPermission('Job Postings', 'Seek', 'delete') || hasPermission('Job Postings', 'LinkedIn', 'delete');

  // ── Data (mockup — no API calls) ──
  const [accounts, setAccounts] = useState([]);
  const error = null;

  // ── Dialog state ──
  const [formOpen,        setFormOpen]        = useState(false);
  const [deleteOpen,      setDeleteOpen]      = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const [submitting,      setSubmitting]      = useState(false);

  const openConnect = (platform) => {
    setSelectedAccount(null);
    setSelectedPlatform(platform);
    setFormOpen(true);
  };

  const openEdit = (account, platform) => {
    setSelectedAccount(account);
    setSelectedPlatform(platform);
    setFormOpen(true);
  };

  const openDelete = (account, platform) => {
    setSelectedAccount(account);
    setSelectedPlatform(platform);
    setDeleteOpen(true);
  };

  // ── CRUD handlers (mockup — local state only) ──
  let nextId = accounts.length + 1;

  const handleCreateOrUpdate = async (payload, accountId) => {
    setSubmitting(true);
    try {
      if (accountId) {
        setAccounts(prev => prev.map(a => a.id === accountId ? { ...a, ...payload } : a));
      } else {
        setAccounts(prev => [...prev, {
          id: nextId++,
          portal_name: payload.portal_name,
          email: payload.email,
          condition: 'Connected',
          last_sync: null,
        }]);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (accountId) => {
    setSubmitting(true);
    try {
      setAccounts(prev => prev.filter(a => a.id !== accountId));
    } finally {
      setSubmitting(false);
    }
  };

  // ── Helpers ──
  const getAccountForPlatform = (platformId) =>
    accounts.find(acc => acc.portal_name === platformId);

  const connectedCount    = accounts.filter(a => a.condition === 'Connected').length;
  const disconnectedCount = PLATFORM_GROUPS.reduce((sum, g) => sum + g.platforms.length, 0) - accounts.length;

  return (
    <div className="flex flex-col gap-5 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Job Accounts</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage job portal credentials and channel connections.
          </p>
        </div>
        <Button variant="outline" size="sm" disabled>
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="py-3">
          <CardContent className="flex items-center gap-3 py-0">
            <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center">
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </div>
            <div>
              <p className="text-lg font-bold">{connectedCount}</p>
              <p className="text-[10px] text-muted-foreground">Connected</p>
            </div>
          </CardContent>
        </Card>
        <Card className="py-3">
          <CardContent className="flex items-center gap-3 py-0">
            <div className="h-8 w-8 rounded-lg bg-red-50 flex items-center justify-center">
              <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
            </div>
            <div>
              <p className="text-lg font-bold">{disconnectedCount < 0 ? 0 : disconnectedCount}</p>
              <p className="text-[10px] text-muted-foreground">Not Connected</p>
            </div>
          </CardContent>
        </Card>
        <Card className="py-3">
          <CardContent className="flex items-center gap-3 py-0">
            <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <div className="h-2.5 w-2.5 rounded-full bg-blue-500" />
            </div>
            <div>
              <p className="text-lg font-bold">{PLATFORM_GROUPS.reduce((s, g) => s + g.platforms.length, 0)}</p>
              <p className="text-[10px] text-muted-foreground">Total Channels</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Error */}
      {error && (
        <div className="text-sm text-destructive text-center py-4">
          {error}
          <Button variant="outline" size="sm" className="ml-3">Try again</Button>
        </div>
      )}

      {/* Platform Groups */}
      {PLATFORM_GROUPS.map((group) => (
        <Card key={group.label} className="pt-0 gap-0">
          <CardHeader className="py-3 px-5 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">{group.icon}</span>
                <CardTitle className="text-[13px] font-bold">{group.label}</CardTitle>
              </div>
              <span className="text-[10px] text-muted-foreground italic">{group.subtitle}</span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {group.platforms.map((platform) => {
              const account = getAccountForPlatform(platform.id);
              const isConnected = account?.condition === 'Connected';

              return (
                <div
                  key={platform.id}
                  className="flex items-center gap-3 px-5 py-3.5 border-b last:border-b-0"
                >
                  {/* Platform logo */}
                  <div className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
                    {LOGOS[platform.id] ? (
                      <img src={LOGOS[platform.id]} alt={platform.name} className="h-10 w-10 object-contain" />
                    ) : (
                      <div
                        className="h-10 w-10 rounded-lg flex items-center justify-center text-white text-[10px] font-bold"
                        style={
                          platform.id === 'instagram'
                            ? { background: 'linear-gradient(135deg, #833AB4, #FD1D1D, #F77737)' }
                            : { background: platform.color || '#666' }
                        }
                      >
                        {platform.badge}
                      </div>
                    )}
                  </div>

                  {/* Platform info */}
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-semibold">{platform.name}</span>
                    {account && (
                      <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                        {account.email}
                        {account.last_sync && (
                          <span> &middot; Last synced: {new Date(account.last_sync).toLocaleString()}</span>
                        )}
                      </p>
                    )}
                  </div>

                  {/* Connection status */}
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full shrink-0 ${isConnected ? 'bg-emerald-500' : 'bg-red-400'}`} />
                    <span className={`text-[11px] font-medium ${isConnected ? 'text-emerald-600' : 'text-red-500'}`}>
                      {isConnected ? 'Connected' : 'Not connected'}
                    </span>
                  </div>

                  {/* Action buttons */}
                  {account ? (
                    <div className="flex items-center gap-2">
                      {canEdit && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-[11px] h-8 px-3"
                          onClick={() => openEdit(account, platform)}
                        >
                          <Settings className="h-3 w-3 mr-1" /> Manage
                        </Button>
                      )}
                      {canDelete && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-[11px] h-8 px-3 text-destructive hover:text-destructive"
                          onClick={() => openDelete(account, platform)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  ) : (
                    canCreate && (
                      <Button
                        size="sm"
                        className="text-[11px] h-8 px-4"
                        onClick={() => openConnect(platform)}
                      >
                        Connect
                      </Button>
                    )
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      ))}

      {/* Dialogs */}
      <AccountFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        account={selectedAccount}
        platform={selectedPlatform}
        onSubmit={handleCreateOrUpdate}
        loading={submitting}
      />

      {selectedAccount && (
        <DeleteAccountDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          account={selectedAccount}
          platformName={selectedPlatform?.name}
          onConfirm={handleDelete}
          loading={submitting}
        />
      )}
    </div>
  );
}
