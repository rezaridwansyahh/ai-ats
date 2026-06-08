import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, AlertCircle, Pencil, Check, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import budgetApi from '@/api/budget.api';
import { hasPermission } from '@/utils/permissions';

export default function BudgetSettingsPage() {
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
      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-semibold mb-6" style={{ color: 'var(--foreground)' }}>AI Budget Settings</h1>
          <Card>
            <CardContent className="py-12 text-center" style={{ color: 'var(--muted-foreground)' }}>
              Loading budget data...
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!budgetData) return null;

  const getStatusColor = (percent) => {
    if (percent >= 100) return 'var(--error)';
    if (percent >= 80) return 'var(--amber)';
    if (percent >= 50) return 'var(--saffron)';
    return 'var(--primary)';
  };

  const getProgressColor = (percent) => {
    if (percent >= 100) return 'bg-red-500';
    if (percent >= 80) return 'bg-amber-500';
    if (percent >= 50) return 'bg-yellow-500';
    return 'bg-primary';
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    }).format(amount);
  };

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold" style={{ color: 'var(--foreground)' }}>AI Budget Settings</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
            Monitor and manage your monthly AI usage budget
          </p>
        </div>

        {/* Budget Overview Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" style={{ color: 'var(--primary)' }} />
                  Budget Overview - {formatDate(budgetData.monthYear)}
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
            {/* Progress Bar */}
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

            {/* Budget Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Budget Limit */}
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
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      onClick={handleSaveBudget}
                      disabled={saving}
                    >
                      <Check className="w-4 h-4" style={{ color: 'var(--success)' }} />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      onClick={handleCancelEdit}
                      disabled={saving}
                    >
                      <X className="w-4 h-4" style={{ color: 'var(--error)' }} />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="text-2xl font-semibold" style={{ color: 'var(--foreground)' }}>
                      {formatCurrency(budgetData.budget)}
                    </div>
                    {canUpdate && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        onClick={() => setEditing(true)}
                      >
                        <Pencil className="w-4 h-4" style={{ color: 'var(--muted-foreground)' }} />
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {/* Spent */}
              <div className="p-4 rounded-lg" style={{ background: 'var(--secondary)' }}>
                <div className="text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>
                  Spent This Month
                </div>
                <div className="text-2xl font-semibold" style={{ color: getStatusColor(budgetData.percentUsed) }}>
                  {formatCurrency(budgetData.spent)}
                </div>
              </div>

              {/* Remaining */}
              <div className="p-4 rounded-lg" style={{ background: 'var(--secondary)' }}>
                <div className="text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>
                  Remaining Budget
                </div>
                <div className="text-2xl font-semibold" style={{ color: budgetData.remaining > 0 ? 'var(--success)' : 'var(--error)' }}>
                  {formatCurrency(budgetData.remaining)}
                </div>
              </div>
            </div>

            {/* Warning Messages */}
            {budgetData.percentUsed >= 100 && (
              <div
                className="p-4 rounded-lg border flex items-start gap-3"
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  borderColor: 'var(--error)'
                }}
              >
                <AlertCircle className="w-5 h-5 mt-0.5" style={{ color: 'var(--error)' }} />
                <div>
                  <div className="font-semibold mb-1" style={{ color: 'var(--error)' }}>
                    Budget Exceeded
                  </div>
                  <div className="text-sm" style={{ color: 'var(--foreground)' }}>
                    AI operations are currently blocked. All API calls will return 402 Payment Required until next month or until you increase the budget.
                  </div>
                </div>
              </div>
            )}

            {budgetData.percentUsed >= 80 && budgetData.percentUsed < 100 && (
              <div
                className="p-4 rounded-lg border flex items-start gap-3"
                style={{
                  background: 'rgba(245, 158, 11, 0.1)',
                  borderColor: 'var(--amber)'
                }}
              >
                <AlertCircle className="w-5 h-5 mt-0.5" style={{ color: 'var(--amber)' }} />
                <div>
                  <div className="font-semibold mb-1" style={{ color: 'var(--amber)' }}>
                    Approaching Budget Limit
                  </div>
                  <div className="text-sm" style={{ color: 'var(--foreground)' }}>
                    You have used {budgetData.percentUsed}% of your monthly budget. Consider increasing your limit to avoid service interruption.
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Usage Breakdown Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" style={{ color: 'var(--primary)' }} />
              Usage Breakdown by Operation
            </CardTitle>
            <CardDescription>
              Detailed breakdown of AI usage for the current month
            </CardDescription>
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
                        <td className="py-3 px-4 text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                          {row.operation}
                        </td>
                        <td className="py-3 px-4 text-sm" style={{ color: 'var(--muted-foreground)' }}>
                          <code className="text-xs px-2 py-1 rounded" style={{ background: 'var(--secondary)' }}>
                            {row.model}
                          </code>
                        </td>
                        <td className="py-3 px-4 text-sm text-right" style={{ color: 'var(--foreground)' }}>
                          {parseInt(row.calls).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-sm text-right" style={{ color: 'var(--foreground)' }}>
                          {parseInt(row.total_tokens).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-sm text-right font-semibold" style={{ color: 'var(--foreground)' }}>
                          {formatCurrency(parseFloat(row.estimated_cost_usd))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2" style={{ borderColor: 'var(--border)' }}>
                      <td colSpan="4" className="py-3 px-4 text-sm font-semibold text-right" style={{ color: 'var(--foreground)' }}>
                        Total
                      </td>
                      <td className="py-3 px-4 text-sm font-bold text-right" style={{ color: 'var(--primary)' }}>
                        {formatCurrency(budgetData.spent)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
