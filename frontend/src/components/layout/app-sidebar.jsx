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
  Users,
  BarChart,
  Package,
  ChevronDown,
  User,
  LogOut,
  ChevronsUpDown,
  Briefcase,
  Search,
} from 'lucide-react';

const iconMap = {
  'Dashboard':  Home,
  'Positions':  Briefcase,
  'Applicants': Users,
  'Reports':    BarChart,
  'Settings':   Settings,
  'Users':      Users,
  'Job Postings': Package,
  'Job Management': Search,
};

const routeMap = {
  'dashboard':        '/dashboard',
  'Add Positions':    '/positions/add',
  'Positions List':   '/positions',
  'Applicant List':   '/applicants',
  'Crawl Applicants': '/applicants/crawl',
  'Analytics':        '/reports/analytics',
  'Exports':          '/reports/exports',
  'General':          '/settings/general',
  'Company List':     '/settings/companies',
  'Help':             '/settings/help',
  'User Management':  '/users/management',
  'Role Management':  '/users/role-management',
  'Integrations':     '/settings/integrations',
  'Seek':             '/job-postings/seek',
  'LinkedIn':         '/job-postings/linkedin',
  'Account':            '/job-postings/account',
  'Seek Sourcing':     '/job-management/seek-sourcing',
  'LinkedIn Sourcing': '/job-management/linkedin-sourcing',
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

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const userStr        = localStorage.getItem('user');
      const permissionsStr = localStorage.getItem('permissions');

      if (userStr) setUser(JSON.parse(userStr));

      if (permissionsStr) {
        const parsed = JSON.parse(permissionsStr);
        setPermissions(parsed);
      }
    } catch (err) {
      console.error('Failed to load auth data from localStorage:', err);
    }
  }, []);

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

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="px-4 py-4 border-b border-sidebar-border">
          <img src="/Logo.png" className="h-9 w-auto object-contain" alt="Myralix" />
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Dashboard — Main group */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-semibold px-2 mb-1">Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  className={`cursor-pointer transition-all duration-150 ${
                    location.pathname === '/dashboard'
                      ? 'bg-primary/10 text-primary font-medium border-l-2 border-primary rounded-l-none'
                      : 'hover:bg-accent/60'
                  }`}
                  onClick={() => navigate('/dashboard')}
                >
                  <div className="h-6 w-6 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Home className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <span>Dashboard</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Permission-driven module groups */}
        {sidebarItems.map(({ moduleName, menus }) => {
          const ModuleIcon = iconMap[moduleName] ?? Package;
          const isOpen     = openModules.has(moduleName);
          const hasActiveChild = menus.some(m => isRouteActive(m));

          if (menus.length === 0) return null;

          return (
            <SidebarGroup key={moduleName}>
              <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-semibold px-2 mb-1">{moduleName}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <Collapsible
                      open={isOpen}
                      onOpenChange={() => toggleModule(moduleName)}
                      className="group/collapsible"
                    >
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton className={`cursor-pointer transition-all duration-150 ${
                          hasActiveChild ? 'text-primary font-medium' : 'hover:bg-accent/60'
                        }`}>
                          <div className="h-6 w-6 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <ModuleIcon className="h-3.5 w-3.5 text-primary" />
                          </div>
                          <span>{moduleName}</span>
                          <ChevronDown
                            className="ml-auto h-4 w-4 transition-transform duration-200
                                       group-data-[state=open]/collapsible:rotate-180"
                          />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>

                      <CollapsibleContent className="animate-slide-down">
                        <SidebarMenuSub>
                          {menus.map((menuName) => (
                            <SidebarMenuSubItem key={menuName}>
                              <SidebarMenuSubButton
                                className={`cursor-pointer transition-all duration-150 ${
                                  isRouteActive(menuName)
                                    ? 'bg-primary/10 text-primary font-medium'
                                    : 'hover:bg-accent/60'
                                }`}
                                onClick={() => handleNavigate(menuName)}
                              >
                                <span>{menuName}</span>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
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

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg" className="cursor-pointer hover:bg-accent/60 transition-all duration-150">
                  <div className="flex items-center gap-2.5 px-1 py-1.5">
                    <Avatar className="h-8 w-8 ring-2 ring-primary/20">
                      <AvatarImage
                        src="https://github.com/shadcn.png"
                        alt="profile"
                      />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold text-foreground">
                        {user?.email?.split('@')[0] ?? 'User'}
                      </span>
                      <span className="text-muted-foreground truncate text-xs">
                        {user?.email ?? ''}
                      </span>
                    </div>
                  </div>
                  <ChevronsUpDown className="ml-auto h-4 w-4 text-muted-foreground" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                side="right"
                className="w-[--radix-popper-anchor-width]"
              >
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => navigate('/profile')}
                >
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => navigate('/settings/general')}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer text-red-600 focus:text-red-600"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
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
