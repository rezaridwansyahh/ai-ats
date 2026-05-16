import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, AlertTriangle, Mail, CheckCircle2 } from 'lucide-react';
import {
  getPortalSession,
  verifyPortalEmail,
  getPortalForm,
  submitPortalAssessment,
} from '@/api/portal-assessment.api';
import { PORTAL_TOKEN_KEY } from '@/api/portal-axios';

import CandidateCardA from '@/components/assessment-a/CandidateCard';
import CandidateCardB from '@/components/assessment-b/CandidateCard';
import CandidateCardC from '@/components/assessment-c/CandidateCard';
import CandidateCardD from '@/components/assessment-d/CandidateCard';

// Public candidate-facing page. Lives OUTSIDE the recruiter DashboardLayout.
// Flow: loading → email-gate → runner (CandidateCard).
export default function AssessmentPlacementPage() {
  const { hash } = useParams();
  const [view, setView]         = useState('loading'); // loading | gate | runner | completed | error
  const [session, setSession]   = useState(null);
  const [error, setError]       = useState(null);

  const [email, setEmail]       = useState('');
  const [verifying, setVerifying] = useState(false);
  const [gateError, setGateError] = useState(null);

  // Initial fetch — also auto-resumes the runner if a still-valid portal_token is in localStorage.
  // NOTE: the public lookup doesn't return PII, so to enter the runner directly we additionally
  // re-call verify with the cached email... but we don't have the cached email. So if the JWT is
  // valid but no enriched session is available, fall through to the gate. Simpler UX, costs the
  // candidate one extra email entry per browser reload.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setView('loading');
      try {
        const res = await getPortalSession(hash);
        if (cancelled) return;
        const sess = res.data?.session ?? null;
        setSession(sess);
        // One-time attempt — if this invitation has already been submitted, lock out.
        if (sess?.status === 'completed') {
          setView('completed');
          return;
        }
        if (localStorage.getItem(PORTAL_TOKEN_KEY)) {
          try {
            await getPortalForm(hash);
            // Token is still valid for this hash — but we don't have the enriched session
            // (name/position/...). Keep the gate so verifyEmail can repopulate it.
          } catch {
            // token invalid → drop it
            localStorage.removeItem(PORTAL_TOKEN_KEY);
          }
        }
        setView('gate');
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.message || 'Invalid invitation link.');
          setView('error');
        }
      }
    })();
    return () => { cancelled = true; };
  }, [hash]);

  const handleVerify = async (e) => {
    e.preventDefault();
    setVerifying(true);
    setGateError(null);
    try {
      const res = await verifyPortalEmail(hash, email);
      const token = res.data?.portal_token;
      if (token) localStorage.setItem(PORTAL_TOKEN_KEY, token);
      const sess = res.data?.session ?? session;
      setSession(sess);
      // Defensive: a session that flipped to completed between page-load and email submit
      // should still lock the candidate out.
      setView(sess?.status === 'completed' ? 'completed' : 'runner');
    } catch (err) {
      setGateError(err.response?.data?.message || 'Verification failed.');
    } finally {
      setVerifying(false);
    }
  };

  // Sole submission entrypoint for the runner — always-insert, always-marks-session-complete.
  const handlePortalSubmit = useCallback(
    async ({ results, summary }) => {
      await submitPortalAssessment(hash, { results, summary });
    },
    [hash]
  );

  // Loading / error / gate views render in the centered narrow shell.
  if (view !== 'runner') {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Header />

          {view === 'loading' && (
            <CenteredCard>
              <Loader2 className="h-4 w-4 animate-spin inline mr-2" />Loading invitation…
            </CenteredCard>
          )}

          {view === 'error' && (
            <CenteredCard>
              <AlertTriangle className="h-4 w-4 inline mr-2 text-red-500" />
              {error}
            </CenteredCard>
          )}

          {view === 'completed' && (
            <Card>
              <CardContent className="p-6 space-y-2 text-center">
                <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto" />
                <h2 className="text-sm font-bold">Assessment already submitted</h2>
                <p className="text-[11px] text-muted-foreground">
                  Battery {session?.battery ?? '—'}{session?.job_title ? ` · ${session.job_title}` : ''}
                </p>
                <p className="text-[11px] text-muted-foreground pt-2">
                  This invitation is one-time. Your responses have been recorded — re-takes are not allowed.
                  If you believe this is in error, please contact the recruiter who sent you this link.
                </p>
              </CardContent>
            </Card>
          )}

          {view === 'gate' && (
            <Card>
              <CardContent className="p-6 space-y-4">
                <div>
                  <div className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">
                    Assessment invitation
                  </div>
                  <h1 className="text-base font-bold mt-1">
                    Battery {session?.battery ?? '—'}{session?.job_title ? ` · ${session.job_title}` : ''}
                  </h1>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Enter your email to confirm this invitation is for you.
                  </p>
                </div>

                <form onSubmit={handleVerify} className="space-y-3">
                  <div className="relative">
                    <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      type="email"
                      required
                      autoFocus
                      placeholder="you@example.com"
                      className="pl-8 h-9 text-sm"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  {gateError && (
                    <div className="text-[11px] text-red-600 flex items-center gap-1.5">
                      <AlertTriangle className="h-3 w-3" />
                      {gateError}
                    </div>
                  )}

                  <Button type="submit" disabled={verifying || !email.trim()} className="w-full h-9 text-sm">
                    {verifying
                      ? <><Loader2 className="h-3.5 w-3.5 animate-spin inline mr-1.5" />Verifying…</>
                      : 'Continue'}
                  </Button>
                </form>

                <p className="text-[10px] text-muted-foreground text-center">
                  Trouble signing in? Contact the recruiter who sent you this link.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  // Runner view — full-width to give the CandidateCard breathing room.
  return (
    <div className="min-h-screen bg-muted/30">
      <BatteryRunner session={session} hash={hash} onSubmit={handlePortalSubmit} />
    </div>
  );
}

function BatteryRunner({ session, hash, onSubmit }) {
  if (!session) return null;

  const prefilledProfile = {
    name:       session.participant_name       || '',
    email:      session.participant_email      || '',
    position:   session.participant_position   || '',
    department: session.participant_department || '',
    education:  session.participant_education  || '',
    date_birth: session.participant_date_birth || '',
    participant_id: session.participant_id ?? null,
  };
  const commonProps = {
    mode: 'portal',
    prefilledProfile,
    portalHash: hash,
    onPortalSubmit: onSubmit,
  };

  switch (session.battery) {
    case 'A': return <CandidateCardA {...commonProps} />;
    case 'B': return <CandidateCardB {...commonProps} />;
    case 'C': return <CandidateCardC {...commonProps} />;
    case 'D': return <CandidateCardD {...commonProps} />;
    default:
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="max-w-md">
            <CardContent className="p-6 text-center text-xs text-muted-foreground">
              <AlertTriangle className="h-4 w-4 inline mr-1.5 text-amber-500" />
              Unknown battery: {String(session.battery)}.
            </CardContent>
          </Card>
        </div>
      );
  }
}

function Header() {
  return (
    <div className="text-center mb-4">
      <div className="text-base font-bold tracking-widest text-primary">MYRALIX</div>
      <div className="text-[10px] tracking-wider uppercase text-muted-foreground">
        Assessment Portal
      </div>
    </div>
  );
}

function CenteredCard({ children }) {
  return (
    <Card>
      <CardContent className="p-6 text-center text-xs text-muted-foreground">
        {children}
      </CardContent>
    </Card>
  );
}
