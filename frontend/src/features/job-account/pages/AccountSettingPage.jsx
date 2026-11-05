import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, AlertTriangle, Loader2, Plus } from 'lucide-react';
import { Button }   from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Badge }    from '@/components/ui/badge';

import { createJobAccount, updateJobAccount, getJobAccountsByUserId } from '../api/account.api.js';
import { checkConnection, syncSeekJobPosts } from '@/api/job-posting-seek.api';
import { formatSinceDate } from '@/lib/job-display';

import { AccountFormDialog } from '@/features/job-account/components/account-row/AccountFormDialog';
import { hasPermission } from '@/utils/permissions';
import { useJobAccount } from '../hooks/use-account.js';

import linkedin from '@/assets/logos/linkedin.png';
import seek from '@/assets/logos/seek.png';
import glints from '@/assets/logos/glints.png';

const LOGOS = { linkedin, seek, glints };

const PUBLIC_CHANNELS = [
  { id: 'linkedin', name: 'LinkedIn' },
  { id: 'seek', name: 'Seek' },
  { id: 'glints', name: 'Glints' },
];

const channelFor = (portalName) => PUBLIC_CHANNELS.find((c) => c.id === portalName) || { id: portalName, name: portalName };

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

export default function IntegrationsSettings() {
  const { accounts, loading, error, 
          fetchAccount, createJobAccount, updateJobAccount, deleteJobAccount 
        } = useJobAccount();
  const canCreate = hasPermission('Settings', 'Integrations', 'create');
  const canEdit   = hasPermission('Settings', 'Integrations', 'update');

  const [busyAccountId, setBusyAccountId]       = useState(null);

  const openEdit = (account) => {
    setSelectedAccount(account);
    setSelectedPlatform(channelFor(account.portal_name));
    setFormOpen(true);
  };

  const openAddAccount = () => {
    setSelectedAccount(null);
    setSelectedPlatform(null); // no platform pre-bound — the dialog shows a picker
    setFormOpen(true);
  };

  const publicAccounts  = accounts.filter((acc) => PUBLIC_CHANNELS.some((c) => c.id === acc.portal_name));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-lg font-bold tracking-tight">Integrations</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Job portal credentials used to publish jobs and sync applications.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchAccount} disabled={loading}>
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {canCreate && (
            <Button size="sm" onClick={openAddAccount}>
              <Plus className="h-3.5 w-3.5" />
              Add Account
            </Button>
          )}
        </div>
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
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : publicAccounts.length === 0 ? (
            <div className="px-4 py-6 text-sm text-muted-foreground text-center">
              No public channel accounts connected yet.
            </div>
          ) : (
            publicAccounts.map((account) => {
              const channel = channelFor(account.portal_name);
              const busy = busyAccountId === account.id;

              return (
                <div
                  key={account.id}
                  className="flex flex-col gap-3 w-full px-4 py-3 border-b last:border-b-0 lg:flex-row lg:items-center lg:justify-between lg:gap-4"
                >
                  <div className="flex flex-col gap-3 min-w-0 sm:flex-row sm:flex-wrap sm:items-center sm:gap-8">
                    <div className="flex items-center gap-3 min-w-0 sm:w-44 sm:shrink-0">
                      <div className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0 overflow-hidden bg-muted/40">
                        <img src={LOGOS[channel.id]} alt={channel.name} className="h-full w-full object-contain" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-sm font-semibold">{channel.name}</span>
                        <div className="text-[11px] text-muted-foreground truncate" title={account.email || ''}>
                          Account: {account.email || '—'}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-0.5 shrink-0">
                      <div>Last connection: {account.last_connect ? formatSinceDate(account.last_connect) : '—'}</div>
                      <div>Last sync: {account.last_sync ? formatSinceDate(account.last_sync) : '—'}</div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 lg:justify-end">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs text-muted-foreground">Status</span>
                        <StatusBadge tone={connectionTone(account.status_connection)}>
                          {account.status_connection === 'Re-connecting' ? 'Re-connecting…' : (account.status_connection || 'Not connected')}
                        </StatusBadge>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs text-muted-foreground">Sync</span>
                        <StatusBadge tone={syncTone(account.status_sync)}>
                          {account.status_sync === 'Sync' ? 'Synced' : account.status_sync === 'Re-sync' ? 'Re-syncing…' : (account.status_sync || 'Not synced')}
                        </StatusBadge>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={!canEdit || account.status_connection !== 'Connected' || busy}
                        onClick={() => runAccountAction(account, syncSeekJobPosts, {
                          loading: 'Queuing sync…', success: 'Sync queued', error: 'Failed to queue sync',
                        })}
                      >
                        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Sync'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={!canEdit || account.status_connection === 'Re-connecting' || busy}
                        onClick={() => runAccountAction(account, checkConnection, {
                          loading: 'Checking connection…', success: 'Connection check queued', error: 'Failed to check connection',
                        })}
                      >
                        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Re-connect'}
                      </Button>
                      {canEdit && (
                        <Button size="sm" onClick={() => openEdit(account)}>
                          Configure
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

      {/* <AccountFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        account={selectedAccount}
        platform={selectedPlatform}
        platforms={PUBLIC_CHANNELS}
        loading={submitting}
      /> */}
    </div>
  );
}
