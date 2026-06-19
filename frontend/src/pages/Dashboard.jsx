import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, CircleDot, Sparkles, Clock } from 'lucide-react';

// ─────────────────────────────────────────────────
// Dummy data
// ─────────────────────────────────────────────────

const WHATS_NEW = [
  { count: 6,  label: 'New candidate applications',     color: 'text-teal-400' },
  { count: 3,  label: 'Scorecards landed in your inbox', color: 'text-teal-400' },
  { count: 2,  label: 'BG Check verdicts (1 flagged)',  color: 'text-orange-400' },
  { count: 1,  label: 'Offer signed by Citra Lestari',  color: 'text-emerald-400' },
  { count: 4,  label: 'Pool re-consents expired',       color: 'text-amber-400' },
];

const AT_RISK = [
  { id: 1, name: 'Andi Wijaya · Sales MT Bandung', reason: 'BG Check flagged · awaiting review',  timeAgo: '2h',    urgency: 'red' },
  { id: 2, name: 'JOB-2148 cohort · Surabaya',     reason: '6/8 hired · 12d to deadline',         timeAgo: 'today', urgency: 'amber' },
  { id: 3, name: 'Maya Sari · AI Specialist',       reason: 'No interviewer feedback in 3d',       timeAgo: '3d',    urgency: 'amber' },
  { id: 4, name: 'JOB-2156 · Content Writer',       reason: 'No applicants in 5d',                 timeAgo: '5d',    urgency: 'red' },
];

const APPROVALS = [
  { id: 1, type: 'OFFER',  title: 'Bagas Pratama · Sr. Backend Engineer L5', desc: 'Offer letter awaiting your sign-off · 22M IDR · ¥2.5M sign-on', timeLeft: '4h left',    urgent: false },
  { id: 2, type: 'REQ',    title: 'New requisition · Data Analyst',           desc: 'Submitted by Maria Tan · BD Jakarta · 1 headcount',             timeLeft: '1d left',    urgent: false },
  { id: 3, type: 'LEVEL',  title: 'Level change · L3 → L4 · Citra Lestari',  desc: 'Promotion offer requires VP approval',                          timeLeft: '2d left',    urgent: false },
  { id: 4, type: 'BUDGET', title: 'Off-band salary · 18M (band 14–16M)',      desc: 'Andi Wijaya · Sales Exec MT',                                   timeLeft: 'overdue 1d', urgent: true  },
];

const SCORECARDS = [
  { id: 1, name: 'Rina Putri · Sales MT — Surabaya', detail: 'Interviewed 2 days ago · Loop 1 of 2', urgency: 'OVERDUE',   urgencyColor: 'text-red-500' },
  { id: 2, name: 'Bagas Pratama · Backend Engineer',  detail: 'Interviewed yesterday · Loop 2 of 2',  urgency: 'TODAY',     urgencyColor: 'text-amber-500' },
  { id: 3, name: 'Maya Sari · AI Specialist',         detail: 'Interviewed 4h ago · Loop 1 of 3',     urgency: 'THIS WEEK', urgencyColor: 'text-blue-500' },
];

const ACTIVITY = [
  { id: 1, label: 'Bagas Pratama · BG Check cleared · Lane A',     timeAgo: '12 min ago',  color: 'bg-emerald-500' },
  { id: 2, label: 'Sales MT cohort · 4/10 hired · Surabaya 2/3',   timeAgo: '34 min ago',  color: 'bg-blue-500' },
  { id: 3, label: 'Andi Wijaya · BG Check Lane B flagged',          timeAgo: '1 hour ago',  color: 'bg-red-500' },
  { id: 4, label: 'Citra Lestari · Offer counter-signed',           timeAgo: '2 hours ago', color: 'bg-emerald-500' },
  { id: 5, label: 'JOB-2156 · 0 applicants in 5d (Content Writer)', timeAgo: 'today',       color: 'bg-amber-500' },
  { id: 6, label: 'Source ROI report · LinkedIn dropped 4 pts',     timeAgo: 'today',       color: 'bg-blue-500' },
];

const BOTTOM_STATS = [
  { label: 'Active Jobs',    value: '14',  sub: '+2 this week' },
  { label: 'Candidates',     value: '412', sub: 'in pipeline' },
  { label: 'TTH (Last 30d)', value: '24d', sub: '−3d vs prev' },
  { label: 'Offer Accept',   value: '81%', sub: '+4% vs prev' },
  { label: 'Sources',        value: '5',   sub: 'LI, GH, Pool, Ref, Direct' },
];

