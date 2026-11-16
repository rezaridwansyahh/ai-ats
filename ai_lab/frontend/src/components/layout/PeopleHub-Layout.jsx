import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { BarChart3, Bell, ChevronLeft, ChevronRight, Coins, LayoutGrid, List, Menu, ScanLine, Settings, Upload, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

const QUOTA = 1000;
const START_USED = 42; 

const MENU = [
  { label: 'Beranda',      to: '/',                     end: true, icon: LayoutGrid },
  { label: 'Karyawan',     to: '/karyawan?aktif=Aktif',           icon: List },
  { label: 'Dashboard',    to: '/dashboard',                      icon: BarChart3 },
  { label: 'Pengingat',    to: '/pengingat',                      icon: Bell },
  { label: 'Impor Excel',  to: '/impor',      hrOnly: true,       icon: Upload },
  { label: 'Scan dokumen', to: '/scan',       hrOnly: true,       icon: ScanLine },
  { label: 'Pengaturan',   to: '/pengaturan', hrOnly: true,       icon: Settings },
  { label: 'Kredit AI',    to: '/kredit',     hrOnly: true,       icon: Coins },
];

const nf = (n) => n.toLocaleString('id-ID');
const isMobile = () => window.innerWidth <= 760;

function titleFor(pathname) {
  if (pathname === '/') return 'Beranda';
  if (pathname.startsWith('/karyawan/')) return 'Profil 360';
  return MENU.find((m) => m.to.split('?')[0] === pathname)?.label ?? 'People Hub';
}

export default function PeopleHubLayout() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const stageRef = useRef(null);
  const [role, setRole] = useState('hr');
  const [hidden, setHidden] = useState(isMobile); 
  const [groupOpen, setGroupOpen] = useState(true);

  const isHr = role === 'hr';
  const left = QUOTA - START_USED;
  const toggle = () => setHidden((h) => !h);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === '[' && !/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) setHidden((h) => !h);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => { stageRef.current?.scrollTo(0, 0); }, [pathname]);

  const onNav = (item) => {
    if (item.hrOnly && !isHr) setRole('hr');
    if (isMobile()) setHidden(true);
  };
  const reset = () => {
    setRole('hr');
    toast('Data demo dikembalikan ke awal');
  };

  const hasActive = MENU.some((m) => m.to.split('?')[0] === pathname) || pathname.startsWith('/karyawan/');

  return (
    <div
      className="flex h-screen overflow-hidden bg-[#f5f7f6] text-[14px] text-[#1c2422]"
      style={{ fontFamily: "'IBM Plex Sans', system-ui, sans-serif" }}
    >
      <aside
        className={`flex w-[260px] flex-none flex-col overflow-hidden border-r border-[#E9E3D5] bg-[#FAF9F5] text-[#1A1A1F] transition-[margin] duration-200 max-[760px]:fixed max-[760px]:inset-y-0 max-[760px]:left-0 max-[760px]:z-20 max-[760px]:shadow-[4px_0_20px_rgba(0,0,0,.25)] ${
          hidden ? '-ml-[261px] max-[760px]:-ml-[270px]' : ''
        }`}
        style={{ fontFamily: "'DM Sans', 'IBM Plex Sans', system-ui, sans-serif" }}
      >
        <div className="flex items-center gap-2.5 border-b border-[#E9E3D5] py-3.5 pl-3.5 pr-3">
          <div className="grid h-10 w-10 flex-none place-items-center rounded-[10px] bg-[#0A6E5C] text-base font-bold text-white">C</div>
          <div className="min-w-0 flex-1">
            <b className="block truncate text-[14.5px] font-bold">PT Contoh Sejahtera</b>
            <small className="block truncate text-[11.5px] text-[#6B6B73]">Myralix · People Hub</small>
          </div>
          <button
            type="button"
            onClick={toggle}
            title="Sembunyikan menu ( [ )"
            aria-label="Sembunyikan menu"
            className="grid h-7 w-7 flex-none place-items-center rounded-lg border border-[#E9E3D5] bg-white text-[#4A4A52] hover:border-[#0A6E5C] hover:text-[#0A6E5C]"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="flex-1 overflow-auto px-2.5 pb-4 pt-2.5">
          <div className="mx-2 my-1.5 text-[11px] font-semibold tracking-[.08em] text-[#8A8A92]">MENU</div>

          <button
            type="button"
            aria-expanded={groupOpen}
            onClick={() => setGroupOpen((o) => !o)}
            className={`my-px flex w-full items-center gap-2.5 rounded-xl px-2.5 py-[9px] text-left text-[14.5px] font-semibold hover:bg-[#0A6E5C]/[0.06] ${
              groupOpen ? 'bg-[#0A6E5C]/[0.06]' : ''
            } ${hasActive && !groupOpen ? 'text-[#0A6E5C]' : 'text-[#1F2430]'}`}
          >
            <Users className="h-[18px] w-[18px] flex-none" />
            <span>People Hub</span>
            <ChevronRight className={`ml-auto h-3.5 w-3.5 text-[#9A9AA2] transition-transform ${groupOpen ? 'rotate-90' : ''}`} />
          </button>

          <div className={groupOpen ? 'mb-1.5 ml-[19px] mt-0.5 border-l border-[#E2DCCD] pl-3' : 'hidden'}>
            {MENU.map((m) => {
              const Icon = m.icon;
              return (
                <NavLink
                  key={m.to}
                  to={m.to}
                  end={m.end}
                  onClick={() => onNav(m)}
                  className={({ isActive }) =>
                    `my-px flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm no-underline ${
                      isActive ? 'bg-[#0A6E5C] font-semibold text-white' : 'text-[#2D3340] hover:bg-[#0A6E5C]/[0.06]'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon className={`h-4 w-4 flex-none ${isActive ? 'text-white' : 'text-[#6B6B73]'}`} />
                      <span>{m.label}</span>
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-2.5 border-t border-[#E9E3D5] px-3.5 py-3">
          <div className="grid h-8 w-8 place-items-center rounded-full bg-[#0A6E5C] text-[13px] font-bold text-white">R</div>
          <div>
            <b className="block text-[13.5px]">Rina</b>
            <small className="text-[11.5px] text-[#6B6B73]">HR Admin · demo</small>
          </div>
        </div>
      </aside>

      {!hidden && <div className="fixed inset-0 z-[15] hidden bg-black/35 max-[760px]:block" onClick={toggle} />}

      <main className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-11 flex-none items-center gap-2.5 border-b border-[#e1e7e4] bg-white px-3.5">
          <button
            type="button"
            onClick={toggle}
            title="Tampilkan / sembunyikan menu ( [ )"
            aria-label="Menu"
            className="grid h-[30px] w-8 place-items-center rounded-lg border border-[#e1e7e4] bg-white hover:border-[#0D9276]"
          >
            <Menu className="h-4 w-4" />
          </button>
          <span className="text-[13.5px] text-[#5f6d69]">
            <span className="max-[760px]:hidden">People Hub › </span>
            <b className="font-semibold text-[#1c2422]">{titleFor(pathname)}</b>
          </span>
          <span className="flex-1" />
          <span className="rounded-full border border-[#f1d3a3] bg-[#fff4e2] px-2.5 py-[3px] text-xs font-medium text-[#9a5a06]">
            Prototipe · data fiktif
          </span>
        </div>
        <div ref={stageRef} className="min-h-0 flex-1 overflow-auto">
          <div className="sticky top-0 z-10 flex flex-wrap items-center gap-3 border-b border-[#e1e7e4] bg-white px-3 py-2 md:px-[22px] md:py-2.5">
            <span className="font-semibold">PT Contoh Sejahtera</span>
            <span className="flex-1" />
            <span className="hidden text-xs text-[#5f6d69] md:inline">Tanggal acuan: 30 Nov 2026</span>

            <div className="inline-flex overflow-hidden rounded-lg border border-[#e1e7e4]">
              {[['hr', 'HR Admin'], ['mgr', 'Manajer Produksi']].map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setRole(key)}
                  className={`px-[11px] py-[5px] text-sm ${
                    role === key ? 'bg-primary text-primary-foreground' : 'bg-white text-[#5f6d69]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div
              className="flex cursor-pointer items-center gap-2 text-[12.5px] text-[#5f6d69]"
              title="Pemakaian kredit AI"
              onClick={() => navigate('/kredit')}
            >
              <span>Kredit AI {nf(left)} / {nf(QUOTA)}</span>
              <div className="h-[7px] w-[90px] overflow-hidden rounded-full bg-[#e4ebe8]">
                <i className="block h-full bg-[#0D9276]" style={{ width: `${Math.max(0, (100 * left) / QUOTA)}%` }} />
              </div>
            </div>

            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={reset} title="Kembalikan data demo ke awal">
              ↺ Reset demo
            </Button>
          </div>

          <div className="max-w-[1760px] px-3 pb-[50px] pt-3.5 md:px-[22px] md:pb-[60px] md:pt-5">
            <Outlet context={{ role }} />
          </div>
        </div>
      </main>
    </div>
  );
}