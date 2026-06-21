import { Workflow, Download, Bell, Eye, FileSignature, Heart, MessageCircleQuestion, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StepCard, StatusPill } from './shared';

/* ─────────────────────────────────────────────────────────────────────────────
   Tone map for the cross-stage offers table
───────────────────────────────────────────────────────────────────────────── */

const STAGE_TONE = {
  offerSent:      { pill: 'border-blue-200   bg-blue-50   text-blue-700',      dot: 'bg-blue-600',    label: 'Offer sent'     },
  signed:         { pill: 'border-emerald-200 bg-emerald-50 text-emerald-700', dot: 'bg-emerald-600', label: 'Signed'         },
  negotiating:    { pill: 'border-purple-200 bg-purple-50 text-purple-700',    dot: 'bg-purple-600',  label: 'Negotiating'    },
  contractSent:   { pill: 'border-blue-200   bg-blue-50   text-blue-700',      dot: 'bg-blue-600',    label: 'Contract sent'  },
  financeApproval: { pill: 'border-amber-200  bg-amber-50  text-amber-700',     dot: 'bg-amber-500',   label: 'Finance approval' },
  declined:       { pill: 'border-rose-200   bg-rose-50   text-rose-700',      dot: 'bg-rose-500',    label: 'Declined'       },
  hmApproval:      { pill: 'border-amber-200  bg-amber-50  text-amber-700',     dot: 'bg-amber-500',   label: 'HM approval'    },
};

const ACTION_META = {
  view:     { label: 'View',     icon: Eye,                  variant: 'outline' },
  contract: { label: 'Contract', icon: FileSignature,         variant: 'outline' },
  counter:  { label: 'Counter',  icon: Heart,                 variant: 'secondary' },
  nudge:    { label: 'Nudge',    icon: Bell,                  variant: 'default' },
  reason:   { label: 'Reason',   icon: MessageCircleQuestion, variant: 'outline' },
};

/* ─────────────────────────────────────────────────────────────────────────────
   Sub-components
───────────────────────────────────────────────────────────────────────────── */

function KpiCard({ label, value, sub, tone }) {
  const toneClass = {
    emerald: 'text-emerald-600',
    blue:    'text-blue-600',
    amber:   'text-amber-600',
    rose:    'text-rose-600',
  }[tone] ?? 'text-foreground';

  return (
    <div className="border rounded-xl bg-card p-4">
      <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-2">{label}</div>
      <div className={`text-2xl font-bold ${toneClass}`}>{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{sub}</div>
    </div>
  );
}

function FunnelStageCard({ label, value, pct, isLast }) {
  return (
    <div className="border rounded-lg p-3 text-center">
      <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-1.5">{label}</div>
      <div className={`text-xl font-bold ${isLast ? 'text-emerald-600' : 'text-foreground'}`}>{value}</div>
      <div className="h-1.5 rounded-full bg-muted mt-2 overflow-hidden">
        <div className="h-full rounded-full bg-emerald-600" style={{ width: `${pct}%` }} />
      </div>
      <div className="text-[11px] text-muted-foreground mt-1">{pct}%</div>
    </div>
  );
}

function OffersTable({ rows }) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="grid grid-cols-7 gap-2 px-4 py-2.5 bg-muted/40 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
        <div>Candidate</div>
        <div>Role</div>
        <div>Stage</div>
        <div>Days in stage</div>
        <div>Package</div>
        <div>Source</div>
        <div className="text-right">Action</div>
      </div>
      <div className="divide-y divide-border/70">
        {rows.map((r) => {
          const action = ACTION_META[r.action];
          return (
            <div key={r.candidate} className="grid grid-cols-7 gap-2 px-4 py-3 text-sm items-center">
              <div className="font-semibold text-foreground truncate">{r.candidate}</div>
              <div className="text-muted-foreground truncate">{r.role}</div>
              <div><StatusPill status={r.stage} toneMap={STAGE_TONE} /></div>
              <div className={r.daysInStageWarning ? 'text-rose-600 font-semibold' : 'text-muted-foreground'}>
                {r.daysInStage}
              </div>
              <div className="text-muted-foreground truncate">{r.package}</div>
              <div className="text-muted-foreground truncate">{r.source}</div>
              <div className="text-right">
                <Button size="sm" variant={action.variant} className="text-xs gap-1">
                  <action.icon className="h-3 w-3" /> {action.label}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DeclineReasonBar({ label, pct, isTop }) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className={isTop ? 'font-semibold text-foreground' : 'text-muted-foreground'}>{label}</span>
        <span className={isTop ? 'font-bold text-rose-600' : 'text-muted-foreground'}>{pct}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full ${isTop ? 'bg-rose-500' : 'bg-muted-foreground/40'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   OfferPipelineStep — default export, used by pages/OfferContract.jsx
───────────────────────────────────────────────────────────────────────────── */

export function OfferPipelineStep({ data, onBack }) {
  const { kpis, funnel, offers, declineReasons, aiRecommendation } = data;
  const topReason = declineReasons[0]?.label;

  return (
    <StepCard
      icon={Workflow}
      title="Offer Pipeline"
      footerLeft={
        <button type="button" onClick={onBack} className="font-semibold text-foreground hover:underline">
          Back
        </button>
      }
    >
      <div className="p-6 space-y-6">

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((k) => <KpiCard key={k.label} {...k} />)}
        </div>

        <div>
          <div className="text-sm font-serif font-bold text-foreground mb-3">Pipeline · stage-by-stage funnel</div>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {funnel.map((f, i) => (
              <FunnelStageCard key={f.label} {...f} isLast={i === funnel.length - 1} />
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-serif font-bold text-foreground">
              All offers — cross-stage view
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="text-xs gap-1.5">
                <Download className="h-3.5 w-3.5" /> Export CSV
              </Button>
              <Button size="sm" className="text-xs gap-1.5">
                <Bell className="h-3.5 w-3.5" /> Nudge all pending
              </Button>
            </div>
          </div>
          <OffersTable rows={offers} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-serif font-bold text-foreground">Why candidates declined — Q1 patterns</div>
              <Badge variant="outline" className="text-[10px] border-border bg-muted text-muted-foreground">
                INSIGHTS
              </Badge>
            </div>
            <div className="space-y-3">
              {declineReasons.map((r) => (
                <DeclineReasonBar key={r.label} {...r} isTop={r.label === topReason} />
              ))}
            </div>
          </div>

          <div className="border rounded-lg p-4 bg-emerald-50 border-emerald-200">
            <div className="flex items-center gap-1.5 text-sm font-bold text-emerald-800 mb-2">
              <Sparkles className="h-4 w-4" /> AI recommendation
            </div>
            <p className="text-xs text-emerald-900">{aiRecommendation.summary}</p>
            <ol className="text-xs text-emerald-900 mt-2 space-y-1 list-decimal pl-4">
              {aiRecommendation.mitigations.map((m, i) => <li key={i}>{m}</li>)}
            </ol>
            <Button size="sm" className="text-xs mt-3">Adopt this playbook</Button>
          </div>
        </div>

      </div>
    </StepCard>
  );
}