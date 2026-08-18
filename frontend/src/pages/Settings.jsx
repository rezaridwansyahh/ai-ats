import { useState } from 'react';
import {
  Settings2, Users, ShieldCheck, Workflow, Plug, Bell, Globe,
  ShieldQuestion, FileText, CreditCard, CalendarClock,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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
import OfferTemplateSettings from '../components/settings/OfferTemplateSettings';

// ── Static Configuration ──

const SETTINGS_NAV = [
  { id: 'general', label: 'General', icon: Settings2 },
  { id: 'team', label: 'Team', icon: Users },
  { id: 'roles', label: 'Roles & Permissions', icon: ShieldCheck },
  { id: 'workflow-templates', label: 'Workflow Templates', icon: Workflow },
  { id: 'integrations', label: 'Integrations', icon: Plug },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'candidate-portal', label: 'Candidate Portal', icon: Globe },
  { id: 'offer-template', label: 'Offer Letter Template', icon: FileText },
  { id: 'compliance', label: 'Compliance', icon: ShieldQuestion, badge: 'OK' },
  { id: 'audit-export', label: 'Audit Export', icon: FileText },
  { id: 'billing', label: 'Billing & Plan', icon: CreditCard },
  { id: 'probation-templates', label: 'Probation Templates', icon: CalendarClock },
];

// ── Section Registry Map ──

const SECTION_COMPONENTS = {
  general: GeneralSettings,
  team: TeamSettings,
  roles: RolesPermissionsSettings,
  'workflow-templates': WorkflowTemplatesSettings,
  integrations: IntegrationsSettings,
  notifications: NotificationsSettings,
  'candidate-portal': CandidatePortalSettings,
  'offer-template': OfferTemplateSettings,
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