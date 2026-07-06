import { useState } from 'react';
import { Clock, CheckCircle2, ChevronDown, ChevronRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatCard } from './shared';
import { getQaResponses } from '@/api/screening.api';

export default function QAStageDashboard({ pendingRows = [], respondedRows = [], onOpen }) {
  const total = pendingRows.length + respondedRows.length;
  const responseRate = total > 0 ? Math.round((respondedRows.length / total) * 100) : 0;

  return (
    <div className="space-y-4 p-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatCard label="Sent · awaiting reply" value={pendingRows.length} />
        <StatCard label="Responded" value={respondedRows.length} />
        <StatCard label="Response rate" value={`${responseRate}%`} hint={total === 0 ? 'no Q&A sent yet' : undefined} />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Responses
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {respondedRows.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted-foreground italic">No responses yet.</p>
          ) : (
            respondedRows.map((r) => <ResponseCard key={r.screening_id} row={r} onOpen={onOpen} />)
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-amber-600" /> Awaiting reply
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {pendingRows.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted-foreground italic">Nothing pending.</p>
          ) : (
            pendingRows.map((r) => (
              <div
                key={r.screening_id ?? r.applicant_id}
                onClick={() => onOpen(r)}
                className="flex items-center justify-between p-2.5 rounded-md border cursor-pointer hover:bg-muted/30 transition-colors"
              >
                <div className="text-xs font-medium">{r.applicant_name || `#${r.applicant_id}`}</div>
                <Badge variant="outline" className="text-[10px] border-amber-300 text-amber-700 bg-amber-50">sent</Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ResponseCard({ row, onOpen }) {
  const [open, setOpen] = useState(false);
  const [answers, setAnswers] = useState(null);
  const [loading, setLoading] = useState(false);

  // ✅ WIRED: real API call, toast.error on failure instead of inline text
  const toggle = async () => {
    const next = !open;
    setOpen(next);
    if (next && !answers && !loading) {
      setLoading(true);
      try {
        const res = await getQaResponses(row.screening_id);
        setAnswers(res.data?.qa?.answers || []);
      } catch (err) {
        toast.error('Failed to load responses', {
          description: err.response?.data?.message || err.message || 'Unknown error',
        });
        setOpen(false);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="rounded-md border overflow-hidden">
      <button
        type="button"
        onClick={toggle}
        className="w-full flex items-center justify-between p-2.5 text-left hover:bg-muted/20 transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0">
          {open ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
          <span className="text-xs font-medium truncate">{row.applicant_name || `#${row.applicant_id}`}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant="outline" className="text-[10px] border-emerald-300 text-emerald-700 bg-emerald-50">responded</Badge>
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => { e.stopPropagation(); onOpen(row); }}
            className="text-[10px] text-primary hover:underline"
          >
            open profile
          </span>
        </div>
      </button>

      {open && (
        <div className="px-3 pb-3 pt-1 border-t bg-muted/10 space-y-2">
          {loading && (
            <div className="py-3 flex items-center justify-center text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> Loading responses…
            </div>
          )}
          {!loading && Array.isArray(answers) && answers.length === 0 && (
            <p className="text-xs text-muted-foreground italic py-2">No answers on record.</p>
          )}
          {!loading && Array.isArray(answers) && answers.map((a, i) => (
            <div key={i} className="text-xs rounded-md bg-background border p-2">
              <div className="font-semibold text-[10px] uppercase tracking-wide text-muted-foreground">
                {a.topic || `Question ${i + 1}`}
              </div>
              <div className="mt-0.5 text-muted-foreground">{a.answer || <em>no answer</em>}</div>
              {/*
                🚧 TODO(backend): mockup shows an "AI Summary" line per response
                (e.g. "Strong fit"). No such field exists on the answer object
                today — would need backend to generate/attach one.
              */}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}