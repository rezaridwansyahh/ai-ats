import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Loader2, AlertTriangle, RotateCw, Check,
  ChevronDown, ChevronRight, Users, FileSearch,
  ShieldCheck, ClipboardList, Scale,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getInitials } from '@/lib/batteries';

import { getJobById } from '@/api/job.api';
import { getBgChecksByJob } from '@/api/background-check.api';

const STATUS_META = {
  claims:   { label: 'Claims',   color: 'bg-blue-100 text-blue-700'      },
  consent:  { label: 'Consent',  color: 'bg-purple-100 text-purple-700'  },
  tracker:  { label: 'Tracker',  color: 'bg-amber-100 text-amber-700'    },
  verdict:  { label: 'Verdict',  color: 'bg-orange-100 text-orange-700'  },
  done:     { label: 'Ready',    color: 'bg-emerald-100 text-emerald-700' },
  archived: { label: 'Archived', color: 'bg-gray-100 text-gray-500'      },
};

function jobStatusTone(status) {
  switch ((status || '').toLowerCase()) {
    case 'active':
    case 'running': return 'border-emerald-200 text-emerald-700 bg-emerald-50';
    case 'draft':   return 'border-amber-200 text-amber-700 bg-amber-50';
    case 'expired':
    case 'failed':  return 'border-rose-200 text-rose-700 bg-rose-50';
    default:        return 'border-border text-muted-foreground bg-muted/40';
  }
}

function SubStageCard({ number, label, count, countLabel, foot, percent, isVerdict, onCalibrate, onClick }) {
  return (
    <Card
      className="cursor-pointer hover:border-primary/40 transition-colors"
      onClick={onClick}
    >
      <CardContent className="p-4 space-y-3">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-xs font-semibold text-foreground">
            {number} · {label}
          </span>
          <span className="text-[11px] text-muted-foreground">{countLabel}</span>
        </div>
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>
        {isVerdict ? (
          <Button
            size="sm"
            className="w-full text-xs"
            onClick={(e) => { e.stopPropagation(); onCalibrate(); }}
          >
            <Scale className="h-3.5 w-3.5 mr-1.5" /> Calibrate cohort
          </Button>
        ) : (
          <p className="text-[10px] text-muted-foreground">
            {foot}{' '}
            <span className="inline-flex items-center gap-0.5 text-muted-foreground/60">
              see candidates <ChevronRight className="h-3 w-3" />
            </span>
          </p>
        )}
      </CardContent>
    </Card>
  );
}


