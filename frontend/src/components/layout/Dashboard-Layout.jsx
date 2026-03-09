import { Outlet, useLocation } from 'react-router-dom'
import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { Separator } from '@/components/ui/separator'
import { ChevronRight } from 'lucide-react'

const BREADCRUMB_MAP = {
  '/dashboard': ['Dashboard'],
  '/users/management': ['Users', 'User Management'],
  '/users/role-management': ['Users', 'Role Management'],
  '/settings/integrations': ['Settings', 'Integrations'],
  '/job-postings/seek': ['Job Postings', 'Seek'],
  '/job-postings/account': ['Job Postings', 'Account'],
  '/job-management/seek-sourcing': ['Job Management', 'Seek Sourcing'],
  '/candidates/search': ['Candidates', 'Search'],
}

export default function DashboardLayout() {
  const location = useLocation()
  const breadcrumbs = BREADCRUMB_MAP[location.pathname] || ['Dashboard']

  return (
    <SidebarProvider>
      <AppSidebar />

      <SidebarInset>
        <header className="flex h-12 items-center gap-2 border-b border-border px-5 bg-card sticky top-0 z-10">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="h-4 mx-1" />
          <nav className="flex items-center gap-1 text-sm">
            {breadcrumbs.map((crumb, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground/60" />}
                <span className={i === breadcrumbs.length - 1 ? 'font-medium text-foreground' : 'text-muted-foreground'}>
                  {crumb}
                </span>
              </span>
            ))}
          </nav>
        </header>

        <main className="p-5 animate-slide-up">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
