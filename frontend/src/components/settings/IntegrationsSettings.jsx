import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, AlertTriangle, Loader2 } from 'lucide-react';
import { Button }   from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Badge }    from '@/components/ui/badge';

import { createJobAccount, updateJobAccount, getJobAccountsByUserId } from '@/api/job-accounts.api';
import { checkConnection, syncSeekJobPosts } from '@/api/job-posting-seek.api';

import { AccountFormDialog } from '@/components/job-account/AccountFormDialog';
import { hasPermission } from '@/utils/permissions';

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
  { id: 'glints', name: 'Glints' },
];

const PRIVATE_CHANNELS = [
  { id: 'instagram', name: 'Instagram' },
  { id: 'facebook', name: 'Facebook' },
  { id: 'whatsapp', name: 'WhatsApp' },
];

// Shared badge tones — warm-cream tokens (bg-muted/text-muted-foreground/
// border-border), not the hardcoded slate/gray classes the ported version had.
const BADGE_TONE = {
  positive: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  neutral:  'bg-muted text-muted-foreground border-border',
  negative: 'bg-rose-50 text-rose-600 border-rose-200',
};

function StatusBadge({ tone, children }) {
  return (
    <Badge variant="outline" className={`text-[9px] px-1.5 py-0 ${BADGE_TONE[tone]}`}>
      {children}
    </Badge>
  );
}

function connectionTone(status) {
  if (status === 'Connected') return 'positive';
  if (status === 'Re-connecting') return 'neutral';
  return 'negative';
}

function syncTone(status) {
  if (status === 'Sync') return 'positive';
  if (status === 'Re-sync') return 'neutral';
  return 'negative';
}

/*
 * Integrations settings — real job platform connections, backed by
 * master_job_account (same table pages/Account.jsx already uses at
 * /settings/account). Ported that page's logic in here rather than
 * rebuilding, since it already works.
 *
 * Previously this tab was a hardcoded INTEGRATION_GROUPS mockup with zero
 * API calls — deleted rather than kept alongside the real thing. There is
 * still a second standalone mockup at pages/Integrations.jsx
 * (/settings/integrations route) that duplicates this same fake concept —
 * not touched here, flagged separately.
 *
 * Layout fix: each channel row used to be a single "flex items-center
 * justify-between flex-wrap" line with shrink-0 on nearly every child
 * (the w-56 identity block, the connection-info block, the button group).
 * flex-wrap only lets the *outer* row break, so once the button group
 * (which had no wrap of its own) needed more width than was left on
 * narrower viewports, it pushed past the card edge and caused horizontal
 * overflow. Rows now stack vertically below `lg` and each inner group
 * wraps/shrinks on its own, so nothing is forced wider than its container.
 */
