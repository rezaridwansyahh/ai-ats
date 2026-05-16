import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Copy, Check, Loader2, AlertTriangle, Sparkles, CheckCircle2 } from 'lucide-react';
import { BATTERIES } from '@/lib/batteries';
import { generateSessionFromCandidate } from '@/api/session.api';

// Tab 2: portal-link generator + read-only per-subtest status.
// Session state is owned by the parent (CandidateDetail) so it survives refresh —
// this component just picks the row matching the active battery and asks the parent
// to merge updates after Generate URL.
export default function TakeTab({
  battery,
  subtestStatus,
  candidateId,
  jobId,
  existingSessions = [],
  onSessionsChange,
}) {
  const [generating, setGenerating] = useState(false);
  const [error, setError]           = useState(null);

  if (!battery) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-xs text-muted-foreground">
          No battery selected. Go back to <span className="font-bold">Setup</span> to pick a battery first.
        </CardContent>
      </Card>
    );
  }

  const def = BATTERIES[battery];
  const scoredCount = def.tests.filter((t) => subtestStatus?.[t.key] === 'scored').length;
  // Most-recent live session for the active battery (parent's array is sorted DESC).
  const session = existingSessions.find((s) => s.battery === battery) || null;

  const handleGenerate = async () => {
    if (!candidateId) {
      setError('Cannot generate: candidate id missing.');
      return;
    }
    setGenerating(true);
    setError(null);
    try {
      const res = await generateSessionFromCandidate({
        candidate_id: Number(candidateId),
        job_id:       jobId ? Number(jobId) : null,
        battery,
      });
      const fresh = res.data?.session ?? null;
      if (fresh && onSessionsChange) {
        // Merge: replace any prior row for this battery, prepend so it stays first.
        onSessionsChange((prev) => [fresh, ...prev.filter((s) => s.battery !== fresh.battery)]);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate URL.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-sm font-bold">Take · candidate-facing portal</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Battery {def.code} · {def.label}
            </p>
          </div>
          <span className="text-[11px] text-primary font-semibold">
            {scoredCount} of {def.tests.length} tests scored
            {scoredCount === def.tests.length ? ' · auto-advances to Score & Decide' : ''}
          </span>
        </div>

        {session
          ? <PortalLinkPanel
              battery={def.code}
              token={session.token}
              status={session.status}
              submittedAt={session.submitted_at}
            />
          : <GeneratePanel onGenerate={handleGenerate} generating={generating} error={error} />}

        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider">Test</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider w-[140px]">Status</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider">Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {def.tests.map((t) => {
                const status = subtestStatus?.[t.key] || 'invited';
                return (
                  <TableRow key={t.key}>
                    <TableCell className="font-bold text-xs">{t.name}</TableCell>
                    <TableCell>
                      <StatusPill status={status} />
                    </TableCell>
                    <TableCell className="text-[11px] text-muted-foreground">{t.detail}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function GeneratePanel({ onGenerate, generating, error }) {
  return (
    <div className="rounded-lg border border-dashed bg-muted/20 p-4 flex items-center justify-between gap-3 flex-wrap">
      <div className="min-w-0">
        <div className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">
          Portal link
        </div>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          {error
            ? <span className="text-red-600 inline-flex items-center gap-1"><AlertTriangle className="h-3 w-3" />{error}</span>
            : 'No invitation generated yet. Click below to mint a single-use 7-day link for this candidate.'}
        </p>
      </div>
      <Button size="sm" onClick={onGenerate} disabled={generating}>
        {generating ? (
          <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />Generating…</>
        ) : (
          <><Sparkles className="h-3.5 w-3.5 mr-1.5" />Generate URL</>
        )}
      </Button>
    </div>
  );
}

function PortalLinkPanel({ battery, token, status, submittedAt }) {
  const dashless = String(token || '').replaceAll('-', '');
  const url = `${window.location.origin}/portal/assessment-placement/${dashless}`;
  const [copied, setCopied] = useState(false);
  const isCompleted = status === 'completed';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API may be unavailable on non-HTTPS hosts; ignore.
    }
  };

  return (
    <div className="rounded-lg border bg-muted/30 p-3">
      <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
        <div className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">
          Portal link · single-use, 7-day token
        </div>
        {isCompleted && (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">
            <CheckCircle2 className="h-3 w-3" />
            Submitted{submittedAt ? ` · ${formatSubmittedAt(submittedAt)}` : ''}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold tracking-wider uppercase text-muted-foreground shrink-0">
          Battery {battery}
        </span>
        <code className="flex-1 truncate text-[11px] font-mono text-foreground bg-background border rounded px-2 py-1.5">
          {url}
        </code>
        <Button size="sm" variant="outline" className="h-7 text-xs shrink-0" onClick={handleCopy}>
          {copied ? <><Check className="h-3 w-3 mr-1" />Copied</> : <><Copy className="h-3 w-3 mr-1" />Copy</>}
        </Button>
      </div>
    </div>
  );
}

function formatSubmittedAt(iso) {
  try {
    return new Date(iso).toLocaleString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return '';
  }
}

function StatusPill({ status }) {
  const map = {
    scored:  { label: 'Scored',  cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    invited: { label: 'Invited', cls: 'bg-slate-50 text-slate-500 border-slate-200'       },
  };
  const v = map[status] || map.invited;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${v.cls}`}>
      {v.label}
    </span>
  );
}
