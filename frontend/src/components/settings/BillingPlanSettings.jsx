import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText } from 'lucide-react';

// ── Static data — swap for API data when backend is ready ──

const PLAN = {
  name: 'Enterprise',
  cadence: 'Annual · renews 12 Mar 2026',
  seatsUsed: 12,
  seatsTotal: 20,
  seatsLabel: 'Recruiter & admin seats',
};

const AI_USAGE = [
  { id: 'screenings', label: 'AI screenings', used: '4,887', total: '10,000' },
  { id: 'parses', label: 'CV parses', used: '6,265', total: 'unlimited' },
  { id: 'summaries', label: 'AI interview summaries', used: '312', total: '1,000' },
];

const INVOICES = [
  { id: 'INV-2026-001', date: '12 Mar 2026', amount: 'Rp 84,000,000', status: 'Paid' },
  { id: 'INV-2025-012', date: '12 Dec 2025', amount: 'Rp 7,000,000', status: 'Paid' },
  { id: 'INV-2025-011', date: '12 Nov 2025', amount: 'Rp 7,000,000', status: 'Paid' },
];

// ── Usage row ──

function UsageRow({ label, used, total }) {
  return (
    <div className="flex items-center justify-between py-3 border-b last:border-b-0">
      <div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="text-sm font-medium mt-0.5">
          {used} / {total}
        </p>
      </div>
      <Button variant="link" size="sm" className="h-auto p-0 text-sm">
        Edit
      </Button>
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
            Screening, parsing, and scoring quota.
          </p>
          <div className="divide-y">
            {AI_USAGE.map((u) => (
              <UsageRow key={u.id} label={u.label} used={u.used} total={u.total} />
            ))}
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