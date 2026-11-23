import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  BarChart3, Bell, CalendarDays, ChevronLeft, ChevronRight, ClipboardList, Clock,
  FileSpreadsheet, Home, Package, ScanLine, Settings, Smartphone,
  Sparkles, Upload, Users,
} from 'lucide-react';
import { getNavigation } from '@/api/module.api';
import { getRoute } from '@/config/routeMap.js';

const iconMap = {
  'Beranda':             Home,
  'Karyawan':            Users,
  'Dashboard':           BarChart3,
  'Pengingat':           Bell,
  'Impor Excel':         FileSpreadsheet,
  'Scan dokumen':        ScanLine,
  'Pengaturan':          Settings,
  'Kredit AI':           Sparkles,
  'Rekap karyawan':      ClipboardList,
  'Cuti & saldo':        CalendarDays,
  'Impor mesin absensi': Upload,
  'Absen klik (PWA)':    Smartphone,
};

const sectionIconMap = {
  'People Hub':              Users,
  'Attendance Intelligence': Clock,
};

const isRouteActive = (pathname, moduleName, menuName) => {
  const route = getRoute(moduleName, menuName);
  return pathname === route || pathname.startsWith(route + '/');
};

export function AppSidebar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { toggleSidebar, setOpenMobile } = useSidebar();

  const [modules, setModules]           = useState([]);
  const [error, setError]               = useState(null);
  const [openSections, setOpenSections] = useState({});

  useEffect(() => {
    getNavigation()
      .then((res) => setModules(res.data.modules ?? []))
      .catch((err) => setError(err?.response?.data?.message || err?.message || 'Gagal memuat menu'));
  }, []);

  // Auto-expand the module containing the current route
  useEffect(() => {
    const active = modules.find(({ name, menus }) =>
      menus.some((m) => isRouteActive(pathname, name, m.name))
    );
    if (active) setOpenSections((prev) => ({ ...prev, [active.name]: true }));
  }, [pathname, modules]);

  const toggleSection = (name) => setOpenSections((prev) => ({ ...prev, [name]: !prev[name] }));

  const go = (route) => {
    navigate(route);
    setOpenMobile(false);
  };

  return (
    <Sidebar>
      <SidebarHeader className="flex-row items-center gap-2.5 border-b border-sidebar-border py-3.5 pl-3.5 pr-3">
        <div className="grid h-10 w-10 flex-none place-items-center rounded-[10px] bg-primary text-base font-bold text-primary-foreground">
          C
        </div>
        <div className="min-w-0 flex-1">
          <b className="block truncate text-[14.5px] font-bold">PT Contoh Sejahtera</b>
          <small className="block truncate text-[11.5px] text-[#6B6B73]">Myralix · AI Lab</small>
        </div>
        <button
          type="button"
          onClick={toggleSidebar}
          title="Sembunyikan menu"
          aria-label="Sembunyikan menu"
          className="grid h-7 w-7 flex-none place-items-center rounded-lg border border-sidebar-border bg-white text-[#4A4A52] hover:border-primary hover:text-primary"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
      </SidebarHeader>

      <SidebarContent className="gap-0 overflow-auto px-2.5 pb-4 pt-2.5">
        <div className="mx-2 my-1.5 text-[11px] font-semibold tracking-[.08em] text-[#8A8A92]">MENU</div>
        {error && <p className="px-2 text-xs text-destructive">{error}</p>}

        {modules.map(({ id, name, menus }) => {
          const SectionIcon = sectionIconMap[name] ?? Package;
          const isOpen      = !!openSections[name];
          const hasActive   = menus.some((m) => isRouteActive(pathname, name, m.name));

          return (
            <div key={id}>
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => toggleSection(name)}
                className={`my-px flex w-full items-center gap-2.5 rounded-xl px-2.5 py-[9px] text-left text-[14.5px] font-semibold hover:bg-primary/[0.06] ${
                  isOpen ? 'bg-primary/[0.06]' : ''
                } ${hasActive && !isOpen ? 'text-primary' : 'text-[#1F2430]'}`}
              >
                <SectionIcon className="h-[18px] w-[18px] flex-none" />
                <span>{name}</span>
                <ChevronRight className={`ml-auto h-3.5 w-3.5 text-[#9A9AA2] transition-transform ${isOpen ? 'rotate-90' : ''}`} />
              </button>

              <div className={isOpen ? 'mb-1.5 ml-[19px] mt-0.5 border-l border-[#E2DCCD] pl-3' : 'hidden'}>
                {menus.map((menu) => {
                  const Icon   = iconMap[menu.name] ?? Package;
                  const active = isRouteActive(pathname, name, menu.name);
                  return (
                    <button
                      key={menu.id}
                      type="button"
                      onClick={() => go(getRoute(name, menu.name))}
                      className={`my-px flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-sm ${
                        active ? 'bg-primary font-semibold text-primary-foreground' : 'text-[#2D3340] hover:bg-primary/[0.06]'
                      }`}
                    >
                      <Icon className={`h-4 w-4 flex-none ${active ? 'text-primary-foreground' : 'text-[#6B6B73]'}`} />
                      <span className="truncate">{menu.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </SidebarContent>

      <SidebarFooter className="flex-row items-center gap-2.5 border-t border-sidebar-border px-3.5 py-3">
        <div className="grid h-8 w-8 place-items-center rounded-full bg-primary text-[13px] font-bold text-primary-foreground">R</div>
        <div>
          <b className="block text-[13.5px]">Rina</b>
          <small className="text-[11.5px] text-[#6B6B73]">Pengguna demo</small>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}