import { useState } from 'react';
import {
  Settings2, Users, ShieldCheck, Workflow, Plug, Bell, Globe,
  ShieldQuestion, FileText, CreditCard, CalendarClock, Plus, X,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select';
import TeamSettings from '../components/settings/TeamSettings';
import RolesPermissionsSettings from '../components/settings/RolesPermissionsSettings';
import WorkflowTemplatesSettings from '../components/settings/WorkflowTemplatesSettings';
import IntegrationsSettings from '../components/settings/IntegrationsSettings';
import NotificationsSettings from '../components/settings/NotificationsSettings';
import CandidatePortalSettings from '../components/settings/CandidatePortalSettings';
import ComplianceSettings from '../components/settings/ComplianceSettings';
import AuditExportSettings from '../components/settings/AuditExportSettings';
import BillingPlanSettings from '../components/settings/BillingPlanSettings';
import ProbationTemplatesSettings from '../components/settings/ProbationTemplatesSettings';

// ── Static config — swap for API data when backend is ready ──

const CHAIN_TABS = [
  { id: 'requisition-offer', label: 'Requisition Offer' },
  { id: 'requisition-create', label: 'Requisition Create' },
  { id: 'budget-exception', label: 'Budget Exception' },
];

const ROLE_OPTIONS = ['HRBP', 'Finance', 'CHRO', 'Hiring Manager', 'TA Lead'];
const MODE_OPTIONS = ['serial', 'parallel'];

const DEFAULT_CHAIN = [
  { id: 1, role: 'HRBP', mode: 'serial', sla: 24 },
  { id: 2, role: 'Finance', mode: 'serial', sla: 24 },
  { id: 3, role: 'CHRO', mode: 'serial', sla: 48 },
];

const SETTINGS_NAV = [
  { id: 'general', label: 'General', icon: Settings2 },
  { id: 'team', label: 'Team', icon: Users },
  { id: 'roles', label: 'Roles & Permissions', icon: ShieldCheck },
  { id: 'workflow-templates', label: 'Workflow Templates', icon: Workflow },
  { id: 'integrations', label: 'Integrations', icon: Plug },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'candidate-portal', label: 'Candidate Portal', icon: Globe },
  { id: 'compliance', label: 'Compliance', icon: ShieldQuestion, badge: 'OK' },
  { id: 'audit-export', label: 'Audit Export', icon: FileText },
  { id: 'billing', label: 'Billing & Plan', icon: CreditCard },
  { id: 'probation-templates', label: 'Probation Templates', icon: CalendarClock },
];

const ORG_FIELDS = [
  { label: 'Company name', value: 'ACME Indonesia' },
  { label: 'Legal entity', value: 'PT Acme Digital Indonesia' },
  { label: 'Primary domain', value: 'acme.co.id' },
  { label: 'Industry', value: 'Technology · Fintech' },
];

const LOCALE_FIELDS = [
  { label: 'Timezone', value: 'Asia/Jakarta (WIB · UTC+7)' },
  { label: 'Currency', value: 'IDR (Rp)' },
  { label: 'Default language', value: 'Bahasa Indonesia' },
  { label: 'Date format', value: 'DD MMM YYYY' },
];

const DEFAULT_TOGGLES = [
  { id: 'five-stage', label: 'Default to 5-stage pipeline', checked: true },
  { id: 'rubric-required', label: 'Require rubric before publishing', checked: true },
  { id: 'ai-screening', label: 'AI screening on by default', checked: true },
  { id: 'public-pages', label: 'Allow public job pages on acme.myralix.co', checked: false },
];

// ── Approval chain step ──

