import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import {
  Loader2, AlertTriangle, Sparkles, CheckCircle2, Send, Mail, Pencil,
} from 'lucide-react';
import { previewExternalInvitation, sendExternalInvitation } from '@/api/external-assessment.api';

// Step 2 for External-battery candidates: admin pastes a third-party
// assessment URL and the system emails it — no portal link, no polling,
// just a single preview-then-send action. Replaces TakeTab for this battery.
export default function ExternalSendTab({ candidateId, jobId, candidateName, candidateEmail, record, onRecordChange }) {
  const locked = record?.status === 'decided';
  const [editing, setEditing] = useState(!record);
  const [url, setUrl] = useState(record?.assessment_url || '');
  const [error, setError] = useState(null);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(null);
  const [sent, setSent] = useState(false);

  const handleOpenPreview = async () => {
    if (!url.trim()) { setError('Enter the assessment URL first.'); return; }
    setError(null);
    setSendError(null);
    setSent(false);
    setPreviewLoading(true);
    try {
      const { data } = await previewExternalInvitation({ candidate_id: Number(candidateId), job_id: jobId ? Number(jobId) : null, assessment_url: url.trim() });
      setSubject(data.subject);
      setBody(data.body);
      setPreviewOpen(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load email preview.');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleSend = async () => {
    setSending(true);
    setSendError(null);
    try {
      const { data } = await sendExternalInvitation({
        candidate_id: Number(candidateId),
        job_id: jobId ? Number(jobId) : null,
        assessment_url: url.trim(),
        subject,
        body,
      });
      onRecordChange?.(data.record);
      setSent(true);
      setEditing(false);
      setTimeout(() => setPreviewOpen(false), 1200);
    } catch (err) {
      setSendError(err.response?.data?.message || 'Failed to send invitation.');
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <Card>
        <CardContent className="space-y-4 p-5">
          <div>
            <h3 className="text-sm font-bold">Send · external assessment</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Paste the third-party assessment link (e.g. Hogan) and email it to the candidate.
            </p>
          </div>

          {editing ? (
            <div className="rounded-lg border border-dashed bg-muted/20 p-4 space-y-3">
              <div>
                <div className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground mb-1.5">
                  Assessment URL
                </div>
                <Input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://..."
                  className="text-sm"
                />
                {error && (
                  <p className="text-[11px] text-red-600 flex items-center gap-1 mt-1.5">
                    <AlertTriangle className="h-3 w-3" /> {error}
                  </p>
                )}
              </div>
              <div className="flex items-center justify-end gap-2">
                {record && (
                  <Button size="sm" variant="ghost" className="text-xs" onClick={() => { setEditing(false); setUrl(record.assessment_url); setError(null); }}>
                    Cancel
                  </Button>
                )}
                <Button size="sm" onClick={handleOpenPreview} disabled={previewLoading}>
                  {previewLoading ? (
                    <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Loading…</>
                  ) : (
                    <><Sparkles className="h-3.5 w-3.5 mr-1.5" /> Preview & Send</>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
              <div className="flex items-center justify-between mb-1 gap-2 flex-wrap">
                <div className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">
                  Assessment link
                </div>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">
                  <CheckCircle2 className="h-3 w-3" />
                  Sent{record?.sent_at ? ` · ${formatSentAt(record.sent_at)}` : ''}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 truncate text-[11px] font-mono text-foreground bg-background border rounded px-2 py-1.5">
                  {record?.assessment_url}
                </code>
                {!locked && (
                  <Button size="sm" variant="outline" className="h-7 text-xs shrink-0" onClick={() => setEditing(true)}>
                    <Pencil className="h-3 w-3 mr-1" /> Edit URL
                  </Button>
                )}
              </div>
              <div className="pt-1">
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={handleOpenPreview} disabled={previewLoading}>
                  {previewLoading ? <Loader2 className="h-3 w-3 mr-1.5 animate-spin" /> : <Send className="h-3 w-3 mr-1.5" />}
                  Resend Invitation Email
                </Button>
              </div>
              {error && (
                <p className="text-[11px] text-red-600 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" /> {error}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary" />
              Send Assessment Invitation
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Starting wording from Settings — edit freely below. Changes apply to this email only.
            </DialogDescription>
          </DialogHeader>

          {candidateEmail && (
            <p className="text-[11px] text-muted-foreground">
              Sending to: <span className="font-semibold text-foreground">{candidateEmail}</span>
              {candidateName ? ` (${candidateName})` : ''}
            </p>
          )}

          <div className="space-y-3">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Subject</label>
              <Input
                className="mt-1 text-sm"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                disabled={sending || sent}
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Body</label>
              <Textarea
                className="mt-1 text-sm leading-relaxed max-h-64"
                rows={8}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                disabled={sending || sent}
              />
            </div>

            {sendError && (
              <div className="flex items-center gap-1.5 text-[11px] text-red-600">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                {sendError}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setPreviewOpen(false)} disabled={sending}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSend} disabled={sending || sent}>
              {sent ? (
                <><CheckCircle2 className="h-3.5 w-3.5 mr-1.5 text-emerald-400" />Sent!</>
              ) : sending ? (
                <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Sending…</>
              ) : (
                <><Send className="h-3.5 w-3.5 mr-1.5" />Send Invitation</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function formatSentAt(iso) {
  try {
    return new Date(iso).toLocaleString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return '';
  }
}
