import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

const QUOTA = 1000;
const START_USED = 42; // credits already spent in the demo data

// hrOnly items are hidden when the role switch is on "Manajer Produksi"
const MENU = [
  { label: 'Beranda',      to: '/',           end: true },
  { label: 'Karyawan',     to: '/karyawan' },
  { label: 'Dashboard',    to: '/dashboard' },
  { label: 'Pengingat',    to: '/pengingat',  badge: 4 },
  { label: 'Impor Excel',  to: '/impor',      hrOnly: true },
  { label: 'Scan Dokumen', to: '/scan',       hrOnly: true },
  { label: 'Pengaturan',   to: '/pengaturan', hrOnly: true },
  { label: 'Kredit AI',    to: '/kredit',     hrOnly: true },
];

const nf = (n) => n.toLocaleString('id-ID');

function NavItem({ item, mobile }) {
  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        [
          'flex items-center justify-between rounded-[7px] text-sm text-[#d7ebe5] no-underline transition-colors',
          mobile ? 'whitespace-nowrap px-2.5 py-1.5 text-[12.5px]' : 'my-px px-2.5 py-[7px]',
          isActive ? 'bg-[#0D9276] text-white' : 'hover:bg-white/10',
        ].join(' ')
      }
    >
      <span>{item.label}</span>
      {item.badge && (
        <span className="ml-1.5 rounded-full bg-[#e8a33b] px-[7px] text-[11px] font-semibold text-[#2a1a00]">
          {item.badge}
        </span>
      )}
    </NavLink>
  );
}

export default function PeopleHubLayout() {
  const navigate = useNavigate();
  const [role, setRole] = useState('hr');
  const [used, setUsed] = useState(START_USED);

  const isHr = role === 'hr';
  const left = QUOTA - used;
  const items = MENU.filter((m) => isHr || !m.hrOnly);

  // Pages read these through useOutletContext() — no separate context folder.
  const spend = (code, credits) => {
    setUsed((u) => u + credits);
    toast(`Saran AI dibuat · −${credits} kredit (${code})`);
  };
  const reset = () => {
    setRole('hr');
    setUsed(START_USED);
    toast('Data demo dikembalikan ke awal');
  };

  return (
    <div
      className="grid min-h-screen bg-[#f5f7f6] text-[14px] leading-normal text-[#1c2422] md:grid-cols-[232px_1fr]"
      style={{ fontFamily: "'IBM Plex Sans', system-ui, sans-serif" }}
    >
      {/* Sidebar (desktop) */}
      <aside className="sticky top-0 hidden h-screen overflow-auto bg-[#0b3d34] px-3 py-4 text-[#d7ebe5] md:block">
        <div className="px-2 font-display text-[21px] font-bold leading-tight text-white">
          Myralix
          <small className="block font-sans text-[11.5px] font-normal text-[#9cc8bc]">PT Contoh Sejahtera</small>
        </div>
        <div className="mt-[18px]">
          <h4 className="mx-2 mb-1.5 text-[11px] font-semibold uppercase tracking-[.08em] text-[#86b6aa]">
            People Hub
          </h4>
          <nav>{items.map((m) => <NavItem key={m.to} item={m} />)}</nav>
        </div>
        <div className="mt-[22px] px-2 text-[11.5px] text-[#86b6aa]">
          Prototipe modul 1 · v1.1 · 11 Nov 2026
          <br />Prototipe terpisah dari Ask HR &amp; Attendance.
          <br />Semua data fiktif. Saran AI disimulasikan; angka dihitung dari data.
        </div>
      </aside>

      <main className="min-w-0">
        {/* Nav (mobile) */}
        <div className="sticky top-0 z-20 flex gap-1 overflow-x-auto bg-[#0b3d34] px-2.5 py-1.5 md:hidden">
          {items.map((m) => <NavItem key={m.to} item={m} mobile />)}
        </div>

        {/* Top bar */}
        <div className="sticky top-0 z-10 flex flex-wrap items-center gap-3 border-b border-[#e1e7e4] bg-white px-3 py-2 md:px-[22px] md:py-2.5">
          <span className="font-semibold">PT Contoh Sejahtera</span>
          <span className="rounded-full border border-[#f1d3a3] bg-[#fff4e2] px-2.5 py-[3px] text-xs font-medium text-[#9a5a06]">
            Prototipe · data fiktif
          </span>
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
            onClick={() => (isHr ? navigate('/kredit') : toast('Menu ini hanya untuk HR Admin'))}
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

        <div className="max-w-[1240px] px-3 pb-[50px] pt-3.5 md:px-[22px] md:pb-[60px] md:pt-5">
          <Outlet context={{ role, spend }} />
        </div>
      </main>
    </div>
  );
}