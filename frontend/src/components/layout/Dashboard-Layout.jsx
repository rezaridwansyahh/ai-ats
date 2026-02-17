import { Outlet } from 'react-router-dom'
import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/layout/app-sidebar'

export default function DashboardLayout() {
  return (
    <SidebarProvider>
      {/* Sidebar stays here permanently */}
      <AppSidebar />

      {/* Only this part changes when you navigate */}
      <SidebarInset>
        <header className="flex h-12 items-center gap-2 border-b px-4">
          <SidebarTrigger />
        </header>

        <main className="p-4">
          <Outlet /> {/* ← This is where page content renders */}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}