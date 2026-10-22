import { useState, useEffect } from 'react';
import { AlertTriangle, CircleDot, Clock, Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/common';

import { getJobs } from '@/api/job.api';
import { getWorkboard, getPendingApprovals } from '@/api/offer.api';
import { getSyncingSourcings, getSources } from '@/api/job-sourcing.api';
import { getNoApplicants, getTimeToHire } from '@/api/candidate.api';
import { getScorecardsOwed } from '@/api/interview.api';

const APPROVAL_COLORS = {
  OFFER: 'bg-blue-50 text-blue-700 border-blue-200',
};

// ─────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function getDisplayName(user) {
  if (!user) return 'there';
  return user.full_name
    ?? (user.username
      ? user.username.charAt(0).toUpperCase() + user.username.slice(1)
      : user.email?.split('@')[0] ?? 'there');
}

function formatDuration(startedAt) {
  if (!startedAt) return '—';
  const ms = Date.now() - new Date(startedAt).getTime();
  if (ms < 0) return '—';
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return '<1m';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ${mins % 60}m`;
}

function daysSince(dateStr) {
  if (!dateStr) return null;
  const ms = Date.now() - new Date(dateStr).getTime();
  return Math.max(0, Math.floor(ms / 86400000));
}

// Scorecard nudge fires after 24h (per the subtitle under the widget below):
// <24h since interview = still within grace (THIS WEEK), 24-48h = due TODAY,
// 48h+ = OVERDUE.
function scorecardUrgency(scheduledAt) {
  if (!scheduledAt) return { label: 'THIS WEEK', color: 'text-blue-500' };
  const hours = (Date.now() - new Date(scheduledAt).getTime()) / 3600000;
  if (hours >= 48) return { label: 'OVERDUE', color: 'text-red-500' };
  if (hours >= 24) return { label: 'TODAY', color: 'text-amber-500' };
  return { label: 'THIS WEEK', color: 'text-blue-500' };
}

// First step not yet approved — the one actually blocking progress.
function activeApprovalStep(approval) {
  const steps = approval?.steps || [];
  const index = steps.findIndex((s) => s.status !== 'approved');
  return { step: index >= 0 ? steps[index] : null, index, total: steps.length };
}

// ─────────────────────────────────────────────────
// Currently Syncing — live worker activity table
// ─────────────────────────────────────────────────

function SyncingTable({ rows, loading }) {
  return (
    <div className="flex-shrink-0 rounded-xl border border-border bg-card">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border">
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 text-primary animate-spin" />
        ) : (
          <span className={`h-2 w-2 rounded-full ${rows.length ? 'bg-emerald-500 animate-pulse' : 'bg-muted-foreground/30'}`} />
        )}
        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          Currently Syncing
        </span>
        <span className="text-[11px] font-bold text-foreground">{rows.length}</span>
      </div>

      {rows.length === 0 ? (
        <div className="px-4 py-3 text-[11px] text-muted-foreground">
          {loading ? 'Loading…' : 'Nothing is syncing right now.'}
        </div>
      ) : (
        <div className="max-h-[168px] overflow-y-auto divide-y divide-border">
          {rows.map((row) => {
            const pct = row.candidate_count
              ? Math.min(100, Math.round(((row.progress || 0) / row.candidate_count) * 100))
              : null;
            return (
              <div key={row.id} className="flex items-center gap-3 px-4 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold truncate">{row.job_title}</p>
                  <p className="text-[11px] text-muted-foreground capitalize">{row.platform} · {row.status}</p>
                </div>
                <div className="w-32 flex-shrink-0">
                  {pct != null ? (
                    <>
                      <div className="bg-muted rounded-full h-1.5 overflow-hidden">
                        <div className="h-1.5 rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5 text-right">
                        {row.progress ?? 0}/{row.candidate_count} · {pct}%
                      </p>
                    </>
                  ) : (
                    <p className="text-[11px] text-muted-foreground text-right">—</p>
                  )}
                </div>
                <span className="text-[11px] text-muted-foreground flex-shrink-0 w-12 text-right">
                  {formatDuration(row.sync_started_at)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────
// Quadrant card — fills its grid cell, scrolls internally
// ─────────────────────────────────────────────────

function QuadrantCard({ icon, iconColor, title, count, subtitle, children }) {
  return (
    <div className="rounded-xl border border-border bg-card flex flex-col min-h-0">
      {/* Fixed header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <span className={iconColor}>{icon}</span>
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            {title}
          </span>
          {count != null && (
            <span className="ml-1 text-[11px] font-bold text-foreground">{count}</span>
          )}
        </div>
        {subtitle && (
          <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{subtitle}</p>
        )}
      </div>
      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto divide-y divide-border min-h-0">
        {children}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [offerSummary, setOfferSummary] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [syncing, setSyncing] = useState([]);
  const [syncingLoading, setSyncingLoading] = useState(true);

  const [noApplicants, setNoApplicants] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [scorecardsOwed, setScorecardsOwed] = useState([]);
  const [quadrantsLoading, setQuadrantsLoading] = useState(true);

  const [tth, setTth] = useState(null);
  const [sources, setSources] = useState([]);

  useEffect(() => {
    try {
      const str = localStorage.getItem('user');
      if (str && str !== 'undefined' && str !== 'null') setUser(JSON.parse(str));
    } catch (err) {
      console.error('Failed to parse user from localStorage:', err);
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [jobsRes, offersRes, tthRes, sourcesRes] = await Promise.all([
          getJobs(), getWorkboard(), getTimeToHire(30), getSources(),
        ]);
        setJobs(jobsRes.data.jobs || []);
        setOfferSummary(offersRes.data.summary || null);
        setTth(tthRes.data.tth || null);
        setSources(sourcesRes.data.postings || []);
      } catch (err) {
        console.error('Failed to load dashboard stats:', err);
      } finally {
        setStatsLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [noAppRes, approvalsRes, scorecardsRes] = await Promise.all([
          getNoApplicants(5), getPendingApprovals(), getScorecardsOwed(),
        ]);
        setNoApplicants(noAppRes.data.jobs || []);
        setPendingApprovals(approvalsRes.data.approvals || []);
        setScorecardsOwed(scorecardsRes.data.scorecards || []);
      } catch (err) {
        console.error('Failed to load dashboard quadrants:', err);
      } finally {
        setQuadrantsLoading(false);
      }
    })();
  }, []);

  // Live worker activity — polled rather than fetched once, since this
  // reflects whatever the RPA worker is doing right now.
  useEffect(() => {
    let cancelled = false;
    const fetchSyncing = async () => {
      try {
        const res = await getSyncingSourcings();
        if (!cancelled) setSyncing(res.data.syncing || []);
      } catch (err) {
        console.error('Failed to load syncing job sources:', err);
      } finally {
        if (!cancelled) setSyncingLoading(false);
      }
    };
    fetchSyncing();
    const interval = setInterval(fetchSyncing, 5000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  const activeJobsCount = Array.isArray(jobs)
    ? jobs.filter((j) => j.status === 'Active').length
    : 0;

  const totalCandidates = Array.isArray(jobs)
    ? jobs.reduce((sum, j) => sum + (j.candidate_count || 0), 0)
    : 0;

  const decidedOffers = offerSummary
    ? offerSummary.accepted + offerSummary.rejected + offerSummary.signed
    : 0;

  const acceptedOffers = offerSummary
    ? offerSummary.accepted + offerSummary.signed
    : 0;

  const offerAcceptPct = decidedOffers > 0
    ? Math.round((acceptedOffers / decidedOffers) * 100)
    : null;

  // Top platform by sourcing count, e.g. "Seek leads · 7".
  const platformCounts = sources.reduce((acc, s) => {
    if (s.platform) acc[s.platform] = (acc[s.platform] || 0) + 1;
    return acc;
  }, {});
  const distinctPlatforms = Object.keys(platformCounts);
  const topPlatform = distinctPlatforms.sort((a, b) => platformCounts[b] - platformCounts[a])[0];

  const BOTTOM_STATS = [
    { label: 'Active Jobs', value: statsLoading ? '—' : String(activeJobsCount), sub: `${jobs.length} total jobs` },
    { label: 'Candidates', value: statsLoading ? '—' : String(totalCandidates), sub: 'across active jobs' },
    {
      label: 'TTH (Last 30d)',
      value: statsLoading ? '—' : tth?.avg_days != null ? `${Math.round(tth.avg_days)}d` : 'N/A',
      sub: statsLoading ? '' : `${tth?.hired_count ?? 0} hired`,
    },
    {
      label: 'Offer Accept',
      value: statsLoading ? '—' : offerAcceptPct != null ? `${offerAcceptPct}%` : 'N/A',
      sub: statsLoading ? '' : `${acceptedOffers}/${decidedOffers} decided`,
    },
    {
      label: 'Sources',
      value: statsLoading ? '—' : String(distinctPlatforms.length),
      sub: statsLoading ? '' : topPlatform ? `${topPlatform} leads · ${platformCounts[topPlatform]}` : 'none active',
    },
  ];

  const attentionCount = noApplicants.length + pendingApprovals.length + scorecardsOwed.length;

  const greeting    = getGreeting();
  const displayName = getDisplayName(user);

  return (
    /*
     * h-full fills whatever height the app shell gives this page.
     * flex-col + min-h-0 lets children shrink below their content size.
     * overflow-hidden prevents the page itself from scrolling.
     */
    <div className="h-full flex flex-col gap-4 overflow-hidden">

      {/* ── Greeting — fixed height ── */}
      <div className="flex-shrink-0 flex items-baseline gap-3 flex-wrap">
        <PageHeader
          title={`${greeting},`}
          highlight={`${displayName}.`}
          subtitle={
            quadrantsLoading
              ? 'Loading what needs your attention…'
              : `You have ${attentionCount} item${attentionCount === 1 ? '' : 's'} needing attention.`
          }
        />
      </div>

      {/* ── Currently Syncing — fixed height, live-polled ── */}
      <SyncingTable rows={syncing} loading={syncingLoading} />

      {/* ── Three quadrants — grow to fill remaining space ── */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-0">
        {/* At-Risk: active jobs with no applicants yet */}
        <QuadrantCard
          icon={<AlertTriangle className="h-3.5 w-3.5" />}
          iconColor="text-amber-500"
          title="At-Risk Requisitions"
          count={noApplicants.length}
          subtitle="Active jobs with no applicants in 5+ days."
        >
          {quadrantsLoading ? (
            <div className="px-4 py-3 text-[11px] text-muted-foreground">Loading…</div>
          ) : noApplicants.length === 0 ? (
            <div className="px-4 py-3 text-[11px] text-muted-foreground">Nothing at risk right now.</div>
          ) : noApplicants.map(item => (
            <div key={item.job_id} className="flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors">
              <div className="flex items-start gap-3 min-w-0">
                <span className="mt-1.5 h-2 w-2 rounded-full flex-shrink-0 bg-red-500" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold truncate">{item.job_title}</p>
                  <p className="text-[11px] text-muted-foreground">No applicants yet</p>
                </div>
              </div>
              <span className="text-[11px] text-muted-foreground flex-shrink-0 ml-3">{daysSince(item.created_at)}d</span>
            </div>
          ))}
        </QuadrantCard>

        {/* Offer approvals in progress */}
        <QuadrantCard
          icon={<CircleDot className="h-3.5 w-3.5" />}
          iconColor="text-blue-500"
          title="Offer Approvals Pending"
          count={pendingApprovals.length}
          subtitle="Offers with an approval chain in progress."
        >
          {quadrantsLoading ? (
            <div className="px-4 py-3 text-[11px] text-muted-foreground">Loading…</div>
          ) : pendingApprovals.length === 0 ? (
            <div className="px-4 py-3 text-[11px] text-muted-foreground">No approvals pending.</div>
          ) : pendingApprovals.map(item => {
            const { step, index, total } = activeApprovalStep(item.approval);
            return (
              <div key={item.id} className="flex items-start justify-between px-4 py-3 hover:bg-muted/30 transition-colors gap-3">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border flex-shrink-0 mt-0.5 ${APPROVAL_COLORS.OFFER}`}>
                    OFFER
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold truncate">{item.candidate_name} · {item.job_title}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {step ? `Awaiting ${step.role} (${step.name})` : 'Awaiting approval'}
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-semibold flex-shrink-0 text-muted-foreground">
                  Step {index + 1}/{total}
                </span>
              </div>
            );
          })}
        </QuadrantCard>

        {/* Interviews that happened but have no scorecard recorded yet */}
        <QuadrantCard
          icon={<Clock className="h-3.5 w-3.5" />}
          iconColor="text-primary"
          title="Scorecards Owed"
          count={scorecardsOwed.length}
          subtitle="Auto-nudge fires after 24h."
        >
          {quadrantsLoading ? (
            <div className="px-4 py-3 text-[11px] text-muted-foreground">Loading…</div>
          ) : scorecardsOwed.length === 0 ? (
            <div className="px-4 py-3 text-[11px] text-muted-foreground">Nothing owed right now.</div>
          ) : scorecardsOwed.map(item => {
            const urgency = scorecardUrgency(item.scheduled_at);
            return (
              <div key={item.interview_id} className="flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors gap-3">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30 flex-shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold truncate">{item.candidate_name}</p>
                    <p className="text-[11px] text-muted-foreground">{item.job_title}</p>
                  </div>
                </div>
                <span className={`text-[10px] font-bold flex-shrink-0 ${urgency.color}`}>{urgency.label}</span>
              </div>
            );
          })}
        </QuadrantCard>
      </div>

      {/* ── Stats bar — fixed height ── */}
      <div className="flex-shrink-0 rounded-xl border border-border bg-card">
        <div className="grid grid-cols-5 divide-x divide-border">
          {BOTTOM_STATS.map((stat, i) => (
            <div key={i} className="px-5 py-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{stat.label}</p>
              <p className="text-2xl font-bold text-foreground mt-0.5">{stat.value}</p>
              <p className="text-[11px] text-muted-foreground">{stat.sub}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}