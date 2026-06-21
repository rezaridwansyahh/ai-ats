import { useState } from 'react';
import { ChevronDown, ChevronRight, RefreshCw, BookmarkPlus, Send, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StepCard, StatusPill, formatRp } from './shared';

/* ─────────────────────────────────────────────────────────────────────────────
   Tone map for the commission tracker's invoice status column
───────────────────────────────────────────────────────────────────────────── */

const INVOICE_TONE = {
  awaiting: { pill: 'border-amber-200  bg-amber-50  text-amber-700',     dot: 'bg-amber-500',   label: 'Awaiting start' },
  invoiced: { pill: 'border-blue-200   bg-blue-50   text-blue-700',      dot: 'bg-blue-600',    label: 'Invoiced'       },
  paid:     { pill: 'border-emerald-200 bg-emerald-50 text-emerald-700', dot: 'bg-emerald-600', label: 'Paid'           },
};

/* ─────────────────────────────────────────────────────────────────────────────
   Sub-components used only within Remuneration
───────────────────────────────────────────────────────────────────────────── */

function KpiCard({ label, value, sub, tone, progress }) {
  const toneClass = {
    emerald: 'text-emerald-600',
    blue:    'text-blue-600',
    amber:   'text-amber-600',
  }[tone] ?? 'text-foreground';

  return (
    <div className="border rounded-xl bg-card p-4">
      <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-2">{label}</div>
      <div className={`text-2xl font-bold ${toneClass}`}>{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{sub}</div>
      {progress != null && (
        <div className="h-1.5 rounded-full bg-muted mt-3 overflow-hidden">
          <div className="h-full rounded-full bg-blue-600" style={{ width: `${progress}%` }} />
        </div>
      )}
    </div>
  );
}

function OfferBuildRow({ row }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-border/70 last:border-b-0">
      <span className="text-sm text-foreground">{row.label}</span>
      <span className="text-sm font-semibold text-foreground">
        {row.value} <span className="text-xs text-muted-foreground font-normal">{row.meta}</span>
      </span>
    </div>
  );
}

