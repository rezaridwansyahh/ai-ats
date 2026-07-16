import { useState } from 'react';
import { Download, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/common';
/* ─────────────────────────────────────────────────────────────────────────────
   DUMMY DATA
   Replace `reportsMock` with real fetches later — nothing else changes.
   No `report.api.js` exists yet; this section aggregates across screening,
   interview, psych, medical, background-check, offer, and onboarding modules,
   so a real integration likely needs either one backend aggregation endpoint
   or several parallel fetches stitched together here.
───────────────────────────────────────────────────────────────────────────── */

const reportsMock = {
  slaBreach: {
    kpis: [
      { label: 'Total Breaches',   value: '47',    sub: '+8 vs LW',  tone: 'rose' },
      { label: 'Worst Stage',      value: 'Psych', sub: '14 breaches', tone: null },
      { label: 'Avg Breach Time',  value: '31h',   sub: '+4h vs LW', tone: 'rose' },
      { label: 'Cleared This Wk',  value: '19',    sub: '+12 vs LW', tone: 'emerald' },
    ],
    rows: [
      { stage: 'Screening', job: 'Operator', location: 'Cikarang', candidateId: 'cand#a82c', lastEvent: 'AI screen pending review', sla: '48h',           actual: '73h',  status: 'fail' },
      { stage: 'Psych',     job: 'Operator', location: 'Karawang', candidateId: 'cand#9f1d', lastEvent: 'Battery results not posted', sla: '72h',          actual: '194h', status: 'fail' },
      { stage: 'Medical',   job: 'Operator', location: 'Bekasi',   candidateId: 'cand#71b9', lastEvent: 'Clinic result delay (vendor)', sla: '5d',         actual: '7d',   status: 'fail' },
      { stage: 'BG Check',  job: 'Welder',   location: 'Cibitung', candidateId: 'cand#3f98', lastEvent: 'Vendor partial result returned', sla: '5d',       actual: '5d 4h', status: 'warn' },
      { stage: 'Offer',     job: 'Sales Exec', location: 'HQ',     candidateId: 'cand#5d2a', lastEvent: 'Finance approver out-of-office', sla: '24h per approver', actual: '48h', status: 'fail' },
      { stage: 'Interview', job: 'QA Insp',  location: 'Bekasi',   candidateId: 'cand#882f', lastEvent: 'Just within SLA', sla: '72h',                      actual: '71h',  status: 'ok' },
    ],
  },

  hiringKpis: [
    { label: 'Time to Hire',       value: '24d',       sub: '-3d vs last 30d', tone: 'emerald' },
    { label: 'Offer Accept Rate',  value: '81%',        sub: '+4% vs last 30d', tone: 'emerald' },
    { label: 'Day-30 On-track',    value: '92%',        sub: '+1% vs last 30d', tone: 'emerald' },
    { label: 'Probation Pass',     value: '87%',        sub: '-2% vs last 30d', tone: 'rose' },
    { label: 'Cost per Hire',      value: 'IDR 17.8M',  sub: '-4% vs last 30d', tone: 'emerald' },
  ],

  funnel: {
    code: 'RP-01',
    eyebrow: 'Funnel · Last 30 days',
    title: 'Source → Day-30 lifecycle',
    subtitle: 'Now reads from the full event bus — offer + onboarding states are first-class.',
    period: 'Last 30d',
    scope: 'All cities',
    stages: [
      { label: 'Sourced',            value: 1240, pct: 100, drop: null,        tone: 'dark'    },
      { label: 'Screened',           value: 480,  pct: 39,  drop: '-61% drop', tone: 'muted'   },
      { label: 'Interviewed',        value: 168,  pct: 14,  drop: '-65% drop', tone: 'blue'    },
      { label: 'Assessed (P+M+BG)',  value: 98,   pct: 8,   drop: '-43% drop', tone: 'amber'   },
      { label: 'Offered',            value: 38,   pct: 3,   drop: '-60% drop', tone: 'orange'  },
      { label: 'Counter-signed',     value: 31,   pct: 3,   drop: '-18% drop', tone: 'teal'    },
      { label: 'Day-30 on-track',    value: 28,   pct: 2,   drop: 'D30 cohort', tone: 'emerald', muted: true },
    ],
    insight: 'Bottleneck: 61% of candidates drop between Screened → Interviewed. Median screen-to-interview latency is 6.1 days. SLA target is 3 days.',
  },

  channels: {
    code: 'RP-02',
    eyebrow: 'Source of hire',
    title: 'Channel → drop stage → hire',
    subtitle: 'Width = volume sourced. Color = where they drop. Bar = % accepted offer.',
    rows: [
      { channel: 'JobStreet',          dropAt: 62, hired: 11, hiredTone: 'navy',    hires: 11, cph: 'IDR 1,682k' },
      { channel: 'LinkedIn (passive)', dropAt: 48, hired: 7,  hiredTone: 'navy',    hires: 7,  cph: 'IDR 6,000k' },
      { channel: 'Referral',           dropAt: 78, hired: 9,  hiredTone: 'emerald', hires: 9,  cph: 'IDR 700k'   },
      { channel: 'Campaign · Mgmt T.', dropAt: null, hired: 3, hiredTone: 'amber',  hires: 3,  cph: 'IDR 7,167k' },
      { channel: 'Talent Pool (warm)', dropAt: null, hired: 1, hiredTone: 'violet', hires: 1,  cph: 'IDR 1,200k' },
    ],
    insight: 'Referrals deliver 9 hires at 700k CPH. LinkedIn passive delivers 7 at 6M CPH. Shift 30% LinkedIn budget to a referral bonus and projected savings is IDR 38M/quarter.',
  },
};

/* ─────────────────────────────────────────────────────────────────────────────
   Shared tone helpers
───────────────────────────────────────────────────────────────────────────── */

const KPI_TONE = {
  emerald: 'text-emerald-600',
  rose:    'text-rose-600',
};

const STATUS_TONE = {
  fail: 'border-rose-200    bg-rose-50    text-rose-700',
  warn: 'border-amber-200   bg-amber-50   text-amber-700',
  ok:   'border-emerald-200 bg-emerald-50 text-emerald-700',
};

const STAGE_BAR_TONE = {
  dark:    'bg-foreground',
  muted:   'bg-muted-foreground/30',
  blue:    'bg-blue-600',
  amber:   'bg-amber-500',
  orange:  'bg-orange-500',
  teal:    'bg-teal-600',
  emerald: 'bg-emerald-600',
};

const HIRED_BADGE_TONE = {
  navy:    'bg-slate-800 text-white',
  emerald: 'bg-emerald-600 text-white',
  amber:   'bg-amber-500 text-white',
  violet:  'bg-violet-500 text-white',
};

/* ─────────────────────────────────────────────────────────────────────────────
   Sub-components
───────────────────────────────────────────────────────────────────────────── */

function KpiCard({ label, value, sub, tone }) {
  return (
    <div className="border rounded-xl bg-card p-4">
      <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-2">
        {label}
      </div>
      <div className="font-serif text-2xl font-bold text-foreground">{value}</div>
      {sub && (
        <div className={`text-xs mt-1 ${KPI_TONE[tone] ?? 'text-muted-foreground'}`}>
          {sub}
        </div>
      )}
    </div>
  );
}

function StatusPill({ status }) {
  const label = { fail: 'FAIL', warn: 'WARN', ok: 'OK' }[status];
  return (
    <span className={`inline-flex items-center justify-center rounded-md border px-2 py-1 text-[11px] font-bold tracking-wide ${STATUS_TONE[status]}`}>
      {label}
    </span>
  );
}

function SlaBreachTable({ rows }) {
  return (
    <div className="border rounded-xl overflow-hidden bg-card">
      <table className="w-full text-sm">
        <thead className="bg-muted/40 border-b">
          <tr className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
            <th className="px-4 py-3 text-left">Stage</th>
            <th className="px-4 py-3 text-left">Job · Candidate</th>
            <th className="px-4 py-3 text-left">Last Event</th>
            <th className="px-4 py-3 text-right">SLA</th>
            <th className="px-4 py-3 text-right">Actual</th>
            <th className="px-4 py-3 text-left">Status</th>
            <th className="px-4 py-3 text-right"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.candidateId} className="border-b last:border-b-0 hover:bg-muted/20">
              <td className="px-4 py-3 font-semibold text-foreground whitespace-nowrap">{r.stage}</td>
              <td className="px-4 py-3">
                <div className="text-foreground">{r.job} · {r.location}</div>
                <div className="text-xs text-muted-foreground">{r.candidateId}</div>
              </td>
              <td className="px-4 py-3 text-muted-foreground">{r.lastEvent}</td>
              <td className="px-4 py-3 text-right text-muted-foreground whitespace-nowrap">{r.sla}</td>
              <td className="px-4 py-3 text-right font-semibold text-foreground whitespace-nowrap">{r.actual}</td>
              <td className="px-4 py-3"><StatusPill status={r.status} /></td>
              <td className="px-4 py-3 text-right">
                <button type="button" className="text-muted-foreground hover:text-foreground px-2">⋯</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FunnelBar({ stage, maxPct }) {
  const widthPct = Math.max((stage.pct / maxPct) * 100, 4);
  return (
    <div className="flex items-center gap-3">
      <div className="w-36 flex-shrink-0 text-xs font-semibold text-foreground text-right">{stage.label}</div>
      <div className="flex-1 relative h-8 bg-muted/30 rounded-md overflow-hidden">
        <div
          className={`h-full rounded-md flex items-center px-3 ${STAGE_BAR_TONE[stage.tone]} ${stage.muted ? 'opacity-70' : ''}`}
          style={{ width: `${widthPct}%` }}
        >
          <span className="text-xs font-bold text-white whitespace-nowrap">{stage.value.toLocaleString()}</span>
        </div>
      </div>
      <div className="w-24 flex-shrink-0 text-xs text-muted-foreground text-right whitespace-nowrap">
        {stage.drop ?? ''}
      </div>
    </div>
  );
}

function FunnelSection({ data }) {
  const maxPct = Math.max(...data.stages.map((s) => s.pct));
  return (
    <div className="border rounded-xl bg-card p-5 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-1">
            {data.code} · {data.eyebrow}
          </div>
          <h3 className="font-serif text-lg font-bold text-foreground">{data.title}</h3>
          <p className="text-xs text-muted-foreground mt-1">{data.subtitle}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button type="button" className="flex items-center gap-1 text-xs font-semibold border rounded-md px-2.5 py-1.5 text-foreground hover:bg-muted/40">
            {data.period} <ChevronDown className="h-3 w-3" />
          </button>
          <button type="button" className="flex items-center gap-1 text-xs font-semibold border rounded-md px-2.5 py-1.5 text-foreground hover:bg-muted/40">
            {data.scope} <ChevronDown className="h-3 w-3" />
          </button>
          <button type="button" className="flex items-center gap-1 text-xs font-semibold border rounded-md px-2.5 py-1.5 text-foreground hover:bg-muted/40">
            <Download className="h-3 w-3" /> Export CSV
          </button>
        </div>
      </div>

      <div className="space-y-2 pt-2">
        {data.stages.map((s) => <FunnelBar key={s.label} stage={s} maxPct={maxPct} />)}
      </div>

      <div className="border border-blue-200 bg-blue-50 text-blue-900 rounded-lg px-4 py-3 text-xs leading-relaxed">
        <span className="font-bold">Bottleneck.</span> {data.insight.replace('Bottleneck: ', '')}
      </div>
    </div>
  );
}

function ChannelRow({ row }) {
  return (
    <tr className="border-b last:border-b-0">
      <td className="px-4 py-3.5 text-sm font-semibold text-foreground whitespace-nowrap">{row.channel}</td>
      <td className="px-4 py-3.5">
        <div className="relative h-6 bg-muted/30 rounded-md overflow-hidden">
          {row.dropAt != null && (
            <div
              className="absolute top-0 bottom-0 border border-dashed border-rose-400 bg-rose-50/80 flex items-center justify-center"
              style={{ left: `${row.dropAt - 12}%`, width: '14%' }}
            >
              <span className="text-[9px] font-bold text-rose-600 whitespace-nowrap">× DROP</span>
            </div>
          )}
          <div className={`absolute right-0 top-0 bottom-0 flex items-center px-2 rounded-r-md ${HIRED_BADGE_TONE[row.hiredTone]}`} style={{ minWidth: '64px' }}>
            <span className="text-[10px] font-bold whitespace-nowrap">{row.hired} HIRED</span>
          </div>
        </div>
      </td>
      <td className="px-4 py-3.5 text-sm text-right text-foreground">{row.hires}</td>
      <td className="px-4 py-3.5 text-sm text-right text-muted-foreground whitespace-nowrap">{row.cph}</td>
    </tr>
  );
}

function ChannelSection({ data }) {
  const [tab, setTab] = useState('cph');
  return (
    <div className="border rounded-xl bg-card p-5 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-1">
            {data.code} · {data.eyebrow}
          </div>
          <h3 className="font-serif text-lg font-bold text-foreground">{data.title}</h3>
          <p className="text-xs text-muted-foreground mt-1">{data.subtitle}</p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0 border rounded-md p-0.5">
          <button
            type="button"
            onClick={() => setTab('cph')}
            className={`text-xs font-semibold px-2.5 py-1 rounded ${tab === 'cph' ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`}
          >
            By cost-per-hire
          </button>
          <button
            type="button"
            onClick={() => setTab('stage')}
            className={`text-xs font-semibold px-2.5 py-1 rounded ${tab === 'stage' ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`}
          >
            By stage
          </button>
        </div>
      </div>

      <table className="w-full">
        <thead>
          <tr className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
            <th className="px-4 py-2 text-left w-40">Channel</th>
            <th className="px-4 py-2 text-left">Stage Flow</th>
            <th className="px-4 py-2 text-right w-20">Hires</th>
            <th className="px-4 py-2 text-right w-28">CPH</th>
          </tr>
        </thead>
        <tbody>
          {data.rows.map((r) => <ChannelRow key={r.channel} row={r} />)}
        </tbody>
      </table>

      <div className="border border-emerald-200 bg-emerald-50 text-emerald-900 rounded-lg px-4 py-3 text-xs leading-relaxed">
        <span className="font-bold">Insight.</span> {data.insight.replace('Insight: ', '')}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Page
───────────────────────────────────────────────────────────────────────────── */

export default function ReportsPage({ data = reportsMock }) {
  const { slaBreach, hiringKpis, funnel, channels } = data;

  return (
    <div className="p-6 space-y-8 max-w-[1100px] mx-auto">
        <PageHeader
            title="Reports"
            highlight="& Insights"
            subtitle="Track SLA breaches, hiring velocity, and source performance across every stage."
        />
      {/* SLA breach section */}
      <section className="space-y-4">
        <div>
          <h2 className="font-serif text-xl font-bold text-foreground">SLA breach</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Reports gets a dedicated SLA breach view: 4 KPIs, then a per-breach table with drill — every step the candidate took, the timer at each event, and the final breach delta. Replaces the v54 "SLA chart" stub.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {slaBreach.kpis.map((k) => <KpiCard key={k.label} {...k} />)}
        </div>

        <SlaBreachTable rows={slaBreach.rows} />

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {hiringKpis.map((k) => <KpiCard key={k.label} {...k} />)}
        </div>
      </section>

      {/* RP-01 Funnel */}
      <FunnelSection data={funnel} />

      {/* RP-02 Channel */}
      <ChannelSection data={channels} />

    </div>
  );
}