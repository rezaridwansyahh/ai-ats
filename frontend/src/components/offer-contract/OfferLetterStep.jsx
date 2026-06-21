import { ChevronRight, Megaphone, FileDown, StickyNote, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StepCard, StatusPill } from './shared';

/* ─────────────────────────────────────────────────────────────────────────────
   Tone maps
───────────────────────────────────────────────────────────────────────────── */

const APPROVAL_TONE = {
  drafted:  { pill: 'border-emerald-200 bg-emerald-50 text-emerald-700', dot: 'bg-emerald-600', label: 'Drafted'  },
  approved: { pill: 'border-emerald-200 bg-emerald-50 text-emerald-700', dot: 'bg-emerald-600', label: 'Approved' },
  pending:  { pill: 'border-amber-200  bg-amber-50  text-amber-700',     dot: 'bg-amber-500',   label: 'Pending'  },
  auto:     { pill: 'border-border     bg-muted     text-muted-foreground', dot: 'bg-muted-foreground', label: 'Auto after Finance' },
};

const OFFER_TONE = {
  financeApproval: { pill: 'border-amber-200  bg-amber-50  text-amber-700',     dot: 'bg-amber-500',   label: 'Finance approval' },
  sentToCandidate: { pill: 'border-blue-200   bg-blue-50   text-blue-700',      dot: 'bg-blue-600',    label: 'Sent to candidate' },
  negotiating:     { pill: 'border-purple-200 bg-purple-50 text-purple-700',    dot: 'bg-purple-600',  label: 'Negotiating' },
  drafting:        { pill: 'border-border     bg-muted     text-muted-foreground', dot: 'bg-muted-foreground', label: 'Drafting' },
  accepted:        { pill: 'border-emerald-200 bg-emerald-50 text-emerald-700', dot: 'bg-emerald-600', label: 'Accepted' },
  hmApproval:       { pill: 'border-amber-200  bg-amber-50  text-amber-700',     dot: 'bg-amber-500',   label: 'HM approval' },
  declined:        { pill: 'border-rose-200   bg-rose-50   text-rose-700',      dot: 'bg-rose-500',    label: 'Declined' },
};

const ACTION_LABEL = {
  financeApproval: 'Remind',
  sentToCandidate: 'Follow up',
  negotiating: 'Counter',
  drafting: 'Edit draft',
  accepted: 'View',
  hmApproval: 'Remind HM',
  declined: 'Reason',
};

/* ─────────────────────────────────────────────────────────────────────────────
   Sub-components
───────────────────────────────────────────────────────────────────────────── */

function HeaderBanner({ summary, autoFillNote, approvedCount, onSendApproved }) {
  return (
    <div className="flex items-center justify-between gap-4 flex-wrap bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
      <div className="text-sm text-amber-900">
        <span className="font-bold">{summary}</span>
        <div className="text-xs text-amber-700 mt-0.5">{autoFillNote}</div>
      </div>
      <Button size="sm" onClick={onSendApproved} className="text-xs whitespace-nowrap">
        Send {approvedCount} approved offers
      </Button>
    </div>
  );
}

