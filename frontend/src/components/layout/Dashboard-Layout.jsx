import { Outlet, useLocation } from 'react-router-dom'
import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { Separator } from '@/components/ui/separator'
import { ChevronRight, Home } from 'lucide-react'
import { Toaster } from "@/components/ui/sonner"

const BREADCRUMB_MAP = {
  '/dashboard': ['Dashboard'],
  '/sourcing/job-management':    ['Sourcing', 'Job Management'],
  '/sourcing/source-management': ['Sourcing', 'Source Management'],
  '/sourcing/talent-pool':       ['Sourcing', 'Talent Pool'],
  '/sourcing/source-candidate':  ['Sourcing', 'Source Candidate'],
  '/selection/ai-matching':      ['Selection', 'AI Matching'],
  '/selection/assessment-a':     ['Selection', 'Assessment A'],
  '/selection/assessment-b':     ['Selection', 'Assessment B'],
  '/selection/assessment-c':     ['Selection', 'Assessment C'],
  '/selection/assessment-d':     ['Selection', 'Assessment D'],
  '/selection/report':           ['Selection', 'Report'],
  '/settings/user-management':   ['Settings', 'User Management'],
  '/settings/role-management':   ['Settings', 'Role Management'],
  '/settings/integrations':      ['Settings', 'Integrations'],
  '/settings/account':           ['Settings', 'Account'],
  '/settings/recruiters':        ['Settings', 'Recruiters'],
}

export default function DashboardLayout() {
  const location = useLocation()
  const breadcrumbs = BREADCRUMB_MAP[location.pathname] || ['Dashboard']

  return (
    
    <SidebarProvider>
      <AppSidebar />

      <SidebarInset>
        {/* Header — glassmorphism sticky bar */}
        <header className="flex h-13 items-center gap-2 border-b border-border/70 px-5 sticky top-0 z-20 backdrop-blur-md bg-card/85 shadow-[0_1px_0_0_rgba(226,232,240,0.8)]">
          <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground transition-colors" />
          <Separator orientation="vertical" className="h-4 mx-1.5 opacity-50" />

          {/* Breadcrumb */}
          <nav className="flex items-center gap-1 text-sm" aria-label="Breadcrumb">
            <Home className="h-3.5 w-3.5 text-muted-foreground/50 flex-shrink-0" />
            {breadcrumbs.map((crumb, i) => (
              <span key={i} className="flex items-center gap-1">
                <ChevronRight className="h-3 w-3 text-muted-foreground/40 flex-shrink-0" />
                <span
                  className={
                    i === breadcrumbs.length - 1
                      ? 'font-semibold text-foreground text-xs tracking-tight'
                      : 'text-muted-foreground text-xs hover:text-foreground transition-colors cursor-pointer'
                  }
                >
                  {crumb}
                </span>
              </span>
            ))}
          </nav>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Right side — subtle env badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/8 border border-primary/15">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] font-semibold text-primary tracking-wide uppercase">Live</span>
          </div>
        </header>

        {/* Main content */}
        <main className="p-5 min-h-[calc(100vh-3.25rem)]">
          <Toaster />
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
