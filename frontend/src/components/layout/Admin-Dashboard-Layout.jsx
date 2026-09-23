import { Outlet, useLocation } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar';
import { AdminSidebar } from '@/components/layout/admin-sidebar';
import { Separator } from '@/components/ui/separator';
import { Toaster } from '@/components/ui/sonner';
import { ChevronRight } from 'lucide-react';

const BREADCRUMB_MAP = {
  '/portal/admin/dashboard': ['Platform', 'Dashboard'],
  '/portal/admin/companies': ['Platform', 'Companies'],
  '/portal/admin/roles':     ['Platform', 'Roles'],
};

export default function AdminDashboardLayout() {
  const location = useLocation();
  const breadcrumbs = BREADCRUMB_MAP[location.pathname] || ['Platform', 'Dashboard'];

  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset>
        <header className="flex h-12 items-center gap-3 border-b border-border/70 px-4 sticky top-0 z-20 backdrop-blur-md bg-card/90">
          <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground transition-colors" />
          <Separator orientation="vertical" className="h-4 opacity-50" />
          <nav className="flex items-center gap-1 text-xs" aria-label="Breadcrumb">
            {breadcrumbs.map((crumb, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground/40 flex-shrink-0" />}
                <span className={
                  i === breadcrumbs.length - 1
                    ? 'font-semibold text-foreground tracking-tight'
                    : 'text-muted-foreground'
                }>
                  {crumb}
                </span>
              </span>
            ))}
          </nav>
        </header>

        <main className="p-5 min-h-[calc(100vh-3rem)]">
          <Toaster />
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}