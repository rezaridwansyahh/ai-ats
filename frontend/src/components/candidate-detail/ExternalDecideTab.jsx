import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ClipboardCheck } from 'lucide-react';

const DECISION_LABELS = { advance: 'Advanced', hold: 'On hold', reject: 'Rejected' };
const DECISION_TONE = {
  advance: 'border-emerald-200 text-emerald-700 bg-emerald-50',
  hold:    'border-amber-200 text-amber-700 bg-amber-50',
  reject:  'border-rose-200 text-rose-700 bg-rose-50',
};

// Step 3 for External-battery candidates: a read-only recap of what was
// sent — the actual Advance/Hold/Reject controls live in the sidebar
// (ExternalDecisionCard in CandidateDetail.jsx), same placement as the
// internal flow's TindakLanjutCard. Replaces ScoreDecideTab's main content.
export default function ExternalDecideTab({ record }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <ClipboardCheck className="h-4 w-4 text-primary" /> External assessment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {record?.assessment_url ? (
          <>
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                Link sent to candidate
              </div>
              <code className="block truncate text-[11px] font-mono bg-muted/30 border rounded px-2 py-1.5">
                {record.assessment_url}
              </code>
              {record.sent_at && (
                <p className="text-[11px] text-muted-foreground mt-1">
                  Sent {new Date(record.sent_at).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              )}
            </div>

            {record.decision && (
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                  Current decision
                </div>
                <Badge variant="outline" className={DECISION_TONE[record.decision] || ''}>
                  {DECISION_LABELS[record.decision] || record.decision}
                </Badge>
              </div>
            )}

            <p className="text-xs text-muted-foreground italic">
              Results are reviewed outside this system — record Advance, Hold, or Reject in the sidebar once they're back.
            </p>
          </>
        ) : (
          <p className="text-xs text-muted-foreground italic py-2">
            No assessment has been sent yet. Go back to the Send step first.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
