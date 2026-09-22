import { useEffect, useState } from 'react';
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
import { Home, Building2, ShieldCheck } from 'lucide-react';
import { UserFooter } from '@/components/common';

const NAV_ITEMS = [
  { label: 'Dashboard', icon: Home,        route: '/portal/admin/dashboard' },
  { label: 'Companies', icon: Building2,   route: '/portal/admin/companies' },
  { label: 'Roles',     icon: ShieldCheck, route: '/portal/admin/roles' },
];

export function AdminSidebar() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [user, setUser] = useState(null);

  useEffect(() => {
    try {
      const str = localStorage.getItem('user');
      if (str && str !== 'undefined' && str !== 'null') setUser(JSON.parse(str));
    } catch (err) {
      console.error('Failed to load user from localStorage:', err);
    }
  }, []);

  const handleLogout = () => {
    ['token', 'user', 'role', 'permissions', 'userData'].forEach(k =>
      localStorage.removeItem(k)
    );
    navigate('/login');
  };

  return (
    <Sidebar>
      <SidebarHeader className="px-3 py-4">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-md bg-primary flex items-center justify-center">
            <ShieldCheck className="h-4 w-4 text-white" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-bold">Myralix</p>
            <p className="text-[10px] text-muted-foreground -mt-0.5">Platform Admin</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-3">
        <SidebarGroup className="p-0">
          <SidebarGroupLabel className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground/50 font-bold px-2 mb-1 h-5">
            Platform
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map(({ label, icon: Icon, route }) => {
                const active = location.pathname === route || location.pathname.startsWith(route + '/');
                return (
                  <SidebarMenuItem key={route}>
                    <SidebarMenuButton
                      className={`cursor-pointer transition-all duration-200 rounded-lg h-8 ${
                        active
                          ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                          : 'text-muted-foreground hover:bg-accent/80 hover:text-foreground'
                      }`}
                      onClick={() => navigate(route)}
                    >
                      <div className={`h-5 w-5 rounded-md flex items-center justify-center flex-shrink-0 ${
                        active ? 'bg-white/20' : 'bg-primary/10'
                      }`}>
                        <Icon className={`h-3 w-3 ${active ? 'text-white' : 'text-primary'}`} />
                      </div>
                      <span className="text-sm">{label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border/70 p-2">
        <UserFooter user={user} onLogout={handleLogout} />
      </SidebarFooter>
    </Sidebar>
  );
}