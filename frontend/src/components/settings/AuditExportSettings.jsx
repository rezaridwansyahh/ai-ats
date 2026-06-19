import { useState } from 'react';
import { Settings2, FileText, Check } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';

// ── Static data — swap for API data when backend is ready ──

const BANNER = {
  title: 'New in v50 · Action 13.',
  body: "v49 had audit logs but not an audit export. A UI log satisfies no auditor — UU PDP requires a downloadable pack on demand. Enterprise procurement asks this question first.",
};

const SCOPE_OPTIONS = ['Candidate', 'Job', 'Date range'];

const INCLUDE_ITEMS = [
  { id: 'consent', label: 'Consent events (v50-tagged) with IP, UA, timestamp', checked: true },
  { id: 'access', label: 'Data-access events (who viewed what)', checked: true },
  { id: 'modification', label: 'Data-modification events (field-level diff)', checked: true },
  { id: 'retention', label: 'Retention actions (auto-purge, manual delete)', checked: true },
  { id: 'erasure', label: 'Right-to-erasure history', checked: true },
  { id: 'ai-decisions', label: 'AI model decisions (score explanations)', checked: true },
  { id: 'offer-approval', label: 'Offer approval trail (HM sign-off · Action 03)', checked: true },
];

const RECENT_EXPORTS = [
  { id: 1, title: 'Dewi Sartika', date: 'Apr 20', by: 'Sarah Chen' },
  { id: 2, title: 'Req · Head of Data', date: 'Apr 15', by: 'Admin' },
  { id: 3, title: 'Date range Q1', date: 'Mar 31', by: 'Admin' },
  { id: 4, title: 'Bayu Pratama · erasure', date: 'Mar 28', by: 'HR Ops' },
];

const COVERAGE_ITEMS = [
  'UU PDP Art 20 · Consent trail',
  'UU PDP Art 35 · Retention log',
  'UU PDP Art 7 · Erasure history',
  'PP 71/2019 · Data residency',
  'Ministerial Reg 20 · DPIA',
];

// ── Page ──

export default function AuditExportSettings() {
  const [scope, setScope] = useState('Candidate');
  const [candidate, setCandidate] = useState('Dewi Sartika');
  const [dateFrom, setDateFrom] = useState('01/01/2026');
  const [dateTo, setDateTo] = useState('24/04/2026');
  const [items, setItems] = useState(INCLUDE_ITEMS);

  const toggleItem = (id) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i))
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight font-serif">Audit Export Pack</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Generate a timestamped consent trail, retention record, and right-to-erasure
            history — per candidate, per job, or per date range.{' '}
            <span className="font-semibold text-foreground">Auditor-ready.</span>
          </p>
        </div>
        <Button variant="outline" size="sm" className="flex-shrink-0">
          <Settings2 className="h-3.5 w-3.5 mr-1.5" />
          Retention settings
        </Button>
      </div>

      {/* Callout banner */}
      <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 px-4 py-3 text-sm text-emerald-900">
        <span className="font-semibold">{BANNER.title}</span>{' '}
        <span className="text-emerald-800">{BANNER.body}</span>
      </div>

      <div className="grid grid-cols-[1fr_320px] gap-4">
        {/* Build a pack */}
        <Card className="py-0 gap-0 overflow-hidden">
          <div className="px-4 py-3 border-b">
            <p className="text-sm font-semibold">Build a pack</p>
          </div>

          <div className="p-4 space-y-4">
            <div className="space-y-1.5">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Scope</p>
              <div className="flex gap-2">
                {SCOPE_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setScope(opt)}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${
                      scope === opt
                        ? 'bg-teal-700 border-teal-700 text-white'
                        : 'bg-background border-input text-foreground hover:bg-muted/50'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {scope === 'Candidate' && (
              <div className="space-y-1.5">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Candidate</p>
                <Input value={candidate} onChange={(e) => setCandidate(e.target.value)} />
              </div>
            )}

            <div className="space-y-1.5">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Date range</p>
              <div className="flex items-center gap-2">
                <Input value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                <span className="text-sm text-muted-foreground flex-shrink-0">to</span>
                <Input value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Include</p>
              <div className="space-y-2.5">
                {items.map((item) => (
                  <label key={item.id} className="flex items-start gap-2.5 cursor-pointer">
                    <Checkbox
                      checked={item.checked}
                      onCheckedChange={() => toggleItem(item.id)}
                      className="mt-0.5"
                    />
                    <span className="text-sm">{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <Button className="w-full bg-teal-700 hover:bg-teal-800">
              <FileText className="h-3.5 w-3.5 mr-1.5" />
              Generate pack (PDF + CSV)
            </Button>
          </div>
        </Card>

        {/* Right column */}
        <div className="space-y-4">
          <Card className="py-0 gap-0 overflow-hidden">
            <div className="px-4 py-3 border-b">
              <p className="text-sm font-semibold">Recent exports</p>
            </div>
            {RECENT_EXPORTS.map((e) => (
              <div key={e.id} className="px-4 py-3 border-b last:border-b-0">
                <p className="text-sm font-semibold">{e.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {e.date} · by {e.by}
                </p>
              </div>
            ))}
          </Card>

          <Card className="py-0 gap-0 overflow-hidden">
            <div className="px-4 py-3 border-b">
              <p className="text-sm font-semibold">Audit requirement coverage</p>
            </div>
            <div className="px-4 py-3 space-y-2.5">
              {COVERAGE_ITEMS.map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" />
                  <span className="text-sm">{item}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}