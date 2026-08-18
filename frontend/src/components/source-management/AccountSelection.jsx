import { useState, useMemo } from 'react';
import { Loader2, Link2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/common';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

const CONNECTION_VARIANT = {
  Connected: 'success',
  'Not Connected': 'muted',
  Error: 'danger',
};

const PLATFORM_OPTIONS = ['seek', 'linkedin', 'glints'];
const PAGE_SIZE = 5;

/**
 * AccountSelectionStep — Step 1 of Source Management.
 * Lists the connected job accounts (master_job_account) — the real anchor
 * for sourcing data, since core_job_sourcing.account_id is what everything
 * downstream is actually scoped by.
 */
export default function AccountSelectionStep({ accounts, loading, selectedAccount, onSelectAccount }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [page, setPage] = useState(1);

  const filteredAccounts = useMemo(() => {
    return accounts.filter(account => {
      const matchesSearch = !searchQuery || account.email?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPlatform = platformFilter === 'all' || account.portal_name === platformFilter;
      return matchesSearch && matchesPlatform;
    });
  }, [accounts, searchQuery, platformFilter]);

  const totalPages = Math.ceil(filteredAccounts.length / PAGE_SIZE);
  const paginatedAccounts = filteredAccounts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-5">
      <Card data-tour="source-mgmt-account-list">
        <CardHeader className="pb-3 space-y-3">
          <CardTitle className="text-sm">Connected Accounts</CardTitle>
          <div className="flex items-center gap-3">
            <Input
              placeholder="Search by email..."
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setPage(1); }}
              className="max-w-[250px] text-xs"
            />
            <Select value={platformFilter} onValueChange={v => { setPlatformFilter(v); setPage(1); }}>
              <SelectTrigger className="w-[150px] text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Platforms</SelectItem>
                {PLATFORM_OPTIONS.map(p => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : filteredAccounts.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-10">
              {accounts.length === 0
                ? 'No connected accounts yet. Connect one under Settings → Integrations.'
                : 'No accounts match your search.'}
            </p>
          ) : (
            <div className="space-y-2">
              {paginatedAccounts.map(account => {
                const isConnected = account.status_connection === 'Connected';
                const isSelected  = selectedAccount?.id === account.id;
                return (
                  <div
                    key={account.id}
                    onClick={() => isConnected && onSelectAccount(isSelected ? null : account)}
                    className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${
                      isSelected
                        ? 'ring-2 ring-primary bg-primary/5'
                        : isConnected
                          ? 'hover:bg-muted/30 cursor-pointer'
                          : 'opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Link2 className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold capitalize">{account.portal_name}</span>
                          <StatusBadge
                            label={account.status_connection}
                            variant={CONNECTION_VARIANT[account.status_connection] ?? 'muted'}
                            dot
                          />
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate">{account.email}</p>
                      </div>
                    </div>
                    {!isConnected && (
                      <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
                        Reconnect in Settings first
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          <div className="flex flex-col items-center gap-2 pt-3 border-t mt-3">
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" className="h-7 text-xs" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                Previous
              </Button>
              {(() => {
                const pages = [];
                pages.push(1);
                if (page > 3) pages.push('...');
                for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
                  pages.push(i);
                }
                if (page < totalPages - 2) pages.push('...');
                if (totalPages > 1) pages.push(totalPages);
                return pages.map((p, idx) =>
                  p === '...' ? (
                    <span key={`dots-${idx}`} className="text-xs text-muted-foreground px-1">...</span>
                  ) : (
                    <Button
                      key={p}
                      variant={page === p ? 'default' : 'outline'}
                      size="sm"
                      className="h-7 w-7 text-xs p-0"
                      onClick={() => setPage(p)}
                    >
                      {p}
                    </Button>
                  )
                );
              })()}
              <Button variant="outline" size="sm" className="h-7 text-xs" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                Next
              </Button>
            </div>
            <span className="text-[10px] text-muted-foreground">
              {filteredAccounts.length > 0
                ? `Showing ${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, filteredAccounts.length)} of ${filteredAccounts.length}`
                : 'No results'}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
