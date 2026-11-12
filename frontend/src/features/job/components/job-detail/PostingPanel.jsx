import { Loader2, Megaphone, RefreshCw, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/common';
import { formatSinceDate } from '@/lib/job-display';

export default function PostingPanel({ displayChannels, isPosted, syncing, anySyncing, syncableChannels, onResync }) {
  return (
    <Card className="py-4 gap-3">
      <CardHeader>
        <CardTitle className="text-sm flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <Megaphone className="h-4 w-4 text-primary" /> Posting
          </span>
          {isPosted && (
            <span className="text-[10px] font-normal text-muted-foreground">
              {displayChannels.length} channel{displayChannels.length > 1 ? 's' : ''}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Posted status + Re-sync */}
        <div className="flex items-center justify-between gap-2">
          {isPosted ? (
            <span className="text-[11px] flex items-center gap-1.5 text-emerald-600">
              <CheckCircle2 className="h-3.5 w-3.5" /> Posted
            </span>
          ) : (
            <span className="text-[11px] text-muted-foreground">Not posted</span>
          )}
          <Button
            size="sm"
            variant="outline"
            className="text-xs"
            onClick={onResync}
            disabled={syncing || anySyncing || syncableChannels.length === 0}
            title={syncableChannels.length === 0 ? 'No syncable postings' : 'Pull latest applicants from all posted platforms'}
          >
            {(syncing || anySyncing)
              ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              : <RefreshCw className="h-3.5 w-3.5 mr-1.5" />}
            {(syncing || anySyncing) ? 'Syncing…' : 'Re-sync'}
          </Button>
        </div>

        {/* Channel list */}
        {displayChannels.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">
            Not posted to any channel yet.
          </p>
        ) : (
          <div className="space-y-2.5 pt-1 border-t">
            {displayChannels.map((ch) => (
              <div key={ch.id} className="space-y-1 pt-2.5 first:pt-1">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="outline" className="text-[10px] uppercase tracking-wide capitalize">
                    {ch.platform}
                  </Badge>
                  <StatusBadge
                    label={ch.status}
                    variant={
                      ch.status === 'Active'  ? 'success' :
                      ch.status === 'Running' ? 'warning' :
                      ch.status === 'Expired' ? 'danger'  : 'muted'
                    }
                    dot
                  />
                </div>
                <p className="text-xs truncate" title={ch.job_title}>{ch.job_title}</p>
                {ch.sync_state === 'syncing' ? (
                  <p className="text-[10px] text-primary flex items-center gap-1">
                    <Loader2 className="h-2.5 w-2.5 animate-spin" /> Syncing…
                  </p>
                ) : ch.sync_state === 'error' ? (
                  <p className="text-[10px] text-red-500">Sync failed</p>
                ) : (
                  <p className="text-[10px] text-muted-foreground">
                    {ch.last_sync ? `synced ${formatSinceDate(ch.last_sync)}` : 'never synced'}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
