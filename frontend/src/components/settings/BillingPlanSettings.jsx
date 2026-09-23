import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { FileText, DollarSign, TrendingUp, AlertCircle, Pencil, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import budgetApi from '@/api/budget.api';
import { hasPermission } from '@/utils/permissions';

/*
 * Billing & Plan settings — the AI Budget Overview and Usage Breakdown
 * sections below are ported from the standalone BudgetSettingsPage.jsx
 * (real budget cap + spend tracking via company_budgets/budget.api.js),
 * which had no nav path anywhere in the app. This tab previously only
 * showed a rough read-only usage summary grouped by pipeline stage —
 * replaced with the full, editable version rather than kept alongside it.
 *
 * Plan/Seats/Invoices below stay as static placeholders — there's no
 * subscription/billing backend yet, so there's nothing real to wire up.
 */

// ── Static data — no backend concept for plan/seats/invoices yet ──

const PLAN = {
  name: 'Enterprise',
  cadence: 'Annual · renews 12 Mar 2026',
  seatsUsed: 12,
  seatsTotal: 20,
  seatsLabel: 'Recruiter & admin seats',
};

const INVOICES = [
  { id: 'INV-2026-001', date: '12 Mar 2026', amount: 'Rp 84,000,000', status: 'Paid' },
  { id: 'INV-2025-012', date: '12 Dec 2025', amount: 'Rp 7,000,000', status: 'Paid' },
  { id: 'INV-2025-011', date: '12 Nov 2025', amount: 'Rp 7,000,000', status: 'Paid' },
];

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

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  }).format(amount);
}

function getStatusColor(percent) {
  if (percent >= 100) return 'var(--error)';
  if (percent >= 80) return 'var(--amber)';
  if (percent >= 50) return 'var(--saffron)';
  return 'var(--primary)';
}

function getProgressColor(percent) {
  if (percent >= 100) return 'bg-red-500';
  if (percent >= 80) return 'bg-amber-500';
  if (percent >= 50) return 'bg-yellow-500';
  return 'bg-primary';
}

