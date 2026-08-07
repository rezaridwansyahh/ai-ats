import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  Loader2, AlertTriangle, Check, X, FileText, Building2, Ban, Download,
  ThumbsDown, MessageSquareText, Circle, Lock,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';

import {
  getApprovalChainByToken, decideApprovalStepByToken,
  downloadApprovalLetterDocx, downloadApprovalLetterPdf,
} from '@/api/offer-pack.api';

function fmtCurrency(value) {
  if (value == null) return '—';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(value);
}

function fmtDate(d) {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch { return '—'; }
}

function downloadBlob(blobResponse, filename) {
  const url = window.URL.createObjectURL(new Blob([blobResponse.data]));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
}

function CenteredShell({ children }) {
  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-4">{children}</div>
    </div>
  );
}

function StatusScreen({ icon: Icon, tone, title, message }) {
  const toneClasses = {
    error:   'border-red-200 bg-red-50 text-red-700',
    warn:    'border-amber-200 bg-amber-50 text-amber-700',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  }[tone] || 'border-border bg-muted/40 text-muted-foreground';

  return (
    <CenteredShell>
      <Card>
        <CardContent className="py-10 text-center space-y-3">
          <div className={`h-12 w-12 rounded-full flex items-center justify-center mx-auto border ${toneClasses}`}>
            <Icon className="h-5 w-5" />
          </div>
          <p className="text-sm font-semibold">{title}</p>
          {message && <p className="text-xs text-muted-foreground max-w-xs mx-auto">{message}</p>}
        </CardContent>
      </Card>
    </CenteredShell>
  );
}

/* Each card is independently decidable — no "your turn" gating. Stays
   editable (resubmittable) until the recruiter locks it via reject or
   finalize; `locked` disables all decide UI once that happens. */
