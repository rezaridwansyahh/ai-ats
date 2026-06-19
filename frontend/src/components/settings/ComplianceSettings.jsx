import { Download, ShieldCheck, Settings as SettingsIcon, UserRound, Check } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// ── Static data — swap for API data when backend is ready ──

const SUMMARY_CARDS = [
  { id: 'residency', label: 'Data residency', value: 'Jakarta ID', desc: 'In compliance with PP 71/2019', dot: 'bg-emerald-500' },
  { id: 'consent', label: 'Consent coverage', value: '98.2%', desc: '27 candidates pending renewal', dot: 'bg-emerald-500' },
  { id: 'retention', label: 'Retention breaches', value: '0', desc: 'Auto-purge active', dot: 'bg-emerald-500' },
  { id: 'dpia', label: 'DPIA due', value: '14d', desc: 'Q4 review window', dot: 'bg-amber-500' },
];

const RETENTION_POLICY = [
  { id: 'active', label: 'Active candidates', sub: null, value: 'While in pipeline' },
  { id: 'rejected', label: 'Rejected candidates', sub: '14 purged this month', value: '12 months' },
  { id: 'hired', label: 'Hired (converted to employee)', sub: null, value: 'N/A — transferred to HRIS' },
  { id: 'offer', label: 'Unsuccessful offer', sub: 'Next purge: Nov 3', value: '18 months' },
  { id: 'pool', label: 'Talent Pool (consented)', sub: null, value: '36 months rolling' },
];

const AUDIT_EVENTS = [
  { id: 1, actor: 'Sarah Chen', action: 'viewed DEI dashboard', time: '2 min ago', system: false },
  { id: 2, actor: 'System', action: 'auto-purged 3 expired candidate records', time: '1 hour ago', system: true },
  { id: 3, actor: 'Ahmad Sutanto', action: 'accessed Dewi Sartika profile', time: '3 hours ago', system: false },
  { id: 4, actor: 'Sarah Chen', action: 'exported Talent Pool (47 records, CSV)', time: 'yesterday', system: false },
  { id: 5, actor: 'System', action: 'AI rubric updated for Sr. Frontend Dev', time: 'yesterday', system: true },
  { id: 6, actor: 'Maya Hartono', action: 'rejected candidate Budi K. with reason', time: '2d ago', system: false },
  { id: 7, actor: 'System', action: 'consent renewal sent to 12 pool candidates', time: '3d ago', system: true },
  { id: 8, actor: 'Sarah Chen', action: 'ran DPIA review Q3', time: '1w ago', system: false },
];

const DSR_STATS = [
  { id: 'quarter', label: 'This quarter', value: '4 / 4', desc: 'All resolved within 30d', tone: 'text-emerald-600' },
  { id: 'response', label: 'Avg response', value: '6.2d', desc: 'Target ≤ 30d', tone: 'text-foreground' },
];

const AI_GOVERNANCE = [
  { id: 'scoring', label: 'Scoring model', desc: 'Runs in Jakarta region' },
  { id: 'opt-out', label: 'Training opt-out', desc: 'Your data never trains shared models' },
  { id: 'dei', label: 'DEI fields excluded', desc: 'Gender, age, ethnicity never scored' },
  { id: 'review', label: 'Human review required', desc: 'Reject decisions require recruiter confirm' },
];

// ── Summary card ──

function SummaryCard({ label, value, desc, dot }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
        <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
        {label}
      </div>
      <p className="text-2xl font-bold font-serif mt-1.5">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
    </Card>
  );
}

// ── Retention row ──

function RetentionRow({ label, sub, value }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b last:border-b-0">
      <div>
        <p className="text-sm font-semibold">{label}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
      <span className="text-sm text-muted-foreground">{value}</span>
    </div>
  );
}

// ── Audit event row ──

function AuditEventRow({ event }) {
  const Icon = event.system ? SettingsIcon : UserRound;
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 border-b last:border-b-0">
      <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <p className="flex-1 text-sm min-w-0">
        <span className="font-semibold">{event.actor}</span>{' '}
        <span className="text-muted-foreground">{event.action}</span>
      </p>
      <span className="text-xs text-muted-foreground flex-shrink-0">{event.time}</span>
    </div>
  );
}

// ── DSR stat ──

function DsrStat({ label, value, desc, tone }) {
  return (
    <div className="rounded-lg bg-muted/40 p-3">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`text-2xl font-bold font-serif mt-1 ${tone}`}>{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
    </div>
  );
}

// ── AI governance row ──

function GovernanceRow({ label, desc }) {
  return (
    <div className="flex items-start gap-3 px-4 py-3 border-b last:border-b-0">
      <div className="h-5 w-5 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Check className="h-3 w-3 text-emerald-600" />
      </div>
      <div>
        <p className="text-sm font-semibold">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
      </div>
    </div>
  );
}

// ── Page ──

export default function ComplianceSettings() {
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight font-serif">Compliance</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Data residency, retention, consent, and audit trail. All candidate data stored in
            Indonesia (Jakarta region).
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Button variant="outline" size="sm">
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Download audit log
          </Button>
          <Button size="sm" className="bg-teal-700 hover:bg-teal-800">
            <ShieldCheck className="h-3.5 w-3.5 mr-1.5" />
            Run DPIA
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-3">
        {SUMMARY_CARDS.map((c) => (
          <SummaryCard key={c.id} {...c} />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Retention policy */}
        <Card className="py-0 gap-0 overflow-hidden">
          <div className="px-4 py-3 border-b">
            <p className="text-sm font-semibold">Retention policy</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Data expires & is auto-purged based on stage
            </p>
          </div>
          {RETENTION_POLICY.map((r) => (
            <RetentionRow key={r.id} {...r} />
          ))}
        </Card>

        {/* Recent audit events */}
        <Card className="py-0 gap-0 overflow-hidden">
          <div className="px-4 py-3 border-b">
            <p className="text-sm font-semibold">Recent audit events</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              All write operations · 7-year retention
            </p>
          </div>
          <div className="max-h-[340px] overflow-y-auto">
            {AUDIT_EVENTS.map((e) => (
              <AuditEventRow key={e.id} event={e} />
            ))}
          </div>
        </Card>

        {/* Data subject requests */}
        <Card className="py-0 gap-0 overflow-hidden">
          <div className="px-4 py-3 border-b">
            <p className="text-sm font-semibold">Data subject requests</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Right-to-erasure and access requests under PP 71/2019
            </p>
          </div>
          <div className="p-4 grid grid-cols-2 gap-3">
            {DSR_STATS.map((s) => (
              <DsrStat key={s.id} {...s} />
            ))}
          </div>
        </Card>

        {/* AI model governance */}
        <Card className="py-0 gap-0 overflow-hidden">
          <div className="px-4 py-3 border-b">
            <p className="text-sm font-semibold">AI model governance</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              What AI does with candidate data
            </p>
          </div>
          {AI_GOVERNANCE.map((g) => (
            <GovernanceRow key={g.id} {...g} />
          ))}
        </Card>
      </div>
    </div>
  );
}