function formatMonth(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

// ── AI Budget section (editable cap + usage breakdown) ──

function BudgetSection() {
  const canUpdate = hasPermission('Settings', 'Budget', 'update');

  const [loading, setLoading] = useState(true);
  const [budgetData, setBudgetData] = useState(null);
  const [usageSummary, setUsageSummary] = useState([]);
  const [editing, setEditing] = useState(false);
  const [newBudget, setNewBudget] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchBudgetData = async () => {
    setLoading(true);
    try {
      const data = await budgetApi.getBudget();
      setBudgetData(data);
      setNewBudget(data.budget.toString());
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load budget data');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsageSummary = async () => {
    try {
      const data = await budgetApi.getUsageSummary();
      setUsageSummary(data.rows || []);
    } catch (err) {
      console.error('Failed to load usage summary:', err);
    }
  };

  useEffect(() => {
    fetchBudgetData();
    fetchUsageSummary();
  }, []);

  const handleSaveBudget = async () => {
    if (!canUpdate) { toast.error('You do not have permission to update the budget.'); return; }
    const budgetValue = parseFloat(newBudget);
    if (isNaN(budgetValue) || budgetValue <= 0) {
      toast.error('Please enter a valid budget amount');
      return;
    }

    setSaving(true);
    try {
      await budgetApi.updateBudget(budgetValue);
      toast.success('Budget updated successfully');
      await fetchBudgetData();
      setEditing(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update budget');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditing(false);
    setNewBudget(budgetData?.budget.toString() || '');
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          Loading budget data...
        </CardContent>
      </Card>
    );
  }

  if (!budgetData) return null;

  return (
    <div className="space-y-4">
      {/* Budget Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" style={{ color: 'var(--primary)' }} />
                Budget Overview · {formatMonth(budgetData.monthYear)}
              </CardTitle>
              <CardDescription className="mt-1">
                Monthly AI usage cap and current spending
              </CardDescription>
            </div>
            {budgetData.alert80Sent && (
              <Badge variant="warning" className="flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                80% Alert Sent
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                Usage Progress
              </span>
              <span className="text-sm font-semibold" style={{ color: getStatusColor(budgetData.percentUsed) }}>
                {budgetData.percentUsed}%
              </span>
            </div>
            <Progress
              value={Math.min(budgetData.percentUsed, 100)}
              className={`h-3 ${getProgressColor(budgetData.percentUsed)}`}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg" style={{ background: 'var(--secondary)' }}>
              <div className="text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>
                Monthly Budget
              </div>
              {editing ? (
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newBudget}
                    onChange={(e) => setNewBudget(e.target.value)}
                    className="h-8 w-32"
                    disabled={saving}
                  />
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={handleSaveBudget} disabled={saving}>
                    <Check className="w-4 h-4" style={{ color: 'var(--success)' }} />
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={handleCancelEdit} disabled={saving}>
                    <X className="w-4 h-4" style={{ color: 'var(--error)' }} />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="text-2xl font-semibold" style={{ color: 'var(--foreground)' }}>
                    {formatCurrency(budgetData.budget)}
                  </div>
                  {canUpdate && (
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => setEditing(true)}>
                      <Pencil className="w-4 h-4" style={{ color: 'var(--muted-foreground)' }} />
                    </Button>
                  )}
                </div>
              )}
            </div>

            <div className="p-4 rounded-lg" style={{ background: 'var(--secondary)' }}>
              <div className="text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>
                Spent This Month
              </div>
              <div className="text-2xl font-semibold" style={{ color: getStatusColor(budgetData.percentUsed) }}>
                {formatCurrency(budgetData.spent)}
              </div>
            </div>

            <div className="p-4 rounded-lg" style={{ background: 'var(--secondary)' }}>
              <div className="text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>
                Remaining Budget
              </div>
              <div className="text-2xl font-semibold" style={{ color: budgetData.remaining > 0 ? 'var(--success)' : 'var(--error)' }}>
                {formatCurrency(budgetData.remaining)}
              </div>
            </div>
          </div>

          {budgetData.percentUsed >= 100 && (
            <div className="p-4 rounded-lg border flex items-start gap-3" style={{ background: 'rgba(239, 68, 68, 0.1)', borderColor: 'var(--error)' }}>
              <AlertCircle className="w-5 h-5 mt-0.5" style={{ color: 'var(--error)' }} />
              <div>
                <div className="font-semibold mb-1" style={{ color: 'var(--error)' }}>Budget Exceeded</div>
                <div className="text-sm" style={{ color: 'var(--foreground)' }}>
                  AI operations are currently blocked. All API calls will return 402 Payment Required until next month or until you increase the budget.
                </div>
              </div>
            </div>
          )}

          {budgetData.percentUsed >= 80 && budgetData.percentUsed < 100 && (
            <div className="p-4 rounded-lg border flex items-start gap-3" style={{ background: 'rgba(245, 158, 11, 0.1)', borderColor: 'var(--amber)' }}>
              <AlertCircle className="w-5 h-5 mt-0.5" style={{ color: 'var(--amber)' }} />
              <div>
                <div className="font-semibold mb-1" style={{ color: 'var(--amber)' }}>Approaching Budget Limit</div>
                <div className="text-sm" style={{ color: 'var(--foreground)' }}>
                  You have used {budgetData.percentUsed}% of your monthly budget. Consider increasing your limit to avoid service interruption.
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Usage Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" style={{ color: 'var(--primary)' }} />
            Usage Breakdown by Operation
          </CardTitle>
          <CardDescription>Detailed breakdown of AI usage for the current month</CardDescription>
        </CardHeader>
        <CardContent>
          {usageSummary.length === 0 ? (
            <div className="text-center py-8" style={{ color: 'var(--muted-foreground)' }}>
              No usage data for this month yet
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                    <th className="text-left py-3 px-4 text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>Operation</th>
                    <th className="text-left py-3 px-4 text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>Model</th>
                    <th className="text-right py-3 px-4 text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>Calls</th>
                    <th className="text-right py-3 px-4 text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>Tokens</th>
                    <th className="text-right py-3 px-4 text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {usageSummary.map((row, idx) => (
                    <tr key={idx} className="border-b" style={{ borderColor: 'var(--border)' }}>
                      <td className="py-3 px-4 text-sm font-medium" style={{ color: 'var(--foreground)' }}>{row.operation}</td>
                      <td className="py-3 px-4 text-sm" style={{ color: 'var(--muted-foreground)' }}>
                        <code className="text-xs px-2 py-1 rounded" style={{ background: 'var(--secondary)' }}>{row.model}</code>
                      </td>
                      <td className="py-3 px-4 text-sm text-right" style={{ color: 'var(--foreground)' }}>{parseInt(row.calls).toLocaleString()}</td>
                      <td className="py-3 px-4 text-sm text-right" style={{ color: 'var(--foreground)' }}>{parseInt(row.total_tokens).toLocaleString()}</td>
                      <td className="py-3 px-4 text-sm text-right font-semibold" style={{ color: 'var(--foreground)' }}>{formatCurrency(parseFloat(row.estimated_cost_usd))}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2" style={{ borderColor: 'var(--border)' }}>
                    <td colSpan="4" className="py-3 px-4 text-sm font-semibold text-right" style={{ color: 'var(--foreground)' }}>Total</td>
                    <td className="py-3 px-4 text-sm font-bold text-right" style={{ color: 'var(--primary)' }}>{formatCurrency(budgetData.spent)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
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

      <BudgetSection />

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
  );
}
