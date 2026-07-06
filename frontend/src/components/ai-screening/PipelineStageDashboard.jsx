import { useMemo, useState } from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatCard } from './shared';

function recommendation(score) {
  if (score == null) return { label: 'Awaiting score', tone: 'bg-muted text-muted-foreground border-border', bucket: 'awaiting' };
  if (score >= 80) return { label: 'Advance',            tone: 'bg-emerald-50 text-emerald-700 border-emerald-200', bucket: 'advance' };
  if (score >= 60) return { label: 'Hold · borderline',  tone: 'bg-amber-50 text-amber-700 border-amber-200',       bucket: 'awaiting' };
  return                  { label: 'Reject · below threshold', tone: 'bg-rose-50 text-rose-700 border-rose-200',    bucket: 'archive' };
}

function scoreBg(score) {
  if (score == null) return 'bg-gray-100 text-gray-500 border-gray-200';
  if (score >= 80) return 'bg-emerald-100 text-emerald-700 border-emerald-200';
  if (score >= 60) return 'bg-amber-100 text-amber-700 border-amber-200';
  return 'bg-rose-100 text-rose-700 border-rose-200';
}

/*
 * Job-level "Screening Pipeline" dashboard — mirrors the Screening Pipeline
 * mockup's three-column decision view + full table.
 *
 * Data contract:
 *   rows — candidates with a score but no final decision yet (AIScreeningPage's `cohortRows`)
 *   onAdvance(ids, reason) — ✅ WIRED: same advanceBulk() flow as AIScreeningPage
 *   advancing — bool, loading state for the advance button
 *
 * 🚧 TODO(backend): "Archive to Talent Pool" and "Send Reminders" are UI-only —
 * no archive/talent-pool endpoint and no reminder endpoint exist today.
 * setScreeningDecision only supports advance/hold/reject. Toasts below are
 * intentionally honest that nothing happened on click, rather than faking success.
 */
