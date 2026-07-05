import { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarFooter,
} from '@/components/ui/sidebar';
import {
  Home, Settings, Package, Briefcase, ClipboardList,
  FileText, Search, Stethoscope, FileSignature, UserCheck,
  BarChart3, Brain, ShieldCheck, Megaphone, Users, Bell,
  ChevronDown, Sparkles, Mail, GitBranch, Activity, Workflow,
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
  'Psych Assessment':   BarChart3,
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
  'Report Candidate':  '/report-candidate',
  'User Management':   '/settings/user-management',
  'Role Management':   '/settings/role-management',
  'Recruiters':        '/settings/recruiters',
  'Account':           '/settings/account',
  'Budget':            '/settings/budget',
  'Integrations':      '/settings/integrations',
  'Job Management':    '/sourcing/job-management',
  'Source Management': '/sourcing/source-management',
  'Talent Pool':       '/sourcing/talent-pool',
  'Source Candidate':  '/sourcing/source-candidate',
  'Search & Outreach': '/sourcing/source-candidate',
  'AI Screening':      '/selection/ai-screening',
  'AI Matching':       '/selection/ai-screening',
  'Psych Assessment':  '/selection/assessment',
  'Assessment A':      '/asesmen/assessment-a',
  'Assessment B':      '/asesmen/assessment-b',
  'Assessment C':      '/asesmen/assessment-c',
  'Assessment D':      '/asesmen/assessment-d',
  'Insights Discovery Assessment': '/asesmen/insights-discovery-assessment',
  'Thomas Kilmann Assessment':     '/asesmen/thomas-kilmann-assessment',
  'Interview': '/selection/interview',
  'Background Check': '/selection/background-check',
  'Offer & Contract': '/selection/offer-contract',
  'Onboarding':        '/selection/onboarding',
};

// Maps a raw "module" name (as it appears in permissions data) to the
// human-facing section label shown in the sidebar. Extend as new modules
// are added on the backend.
const SECTION_LABEL_MAP = {
  'Sourcing':        'Sourcing',
  'Selection':       'Selection',
  'Offer & Onboard': 'Offer & Onboard',
  'Onboarding':      'Offer & Onboard',
  'Insights':        'Insights',
  'Settings':        'Settings',
};

// Menu names that should never be shown in the sidebar, even if the user
// has permission for them.
const HIDDEN_ITEMS = new Set([
  'Assessment A',
  'Assessment B',
  'Assessment C',
  'Assessment D',
  'Insights Discovery Assessment',
  'Thomas Kilmann Assessment',
]);

// Menu names that are visible but not yet clickable ("SOON" pill).
const SOON_ITEMS = new Set([
  'Medical Assessmen',
  'Psych Assessmen', // displays as "Psychological Ass." via DISPLAY_NAME_MAP
]);

// Explicit ordering for items inside the "Selection" section.
// Explicit ordering for items inside the "Selection" section.
const SELECTION_MENU_ORDER = [
  'AI Screening',
  'Interview',
  'Psych Assessment',
  'Medical Assessment',
  'Background Check',
];

// Explicit ordering for top-level sections.
const SECTION_ORDER = ['Sourcing', 'Selection', 'Offer & Onboard', 'Insights', 'Settings'];