export default function IntegrationsSettings() {
  const canCreate = hasPermission('Settings', 'Integrations', 'create');
  const canEdit   = hasPermission('Settings', 'Integrations', 'update');
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  const [user] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
  });

  const fetchAccounts = useCallback(async () => {
    if (!user?.id) { setLoading(false); return; }
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
  }, [user?.id]);

  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);

  const [formOpen, setFormOpen]                 = useState(false);
  const [selectedAccount, setSelectedAccount]   = useState(null);
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const [submitting, setSubmitting]             = useState(false);
  const [busyAccountId, setBusyAccountId]       = useState(null);

  const openConfigure = (platform, account) => {
    setSelectedAccount(account || null);
    setSelectedPlatform(platform);
    setFormOpen(true);
  };

  const handleCreateOrUpdate = async (payload, accountId) => {
    if (accountId ? !canEdit : !canCreate) return;
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

  const runAccountAction = async (account, action, messages) => {
    setBusyAccountId(account.id);
    try {
      await toast.promise(action(account.id), { position: 'top-center', ...messages });
    } finally {
      setBusyAccountId(null);
      fetchAccounts();
    }
  };

  if (!user?.id) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 rounded-lg border border-amber-200 bg-amber-50 text-sm text-amber-700">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        You must be signed in to manage integrations.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-lg font-bold tracking-tight">Integrations</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Job portal credentials used to publish jobs and sync applications.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchAccounts} disabled={loading}>
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg border border-red-200 bg-red-50 text-sm text-red-600">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Public Channels */}
      <Card className="py-0 gap-0">
        <CardHeader className="border-b !pb-3 pt-3 flex items-center min-h-14">
          <CardTitle className="flex justify-between items-center w-full gap-3 flex-wrap">
            <span className="text-sm">Public Channels</span>
            <span className="text-xs font-normal text-muted-foreground">
              Direct API publishing — applications flow back automatically
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0 py-0">
          {loading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: PUBLIC_CHANNELS.length }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : (
            PUBLIC_CHANNELS.map((channel) => {
              const account = accounts.find((acc) => acc.portal_name === channel.id);
              const busy = busyAccountId === account?.id;

              return (
                <div
                  key={channel.id}
                  className="flex flex-col gap-3 w-full px-4 py-3 border-b last:border-b-0 lg:flex-row lg:items-center lg:justify-between lg:gap-4"
                >
                  <div className="flex flex-col gap-3 min-w-0 sm:flex-row sm:items-center sm:gap-8">
                    <div className="flex items-center gap-3 min-w-0 sm:w-56 sm:shrink-0">
                      <div className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0 overflow-hidden bg-muted/40">
                        <img src={LOGOS[channel.id]} alt={channel.name} className="h-full w-full object-contain" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-sm font-semibold">{channel.name}</span>
                        <div className="text-xs text-muted-foreground truncate" title={account?.email || ''}>
                          Account: {account?.email || '—'}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-0.5 shrink-0">
                      <div>Last connection: {account?.last_connect || '—'}</div>
                      <div>Last sync: {account?.last_sync || '—'}</div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 lg:justify-end">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs text-muted-foreground">Status</span>
                        <StatusBadge tone={connectionTone(account?.status_connection)}>
                          {account?.status_connection === 'Re-connecting' ? 'Re-connecting…' : (account?.status_connection || 'Not connected')}
                        </StatusBadge>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs text-muted-foreground">Sync</span>
                        <StatusBadge tone={syncTone(account?.status_sync)}>
                          {account?.status_sync === 'Sync' ? 'Synced' : account?.status_sync === 'Re-sync' ? 'Re-syncing…' : (account?.status_sync || 'Not synced')}
                        </StatusBadge>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={!canEdit || !account || account?.status_connection !== 'Connected' || busy}
                        onClick={() => runAccountAction(account, syncSeekJobPosts, {
                          loading: 'Queuing sync…', success: 'Sync queued', error: 'Failed to queue sync',
                        })}
                      >
                        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Sync'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={!canEdit || !account || account?.status_connection === 'Re-connecting' || busy}
                        onClick={() => runAccountAction(account, checkConnection, {
                          loading: 'Checking connection…', success: 'Connection check queued', error: 'Failed to check connection',
                        })}
                      >
                        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Re-connect'}
                      </Button>
                      {(account ? canEdit : canCreate) && (
                        <Button size="sm" onClick={() => openConfigure(channel.id, account)}>
                          {account ? 'Configure' : 'Connect'}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Private Channels */}
      <Card className="py-0 gap-0">
        <CardHeader className="border-b !pb-3 pt-3 flex items-center min-h-14">
          <CardTitle className="flex justify-between items-center w-full gap-3 flex-wrap">
            <span className="text-sm">Private Channels</span>
            <span className="text-xs font-normal text-muted-foreground">
              Social sharing & broadcast channels
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0 py-0">
          {loading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: PRIVATE_CHANNELS.length }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : (
            PRIVATE_CHANNELS.map((channel) => {
              const account = accounts.find((acc) => acc.portal_name === channel.id);

              return (
                <div
                  key={channel.id}
                  className="flex flex-col gap-3 w-full px-4 py-3 border-b last:border-b-0 lg:flex-row lg:items-center lg:justify-between lg:gap-4"
                >
                  <div className="flex flex-col gap-3 min-w-0 sm:flex-row sm:items-center sm:gap-8">
                    <div className="flex items-center gap-3 min-w-0 sm:w-56 sm:shrink-0">
                      <div className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0 overflow-hidden bg-muted/40">
                        <img src={LOGOS[channel.id]} alt={channel.name} className="h-full w-full object-contain" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-sm font-semibold truncate block">{channel.name}</span>
                        <div>
                          {account ? (
                            <StatusBadge tone="positive">{account.condition || 'Connected'}</StatusBadge>
                          ) : (
                            <StatusBadge tone="negative">Not connected</StatusBadge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground shrink-0">
                      Last connection: {account?.last_connect || '—'}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!canEdit || !account}
                      onClick={() => toast.promise(new Promise((resolve) => setTimeout(resolve, 3000)), {
                        position: 'top-center', loading: 'Reconnecting…', success: 'Reconnected', error: 'Failed to reconnect',
                      })}
                    >
                      Re-connect
                    </Button>
                    {(account ? canEdit : canCreate) && (
                      <Button size="sm" onClick={() => openConfigure(channel.id, account)}>
                        {account ? 'Configure' : 'Connect'}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

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