function Section({ id, title, subtitle, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 py-2 text-left"
      >
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground transition-transform ${open ? '' : '-rotate-90'}`}
        />
        <span className="text-sm font-semibold">{title}</span>
        {subtitle && (
          <span className="text-xs text-muted-foreground">{subtitle}</span>
        )}
      </button>
      {open && children}
    </div>
  );
}

function CandidateRow({ bg, onOpen }) {
  const name   = bg.candidate_name || `#${bg.candidate_id}`;
  const meta   = STATUS_META[bg.status] || { label: bg.status, color: 'bg-muted text-muted-foreground' };

  return (
    <div
      onClick={onOpen}
      className="flex items-center justify-between gap-3 p-3 border rounded-lg hover:bg-muted/30 cursor-pointer transition-colors"
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[11px] font-bold shrink-0">
          {getInitials(name)}
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold truncate">{name}</div>
          {bg.last_position && (
            <div className="text-[10px] text-muted-foreground truncate mt-0.5">
              {bg.last_position}
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {bg.verdict && (
          <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
            {bg.verdict.replace(/_/g, ' ')}
          </span>
        )}
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${meta.color}`}>
          {meta.label}
        </span>
        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
    </div>
  );
}

function VerdictHero({ count, onCalibrate }) {
  if (count === 0) return null;
  return (
    <Card className="border-emerald-200 bg-emerald-50/40">
      <CardContent className="p-4 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="text-sm font-semibold text-emerald-800">
            {count} candidate{count === 1 ? '' : 's'} ready for verdict
          </p>
          <p className="text-[11px] text-emerald-700 mt-0.5">
            All BG check lanes resolved — open Calibration to compare side-by-side.
          </p>
        </div>
        <Button
          size="sm"
          className="text-xs bg-emerald-700 hover:bg-emerald-800"
          onClick={onCalibrate}
        >
          <Scale className="h-3.5 w-3.5 mr-1.5" /> Calibrate cohort
        </Button>
      </CardContent>
    </Card>
  );
}

export default function BgCheckJobPage() {
  const navigate          = useNavigate();
  const { jobId: param }  = useParams();
  const jobId             = param ? Number(param) : null;

  const [job, setJob]         = useState(null);
  const [bgChecks, setBgChecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const load = useCallback(async () => {
    if (!jobId) return;
    setLoading(true);
    setError(null);
    try {
      const [jobRes, bgRes] = await Promise.all([
        getJobById(jobId),
        getBgChecksByJob(jobId),
      ]);
      setJob(jobRes.data?.job || jobRes.data || null);
      setBgChecks(bgRes.data?.bg_checks || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => { load(); }, [load]);

  const byStatus = (status) => bgChecks.filter((b) => b.status === status);

  const claimsCandidates   = byStatus('claims');
  const consentCandidates  = byStatus('consent');
  const trackerCandidates  = byStatus('tracker');
  const verdictCandidates  = byStatus('verdict');
  const doneCandidates     = byStatus('done');
  const totalActive        = bgChecks.filter((b) => b.status !== 'archived').length;

  const subStageTotal = (n) => Math.max(1, totalActive);
  const pct = (n) => Math.round((n / subStageTotal()) * 100);

  const goCandidate = (bg) =>
    navigate(`/selection/background-check/candidate/${bg.bg_id}`);

  const goCalibration = () =>
    navigate(`/selection/background-check/calibration/${jobId}`);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-5 p-6">

      {/* Back */}
      <Button
        variant="ghost" size="sm" className="text-xs -ml-2"
        onClick={() => navigate('/selection/background-check')}
      >
        <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back to workboard
      </Button>

      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight">
              {job?.job_title || `Job #${jobId}`}
            </h1>
            {job?.status && (
              <Badge
                variant="outline"
                className={`text-[9px] uppercase tracking-wide ${jobStatusTone(job.status)}`}
              >
                {job.status}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {totalActive} candidate{totalActive === 1 ? '' : 's'} in BG check
            {job?.job_location ? ` · ${job.job_location}` : ''}
            {job?.work_type    ? ` · ${job.work_type}`    : ''}
          </p>
        </div>
        <Button variant="outline" size="sm" className="text-xs" onClick={load}>
          <RotateCw className="h-3.5 w-3.5 mr-1.5" /> Refresh
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg border border-red-200 bg-red-50 text-sm text-red-600">
          <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {/* Sub-stage progress strip */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">
              Sub-stage progress
            </CardTitle>
            <span className="text-[11px] text-muted-foreground">
              {totalActive} total · UU PDP compliant
            </span>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <SubStageCard
              number="1" label="Claims"
              countLabel={`${claimsCandidates.length} reviewing`}
              foot={`${claimsCandidates.length} with auto-extracted items`}
              percent={pct(claimsCandidates.length)}
              onClick={() => {}}
            />
            <SubStageCard
              number="2" label="Consent"
              countLabel={`${consentCandidates.length} awaiting`}
              foot={`${consentCandidates.length} consent letters sent`}
              percent={pct(consentCandidates.length)}
              onClick={() => {}}
            />
            <SubStageCard
              number="3" label="Tracker"
              countLabel={`${trackerCandidates.length} in flight`}
              foot={`${trackerCandidates.length} with active vendor lanes`}
              percent={pct(trackerCandidates.length)}
              onClick={() => {}}
            />
            <SubStageCard
              number="4" label="Verdict"
              countLabel={`${verdictCandidates.length + doneCandidates.length} ready`}
              foot=""
              percent={pct(verdictCandidates.length + doneCandidates.length)}
              isVerdict
              onCalibrate={goCalibration}
              onClick={goCalibration}
            />
          </div>
        </CardContent>
      </Card>

      {/* Candidate sections */}
      <div className="space-y-4">

        {/* Tracker — expanded by default, most work happens here */}
        <Section
          id="tracker"
          title="Tracker"
          subtitle={`${trackerCandidates.length} candidates with active lanes`}
          defaultOpen={trackerCandidates.length > 0}
        >
          {trackerCandidates.length === 0 ? (
            <p className="text-xs text-muted-foreground italic px-1">No candidates at tracker stage.</p>
          ) : (
            <div className="space-y-2">
              {trackerCandidates.map((b) => (
                <CandidateRow key={b.bg_id} bg={b} onOpen={() => goCandidate(b)} />
              ))}
            </div>
          )}
        </Section>

        {/* Claims */}
        <Section
          id="claims"
          title="Claims"
          subtitle={`${claimsCandidates.length} candidates with auto-extracted items`}
        >
          {claimsCandidates.length === 0 ? (
            <p className="text-xs text-muted-foreground italic px-1">No candidates at claims stage.</p>
          ) : (
            <div className="space-y-2">
              {claimsCandidates.map((b) => (
                <CandidateRow key={b.bg_id} bg={b} onOpen={() => goCandidate(b)} />
              ))}
            </div>
          )}
        </Section>

        {/* Consent */}
        <Section
          id="consent"
          title="Consent"
          subtitle={`${consentCandidates.length} awaiting candidate e-signature`}
        >
          {consentCandidates.length === 0 ? (
            <p className="text-xs text-muted-foreground italic px-1">No candidates awaiting consent.</p>
          ) : (
            <div className="space-y-2">
              {consentCandidates.map((b) => (
                <CandidateRow key={b.bg_id} bg={b} onOpen={() => goCandidate(b)} />
              ))}
            </div>
          )}
        </Section>

        {/* Verdict */}
        <Section
          id="verdict"
          title="Verdict"
          subtitle={`${verdictCandidates.length + doneCandidates.length} ready for decision`}
        >
          <VerdictHero
            count={verdictCandidates.length + doneCandidates.length}
            onCalibrate={goCalibration}
          />
          {verdictCandidates.length === 0 && doneCandidates.length === 0 && (
            <p className="text-xs text-muted-foreground italic px-1">No candidates at verdict stage.</p>
          )}
          {verdictCandidates.length > 0 && (
            <div className="space-y-2 mt-3">
              {verdictCandidates.map((b) => (
                <CandidateRow key={b.bg_id} bg={b} onOpen={() => goCandidate(b)} />
              ))}
            </div>
          )}
        </Section>

      </div>
    </div>
  );
}