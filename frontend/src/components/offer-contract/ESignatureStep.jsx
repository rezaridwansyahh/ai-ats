import { ChevronRight, PenLine, Send, FileDown, Bell, RotateCcw, ListChecks } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StepCard, StatusPill } from './shared';

/* ─────────────────────────────────────────────────────────────────────────────
   Tone map for the e-signature tracker
───────────────────────────────────────────────────────────────────────────── */

const SIGN_TONE = {
  signed:     { pill: 'border-emerald-200 bg-emerald-50 text-emerald-700', dot: 'bg-emerald-600', label: 'Signed' },
  awaiting:   { pill: 'border-amber-200  bg-amber-50  text-amber-700',     dot: 'bg-amber-500',   label: 'Awaiting' },
  waiting:    { pill: 'border-border     bg-muted     text-muted-foreground', dot: 'bg-muted-foreground', label: 'Waiting' },
  sent:       { pill: 'border-blue-200   bg-blue-50   text-blue-700',      dot: 'bg-blue-600',    label: 'Sent' },
  authFailed: { pill: 'border-rose-200   bg-rose-50   text-rose-700',      dot: 'bg-rose-500',    label: 'Auth failed' },
  auto:       { pill: 'border-border     bg-muted     text-muted-foreground', dot: 'bg-muted-foreground', label: 'Auto' },
  na:         { pill: 'border-border     bg-muted     text-muted-foreground', dot: 'bg-muted-foreground', label: 'N/A' },
};

/* ─────────────────────────────────────────────────────────────────────────────
   Sub-components
───────────────────────────────────────────────────────────────────────────── */

function HeaderBanner({ summary, providerNote, awaitingCount, onSendAll }) {
  return (
    <div className="flex items-center justify-between gap-4 flex-wrap bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
      <div className="text-sm text-amber-900">
        <span className="font-bold">{summary}</span>
        <div className="text-xs text-amber-700 mt-0.5">{providerNote}</div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <select className="text-xs border border-amber-300 rounded-md px-2 py-1.5 bg-card text-foreground">
          <option>Provider: Privy.id</option>
        </select>
        <Button size="sm" onClick={onSendAll} className="text-xs whitespace-nowrap">
          Send {awaitingCount} contracts
        </Button>
      </div>
    </div>
  );
}

function KpiCard({ label, value, sub, tone, progress }) {
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
      {progress != null && (
        <div className="h-1.5 rounded-full bg-muted mt-3 overflow-hidden">
          <div className="h-full rounded-full bg-emerald-600" style={{ width: `${progress}%` }} />
        </div>
      )}
    </div>
  );
}

function SignatureFlowRail({ stages, providerLabel }) {
  return (
    <div className="border rounded-xl overflow-hidden bg-card">
      <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground px-4 py-2.5 bg-muted/30 border-b">
        E-Signature flow · {providerLabel}
      </div>
      <div className="flex items-stretch overflow-x-auto">
        {stages.map((stage, i) => (
          <div key={stage.label} className="flex items-center flex-shrink-0">
            {i > 0 && <ChevronRight className="h-4 w-4 text-muted-foreground/40 mx-2 flex-shrink-0" />}
            <div className="px-3 py-3">
              <div className="text-sm font-semibold text-foreground whitespace-nowrap">{stage.label}</div>
              <div className="text-[11px] text-muted-foreground whitespace-nowrap">{stage.sub}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SignTrackerTable({ rows }) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="grid grid-cols-7 gap-2 px-4 py-2.5 bg-muted/40 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
        <div>Candidate</div>
        <div>Contract</div>
        <div>Provider</div>
        <div>Candidate Sign</div>
        <div>HRBP Sign</div>
        <div>Director Sign</div>
        <div className="text-right">Action</div>
      </div>
      <div className="divide-y divide-border/70">
        {rows.map((r) => (
          <div key={r.candidate} className="grid grid-cols-7 gap-2 px-4 py-3 text-sm items-center">
            <div className="font-semibold text-foreground truncate">{r.candidate}</div>
            <div className="text-muted-foreground truncate">{r.contract}</div>
            <div className="text-muted-foreground truncate">{r.provider}</div>
            <div><StatusPill status={r.candidateSign.status} toneMap={SIGN_TONE} /><span className="text-[11px] text-muted-foreground ml-1.5">{r.candidateSign.timestamp}</span></div>
            <div><StatusPill status={r.hrbpSign.status} toneMap={SIGN_TONE} /><span className="text-[11px] text-muted-foreground ml-1.5">{r.hrbpSign.timestamp}</span></div>
            <div><StatusPill status={r.directorSign.status} toneMap={SIGN_TONE} /><span className="text-[11px] text-muted-foreground ml-1.5">{r.directorSign.timestamp}</span></div>
            <div className="text-right">
              <Button size="sm" variant={r.action.variant} className="text-xs">{r.action.label}</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AutomationTriggerCard({ icon: Icon, title, description }) {
  return (
    <div className="border rounded-lg p-3 flex items-start gap-3">
      <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div>
        <div className="text-sm font-semibold text-foreground">{title}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{description}</div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   ESignatureStep — default export, used by pages/OfferContract.jsx
───────────────────────────────────────────────────────────────────────────── */

export function ESignatureStep({ data, onBack, onNext }) {
  const { summary, providerNote, awaitingCount, kpis, providerLabel, flow, tracker, automations } = data;

  return (
    <StepCard
      icon={PenLine}
      title="E-Signature"
      footerLeft={
        <button type="button" onClick={onBack} className="font-semibold text-foreground hover:underline">
          Back
        </button>
      }
      footerRight={
        <button
          type="button"
          onClick={onNext}
          className="font-semibold text-foreground flex items-center gap-1 hover:underline"
        >
          Next: Offer Pipeline <ChevronRight className="h-3.5 w-3.5" />
        </button>
      }
    >
      <div className="p-6 space-y-6">

        <HeaderBanner
          summary={summary}
          providerNote={providerNote}
          awaitingCount={awaitingCount}
          onSendAll={() => {}}
        />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((k) => <KpiCard key={k.label} {...k} />)}
        </div>

        <SignatureFlowRail stages={flow} providerLabel={providerLabel} />

        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-serif font-bold text-foreground">
              Live e-signature tracker — {tracker.length} in flight
            </div>
            <Button variant="outline" size="sm" className="text-xs gap-1.5">
              <FileDown className="h-3.5 w-3.5" /> Audit log (CSV)
            </Button>
          </div>
          <SignTrackerTable rows={tracker} />
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-serif font-bold text-foreground">Post-signing automation — auto-triggers</div>
            <Badge variant="outline" className="text-[10px] border-emerald-200 bg-emerald-50 text-emerald-700">
              ACTIVE · {automations.length} triggers
            </Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {automations.map((a) => <AutomationTriggerCard key={a.title} {...a} />)}
          </div>
        </div>

      </div>
    </StepCard>
  );
}