function KpiCard({ label, value, sub, tone, progress }) {
  const toneClass = {
    emerald: 'text-emerald-600',
    blue:    'text-blue-600',
    amber:   'text-amber-600',
    purple:  'text-purple-600',
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

function ApprovalWorkflowRail({ stages }) {
  return (
    <div className="border rounded-xl overflow-hidden bg-card">
      <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground px-4 py-2.5 bg-muted/30 border-b">
        Offer approval workflow
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

function ApprovalChainRow({ entry }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border/70 last:border-b-0">
      <div>
        <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{entry.role}</div>
        <div className="text-sm font-semibold text-foreground mt-0.5">{entry.name}</div>
      </div>
      <div className="text-right">
        <StatusPill status={entry.status} toneMap={APPROVAL_TONE} />
        {entry.timestamp && <div className="text-[11px] text-muted-foreground mt-1">{entry.timestamp}</div>}
      </div>
    </div>
  );
}

function LetterPreview({ preview }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-4">
      {/* Letter document */}
      <div className="border rounded-lg p-5 bg-card text-sm space-y-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{preview.location}, {preview.date}</span>
          <span>Ref: {preview.ref}</span>
        </div>
        <div className="font-serif font-bold text-base text-foreground">
          {preview.titleLocal} · {preview.titleEn}
        </div>
        <div className="space-y-2 text-foreground/90 leading-relaxed">
          <p>{preview.greeting}</p>
          <p>{preview.intro}</p>
          <ul className="list-disc pl-5 space-y-1">
            {preview.terms.map((t) => (
              <li key={t.label}>
                {t.label}: <span className="font-semibold">{t.value}</span>
              </li>
            ))}
          </ul>
          <p>{preview.validUntilNote}</p>
          <p>{preview.closing}</p>
        </div>
        <div className="flex gap-4 pt-2">
          <button type="button" className="text-xs font-semibold text-foreground hover:underline flex items-center gap-1">
            <FileDown className="h-3.5 w-3.5" /> Preview PDF
          </button>
          <button type="button" className="text-xs font-semibold text-foreground hover:underline flex items-center gap-1">
            <StickyNote className="h-3.5 w-3.5" /> Add note for HM
          </button>
        </div>
      </div>

      {/* Approval chain + expiry */}
      <div className="space-y-4">
        <div className="border rounded-lg p-4 bg-card">
          <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-1">
            Approval chain
          </div>
          {preview.approvalChain.map((entry) => (
            <ApprovalChainRow key={entry.role} entry={entry} />
          ))}
        </div>

        <div className="border rounded-lg p-4 bg-amber-50 border-amber-200">
          <div className="text-[10px] font-bold uppercase tracking-wide text-amber-700 mb-1">
            Expiry &amp; tracking
          </div>
          <p className="text-xs text-amber-800">{preview.expiryNote}</p>
          <Button size="sm" variant="outline" className="text-xs mt-3 gap-1.5">
            <Bell className="h-3.5 w-3.5" /> Remind Finance
          </Button>
        </div>
      </div>
    </div>
  );
}

function ActiveOffersTable({ rows }) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="grid grid-cols-6 gap-2 px-4 py-2.5 bg-muted/40 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
        <div>Candidate</div>
        <div>Role</div>
        <div>Package</div>
        <div>Status</div>
        <div>Expires</div>
        <div className="text-right">Action</div>
      </div>
      <div className="divide-y divide-border/70">
        {rows.map((r) => (
          <div key={r.candidate} className="grid grid-cols-6 gap-2 px-4 py-3 text-sm items-center">
            <div className="font-semibold text-foreground truncate">{r.candidate}</div>
            <div className="text-muted-foreground truncate">{r.role}</div>
            <div className="text-muted-foreground truncate">{r.package}</div>
            <div><StatusPill status={r.status} toneMap={OFFER_TONE} /></div>
            <div className="text-muted-foreground">{r.expires}</div>
            <div className="text-right">
              <button type="button" className="text-xs font-semibold text-foreground hover:underline">
                {ACTION_LABEL[r.status]}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   OfferLetterStep — default export, used by pages/OfferContract.jsx
───────────────────────────────────────────────────────────────────────────── */

export function OfferLetterStep({ data, onBack, onNext }) {
  const { summary, autoFillNote, approvedCount, kpis, workflow, preview, activeOffers } = data;

  return (
    <StepCard
      icon={Megaphone}
      title="Offer Letter"
      subtitle="Generate, customize, and send the formal offer letter to the candidate."
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
          Next: Contract <ChevronRight className="h-3.5 w-3.5" />
        </button>
      }
    >
      <div className="p-6 space-y-6">

        <HeaderBanner
          summary={summary}
          autoFillNote={autoFillNote}
          approvedCount={approvedCount}
          onSendApproved={() => {}}
        />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((k) => <KpiCard key={k.label} {...k} />)}
        </div>

        <ApprovalWorkflowRail stages={workflow} />

        <div>
          <div className="text-sm font-serif font-bold text-foreground mb-3">
            Offer letter preview — {preview.candidateName} · {preview.role}
          </div>
          <LetterPreview preview={preview} />
        </div>

        <div>
          <div className="text-sm font-serif font-bold text-foreground mb-3">
            Active Offers — {activeOffers.length} in flight
          </div>
          <ActiveOffersTable rows={activeOffers} />
        </div>

      </div>
    </StepCard>
  );
}