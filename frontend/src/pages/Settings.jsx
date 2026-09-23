import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Settings2, Users, ShieldCheck, Workflow, Plug, Bell, Globe,
  ShieldQuestion, FileText, CreditCard, CalendarClock, Mail, Palette,UserRound, 
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { hasPermission } from '@/utils/permissions';

// Sub-settings component imports
import TeamSettings from '../components/settings/TeamSettings';
import RolesPermissionsSettings from '../components/settings/RolesPermissionsSettings';
import WorkflowTemplatesSettings from '../components/settings/WorkflowTemplatesSettings';
import IntegrationsSettings from '../components/settings/IntegrationsSettings';
import RecruitersSettings from '../components/settings/RecruitersSettings';
import NotificationsSettings from '../components/settings/NotificationsSettings';
import CandidatePortalSettings from '../components/settings/CandidatePortalSettings';
import ComplianceSettings from '../components/settings/ComplianceSettings';
import AuditExportSettings from '../components/settings/AuditExportSettings';
import BillingPlanSettings from '../components/settings/BillingPlanSettings';
import ProbationTemplatesSettings from '../components/settings/ProbationTemplatesSettings';
import GeneralSettings from '../components/settings/GeneralSettings';
import OfferTemplateSettings from '../components/settings/OfferTemplateSettings';
import EmailTemplateSettings from '../components/settings/EmailTemplateSettings';
import ThemeSettings from '../components/settings/ThemeSettings';

// ── Static Configuration ──

const SETTINGS_NAV = [
  { id: 'general', label: 'General', icon: Settings2 },
  { id: 'theme', label: 'Theme', icon: Palette },
  { id: 'team', label: 'Team', icon: Users },
  { id: 'roles', label: 'Roles & Permissions', icon: ShieldCheck },
  { id: 'recruiters', label: 'Recruiters', icon: UserRound },
  { id: 'workflow-templates', label: 'Workflow Templates', icon: Workflow },
  { id: 'integrations', label: 'Integrations', icon: Plug },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'candidate-portal', label: 'Candidate Portal', icon: Globe },
  { id: 'offer-template', label: 'Offer Letter Template', icon: FileText },
  { id: 'email-templates', label: 'Email Templates', icon: Mail },
  { id: 'compliance', label: 'Compliance', icon: ShieldQuestion, badge: 'OK' },
  { id: 'audit-export', label: 'Audit Export', icon: FileText },
  { id: 'billing', label: 'Billing & Plan', icon: CreditCard },
  { id: 'probation-templates', label: 'Probation Templates', icon: CalendarClock },
];

// Tabs backed by a real module/menu in the permission schema — gated on
// 'read'. Tabs with no entry here (Notifications, Compliance, etc.) have no
// corresponding menu in the RBAC data at all, so there's nothing to check and
// they stay open to any authenticated user. "Billing & Plan" is deliberately
// left out too — it mixes a gated feature (Budget, gated internally on its
// own 'update' permission) with ungated static Plan/Invoices mockup content,
// so hiding the whole tab would also hide the part nothing restricts.
const TAB_PERMISSION = {
  roles:        { module: 'Settings', menu: 'Role Management' },
  integrations: { module: 'Settings', menu: 'Integrations' },
  team:         { module: 'Settings', menu: 'User Management' },
  recruiters:   { module: 'Settings', menu: 'Recruiters' },
};

function canAccessTab(id) {
  const perm = TAB_PERMISSION[id];
  return !perm || hasPermission(perm.module, perm.menu, 'read');
}

// ── Section Registry Map ──

const SECTION_COMPONENTS = {
  general: GeneralSettings,
  theme: ThemeSettings,
  team: TeamSettings,
  roles: RolesPermissionsSettings,
  recruiters: RecruitersSettings,
  'workflow-templates': WorkflowTemplatesSettings,
  integrations: IntegrationsSettings,
  notifications: NotificationsSettings,
  'candidate-portal': CandidatePortalSettings,
  'offer-template': OfferTemplateSettings,
  'email-templates': EmailTemplateSettings,
  compliance: ComplianceSettings,
  'audit-export': AuditExportSettings,
  billing: BillingPlanSettings,
  'probation-templates': ProbationTemplatesSettings,
};

// ── View Wrapper Page ──

export default function SettingsPage() {
  const location = useLocation();
  // Deep-links (e.g. "Go to Settings → Offer Template") pass the target
  // section via router state, since tabs aren't reflected in the URL. Fall
  // back to 'general' if the requested tab is one the role can't open.
  const requestedSection = location.state?.section || 'general';
  const [activeSection, setActiveSection] = useState(
    canAccessTab(requestedSection) ? requestedSection : 'general'
  );
  const ActiveComponent = SECTION_COMPONENTS[activeSection];

  const selectSection = (id) => {
    if (!canAccessTab(id)) return;
    setActiveSection(id);
  };

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
            const accessible = canAccessTab(item.id);
            return (
              <button
                key={item.id}
                onClick={() => selectSection(item.id)}
                disabled={!accessible}
                title={accessible ? undefined : 'You do not have permission to access this section.'}
                className={`w-full flex items-center justify-between gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                  !accessible
                    ? 'text-muted-foreground/40 cursor-not-allowed'
                    : isActive
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  {item.label}
                </span>
                <span className="flex items-center gap-1.5">
                  {item.badge && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-emerald-50 text-emerald-600 border-emerald-200">
                      {item.badge}
                    </Badge>
                  )}
                  {!accessible && <Lock className="h-3 w-3 shrink-0" />}
                </span>
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