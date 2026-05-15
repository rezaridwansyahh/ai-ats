import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarHeader,
  SidebarFooter,
} from '@/components/ui/sidebar';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

import {
  Home,
  Settings,
  Package,
  ChevronDown,
  User,
  LogOut,
  ChevronsUpDown,
  Briefcase,
  ClipboardList,
  Building2,
  Workflow,
  FileText,
} from 'lucide-react';

import { hasPermission } from '@/utils/permissions';
import { getCompanyById } from '@/api/company.api';

const iconMap = {
  'Dashboard': Home,
  'Sourcing':  Briefcase,
  'Selection': ClipboardList,
  'Asesmen':   FileText,
  'Settings':  Settings,
};

const routeMap = {
  'Dashboard':          '/dashboard',
  'Candidate Pipeline': '/candidate-pipeline',
  'User Management':   '/settings/user-management',
  'Role Management':   '/settings/role-management',
  'Recruiters':        '/settings/recruiters',
  'Account':           '/settings/account',
  'Integrations':      '/settings/integrations',
  'Job Management':    '/sourcing/job-management',
  'Source Management': '/sourcing/source-management',
  'Talent Pool':       '/sourcing/talent-pool',
  'Source Candidate':  '/sourcing/source-candidate',
  'AI Matching':       '/selection/ai-matching',
  'Report':            '/selection/report',
  'Assessment A':      '/asesmen/assessment-a',
  'Assessment B':      '/asesmen/assessment-b',
  'Assessment C':      '/asesmen/assessment-c',
  'Assessment D':      '/asesmen/assessment-d',
};

const useSidebarStructure = (permissions) => {
  return useMemo(() => {
    if (!permissions || permissions.length === 0) return [];

    const grouped = {};

    permissions.forEach((perm) => {
      if (perm.menus && Array.isArray(perm.menus)) {
        const moduleName = perm.module;
        if (!moduleName) return;

        if (!grouped[moduleName]) {
          grouped[moduleName] = { moduleName, menus: [] };
        }

        perm.menus.forEach(({ menu: menuName }) => {
          if (menuName && !grouped[moduleName].menus.includes(menuName)) {
            grouped[moduleName].menus.push(menuName);
          }
        });
      }
      else if (perm.module && perm.menu) {
        const { module: moduleName, menu: menuName } = perm;

        if (!grouped[moduleName]) {
          grouped[moduleName] = { moduleName, menus: [] };
        }
        if (!grouped[moduleName].menus.includes(menuName)) {
          grouped[moduleName].menus.push(menuName);
        }
      }
    });
    return Object.values(grouped);
  }, [permissions]);
};

