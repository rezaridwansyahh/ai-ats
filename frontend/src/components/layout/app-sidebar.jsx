import { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from '@/components/ui/sidebar';
import {
  Home, Settings, Package, Briefcase, ClipboardList,
  FileText, Search, Stethoscope, FileSignature, UserCheck,
  BarChart3, Brain, ShieldCheck, Megaphone, Users, Bell,
  ChevronDown, Sparkles, Mail, GitBranch, Activity,
} from 'lucide-react';
import { hasPermission } from '@/utils/permissions';
import { getCompanyById } from '@/api/company.api';
import { TenantCard, UserFooter } from '@/components/common';

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

const iconMap = {
  'Dashboard':          Home,
  'Manager Inbox':      Bell,
  'Candidate Pipeline': GitBranch,
  'Pipeline':           GitBranch,
  'Job Management':     Briefcase,
  'Talent Pool':        Users,
  'Search & Outreach':  Search,
  'Source Candidate':   Search,
  'Source Management':  Search,
  'Campaigns':          Megaphone,
  'AI Screening':       Brain,
  'Interview':          UserCheck,
  'Psych Assessment':   ClipboardList,
  'Medical Assessment': Activity,
  'Medical (MCU)':      Stethoscope,
  'Background Check':   ShieldCheck,
  'Offer & Contract':   FileSignature,
  'Onboarding':         FileText,
  'Report':             BarChart3,
  'Reports':            BarChart3,
  'User Management':    Users,
  'Role Management':    ShieldCheck,
  'Recruiters':         Users,
  'Account':            Settings,
  'Integrations':       Package,
  'Settings':           Settings,
};

const sectionIconMap = {
  'Sourcing':        Search,
  'Selection':       Sparkles,
  'Offer & Onboard': Mail,
  'Insights':        BarChart3,
  'Settings':        Settings,
};

const DISPLAY_NAME_MAP = {
  'Candidate Pipeline': 'Pipeline',
  'Source Candidate':   'Search & Outreach',
  'Search & Outreach':  'Search & Outreach',
  'Psych Assessment':   'Psychological Ass.',
};

const routeMap = {
  'Dashboard':          '/dashboard',
  'Candidate Pipeline': '/candidate-pipeline',
  'User Management':    '/settings/user-management',
  'Role Management':    '/settings/role-management',
  'Recruiters':         '/settings/recruiters',
  'Account':            '/settings/account',
  'Integrations':       '/settings/integrations',
  'Job Management':     '/sourcing/job-management',
  'Source Management':  '/sourcing/source-management',
  'Talent Pool':        '/sourcing/talent-pool',
  'Source Candidate':   '/sourcing/source-candidate',
  'Search & Outreach':  '/sourcing/source-candidate',
  'AI Screening':       '/selection/ai-screening',
  'AI Screen':          '/selection/ai-screening',
  'Interview':          '/selection/interview',
  'Background Check':   '/selection/background-check',
  'Report':             '/selection/report',
  'Reports':            '/selection/report',
  'Offer & Contract':   '/offer-onboard/offer-contract',
  'Onboarding':         '/offer-onboard/onboarding',
};

const SOON_ITEMS = new Set([
  'Manager Inbox',
  'Campaigns',
  'Psych Assessment',
  'Medical Assessment',
  'Medical (MCU)',
  'Reports',
]);

const HIDDEN_ITEMS = new Set([
  'Assessment A',
  'Assessment B',
  'Assessment C',
  'Assessment D',
  'Insights Discovery Assessment',
  'Thomas Kilmann Assessment',
  'AI Matching',
  'Report',
  'Reports',
]);

const SELECTION_MENU_ORDER = [
  'AI Screening',
  'Background Check',
  'Interview',
  'Medical Assessment',
  'Medical (MCU)',
  'Psych Assessment',
];

const SECTION_ORDER = [
  'Sourcing',
  'Selection',
  'Offer & Onboard',
  'Insights',
  'Settings',
];

const SECTION_LABEL_MAP = {
  'Sourcing':  'Sourcing',
  'Selection': 'Selection',
  'Asesmen':   'Selection',
  'Offer':     'Offer & Onboard',
  'Onboard':   'Offer & Onboard',
  'Insights':  'Insights',
  'Settings':  'Settings',
};

// Static fallback nav — shown when permissions haven't loaded from the API yet.
// Matches the mockup structure exactly.
const STATIC_NAV = [
  {
    sectionLabel: 'Sourcing',
    menus: ['Job Management', 'Candidate Pipeline', 'Talent Pool', 'Search & Outreach', 'Source Management'],
  },
  {
    sectionLabel: 'Selection',
    menus: ['AI Screening', 'Interview', 'Psych Assessment', 'Medical Assessment', 'Background Check'],
  },
  {
    sectionLabel: 'Offer & Onboard',
    menus: ['Offer & Contract', 'Onboarding'],
  },
  {
    sectionLabel: 'Settings',
    menus: ['User Management', 'Role Management', 'Recruiters', 'Integrations'],
  },
];

// ─────────────────────────────────────────────
// Hook — build sidebar structure from permissions
// ─────────────────────────────────────────────
const useSidebarStructure = (permissions) => {
  return useMemo(() => {
    if (!permissions || permissions.length === 0) return [];

    const byModule = {};
    permissions.forEach((perm) => {
      if (perm.menus && Array.isArray(perm.menus)) {
        const moduleName = perm.module;
        if (!moduleName) return;
        if (!byModule[moduleName]) byModule[moduleName] = { moduleName, menus: [] };
        perm.menus.forEach(({ menu: menuName }) => {
          if (menuName && !byModule[moduleName].menus.includes(menuName)) {
            byModule[moduleName].menus.push(menuName);
          }
        });
      } else if (perm.module && perm.menu) {
        const { module: moduleName, menu: menuName } = perm;
        if (!byModule[moduleName]) byModule[moduleName] = { moduleName, menus: [] };
        if (!byModule[moduleName].menus.includes(menuName)) {
          byModule[moduleName].menus.push(menuName);
        }
      }
    });

    const bySection = {};
    Object.values(byModule).forEach(({ moduleName, menus }) => {
      if (moduleName === 'Main') return;
      const sectionLabel = SECTION_LABEL_MAP[moduleName] ?? moduleName;
      if (!bySection[sectionLabel]) bySection[sectionLabel] = { sectionLabel, menus: [] };
      menus.forEach((menuName) => {
        if (HIDDEN_ITEMS.has(menuName)) return;
        if (!bySection[sectionLabel].menus.includes(menuName)) {
          bySection[sectionLabel].menus.push(menuName);
        }
      });
    });

    return Object.values(bySection).sort((a, b) => {
      if (a.sectionLabel === 'Selection') {
        a.menus.sort((ma, mb) => {
          const ia = SELECTION_MENU_ORDER.indexOf(ma);
          const ib = SELECTION_MENU_ORDER.indexOf(mb);
          return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
        });
      }
      const ai = SECTION_ORDER.indexOf(a.sectionLabel);
      const bi = SECTION_ORDER.indexOf(b.sectionLabel);
      return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
    });
  }, [permissions]);
};

// ─────────────────────────────────────────────
// Helper — find which section contains the current route
// ─────────────────────────────────────────────

const getActiveSectionForPath = (pathname, sidebarItems) => {
  for (const { sectionLabel, menus } of sidebarItems) {
    for (const menuName of menus) {
      const route = routeMap[menuName];
      if (route && (pathname === route || pathname.startsWith(route + '/'))) {
        return sectionLabel;
      }
    }
  }
  return null;
};

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────

const SoonPill = () => (
  <span className="ml-auto text-[9px] font-bold tracking-widest uppercase text-muted-foreground/60 border border-muted-foreground/30 rounded px-1.5 py-0.5 leading-none">
    SOON
  </span>
);

const NewPill = () => (
  <span className="text-[9px] font-bold tracking-wide uppercase text-white bg-primary px-1.5 py-0.5 rounded leading-none">
    NEW
  </span>
);

const SectionHeader = ({ label, icon: Icon, isOpen, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="flex items-center justify-between w-full px-2 py-2 rounded-md hover:bg-sidebar-accent/60 transition-colors group"
  >
    <div className="flex items-center gap-2.5">
      {Icon && (
        <Icon
          className={`h-4 w-4 flex-shrink-0 transition-colors ${
            isOpen ? 'text-primary' : 'text-foreground/50'
          }`}
        />
      )}
      <span
        className={`text-sm font-semibold tracking-wide transition-colors ${
          isOpen ? 'text-foreground' : 'text-foreground/75'
        }`}
      >
        {label}
      </span>
    </div>
    <ChevronDown
      className={`h-3.5 w-3.5 flex-shrink-0 transition-transform duration-200 ${
        isOpen ? 'rotate-0 text-foreground/40' : '-rotate-90 text-foreground/30'
      }`}
    />
  </button>
);

const SectionNavItem = ({ menuName, active, soon, onClick }) => {
  const Icon        = iconMap[menuName] ?? Package;
  const displayName = DISPLAY_NAME_MAP[menuName] ?? menuName;

  return (
    <button
      type="button"
      onClick={soon ? undefined : onClick}
      disabled={soon}
      className={`
        relative flex items-center gap-2.5 w-full
        px-2 py-[7px] rounded-md text-[13px]
        transition-colors duration-150
        ${active
            ? 'bg-primary/15 text-primary font-semibold'
            : soon
              ? 'text-foreground/35 cursor-default'
              : 'text-foreground/80 font-medium hover:bg-sidebar-accent/80 hover:text-foreground'
          }
      `}
    >
      {active && (
        <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-primary" />
      )}
      <Icon
        className={`h-[16px] w-[16px] flex-shrink-0 ${
          active
            ? 'text-primary'
            : soon
              ? 'text-foreground/30'
              : 'text-foreground/50'
        }`}
      />
      <span className="flex-1 text-left truncate">{displayName}</span>
      {soon && <SoonPill />}
    </button>
  );
};

/** Flat nav row — Dashboard, Manager Inbox, Reports, Settings */
const FlatNavItem = ({ label, icon: Icon, active, soon, newBadge, onClick }) => (
  <button
    type="button"
    onClick={soon ? undefined : onClick}
    disabled={soon}
    className={`
      relative flex items-center gap-2.5 w-full
      px-2 py-[7px] rounded-md text-[13px]
      transition-colors duration-150
      ${active
        ? 'bg-primary/15 text-primary font-semibold'
        : soon
          ? 'text-foreground/35 cursor-default'
          : 'text-foreground/80 font-medium hover:bg-sidebar-accent/80 hover:text-foreground'
      }
    `}
  >
    {active && (
      <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-primary" />
    )}
    <Icon
      className={`h-[16px] w-[16px] flex-shrink-0 ${
        active
          ? 'text-primary'
          : soon
            ? 'text-foreground/30'
            : 'text-foreground/50'
      }`}
    />
    <span className="flex-1 text-left truncate">{label}</span>
    {newBadge && <NewPill />}
    {soon && <SoonPill />}
  </button>
);

// ─────────────────────────────────────────────
// AppSidebar
// ─────────────────────────────────────────────

export function AppSidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser]               = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [company, setCompany]         = useState(null);
  const [openSections, setOpenSections] = useState({});

  useEffect(() => {
    try {
      const userStr        = localStorage.getItem('user');
      const permissionsStr = localStorage.getItem('permissions');
      if (userStr && userStr !== 'undefined' && userStr !== 'null') {
        setUser(JSON.parse(userStr));
      }
      if (permissionsStr && permissionsStr !== 'undefined' && permissionsStr !== 'null') {
        const parsed = JSON.parse(permissionsStr);
        if (Array.isArray(parsed)) setPermissions(parsed);
      }
    } catch (err) {
      console.error('Failed to load auth data from localStorage:', err);
    }
  }, []);

  useEffect(() => {
    const cid = user?.company_id;
    if (!cid) { setCompany(null); return; }
    let cancelled = false;
    getCompanyById(cid)
      .then(res => { if (!cancelled) setCompany(res.data?.company || null); })
      .catch(() => { if (!cancelled) setCompany(null); });
    return () => { cancelled = true; };
  }, [user?.company_id]);

  const sidebarItems = useSidebarStructure(permissions);

  // Use static nav as fallback when permissions haven't loaded yet
  const navItems = sidebarItems.length > 0 ? sidebarItems : STATIC_NAV;

  // Auto-expand section containing the current route
  useEffect(() => {
    if (navItems.length === 0) return;
    const activeSection = getActiveSectionForPath(location.pathname, navItems);
    if (activeSection) {
      setOpenSections(prev => ({ ...prev, [activeSection]: true }));
    }
  }, [location.pathname, navItems]);

  const toggleSection = useCallback((label) => {
    setOpenSections(prev => ({ ...prev, [label]: !prev[label] }));
  }, []);

  const handleNavigate = useCallback((menuName) => {
    if (SOON_ITEMS.has(menuName) || !menuName) return;
    const route = routeMap[menuName] ?? `/${menuName.toLowerCase().replace(/\s+/g, '-')}`;
    navigate(route);
  }, [navigate]);

  const handleLogout = () => {
    ['token', 'user', 'role', 'permissions', 'userData'].forEach(k =>
      localStorage.removeItem(k)
    );
    navigate('/login');
  };

  const isRouteActive = (menuName) => {
    const route = routeMap[menuName];
    if (!route) return false;
    return location.pathname === route || location.pathname.startsWith(route + '/');
  };

  const isDashboardActive = location.pathname === '/dashboard';
  const canSeeDashboard   = hasPermission('Main', 'Dashboard', 'read');

  return (
    <Sidebar>

      {/* ── Header: logo mark + company ── */}
      <SidebarHeader className="p-0">
        <TenantCard company={company} tier="ENT" />
      </SidebarHeader>

      {/* ── Content ── */}
      <SidebarContent className="px-2 py-3 gap-0 overflow-y-auto">

        {/* Top flat items */}
        <div className="mb-2 space-y-0.5">
          {canSeeDashboard && (
            <FlatNavItem
              label="Dashboard"
              icon={Home}
              active={isDashboardActive}
              onClick={() => navigate('/dashboard')}
            />
          )}
          <FlatNavItem
            label="Manager Inbox"
            icon={Bell}
            newBadge
            soon
          />
        </div>

        {/* Divider */}
        <div className="mx-1 mb-2 border-t border-sidebar-border/50" />

        {/* Collapsible sections from permissions (falls back to STATIC_NAV) */}
        <div className="space-y-0.5">
          {navItems.map(({ sectionLabel, menus }) => {
            if (menus.length === 0) return null;
            const isOpen      = !!openSections[sectionLabel];
            const SectionIcon = sectionIconMap[sectionLabel];

            return (
              <SidebarGroup key={sectionLabel} className="p-0">
                <SectionHeader
                  label={sectionLabel}
                  icon={SectionIcon}
                  isOpen={isOpen}
                  onClick={() => {
                    if (sectionLabel === 'Settings') {
                      navigate('/settings');
                      setOpenSections(prev => ({ ...prev, Settings: true }));
                    } else {
                      toggleSection(sectionLabel);
                    }
                  }}
                />
                {isOpen && (
                  <SidebarGroupContent className="mt-0.5 mb-1">
                    {/* ml-4 lines the border up with the section icon's center */}
                    <div className="ml-4 pl-4 border-l border-sidebar-border">
                      <SidebarMenu className="space-y-0.5">
                        {menus.map((menuName) => (
                          <SidebarMenuItem key={menuName} className="p-0">
                            <SectionNavItem
                              menuName={menuName}
                              active={isRouteActive(menuName)}
                              soon={SOON_ITEMS.has(menuName)}
                              onClick={() => handleNavigate(menuName)}
                            />
                          </SidebarMenuItem>
                        ))}
                      </SidebarMenu>
                    </div>
                  </SidebarGroupContent>
                )}
              </SidebarGroup>
            );
          })}
        </div>

        {/* Bottom flat items: Reports */}
        <div className="mt-auto pt-3 mx-1 border-t border-sidebar-border/50 space-y-0.5">
          <FlatNavItem
            label="Reports"
            icon={BarChart3}
            active={location.pathname.startsWith('/selection/report')}
            soon
          />
        </div>

      </SidebarContent>

      {/* ── Footer: user card ── */}
      <SidebarFooter className="border-t border-sidebar-border/70 p-2">
        <UserFooter user={user} onLogout={handleLogout} />
      </SidebarFooter>

    </Sidebar>
  );
}