// Fallback nav shown before permissions have loaded from localStorage.
const STATIC_NAV = [];

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

  const isRouteActive = useCallback((menuName) => {
    const route = routeMap[menuName];
    if (!route) return false;
    return location.pathname === route || location.pathname.startsWith(route + '/');
  }, [location.pathname]);

  const userInitials = user?.email
    ? user.email.split('@')[0].slice(0, 2).toUpperCase()
    : 'U';

  const isDashboardActive         = location.pathname === '/dashboard';
  const isCandidatePipelineActive = location.pathname === '/candidate-pipeline';
  const isReportCandidateActive   = location.pathname === '/report-candidate';
  const canSeeDashboard           = hasPermission('Main', 'Dashboard', 'read');
  const canSeeCandidatePipeline   = hasPermission('Main', 'Candidate Pipeline', 'read');
  const canSeeReportCandidate     = hasPermission('Main', 'Report Candidate', 'read');
  const canSeeMain                = canSeeDashboard || canSeeCandidatePipeline || canSeeReportCandidate;

  return (
    <Sidebar>

      {/* ── Header: logo mark + company ── */}
      <SidebarHeader className="p-0">
        <TenantCard company={company} tier="ENT" />
      </SidebarHeader>

      {/* ── Content ── */}
      <SidebarContent className="px-2 py-3 gap-0 overflow-y-auto">

        {/* Main group — Dashboard + Candidate Pipeline as flat top-level rows */}
        {canSeeMain && (
          <SidebarGroup className="p-0 mb-1">
            <SidebarGroupLabel className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground/50 font-bold px-2 mb-1 h-5">
              Main
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {canSeeDashboard && (
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      className={`cursor-pointer transition-all duration-200 rounded-lg h-8 ${
                        isDashboardActive
                          ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                          : 'text-muted-foreground hover:bg-accent/80 hover:text-foreground'
                      }`}
                      onClick={() => navigate('/dashboard')}
                    >
                      <div className={`h-5 w-5 rounded-md flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                        isDashboardActive ? 'bg-white/20' : 'bg-primary/10'
                      }`}>
                        <Home className={`h-3 w-3 ${isDashboardActive ? 'text-white' : 'text-primary'}`} />
                      </div>
                      <span className="text-sm">Dashboard</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
                {canSeeCandidatePipeline && (
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      className={`cursor-pointer transition-all duration-200 rounded-lg h-8 ${
                        isCandidatePipelineActive
                          ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                          : 'text-muted-foreground hover:bg-accent/80 hover:text-foreground'
                      }`}
                      onClick={() => navigate('/candidate-pipeline')}
                    >
                      <div className={`h-5 w-5 rounded-md flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                        isCandidatePipelineActive ? 'bg-white/20' : 'bg-primary/10'
                      }`}>
                        <Workflow className={`h-3 w-3 ${isCandidatePipelineActive ? 'text-white' : 'text-primary'}`} />
                      </div>
                      <span className="text-sm">Candidate Pipeline</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
                {canSeeReportCandidate && (
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      className={`cursor-pointer transition-all duration-200 rounded-lg h-8 ${
                        isReportCandidateActive
                          ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                          : 'text-muted-foreground hover:bg-accent/80 hover:text-foreground'
                      }`}
                      onClick={() => navigate('/report-candidate')}
                    >
                      <div className={`h-5 w-5 rounded-md flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                        isReportCandidateActive ? 'bg-white/20' : 'bg-primary/10'
                      }`}>
                        <Workflow className={`h-3 w-3 ${isReportCandidateActive ? 'text-white' : 'text-primary'}`} />
                      </div>
                      <span className="text-sm">Report Candidate</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Permission-driven section groups (Main rendered above as flat rows) */}
        <div>
        {sidebarItems
          .filter(({ sectionLabel }) => sectionLabel !== 'Settings')
          .map(({ sectionLabel, menus }) => {
            const SectionIcon    = sectionIconMap[sectionLabel] ?? Package;
            const isOpen         = !!openSections[sectionLabel];
            const hasActiveChild = menus.some((m) => isRouteActive(m));

            if (menus.length === 0) return null;

            return (
              <SidebarGroup key={sectionLabel} className="p-0">
                <SectionHeader
                  label={sectionLabel}
                  icon={SectionIcon}
                  isOpen={isOpen || hasActiveChild}
                  onClick={() => toggleSection(sectionLabel)}
                />
                {(isOpen || hasActiveChild) && (
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

      {/* Bottom flat items: Reports, Settings */}
      <div className="mt-auto pt-3 mx-1 border-t border-sidebar-border/50 space-y-0.5">
        {/* Ini nanti dulu - candra */}
        {/* <FlatNavItem
          label="Reports"
          icon={BarChart3}
          active={location.pathname.startsWith('/selection/report')}
          soon
        /> */}
        <FlatNavItem
          label="Settings"
          icon={Settings}
          active={location.pathname.startsWith('/settings')}
          onClick={() => navigate('/settings')}
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