export function AppSidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser]               = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [openModules, setOpenModules] = useState(new Set());
  const [company, setCompany]         = useState(null);

  // Load from localStorage on mount
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

  // Resolve the user's tenant once (after we know company_id).
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

  // Auto-open module that contains the current route
  useEffect(() => {
    sidebarItems.forEach(({ moduleName, menus }) => {
      menus.forEach((menuName) => {
        const route = routeMap[menuName];
        if (route && location.pathname === route) {
          setOpenModules((prev) => {
            const next = new Set(prev);
            next.add(moduleName);
            return next;
          });
        }
      });
    });
  }, [location.pathname, sidebarItems]);

  const toggleModule = (moduleName) => {
    setOpenModules((prev) => {
      const next = new Set(prev);
      next.has(moduleName) ? next.delete(moduleName) : next.add(moduleName);
      return next;
    });
  };

  const handleNavigate = (menuName) => {
    if (!menuName) return;
    const route = routeMap[menuName] ?? `/${menuName.toLowerCase().replace(/\s+/g, '-')}`;
    navigate(route);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    localStorage.removeItem('permissions');
    localStorage.removeItem('userData');
    navigate('/login');
  };

  const isRouteActive = (menuName) => {
    const route = routeMap[menuName];
    return route && location.pathname === route;
  };

  const userInitials = user?.email
    ? user.email.split('@')[0].slice(0, 2).toUpperCase()
    : 'U';

  const isDashboardActive       = location.pathname === '/dashboard';
  const isCandidatePipelineActive = location.pathname === '/candidate-pipeline';
  const canSeeDashboard         = hasPermission('Main', 'Dashboard', 'read');
  const canSeeCandidatePipeline = hasPermission('Main', 'Candidate Pipeline', 'read');
  const canSeeMain              = canSeeDashboard || canSeeCandidatePipeline;

  return (
    <Sidebar>
      {/* ── Header ── */}
      <SidebarHeader className="p-0">
        <div className="px-4 py-4 border-b border-sidebar-border/70">
          <img src={`${import.meta.env.BASE_URL}Myralix_Logo_Dark.png`} className="h-8 w-auto object-contain" alt="Myralix" />
        </div>

        {/* Tenant card */}
        {company && (
          <div className="px-3 pt-3 pb-2 border-b border-sidebar-border/70">
            <div className="flex items-start gap-2.5 rounded-lg border border-border/60 bg-card/50 px-3 py-2.5 shadow-sm">
              <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Building2 className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/70 leading-none mb-0.5">
                  Tenant
                </p>
                <p className="text-xs font-bold truncate" title={company.name}>
                  {company.name}
                </p>
                {company.email && (
                  <p className="text-[10px] text-muted-foreground truncate" title={company.email}>
                    {company.email}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </SidebarHeader>

      {/* ── Content ── */}
      <SidebarContent className="px-2 py-3 gap-0">

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
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Permission-driven module groups (Main rendered above as flat rows) */}
        {sidebarItems.filter(s => s.moduleName !== 'Main').map(({ moduleName, menus }) => {
          const ModuleIcon = iconMap[moduleName] ?? Package;
          const isOpen     = openModules.has(moduleName);
          const hasActiveChild = menus.some(m => isRouteActive(m));

          if (menus.length === 0) return null;

          return (
            <SidebarGroup key={moduleName} className="p-0 mb-1">
              <SidebarGroupLabel className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground/50 font-bold px-2 mb-1 h-5">
                {moduleName}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <Collapsible
                      open={isOpen}
                      onOpenChange={() => toggleModule(moduleName)}
                      className="group/collapsible"
                    >
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton className={`cursor-pointer transition-all duration-200 rounded-lg h-8 ${
                          hasActiveChild
                            ? 'text-primary font-semibold bg-primary/8'
                            : 'text-muted-foreground hover:bg-accent/80 hover:text-foreground'
                        }`}>
                          <div className="h-5 w-5 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <ModuleIcon className="h-3 w-3 text-primary" />
                          </div>
                          <span className="text-sm">{moduleName}</span>
                          <ChevronDown
                            className={`ml-auto h-3.5 w-3.5 transition-transform duration-200 ${
                              isOpen ? 'rotate-180' : ''
                            } ${hasActiveChild ? 'text-primary' : 'text-muted-foreground/50'}`}
                          />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>

                      <CollapsibleContent className="animate-slide-down overflow-hidden">
                        <SidebarMenuSub className="ml-5 pl-2 border-l border-border/60 mt-0.5">
                          {menus.map((menuName) => {
                            const active = isRouteActive(menuName);
                            return (
                              <SidebarMenuSubItem key={menuName}>
                                <SidebarMenuSubButton
                                  className={`cursor-pointer transition-all duration-200 rounded-md h-7 text-xs ${
                                    active
                                      ? 'bg-primary/10 text-primary font-semibold'
                                      : 'text-muted-foreground hover:bg-accent/80 hover:text-foreground'
                                  }`}
                                  onClick={() => handleNavigate(menuName)}
                                >
                                  {active && (
                                    <span className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                                  )}
                                  <span>{menuName}</span>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            );
                          })}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </Collapsible>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>

      {/* ── Footer ── */}
      <SidebarFooter className="border-t border-sidebar-border/70 p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="cursor-pointer hover:bg-accent/80 transition-all duration-200 rounded-lg h-auto py-2"
                >
                  <Avatar className="h-7 w-7 ring-2 ring-primary/25 flex-shrink-0">
                    <AvatarImage src="https://github.com/shadcn.png" alt="profile" />
                    <AvatarFallback className="bg-primary/10 text-primary text-[11px] font-bold">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left leading-tight min-w-0">
                    <span className="truncate font-semibold text-foreground text-xs">
                      {user?.email?.split('@')[0] ?? 'User'}
                    </span>
                    <span className="text-muted-foreground truncate text-[10px]">
                      {user?.email ?? ''}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-auto h-3.5 w-3.5 text-muted-foreground/50 flex-shrink-0" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                side="right"
                align="end"
                className="w-52 shadow-md"
              >
                <div className="px-2 py-1.5 border-b border-border mb-1">
                  <p className="text-xs font-semibold text-foreground truncate">
                    {user?.email?.split('@')[0] ?? 'User'}
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate">{user?.email ?? ''}</p>
                </div>
                <DropdownMenuItem
                  className="cursor-pointer text-sm h-8"
                  onClick={() => navigate('/profile')}
                >
                  <User className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer text-sm h-8"
                  onClick={() => navigate('/settings/general')}
                >
                  <Settings className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer text-sm h-8 text-red-600 focus:text-red-600 focus:bg-red-50"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-3.5 w-3.5" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
