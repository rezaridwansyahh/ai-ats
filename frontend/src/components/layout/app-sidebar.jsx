import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarImage } from "@/components/ui/avatar";
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
} from 'lucide-react';

const iconMap = {
  'Dashboard':  Home,
  'Positions':  Briefcase,
  'Applicants': Users,
  'Reports':    BarChart,
  'Settings':   Settings,
  'Users':      Users,
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

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="w-4/5 mx-auto pt-4">
          <img
            src="../../../public/abhimata.png"
            className="w-full object-contain"
            alt="Logo"
          />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
             <SidebarMenuItem>
                <SidebarMenuButton
                  className="cursor-pointer"
                  onClick={() => navigate('/dashboard')}
                >
                  <Home className="h-4 w-4" />
                  <span>Dashboard</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {sidebarItems.map(({ moduleName, menus }) => {
                const ModuleIcon = iconMap[moduleName] ?? Package;
                const isOpen     = openModules.has(moduleName);
                if (menus.length === 0) {
                  return (
                    <SidebarMenuItem key={moduleName}>
                      <SidebarMenuButton
                        className="cursor-pointer"
                        onClick={() => handleNavigate(menus[0])}
                      >
                        <ModuleIcon className="h-4 w-4" />
                        <span>{moduleName}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                }

                return (
                  <SidebarMenuItem key={moduleName}>
                    <Collapsible
                      open={isOpen}
                      onOpenChange={() => toggleModule(moduleName)}
                      className="group/collapsible"
                    >
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton className="cursor-pointer">
                          <ModuleIcon className="h-4 w-4" />
                          <span>{moduleName}</span>
                          <ChevronDown
                            className="ml-auto h-4 w-4 transition-transform duration-200
                                       group-data-[state=open]/collapsible:rotate-180"
                          />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>

                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {menus.map((menuName) => (
                            <SidebarMenuSubItem key={menuName}>
                              <SidebarMenuSubButton
                                className="cursor-pointer"
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
                );
              })}

            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg" className="cursor-pointer">
                  <div className="flex items-center gap-2 px-1 py-1.5">
                    <Avatar>
                      <AvatarImage
                        src="https://github.com/shadcn.png"
                        alt="profile"
                        className="grayscale"
                      />
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm">
                      <span className="truncate font-medium">
                        {user?.email?.split('@')[0] ?? 'User'}
                      </span>
                      <span className="text-muted-foreground truncate text-xs">
                        {user?.email ?? ''}
                      </span>
                    </div>
                  </div>
                  <ChevronsUpDown className="ml-auto h-4 w-4" />
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