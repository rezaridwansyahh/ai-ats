import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText } from 'lucide-react';
import budgetApi from '@/api/budget.api';

// ── Static data — no backend concept for plan/seats/invoices yet ──

const PLAN = {
  name: 'Enterprise',
  cadence: 'Annual · renews 12 Mar 2026',
  seatsUsed: 12,
  seatsTotal: 20,
  seatsLabel: 'Recruiter & admin seats',
};

// Groups the raw per-operation usage rows from the backend into the pipeline
// stages this card displays. Offer & Contract is omitted — no AI operation
// exists for that stage yet.
const USAGE_GROUPS = [
  {
    id: 'job_creation',
    label: 'Job Creation',
    match: (op) => /^generate_job_desc/.test(op),
  },
  {
    id: 'cv_parsed',
    label: 'CV Parsed',
    match: (op) => /^(extract_facets|extract_cv_talent_pool)/.test(op),
  },
  {
    id: 'screening',
    label: 'AI Screening',
    match: (op) => /^(score_applicant|score_with_rubric|generate_followup_qa)/.test(op),
  },
  {
    id: 'assessment',
    label: 'Assessment',
    match: (op) => /^(assessment_|pregen_battery_)/.test(op),
  },
  {
    id: 'interview',
    label: 'Interview',
    match: (op) => /^(generate_rubric_anchors|generate_interview_questions)/.test(op),
  },
  {
    id: 'bg_check',
    label: 'BG Check',
    match: (op) => /^extract_bg_claims/.test(op),
  },
];

const INVOICES = [
  { id: 'INV-2026-001', date: '12 Mar 2026', amount: 'Rp 84,000,000', status: 'Paid' },
  { id: 'INV-2025-012', date: '12 Dec 2025', amount: 'Rp 7,000,000', status: 'Paid' },
  { id: 'INV-2025-011', date: '12 Nov 2025', amount: 'Rp 7,000,000', status: 'Paid' },
];

// ── Usage row ──

const formatCost = (amount) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  }).format(amount);

function UsageRow({ label, calls, tokens, cost }) {
  return (
    <div className="flex items-center justify-between py-3 border-b last:border-b-0">
      <div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="text-sm font-medium mt-0.5">
          {calls.toLocaleString()} calls · {tokens.toLocaleString()} tokens · {formatCost(cost)}
        </p>
      </div>
    </div>
  );
}

// ── Invoice row ──

function InvoiceRow({ invoice }) {
  return (
    <div className="flex items-center justify-between py-3 border-b last:border-b-0">
      <div>
        <p className="text-sm font-semibold">{invoice.id}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{invoice.date}</p>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium">{invoice.amount}</span>
        <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-emerald-50 text-emerald-600 border-emerald-200">
          {invoice.status}
        </Badge>
        <button className="text-muted-foreground hover:text-foreground">
          <FileText className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ── Page ──

export default function BillingPlanSettings() {
  const [usageGroups, setUsageGroups] = useState(null);
  const [monthSpend, setMonthSpend] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const fetchUsage = async () => {
      try {
        const [summaryRes, budgetRes] = await Promise.all([
          budgetApi.getUsageSummary(),
          budgetApi.getBudget(),
        ]);
        if (cancelled) return;

        const rows = summaryRes.rows || [];
        const grouped = USAGE_GROUPS.map((g) => {
          const matched = rows.filter((r) => g.match(r.operation));
          return {
            id: g.id,
            label: g.label,
            calls: matched.reduce((sum, r) => sum + parseInt(r.calls, 10), 0),
            tokens: matched.reduce((sum, r) => sum + parseInt(r.total_tokens, 10), 0),
            cost: matched.reduce((sum, r) => sum + (parseFloat(r.estimated_cost_usd) || 0), 0),
          };
        });
        setUsageGroups(grouped);
        setMonthSpend(budgetRes.spent);
      } catch (err) {
        console.error('Failed to load AI usage:', err);
        if (!cancelled) setUsageGroups([]);
      }
    };

    fetchUsage();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="space-y-4">
      {/* Current plan */}
      <Card className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Current plan</p>
            <p className="text-2xl font-bold font-serif mt-1">{PLAN.name}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{PLAN.cadence}</p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Seats in use</p>
            <p className="text-2xl font-bold font-serif mt-1">
              {PLAN.seatsUsed} / {PLAN.seatsTotal}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{PLAN.seatsLabel}</p>
          </div>
          <Button variant="outline" className="flex-shrink-0">
            Manage plan
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        {/* AI usage */}
        <Card className="px-4 pt-4 pb-0">
          <p className="text-sm font-semibold">AI usage (this month)</p>
          <p className="text-xs text-muted-foreground mt-0.5 mb-1">
            {monthSpend != null
              ? `Estimated cost so far: $${monthSpend.toFixed(2)}`
              : 'Screening, parsing, and scoring usage.'}
          </p>
          <div className="divide-y">
            {usageGroups === null ? (
              <p className="text-sm text-muted-foreground py-3">Loading usage…</p>
            ) : usageGroups.length === 0 ? (
              <p className="text-sm text-muted-foreground py-3">No AI usage recorded yet.</p>
            ) : (
              usageGroups.map((u) => (
                <UsageRow key={u.id} label={u.label} calls={u.calls} tokens={u.tokens} cost={u.cost} />
              ))
            )}
          </div>
        </Card>

        {/* Invoices */}
        <Card className="px-4 pt-4 pb-0">
          <p className="text-sm font-semibold">Invoices</p>
          <p className="text-xs text-muted-foreground mt-0.5 mb-1">
            PDF receipts available for 7 years.
          </p>
          <div className="divide-y">
            {INVOICES.map((inv) => (
              <InvoiceRow key={inv.id} invoice={inv} />
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}