function ApprovalCard({ step, locked, token, onDecided, setBanner }) {
  const [note, setNote] = useState(step.note || '');
  const [confirmReject, setConfirmReject] = useState(false);
  const [submitting, setSubmitting] = useState(null); // 'approved' | 'rejected' | null
  const [error, setError] = useState(null);

  const isApproved = step.status === 'approved';
  const isRejected = step.status === 'rejected';

  const submit = async (decision) => {
    setSubmitting(decision);
    setError(null);
    try {
      await decideApprovalStepByToken(token, step.id, decision, note.trim() || null);
      setConfirmReject(false);
      setBanner({ ok: true, text: `${step.approver_name} · ${decision === 'approved' ? 'approved' : 'not approved'}.` });
      onDecided();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to record decision');
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <div className="p-3 space-y-2">
      <div className="flex items-center gap-3">
        <span className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 ${
          isApproved ? 'bg-emerald-500 text-white'
          : isRejected ? 'bg-rose-500 text-white'
          : 'bg-muted text-muted-foreground'
        }`}>
          {isApproved ? <Check className="h-3.5 w-3.5" />
            : isRejected ? <X className="h-3.5 w-3.5" />
            : <Circle className="h-2.5 w-2.5" />}
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-semibold">{step.role} · {step.approver_name}</div>
          {step.decided_at ? (
            <div className="text-[10px] text-muted-foreground">
              {isApproved ? 'Approved' : 'Not approved'} {fmtDate(step.decided_at)}
              {step.decided_by_name ? ` · by ${step.decided_by_name}` : ' · via portal'}
            </div>
          ) : (
            <div className="text-[10px] text-muted-foreground">Awaiting decision</div>
          )}
        </div>
        {isApproved && <Badge variant="outline" className="text-[9px] border-emerald-300 text-emerald-700 bg-emerald-50">approved</Badge>}
        {isRejected && <Badge variant="outline" className="text-[9px] border-rose-300 text-rose-700 bg-rose-50">not approved</Badge>}
      </div>

      {step.note && (
        <div className="flex items-start gap-2 pl-9 text-[11px] text-muted-foreground">
          <MessageSquareText className="h-3 w-3 shrink-0 mt-0.5" />
          {step.note}
        </div>
      )}

      {!locked && (
        <div className="pl-9 space-y-2">
          {error && (
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-red-200 bg-red-50 text-[11px] text-red-600">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> {error}
            </div>
          )}
          <Textarea
            placeholder="Note (optional)"
            rows={2}
            className="text-xs"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          {!confirmReject ? (
            <div className="flex gap-2">
              <Button
                size="sm" className="text-xs h-7 bg-emerald-600 hover:bg-emerald-700"
                onClick={() => submit('approved')} disabled={!!submitting}
              >
                {submitting === 'approved' ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Check className="h-3 w-3 mr-1" />}
                {isApproved ? 'Keep Approved' : 'Approve'}
              </Button>
              <Button
                size="sm" variant="outline" className="text-xs h-7 text-rose-600 border-rose-300 hover:bg-rose-50"
                onClick={() => setConfirmReject(true)} disabled={!!submitting}
              >
                <ThumbsDown className="h-3 w-3 mr-1" /> Not Approved
              </Button>
            </div>
          ) : (
            <div className="space-y-1.5 p-2.5 rounded-lg border border-rose-200 bg-rose-50/40">
              <p className="text-[11px] text-rose-700">
                Are you sure? This closes the chain for everyone — only the recruiter can revoke &amp; restart it from here.
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm" variant="destructive" className="text-[10px] h-7"
                  onClick={() => submit('rejected')} disabled={!!submitting}
                >
                  {submitting === 'rejected' ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : null} Confirm Not Approved
                </Button>
                <Button size="sm" variant="ghost" className="text-[10px] h-7" onClick={() => setConfirmReject(false)} disabled={!!submitting}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function OfferApprovalPage() {
  const { token } = useParams();

  const [approval, setApproval] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [loadError, setLoadError] = useState(null); // { status, message }
  const [banner, setBanner]     = useState(null);

  const [downloadingDocx, setDownloadingDocx] = useState(false);
  const [downloadingPdf, setDownloadingPdf]   = useState(false);
  const [downloadError, setDownloadError]     = useState(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setLoadError(null);
    try {
      const res = await getApprovalChainByToken(token);
      setApproval(res.data?.approval || null);
    } catch (err) {
      setLoadError({
        status: err.response?.status,
        message: err.response?.data?.message || err.message || 'This approval link could not be loaded.',
      });
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const handleDownloadDocx = async () => {
    setDownloadingDocx(true);
    setDownloadError(null);
    try {
      const res = await downloadApprovalLetterDocx(token);
      downloadBlob(res, 'offer_letter.docx');
    } catch (err) {
      setDownloadError(err.response?.data?.message || err.message || 'Failed to download the offer letter.');
    } finally {
      setDownloadingDocx(false);
    }
  };

  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);
    setDownloadError(null);
    try {
      const res = await downloadApprovalLetterPdf(token);
      downloadBlob(res, 'offer_letter.pdf');
    } catch (err) {
      setDownloadError(err.response?.data?.message || err.message || 'Failed to download the offer letter.');
    } finally {
      setDownloadingPdf(false);
    }
  };

  if (loading) {
    return (
      <CenteredShell>
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </CenteredShell>
    );
  }

  if (loadError) {
    if (loadError.status === 410) {
      const isFinalized = loadError.message?.toLowerCase().includes('finalized');
      return (
        <StatusScreen
          icon={isFinalized ? Check : Ban}
          tone={isFinalized ? 'success' : 'warn'}
          title={isFinalized ? 'This offer has been finalized' : 'This link is no longer active'}
          message={loadError.message}
        />
      );
    }
    return (
      <StatusScreen icon={AlertTriangle} tone="error" title="Link not found" message={loadError.message} />
    );
  }

  if (!approval) return null;

  const locked = approval.status === 'rejected';
  const hasLetter = !!approval.offer_letter;

  return (
    <CenteredShell>
      <Card>
        <CardHeader className="pb-3 text-center">
          <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-2">
            <Building2 className="h-5 w-5" />
          </div>
          <CardTitle className="text-base">Offer Approval Request</CardTitle>
          <p className="text-xs text-muted-foreground">
            Find your name below and record your decision — approvers can decide in any order.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">

          {banner && (
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs ${
              banner.ok ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'
            }`}>
              <Check className="h-3.5 w-3.5 shrink-0" /> {banner.text}
            </div>
          )}

          <div className="rounded-lg border overflow-hidden">
            <div className="px-4 py-3 border-b bg-muted/20 flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">{approval.candidate_name}</p>
                <p className="text-[11px] text-muted-foreground truncate">
                  {approval.position_title || approval.job_title}
                </p>
              </div>
            </div>
            <div className="divide-y text-xs">
              <div className="flex items-center justify-between px-4 py-2">
                <span className="text-muted-foreground">Position</span>
                <span className="font-medium">{approval.position_title || approval.job_title || '—'}</span>
              </div>
              {approval.base_salary != null && (
                <div className="flex items-center justify-between px-4 py-2">
                  <span className="text-muted-foreground">Base salary</span>
                  <span className="font-mono">{fmtCurrency(approval.base_salary)}</span>
                </div>
              )}
              {approval.net_salary != null && (
                <div className="flex items-center justify-between px-4 py-3 font-semibold bg-muted/20">
                  <span>Net salary</span>
                  <span className="font-mono">{fmtCurrency(approval.net_salary)}</span>
                </div>
              )}
            </div>
          </div>

          {hasLetter ? (
            <div className="space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Offer letter — review before deciding
              </p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="text-xs flex-1" onClick={handleDownloadDocx} disabled={downloadingDocx}>
                  {downloadingDocx ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Download className="h-3.5 w-3.5 mr-1.5" />}
                  Download .docx
                </Button>
                <Button size="sm" variant="outline" className="text-xs flex-1" onClick={handleDownloadPdf} disabled={downloadingPdf}>
                  {downloadingPdf ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Download className="h-3.5 w-3.5 mr-1.5" />}
                  Download .pdf
                </Button>
              </div>
              {downloadError && <p className="text-[11px] text-rose-600">{downloadError}</p>}
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-amber-200 bg-amber-50 text-[11px] text-amber-700">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> No offer letter has been generated yet — you can still decide based on the summary above.
            </div>
          )}

          {locked && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-rose-200 bg-rose-50 text-xs text-rose-700">
              <Lock className="h-4 w-4 shrink-0" />
              This offer was marked not approved — no further decisions can be recorded from this link. Contact the recruiter if this needs to be revisited.
            </div>
          )}

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
              Approvers
            </p>
            <div className="rounded-lg border divide-y">
              {approval.steps.map((step) => (
                <ApprovalCard
                  key={step.id}
                  step={step}
                  locked={locked}
                  token={token}
                  onDecided={() => load(true)}
                  setBanner={setBanner}
                />
              ))}
            </div>
          </div>

        </CardContent>
      </Card>
    </CenteredShell>
  );
}