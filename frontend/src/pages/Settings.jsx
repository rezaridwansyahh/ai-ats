import { useState } from 'react';
import {
  Settings2, Users, ShieldCheck, Workflow, Plug, Bell, Globe,
  ShieldQuestion, FileText, CreditCard, CalendarClock, Plus, X,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select';

// Sub-settings component imports
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
import GeneralSettings from '../components/settings/GeneralSettings';

// ── Static Configuration & Mock Data ──

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

// ── Shared Sub-Components ──

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

      {showArrow && <span className="mx-3 text-muted-foreground">→</span>}
    </div>
  );
}

// ── Featured Settings Sections ──

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
          order, the parallel/serial mode, and the SLA.
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
        <div className="flex items-center overflow-x-auto py-2">
          {chain.map((step, i) => (
            <ChainStep
              key={step.id}
              step={step}
              onChange={updateStep}
              onRemove={removeStep}
              showArrow={i < chain.length - 1}
            />
          ))}
          <button
            type="button"
            onClick={addStep}
            className="h-[88px] w-12 shrink-0 rounded-lg border border-dashed flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors"
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

// ── Section Registry Map ──

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

// ── View Wrapper Page ──

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState('general');
  const ActiveComponent = SECTION_COMPONENTS[activeSection];

  return (
    <div className="space-y-8 p-6 max-w-6xl mx-auto">
      <ApprovalChains />

      <hr className="border-t" />

      <div>
        <h1 className="text-2xl font-bold tracking-tight font-serif">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Workspace configuration · team access · roles · workflows · compliance · billing.
        </p>
      </div>

      <div className="grid grid-cols-[240px_1fr] gap-8 items-start">
        {/* Navigation Sidebar */}
        <nav className="space-y-1">
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

        {/* Dynamic Detail Settings Render Box */}
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