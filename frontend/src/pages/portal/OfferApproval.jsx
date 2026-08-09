import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Loader2, AlertTriangle, Clock, ShieldCheck, Mail, Building2, Wallet, Eye,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

import {
  getApprovalViewLinkBasic, verifyApprovalViewEmail, getApprovalViewSummary,
} from '@/api/offer-pack.api';

function fmtCurrency(value) {
  if (value == null) return '—';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(value);
}

function CenteredShell({ children }) {
  return (
    <div className="min-h-screen bg-muted/30 flex items-start justify-center p-4 pt-10">
      <div className="w-full max-w-xl space-y-3">{children}</div>
    </div>
  );
}

function Header() {
  return (
    <div className="text-center mb-1">
      <div className="text-base font-bold tracking-widest text-primary">MYRALIX</div>
      <div className="text-[10px] tracking-wider uppercase text-muted-foreground">
        Offer Review — Read Only
      </div>
    </div>
  );
}

function StatusCard({ icon: Icon, tone, title, message }) {
  const toneClasses = {
    error: 'text-rose-500',
    warn:  'text-amber-500',
  }[tone] || 'text-muted-foreground';

  return (
    <Card>
      <CardContent className="p-6 space-y-2 text-center">
        <Icon className={`h-8 w-8 mx-auto ${toneClasses}`} />
        <h2 className="text-sm font-bold">{title}</h2>
        {message && <p className="text-[11px] text-muted-foreground leading-relaxed">{message}</p>}
      </CardContent>
    </Card>
  );
}

export default function OfferApprovalPage() {
  const { token } = useParams();

  const [view, setView] = useState('loading'); // loading | email_gate | summary | expired | error
  const [basic, setBasic] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const [email, setEmail] = useState('');
  const [emailBusy, setEmailBusy] = useState(false);
  const [emailErr, setEmailErr] = useState(null);

  const [summary, setSummary] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setView('loading');
      try {
        const res = await getApprovalViewLinkBasic(token);
        if (cancelled) return;
        setBasic(res.data?.view || null);
        setView('email_gate');
      } catch (err) {
        if (cancelled) return;
        const status = err.response?.status;
        const msg = err.response?.data?.message || 'This link could not be loaded.';
        setErrorMsg(msg);
        setView(status === 410 ? 'expired' : 'error');
      }
    })();
    return () => { cancelled = true; };
  }, [token]);

  const handleVerifyEmail = async () => {
    if (!email.trim()) return;
    setEmailBusy(true);
    setEmailErr(null);
    try {
      const verifyRes = await verifyApprovalViewEmail(token, email.trim());
      const approvalViewToken = verifyRes.data?.approval_view_token;

      const summaryRes = await getApprovalViewSummary(token, approvalViewToken);
      setSummary(summaryRes.data?.summary || null);
      setView('summary');
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.message || 'Email does not match — try again.';
      if (status === 410) {
        setErrorMsg(msg);
        setView('expired');
        return;
      }
      setEmailErr(msg);
    } finally {
      setEmailBusy(false);
    }
  };

  return (
    <CenteredShell>
      <Header />

      {view === 'loading' && (
        <Card>
          <CardContent className="py-10 text-center text-xs text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin inline mr-2" /> Loading…
          </CardContent>
        </Card>
      )}

      {view === 'error' && (
        <StatusCard icon={AlertTriangle} tone="error" title="Link not found" message={errorMsg} />
      )}

      {view === 'expired' && (
        <StatusCard icon={Clock} tone="warn" title="This link has expired" message={errorMsg} />
      )}

      {view === 'email_gate' && basic && (
        <Card>
          <CardContent className="p-6 space-y-5">
            <div>
              <p className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground mb-1">
                Offer Review Invitation
              </p>
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary shrink-0" />
                {basic.company_name || 'Company'} · {basic.job_title}
              </h2>
              <p className="text-[11px] text-muted-foreground mt-1">
                Enter your email to confirm this link was sent to you.
              </p>
            </div>

            <div className="space-y-2">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setEmailErr(null); }}
                  onKeyDown={(e) => e.key === 'Enter' && handleVerifyEmail()}
                  placeholder="you@company.com"
                  className="pl-9"
                  autoFocus
                />
              </div>
              {emailErr && (
                <p className="text-[11px] text-rose-600 flex items-center gap-1">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> {emailErr}
                </p>
              )}
            </div>

            <Button className="w-full" onClick={handleVerifyEmail} disabled={emailBusy || !email.trim()}>
              {emailBusy
                ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Verifying…</>
                : 'Continue'}
            </Button>

            <p className="text-[10px] text-muted-foreground text-center">
              Trouble accessing this? <span className="text-primary">Contact the recruiter who shared this link.</span>
            </p>
          </CardContent>
        </Card>
      )}

      {view === 'summary' && summary && (
        <>
          <Card>
            <CardContent className="p-5 space-y-1">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-primary shrink-0" />
                <span className="text-xs font-semibold">Read-only offer summary</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {summary.candidate_name} · {summary.position_title || summary.job_title} · {summary.company_name}
              </p>
              <Badge variant="outline" className="text-[9px] mt-1 w-fit">
                No actions available from this link
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Wallet className="h-4 w-4 text-primary" /> Intake summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              {summary.intake?.status === 'skipped' ? (
                <Badge variant="outline" className="text-[9px]">
                  skipped{summary.intake.skip_reason ? ` — ${summary.intake.skip_reason}` : ''}
                </Badge>
              ) : summary.intake?.status === 'recorded' ? (
                <>
                  {summary.intake.line_items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-muted-foreground">{item.label}</span>
                      <span className="font-mono">{fmtCurrency(item.amount)}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between pt-1 border-t font-semibold">
                    <span>Total</span>
                    <span className="font-mono">{fmtCurrency(summary.intake.total)}</span>
                  </div>
                </>
              ) : (
                <p className="text-muted-foreground italic">Not recorded yet.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Wallet className="h-4 w-4 text-primary" /> Build summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              {summary.build?.base_salary != null ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Base salary</span>
                    <span className="font-mono">{fmtCurrency(summary.build.base_salary)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Gross salary</span>
                    <span className="font-mono">{fmtCurrency(summary.build.gross_salary)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">PPh 21</span>
                    <span className="font-mono">− {fmtCurrency(summary.build.pph21)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">BPJS Kesehatan</span>
                    <span className="font-mono">− {fmtCurrency(summary.build.bpjs_kesehatan)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">BPJS Ketenagakerjaan</span>
                    <span className="font-mono">− {fmtCurrency(summary.build.bpjs_ketenagakerjaan)}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t font-semibold">
                    <span>Net salary</span>
                    <span className="font-mono">{fmtCurrency(summary.build.net_salary)}</span>
                  </div>
                </>
              ) : (
                <p className="text-muted-foreground italic">Not built yet.</p>
              )}
            </CardContent>
          </Card>

          <p className="text-[10px] text-muted-foreground text-center flex items-center justify-center gap-1">
            <ShieldCheck className="h-3 w-3" /> This is a read-only view — the approval decision is made in the Myralix dashboard.
          </p>
        </>
      )}
    </CenteredShell>
  );
}