function ChainStep({ step, onChange, onRemove, showArrow }) {
  return (
    <div className="flex items-center">
      <div className="relative w-44 rounded-lg border bg-background p-3 flex flex-col gap-2">
        <button
          type="button"
          onClick={() => onRemove(step.id)}
          className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
          aria-label="Remove step"
        >
          <X className="h-3 w-3" />
        </button>

        <Select value={step.role} onValueChange={(v) => onChange(step.id, { role: v })}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ROLE_OPTIONS.map((r) => (
              <SelectItem key={r} value={r}>{r}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={step.mode} onValueChange={(v) => onChange(step.id, { mode: v })}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MODE_OPTIONS.map((m) => (
              <SelectItem key={m} value={m}>{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span>SLA:</span>
          <Input
            type="number"
            value={step.sla}
            onChange={(e) => onChange(step.id, { sla: Number(e.target.value) })}
            className="h-7 w-14 text-xs px-2"
          />
          <span>h</span>
        </div>
      </div>

      {showArrow && (
        <span className="mx-3 text-muted-foreground">→</span>
      )}
    </div>
  );
}

// ── Approval chains section ──

function ApprovalChains() {
  const [activeTab, setActiveTab] = useState('requisition-offer');
  const [chain, setChain] = useState(DEFAULT_CHAIN);

  const updateStep = (id, patch) => {
    setChain((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  };

  const removeStep = (id) => {
    setChain((prev) => prev.filter((s) => s.id !== id));
  };

  const addStep = () => {
    setChain((prev) => [
      ...prev,
      { id: Date.now(), role: ROLE_OPTIONS[0], mode: 'serial', sla: 24 },
    ]);
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight font-serif">Approval chains</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Every approval flow in Myralix routes through one of these chains. Edit the role, the
          order, the parallel/serial mode, and the SLA. Used by JM-03 (req approval), OF-02
          (offer approval), budget exceptions, etc.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-6 border-b">
        {CHAIN_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-2 text-sm transition-colors ${
              activeTab === tab.id
                ? 'font-semibold text-foreground border-b-2 border-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Chain builder */}
      <div className="rounded-xl border bg-muted/30 p-5">
        <div className="flex items-center">
          {chain.map((step, i) => (
            <ChainStep
              key={step.id}
              step={step}
              onChange={updateStep}
              onRemove={removeStep}
              showArrow
            />
          ))}
          <button
            type="button"
            onClick={addStep}
            className="h-[88px] w-12 rounded-lg border border-dashed flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors"
            aria-label="Add step"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Button className="bg-foreground text-background hover:bg-foreground/90">
          Save chain
        </Button>
        <p className="text-xs text-muted-foreground">
          Used by 23 active requisitions · last edited 14d ago
        </p>
      </div>
    </div>
  );
}

// ── Settings detail field row ──

function FieldRow({ label, value }) {
  return (
    <div className="flex items-center justify-between py-3 border-b last:border-b-0">
      <div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="text-sm font-medium mt-0.5">{value}</p>
      </div>
      <Button variant="link" size="sm" className="h-auto p-0 text-sm">
        Edit
      </Button>
    </div>
  );
}

// ── Toggle row ──

function ToggleRow({ label, checked, onCheckedChange }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <span className="text-sm">{label}</span>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

// ── Main settings panel (General tab) ──

function GeneralSettings() {
  const [toggles, setToggles] = useState(DEFAULT_TOGGLES);

  const toggle = (id) => {
    setToggles((prev) =>
      prev.map((t) => (t.id === id ? { ...t, checked: !t.checked } : t))
    );
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Organization</CardTitle>
          <CardDescription>Company profile used on job posts and candidate communication.</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          {ORG_FIELDS.map((f) => (
            <FieldRow key={f.label} label={f.label} value={f.value} />
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Locale & regional</CardTitle>
          <CardDescription>Controls dates, currency, and default working hours.</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          {LOCALE_FIELDS.map((f) => (
            <FieldRow key={f.label} label={f.label} value={f.value} />
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Workspace defaults</CardTitle>
          <CardDescription>Apply to new jobs unless overridden.</CardDescription>
        </CardHeader>
        <CardContent className="pt-0 divide-y">
          {toggles.map((t) => (
            <ToggleRow
              key={t.id}
              label={t.label}
              checked={t.checked}
              onCheckedChange={() => toggle(t.id)}
            />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

// ── Section registry ──

const SECTION_COMPONENTS = {
  general: GeneralSettings,
  team: TeamSettings,
  roles: RolesPermissionsSettings,
  'workflow-templates': WorkflowTemplatesSettings,
  integrations: IntegrationsSettings,
  notifications: NotificationsSettings,
  'candidate-portal': CandidatePortalSettings,
  compliance: ComplianceSettings,
  'audit-export': AuditExportSettings,
  billing: BillingPlanSettings,
  'probation-templates': ProbationTemplatesSettings,
};

// ── Page ──

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState('general');

  const ActiveComponent = SECTION_COMPONENTS[activeSection];

  return (
    <div className="space-y-8">
      <ApprovalChains />

      <div>
        <h1 className="text-2xl font-bold tracking-tight font-serif">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Workspace configuration · team access · roles · workflows · compliance · billing.
        </p>
      </div>

      <div className="grid grid-cols-[220px_1fr] gap-6">
        {/* Sub-nav */}
        <nav className="space-y-0.5">
          {SETTINGS_NAV.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center justify-between gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-700 font-medium'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  {item.label}
                </span>
                {item.badge && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-emerald-50 text-emerald-600 border-emerald-200">
                    {item.badge}
                  </Badge>
                )}
              </button>
            );
          })}
        </nav>

        {/* Detail panel */}
        <div>
          {ActiveComponent ? (
            <ActiveComponent />
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-sm text-muted-foreground">
                {SETTINGS_NAV.find((s) => s.id === activeSection)?.label} settings coming soon.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}