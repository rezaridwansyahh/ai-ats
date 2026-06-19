import { useCallback, useMemo, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { Separator } from '@/components/ui/separator'
import { Toaster } from "@/components/ui/sonner"
import { BreadcrumbContext } from '@/components/layout/breadcrumb-context'
import PipelineBar from '@/components/layout/PipelineBar';
import GlobalSearch from '@/components/layout/GlobalSearch';
import { ChevronRight, Zap, Bell } from 'lucide-react';

const BREADCRUMB_MAP = {
  '/dashboard':                  ['Workspace', 'Dashboard'],
  '/candidate-pipeline':         ['Workspace', 'Candidate Pipeline'],
  '/sourcing/job-management':    ['Sourcing', 'Job Management'],
  '/sourcing/source-management': ['Sourcing', 'Source Management'],
  '/sourcing/talent-pool':       ['Sourcing', 'Talent Pool'],
  '/sourcing/source-candidate':  ['Sourcing', 'Search & Outreach'],
  '/selection/ai-screening':     ['Selection', 'AI Screening'],
  '/selection/background-check': ['Selection', 'Background Check'],
  '/selection/report':           ['Selection', 'Report'],
  '/settings':                   ['Insights', 'Settings'],
  '/settings/user-management':   ['Settings', 'User Management'],
  '/settings/role-management':   ['Settings', 'Role Management'],
  '/settings/integrations':      ['Settings', 'Integrations'],
  '/settings/account':           ['Settings', 'Account'],
  '/settings/recruiters':        ['Settings', 'Recruiters'],
}

function resolveBreadcrumbs(pathname) {
  if (BREADCRUMB_MAP[pathname]) return BREADCRUMB_MAP[pathname]
  if (/^\/candidate-pipeline\/\d+$/.test(pathname)) return ['Workspace', 'Candidate Pipeline', 'Detail']
  if (pathname.startsWith('/selection/ai-screening/job/')) return ['Selection', 'AI Screening', 'Position']
  if (pathname.startsWith('/selection/ai-screening/candidate/')) return ['Selection', 'AI Screening', 'Candidate']
  if (pathname === '/sourcing/job-management/new') return ['Sourcing', 'Job Management', 'New Job']
  if (/^\/sourcing\/job-management\/\d+\/edit$/.test(pathname)) return ['Sourcing', 'Job Management', 'Edit Job']
  if (/^\/sourcing\/job-management\/\d+$/.test(pathname)) return ['Sourcing', 'Job Management', 'Detail']
  return ['Workspace', 'Dashboard']
}

// Dummy credit data — TODO: replace with real API
const CREDITS_USED  = 60;
const CREDITS_TOTAL = 100;
const DAYS_LEFT     = 14;

export default function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const [dynCrumb, setDynCrumb] = useState(null);
  const setBreadcrumb = useCallback((path, label) => {
    setDynCrumb((prev) => {
      if (label) return { path, label }
      return prev && prev.path === path ? null : prev
    })
  }, [])
  const breadcrumbCtx = useMemo(() => ({ set: setBreadcrumb }), [setBreadcrumb])

  let breadcrumbs = resolveBreadcrumbs(location.pathname)
  if (dynCrumb && dynCrumb.path === location.pathname && breadcrumbs.length > 0) {
    breadcrumbs = [...breadcrumbs.slice(0, -1), dynCrumb.label]
  }

  const creditPct = Math.round((CREDITS_USED / CREDITS_TOTAL) * 100);

  return (
    <SidebarProvider>
      <AppSidebar />

      <SidebarInset>

        {/* ── Top header ── */}
        <header className="flex h-12 items-center gap-3 border-b border-border/70 px-4 sticky top-0 z-20 backdrop-blur-md bg-card/90">
          <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground transition-colors" />
          <Separator orientation="vertical" className="h-4 opacity-50" />

          {/* Breadcrumb */}
          <nav className="flex items-center gap-1 text-xs" aria-label="Breadcrumb">
            {breadcrumbs.map((crumb, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground/40 flex-shrink-0" />}
                <span className={
                  i === breadcrumbs.length - 1
                    ? 'font-semibold text-foreground tracking-tight'
                    : 'text-muted-foreground hover:text-foreground transition-colors cursor-pointer'
                }>
                  {crumb}
                </span>
              </span>
            ))}
          </nav>

          <div className="flex-1" />


          <div className="hidden md:block">
            <GlobalSearch />
          </div>

          {/* Credits */}
          <div className="hidden sm:flex items-center gap-2">
            <Zap className="h-3.5 w-3.5 text-primary flex-shrink-0" />
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-foreground">
                {CREDITS_USED}
              </span>
              <span className="text-xs text-muted-foreground">/</span>
              <span className="text-xs text-muted-foreground">{CREDITS_TOTAL}</span>
              {/* Progress bar */}
              <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${creditPct}%` }}
                />
              </div>
            </div>
          </div>

          <Separator orientation="vertical" className="h-4 opacity-50" />

          {/* Days left */}
          <span className={`text-xs font-bold ${DAYS_LEFT <= 7 ? 'text-red-500' : 'text-amber-500'}`}>
            {DAYS_LEFT}d left
          </span>

          {/* Notification bell */}
          <button className="relative h-8 w-8 flex items-center justify-center rounded-lg hover:bg-muted/60 transition-colors">
            <Bell className="h-4 w-4 text-muted-foreground" />
            {/* Unread dot */}
            <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-red-500" />
          </button>
        </header>

        {/* ── Pipeline bar — appears on every page ── */}
        <PipelineBar />

        {/* ── Main content ── */}
        <main className="p-5 min-h-[calc(100vh-6.5rem)]">
          <Toaster />
          <BreadcrumbContext.Provider value={breadcrumbCtx}>
            <Outlet />
          </BreadcrumbContext.Provider>
        </main>

      </SidebarInset>
    </SidebarProvider>
  )
}