export default function PipelineStageDashboard({ rows = [], onAdvance, advancing = false }) {
  const [selected, setSelected] = useState(new Set());
  const [reason, setReason] = useState('');

  const buckets = useMemo(() => {
    const b = { advance: [], awaiting: [], archive: [] };
    for (const r of rows) b[recommendation(r.overall_score).bucket].push(r);
    return b;
  }, [rows]);

  const allSelected = rows.length > 0 && rows.every((r) => selected.has(r.screening_id));
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(rows.map((r) => r.screening_id)));
  const toggle = (id) => setSelected((cur) => {
    const next = new Set(cur);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  // ✅ Real action — real success toast
  const handleAdvanceClick = async () => {
    if (selected.size === 0 || !onAdvance) return;
    const count = selected.size;
    await onAdvance([...selected], reason || undefined);
    setSelected(new Set());
    setReason('');
    toast.success('Candidates advanced', {
      description: `${count} candidate${count === 1 ? '' : 's'} moved to Interview.`,
    });
  };

  const handleAdvanceColumn = async () => {
    if (!onAdvance || buckets.advance.length === 0) return;
    const count = buckets.advance.length;
    await onAdvance(buckets.advance.map((r) => r.screening_id), reason || undefined);
    toast.success('Candidates advanced', {
      description: `${count} candidate(s) moved to Interview.`,
    });
  };

  // 🚧 TODO(backend): no endpoint exists yet — toast is honest about that.
  const handleSendReminders = () => {
    toast.error('Not wired yet', {
      description: '🚧 Reminder sending has no backend endpoint yet — nothing was sent.',
    });
  };

  const handleArchiveAll = () => {
    toast.error('Not wired yet', {
      description: '🚧 Archive-to-talent-pool has no backend endpoint yet — nothing was archived.',
    });
  };

  return (
    <div className="space-y-4 p-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatCard label="Recommended advance" value={buckets.advance.length} />
        <StatCard label="Borderline / awaiting" value={buckets.awaiting.length} />
        <StatCard label="Recommended reject" value={buckets.archive.length} tone="danger" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <PipelineColumn
          title="Advance to interview"
          tone="emerald"
          rows={buckets.advance}
          actionLabel={advancing ? 'Advancing…' : `Advance all (${buckets.advance.length})`}
          actionDisabled={buckets.advance.length === 0 || advancing}
          onAction={handleAdvanceColumn}
        />
        <PipelineColumn
          title="Awaiting / borderline"
          tone="amber"
          rows={buckets.awaiting}
          actionLabel="Send reminders"
          actionDisabled={buckets.awaiting.length === 0}
          onAction={handleSendReminders}
          actionHint="🚧 needs a reminder endpoint"
        />
        <PipelineColumn
          title="Archive to talent pool"
          tone="blue"
          rows={buckets.archive}
          actionLabel="Archive all"
          actionDisabled={buckets.archive.length === 0}
          onAction={handleArchiveAll}
          actionHint="🚧 needs an archive endpoint"
        />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">
            Full screening decisions — {rows.length} candidates
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {rows.length === 0 ? (
            <p className="py-8 text-center text-xs text-muted-foreground italic">
              No candidates ready yet. Score candidates in the Match step first.
            </p>
          ) : (
            <>
              <Table className="w-full">
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="w-[36px] pl-4">
                      <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
                    </TableHead>
                    <TableHead className="text-[10px] font-bold uppercase">Candidate</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase text-center">Score</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase">Recommendation</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => {
                    const rec = recommendation(r.overall_score);
                    const isSel = selected.has(r.screening_id);
                    return (
                      <TableRow key={r.screening_id} className={isSel ? 'bg-primary/5' : ''}>
                        <TableCell className="pl-4">
                          <Checkbox checked={isSel} onCheckedChange={() => toggle(r.screening_id)} />
                        </TableCell>
                        <TableCell className="text-xs">{r.applicant_name || `#${r.applicant_id}`}</TableCell>
                        <TableCell className="text-center">
                          <Badge className={`text-xs font-mono font-bold ${scoreBg(r.overall_score)}`}>{r.overall_score ?? '—'}</Badge>
                        </TableCell>
                        <TableCell><Badge variant="outline" className={`text-[10px] ${rec.tone}`}>{rec.label}</Badge></TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              <div className="border-t p-3 space-y-2">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <span className="text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">{selected.size} selected</span>
                  </span>
                  <Button size="sm" className="text-xs" disabled={selected.size === 0 || advancing} onClick={handleAdvanceClick}>
                    {advancing ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : null}
                    Advance {selected.size} to interview <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                  </Button>
                </div>
                <Textarea
                  placeholder="Optional reason (applies to all advanced candidates)…"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={2}
                  className="text-xs"
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function PipelineColumn({ title, tone, rows, actionLabel, actionDisabled, actionHint, onAction }) {
  const toneCls = {
    emerald: 'border-emerald-200 bg-emerald-50/40',
    amber: 'border-amber-200 bg-amber-50/40',
    blue: 'border-blue-200 bg-blue-50/40',
  }[tone];
  const btnTone = {
    emerald: 'bg-emerald-600 hover:bg-emerald-700',
    amber: '',
    blue: '',
  }[tone];

  return (
    <Card className={toneCls}>
      <CardHeader className="pb-2">
        <CardTitle className="text-xs flex items-center justify-between">
          {title}
          <Badge variant="secondary" className="text-[10px] font-mono">{rows.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1.5">
        {rows.length === 0 ? (
          <p className="text-[11px] text-muted-foreground italic py-2">None</p>
        ) : (
          rows.slice(0, 5).map((r) => (
            <div key={r.screening_id} className="text-xs bg-background rounded-md border px-2 py-1.5 truncate">
              {r.applicant_name || `#${r.applicant_id}`}
            </div>
          ))
        )}
        {rows.length > 5 && <p className="text-[10px] text-muted-foreground">+{rows.length - 5} more</p>}
        <Button size="sm" className={`w-full text-xs mt-2 ${btnTone}`} disabled={actionDisabled} onClick={onAction} title={actionHint}>
          {actionLabel}
        </Button>
        {actionHint && <p className="text-[9px] text-muted-foreground italic text-center">{actionHint}</p>}
      </CardContent>
    </Card>
  );
}