function MarketBenchmark({ benchmark }) {
  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="text-xs text-muted-foreground">{benchmark.contextLabel}</div>
        <div className="text-xs font-semibold text-foreground flex items-center gap-1">
          <ChevronDown className="h-3 w-3 rotate-180" /> Offer · {benchmark.offerPercentile} %
        </div>
      </div>

      <div className="relative h-3 rounded-full bg-gradient-to-r from-rose-200 via-amber-100 via-emerald-100 to-rose-200 mb-2">
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-foreground"
          style={{ left: `${benchmark.offerPosition}%` }}
        />
      </div>

      <div className="grid grid-cols-5 text-center">
        {benchmark.points.map((p) => (
          <div key={p.label}>
            <div className="text-[11px] font-semibold text-muted-foreground">{p.label}</div>
            <div className="text-xs font-bold text-foreground">{p.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CommissionTrackerTable({ rows }) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="grid grid-cols-7 gap-2 px-4 py-2.5 bg-muted/40 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
        <div>Vendor</div>
        <div>Candidate</div>
        <div>Role</div>
        <div>Terms</div>
        <div className="text-right">Amount</div>
        <div>Invoice Status</div>
        <div className="text-right">Action</div>
      </div>
      <div className="divide-y divide-border/70">
        {rows.map((r, i) => (
          <div key={i} className="grid grid-cols-7 gap-2 px-4 py-3 text-sm items-center">
            <div className="font-semibold text-foreground truncate">{r.vendor}</div>
            <div className="text-muted-foreground truncate">{r.candidate}</div>
            <div className="text-muted-foreground truncate">{r.role}</div>
            <div className="text-muted-foreground truncate">{r.terms}</div>
            <div className="text-right font-semibold text-foreground">{r.amount}</div>
            <div><StatusPill status={r.invoiceStatus} toneMap={INVOICE_TONE} /></div>
            <div className="text-right">
              <button type="button" className="text-xs font-semibold text-foreground hover:underline">
                {r.action}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SalarySlipPreview({ slip }) {
  const grossTotal      = slip.earnings.reduce((sum, e) => sum + e.amount, 0);
  const deductionsTotal = slip.deductions.reduce((sum, d) => sum + d.amount, 0);
  const netTotal         = grossTotal + deductionsTotal;

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="bg-foreground text-background px-4 py-2.5 text-xs font-bold uppercase tracking-wide">
        Salary Slip · {slip.month}
      </div>
      <div className="p-4 space-y-4 text-sm">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-2">Earnings</div>
          <div className="space-y-1.5">
            {slip.earnings.map((e) => (
              <div key={e.label} className="flex items-center justify-between">
                <span className="text-foreground">{e.label}</span>
                <span className="text-emerald-700 font-medium">{formatRp(e.amount)}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between font-bold border-t border-border/70 mt-2 pt-2">
            <span>Gross Bulanan</span>
            <span>{formatRp(grossTotal)}</span>
          </div>
        </div>

        <div>
          <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-2">Deductions</div>
          <div className="space-y-1.5">
            {slip.deductions.map((d) => (
              <div key={d.label} className="flex items-center justify-between">
                <span className="text-foreground">{d.label}</span>
                <span className="text-rose-600 font-medium">{formatRp(d.amount)}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between font-bold border-t border-border/70 mt-2 pt-2">
            <span>Total Potongan</span>
            <span>{formatRp(deductionsTotal)}</span>
          </div>
        </div>

        <div className="flex items-center justify-between font-bold text-base border-t border-border pt-3">
          <span>Net per bulan</span>
          <span className="text-emerald-700">{formatRp(netTotal)}</span>
        </div>

        <div className="text-[11px] text-muted-foreground border-t border-border/70 pt-2">
          {slip.footnote}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   RemunerationStep — default export, used by pages/OfferContract.jsx
───────────────────────────────────────────────────────────────────────────── */

export function RemunerationStep({ data, candidate, onNext }) {
  const {
    autoSchedulingOff, kpis, offerBuild, totalAnnualPackage,
    benchmark, aiInsight, commissionTracker, salarySlip,
  } = data;
  const [bannerOpen, setBannerOpen] = useState(autoSchedulingOff);

  return (
    <StepCard
      title="Offer & Contract"
      badge="OFFER → SIGNED"
      subtitle="From remuneration bands to e-signed PKWT / PKWTT contracts — approvals, batch sends, negotiation notes and live status tracking all in one pipeline."
      footerRight={
        <button
          type="button"
          onClick={onNext}
          className="font-semibold text-foreground flex items-center gap-1 hover:underline"
        >
          Next: Offer Letter <ChevronRight className="h-3.5 w-3.5" />
        </button>
      }
    >
      <div className="p-6 space-y-6">

        {bannerOpen && (
          <div className="flex items-start justify-between gap-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm">
            <div className="text-amber-800">
              <span className="font-bold">Auto-scheduling is OFF</span> for this job. Candidates will not be auto-advanced.
              Configure in{' '}
              <span className="font-semibold underline cursor-pointer">Job Management → Step 2 → AI &amp; Automation</span>.
            </div>
            <button type="button" onClick={() => setBannerOpen(false)} className="flex-shrink-0">
              <X className="h-4 w-4 text-amber-500" />
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((k) => <KpiCard key={k.label} {...k} />)}
        </div>

        <div className="border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-b">
            <div className="font-serif font-bold text-foreground">
              Remuneration calculator — {candidate.role} · {candidate.location}
            </div>
            <Badge variant="outline" className="text-[10px] border-emerald-200 bg-emerald-50 text-emerald-700">
              AI-BENCHMARKED
            </Badge>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-border">
            <div className="p-4">
              <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-2">
                Build an offer
              </div>
              <div className="border rounded-lg">
                {offerBuild.map((row) => <OfferBuildRow key={row.label} row={row} />)}
              </div>
              <div className="flex items-center justify-between mt-3 px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200">
                <span className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                  Total Annual Package
                </span>
                <span className="text-lg font-bold text-emerald-700">{totalAnnualPackage}</span>
              </div>
            </div>

            <div className="p-4 space-y-4">
              <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                Market benchmark
              </div>
              <MarketBenchmark benchmark={benchmark} />

              <div className="bg-muted/40 border border-border rounded-lg p-3 text-xs text-foreground">
                <span className="font-bold">AI insight</span> — {aiInsight}
              </div>

              <div className="flex items-center justify-end gap-2 flex-wrap">
                <Button variant="outline" size="sm" className="text-xs gap-1.5">
                  <RefreshCw className="h-3.5 w-3.5" /> Re-benchmark
                </Button>
                <Button variant="outline" size="sm" className="text-xs gap-1.5">
                  <BookmarkPlus className="h-3.5 w-3.5" /> Save as template
                </Button>
                <Button size="sm" className="text-xs gap-1.5">
                  <Send className="h-3.5 w-3.5" /> Send for approval
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="text-sm font-serif font-bold text-foreground mb-3">Agency Commission Tracker</div>
          <CommissionTrackerTable rows={commissionTracker} />
        </div>

        <SalarySlipPreview slip={salarySlip} />

      </div>
    </StepCard>
  );
}