const APPROVAL_COLORS = {
  OFFER:  'bg-blue-50 text-blue-700 border-blue-200',
  REQ:    'bg-purple-50 text-purple-700 border-purple-200',
  LEVEL:  'bg-amber-50 text-amber-700 border-amber-200',
  BUDGET: 'bg-red-50 text-red-700 border-red-200',
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

// ─────────────────────────────────────────────────
// Ticker
// ─────────────────────────────────────────────────

function WhatsNewTicker() {
  return (
    <div className="rounded-xl overflow-hidden bg-[#1a1a1a] flex-shrink-0">
      <style>{`
        @keyframes ticker-slide {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .ticker-track {
          display: flex;
          width: max-content;
          animation: ticker-slide 28s linear infinite;
        }
        .ticker-track:hover { animation-play-state: paused; }
      `}</style>
      <div className="flex items-stretch h-[52px]">
        <div className="flex-shrink-0 flex flex-col justify-center px-5 border-r border-white/10 min-w-[148px]">
          <p className="text-[9px] font-bold uppercase tracking-widest text-amber-400">What's New Since</p>
          <p className="text-[12px] font-medium text-white/60 mt-0.5">Yesterday at 17:42</p>
        </div>
        <div className="flex-1 overflow-hidden relative">
          <div className="absolute right-0 top-0 bottom-0 w-16 z-10 pointer-events-none"
               style={{ background: 'linear-gradient(to right, transparent, #1a1a1a)' }} />
          <div className="ticker-track h-full items-center">
            {[...WHATS_NEW, ...WHATS_NEW].map((item, i) => (
              <div key={i} className="flex items-center gap-2.5 flex-shrink-0 px-6 border-r border-white/10 h-full whitespace-nowrap cursor-pointer hover:bg-white/5 transition-colors">
                <span className={`text-lg font-bold leading-none ${item.color}`}>{item.count}</span>
                <span className="text-[12px] text-white/70">{item.label}</span>
                <span className="text-white/25 text-sm ml-1">→</span>
              </div>
            ))}
          </div>
        </div>
      </div>
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

  useEffect(() => {
    try {
      const str = localStorage.getItem('user');
      if (str && str !== 'undefined' && str !== 'null') setUser(JSON.parse(str));
    } catch {}
  }, []);

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
        <h1 className="text-2xl font-bold tracking-tight">
          {greeting},{' '}
          <span className="text-primary italic">{displayName}</span>.
        </h1>
        <p className="text-sm text-muted-foreground">
          You have{' '}
          <span className="font-semibold text-foreground">13 items</span>{' '}
          needing attention across 3 cities · 2 are past SLA.
        </p>
      </div>

      {/* ── Ticker — fixed height ── */}
      <WhatsNewTicker />

      {/* ── Four quadrants — grow to fill remaining space ── */}
      <div className="flex-1 grid grid-cols-2 gap-4 min-h-0">
        {/* Top-left: At-Risk */}
        <QuadrantCard
          icon={<AlertTriangle className="h-3.5 w-3.5" />}
          iconColor="text-amber-500"
          title="At-Risk Requisitions"
          count={AT_RISK.length}
          subtitle="Things that need a recruiter decision today."
        >
          {AT_RISK.map(item => (
            <div key={item.id} className="flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors cursor-pointer">
              <div className="flex items-start gap-3 min-w-0">
                <span className={`mt-1.5 h-2 w-2 rounded-full flex-shrink-0 ${item.urgency === 'red' ? 'bg-red-500' : 'bg-amber-400'}`} />
                <div className="min-w-0">
                  <p className="text-xs font-semibold truncate">{item.name}</p>
                  <p className="text-[11px] text-muted-foreground">{item.reason}</p>
                </div>
              </div>
              <span className="text-[11px] text-muted-foreground flex-shrink-0 ml-3">{item.timeAgo}</span>
            </div>
          ))}
        </QuadrantCard>

        {/* Top-right: Approvals */}
        <QuadrantCard
          icon={<CircleDot className="h-3.5 w-3.5" />}
          iconColor="text-blue-500"
          title="Approvals Waiting on You"
          count={APPROVALS.length}
          subtitle="Offers, reqs, level changes, off-band salary — review in Manager Inbox."
        >
          {APPROVALS.map(item => (
            <div key={item.id} className="flex items-start justify-between px-4 py-3 hover:bg-muted/30 transition-colors cursor-pointer gap-3">
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border flex-shrink-0 mt-0.5 ${APPROVAL_COLORS[item.type]}`}>
                  {item.type}
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold">{item.title}</p>
                  <p className="text-[11px] text-muted-foreground">{item.desc}</p>
                </div>
              </div>
              <span className={`text-[11px] font-semibold flex-shrink-0 ${item.urgent ? 'text-red-500' : 'text-muted-foreground'}`}>
                {item.timeLeft}
              </span>
            </div>
          ))}
        </QuadrantCard>

        {/* Bottom-left: Scorecards */}
        <QuadrantCard
          icon={<Clock className="h-3.5 w-3.5" />}
          iconColor="text-primary"
          title="Scorecards Owed"
          count={SCORECARDS.length}
          subtitle="Auto-nudge fires after 24h. Open Manager Inbox to fill rubric."
        >
          {SCORECARDS.map(item => (
            <div key={item.id} className="flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors cursor-pointer gap-3">
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30 flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold">{item.name}</p>
                  <p className="text-[11px] text-muted-foreground">{item.detail}</p>
                </div>
              </div>
              <span className={`text-[10px] font-bold flex-shrink-0 ${item.urgencyColor}`}>{item.urgency}</span>
            </div>
          ))}
        </QuadrantCard>

        {/* Bottom-right: Activity Feed */}
        <QuadrantCard
          icon={<Sparkles className="h-3.5 w-3.5" />}
          iconColor="text-primary"
          title="Activity Feed"
          count={ACTIVITY.length}
          subtitle="Pipeline events from the last 24h. Filter via top bar."
        >
          {ACTIVITY.map(item => (
            <div key={item.id} className="flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors gap-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <span className={`h-2 w-2 rounded-full flex-shrink-0 ${item.color}`} />
                <p className="text-xs truncate">{item.label}</p>
              </div>
              <span className="text-[11px] text-muted-foreground flex-shrink-0">{item.timeAgo}</span>
            </div>
          ))}
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