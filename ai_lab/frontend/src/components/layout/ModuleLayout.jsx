import { Link, Outlet, useLocation } from 'react-router-dom';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './app-sidebar';
import { findPage } from '@/config/routeMap.js';
import { fmtDate, REF_DATE } from '@/components/dashboard/dashboardMetrics.js';

const QUOTA = 1000;
const USED = 42; 
const nf = (n) => n.toLocaleString('id-ID');

export default function ModuleLayout() {
  const { pathname } = useLocation();
  const page = findPage(pathname);
  const left = QUOTA - USED;

  return (
    <SidebarProvider style={{ '--sidebar-width': '260px' }}>
      <AppSidebar />
      <SidebarInset className="min-w-0">
        <div className="sticky top-0 z-10">
          <div className="flex h-11 items-center gap-2.5 border-b border-border bg-card px-3.5">
            <SidebarTrigger className="h-[30px] w-8 rounded-lg border border-border bg-card hover:border-[#0D9276]" />
            <span className="text-[13.5px] text-muted-foreground">
              <span className="max-[760px]:hidden">{page.module} › </span>
              <b className="font-semibold text-foreground">{page.title}</b>
            </span>
            <span className="flex-1" />
            <span className="rounded-full border border-[#f1d3a3] bg-[#fff4e2] px-2.5 py-[3px] text-xs font-medium text-[#9a5a06]">
              Prototipe · data fiktif
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 border-b border-border bg-card px-3 py-2 md:px-[22px] md:py-2.5">
            <span className="font-semibold">PT Contoh Sejahtera</span>
            <span className="flex-1" />
            <span className="hidden text-xs text-muted-foreground md:inline">Tanggal acuan: {fmtDate(REF_DATE)}</span>
            <Link to="/kredit" title="Pemakaian kredit AI" className="flex items-center gap-2 text-[12.5px] text-muted-foreground">
              <span>Kredit AI {nf(left)} / {nf(QUOTA)}</span>
              <div className="h-[7px] w-[90px] overflow-hidden rounded-full bg-[#e4ebe8]">
                <i className="block h-full bg-[#0D9276]" style={{ width: `${(100 * left) / QUOTA}%` }} />
              </div>
            </Link>
          </div>
        </div>

        <main className="max-w-[1760px] px-3 pb-[50px] pt-3.5 md:px-[22px] md:pb-[60px] md:pt-5">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}