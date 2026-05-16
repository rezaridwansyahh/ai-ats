import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import DetailStepper from '@/components/candidate-detail/DetailStepper';
import SetupTab from '@/components/candidate-detail/SetupTab';
import TakeTab from '@/components/candidate-detail/TakeTab';
import ScoreDecideTab from '@/components/candidate-detail/ScoreDecideTab';
import { STEPS } from '@/components/candidate-detail/steps';
import { BATTERIES, getInitials } from '@/lib/batteries';
import { getCandidateById } from '@/api/candidate.api';
import { getSessionsFromCandidate } from '@/api/session.api';
import { getResultFromCandidate } from '@/api/assessment-battery-result.api';

export default function CandidateDetailPage() {
  const navigate = useNavigate();
  const { jobId, participantId: candidateIdParam } = useParams();
  const candidateId = Number(candidateIdParam);

  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);

  const [activeKey, setActiveKey] = useState('setup');
  const [battery, setBattery]     = useState(null);

  // Existing live sessions for (candidate, job). Powers TakeTab's URL panel and lets the
  // page restore battery + active tab across refresh.
  const [existingSessions, setExistingSessions] = useState([]);
  // Restore battery/tab from server state at most ONCE per (candidate, job) pair, so
  // later re-fetches (e.g. after Generate URL) don't yank the user away from their
  // current tab navigation.
  const restoredOnceRef = useRef(false);

  // Latest core_applicant_assessment row for (candidate, battery). Drives both the
  // Take tab's per-subtest "Scored" pills and the Score & Decide tab's ReportView.
  const [latestResult, setLatestResult] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getCandidateById(candidateId);
        if (!cancelled) setCandidate(res.data?.pipeline || null);
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.message || err.message || 'Failed to load candidate');
          setCandidate(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [candidateId]);

  // Restore session state from the DB. Runs after the candidate fetch — empty
  // result is fine (recruiter starts on Setup as today).
  useEffect(() => {
    if (!candidateId) return undefined;
    restoredOnceRef.current = false;
    let cancelled = false;
    (async () => {
      try {
        const res = await getSessionsFromCandidate({
          candidate_id: candidateId,
          job_id:       jobId ? Number(jobId) : undefined,
        });
        if (cancelled) return;
        const sessions = res.data?.sessions ?? [];
        setExistingSessions(sessions);
        if (sessions.length > 0 && !restoredOnceRef.current) {
          // Most recent (DESC) wins per the locked design decision.
          setBattery(sessions[0].battery);
          setActiveKey('take');
          restoredOnceRef.current = true;
        }
      } catch {
        // Silent — Setup tab still works without a prior session.
      }
    })();
    return () => { cancelled = true; };
  }, [candidateId, jobId]);

  // Fetch the latest result whenever the active battery changes. Silent on failure —
  // Take falls back to all-Invited and Score & Decide falls back to empty state.
  useEffect(() => {
    if (!candidateId || !battery) {
      setLatestResult(null);
      return undefined;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await getResultFromCandidate({ candidate_id: candidateId, battery });
        if (!cancelled) setLatestResult(res.data?.result ?? null);
      } catch {
        if (!cancelled) setLatestResult(null);
      }
    })();
    return () => { cancelled = true; };
  }, [candidateId, battery]);

  // Per-subtest status for the Take tab. A key is "scored" iff it shows up in
  // results.by_subtest with non-null data; otherwise "invited".
  const subtestStatus = useMemo(() => {
    const by = latestResult?.results?.by_subtest;
    if (!by || !battery) return {};
    const out = {};
    (BATTERIES[battery]?.tests || []).forEach((t) => {
      out[t.key] = by[t.key] != null ? 'scored' : 'invited';
    });
    return out;
  }, [latestResult, battery]);

  const completed = useMemo(() => ({
    setup: !!battery,
    take:  latestResult?.status === 'completed',
  }), [battery, latestResult]);

  if (loading) {
    return (
      <div className="space-y-4">
        <BackButton onBack={() => navigate('/selection/report')} />
        <Card><CardContent className="py-12 text-center text-xs text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin inline mr-1.5" />Loading candidate…
        </CardContent></Card>
      </div>
    );
  }

  if (error || !candidate) {
    return (
      <div className="space-y-4">
        <BackButton onBack={() => navigate('/selection/report')} />
        <Card><CardContent className="py-12 text-center text-xs text-muted-foreground">
          {error || 'Candidate not found.'}
        </CardContent></Card>
      </div>
    );
  }

  const candidateView = {
    id:        candidate.id,
    name:      candidate.candidate_name || candidate.name || '—',
    role:      candidate.last_position  || '—',
    email:     candidate.email          || '—',
    education: candidate.education      || '—',
  };

  const handleSendInvitation = () => setActiveKey('take');

  return (
    <div className="space-y-4">
      <BackButton onBack={() => navigate('/selection/report')} />

      <CandidateHeader candidate={candidateView} battery={battery} jobId={jobId} />

      <Card>
        <CardContent className="py-2">
          <DetailStepper activeKey={activeKey} onSelect={setActiveKey} completed={completed} />
        </CardContent>
      </Card>

      {activeKey === 'setup' && (
        <SetupTab
          selectedBattery={battery}
          onSelectBattery={setBattery}
          onSendInvitation={handleSendInvitation}
        />
      )}
      {activeKey === 'take' && (
        <TakeTab
          battery={battery}
          subtestStatus={subtestStatus}
          candidateId={candidateId}
          jobId={jobId}
          existingSessions={existingSessions}
          onSessionsChange={setExistingSessions}
        />
      )}
      {activeKey === 'decide' && (
        <ScoreDecideTab
          key={latestResult?.id ?? `no-result-${battery ?? 'none'}`}
          candidate={candidateView}
          battery={battery}
          result={latestResult}
          onJumpToTab={setActiveKey}
        />
      )}

      <StepFooter activeKey={activeKey} onSelect={setActiveKey} />
    </div>
  );
}

function BackButton({ onBack }) {
  return (
    <Button variant="ghost" size="sm" onClick={onBack} className="text-xs">
      <ArrowLeft className="h-3.5 w-3.5 mr-1.5" /> Back to candidates
    </Button>
  );
}

function CandidateHeader({ candidate, battery }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="h-11 w-11 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold shrink-0">
          {getInitials(candidate.name)}
        </div>
        <div className="min-w-0">
          <div className="text-base font-bold truncate">{candidate.name}</div>
          <div className="text-[11px] text-muted-foreground truncate">
            {candidate.role}
            {battery ? <> <span className="opacity-60">·</span> Battery {battery}</> : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StepFooter({ activeKey, onSelect }) {
  const i = STEPS.findIndex((s) => s.key === activeKey);
  const prev = i > 0 ? STEPS[i - 1] : null;
  const next = i < STEPS.length - 1 ? STEPS[i + 1] : null;

  return (
    <div className="flex justify-between items-center border-t pt-3">
      {prev ? (
        <Button variant="ghost" size="sm" className="text-xs" onClick={() => onSelect(prev.key)}>
          ← Previous: {prev.label}
        </Button>
      ) : <div />}
      {next ? (
        <Button variant="ghost" size="sm" className="text-xs" onClick={() => onSelect(next.key)}>
          Next: {next.label} →
        </Button>
      ) : <div />}
    </div>
  );
}
