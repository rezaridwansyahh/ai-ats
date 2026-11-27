import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { fmtDate } from '@/components/dashboard/dashboardMetrics.js';
import { dec, initials } from '@/components/karyawan/karyawanUtils.js';
import { FlagTags } from './RekapList';

const STATUS_BG = {
  'Hadir': '#eef8f4', 'Dinas Luar': '#e8f1fb', 'WFH': '#e8f1fb',
  'Cuti': '#f2eefe', 'Sakit': '#fff4e2', 'Izin': '#fff9d9', 'Alpa': '#fdecea',
};
const HATCH = 'repeating-linear-gradient(45deg,#fff,#fff 4px,#f1f1f1 4px,#f1f1f1 8px)';
const PRESENT = new Set(['Hadir', 'Dinas Luar', 'WFH']);
const LEGEND = [['Hadir', '#eef8f4'], ['DL/WFH', '#e8f1fb'], ['Cuti', '#f2eefe'], ['Sakit', '#fff4e2'], ['Izin', '#fff9d9'], ['Alpa', '#fdecea']];
const HARI = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum'];

const weekday = (tgl) => (new Date(`${tgl}T00:00:00Z`).getUTCDay() + 6) % 7; // 0 = Monday

function title(period) {
  const month = (s) => new Date(`${s}T00:00:00Z`).toLocaleDateString('id-ID', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  return period.from.slice(0, 7) === period.to.slice(0, 7)
    ? `Kalender ${month(period.from)}`
    : `Kalender ${fmtDate(period.from)} – ${fmtDate(period.to)}`;
}

export function ProfileCard({ employee, rekap, onTalk }) {
  return (
    <Card className="gap-0 py-0 shadow-none">
      <CardContent className="flex flex-wrap items-center gap-3.5 p-4">
        <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-[#cfe8e0] text-[22px] font-semibold text-primary">
          {initials(employee.nama)}
        </div>
        <div className="min-w-[200px] flex-1">
          <div className="font-display text-[22px] font-semibold leading-tight">{employee.nama}</div>
          <p className="text-xs text-muted-foreground">
            {[employee.jabatan, employee.divisi, employee.lokasi].filter(Boolean).join(' · ')} · atasan {employee.atasan ?? '—'}
          </p>
          <div className="mt-1"><FlagTags flags={rekap.tanda} emptyLabel="Tidak ada tanda" /></div>
        </div>
        <Button variant="outline" onClick={onTalk}>✦ Bahan obrolan 1-on-1</Button>
      </CardContent>
    </Card>
  );
}

export function CalendarCard({ period, kalender }) {
  return (
    <Card className="gap-0 py-0 shadow-none">
      <CardContent className="p-4">
        <h3 className="mb-3 text-sm font-semibold">{title(period)}</h3>
        <div className="grid grid-cols-5 gap-1">
          {HARI.map((h) => <div key={h} className="text-center text-[11px] text-muted-foreground">{h}</div>)}
          {kalender.map((d) => {
            const present = PRESENT.has(d.status);
            const hint = `${fmtDate(d.tgl)} · ${d.status ? `${d.status}${d.jam_masuk ? ` ${d.jam_masuk}` : ''}${d.jam_pulang ? `–${d.jam_pulang}` : ''}` : 'tidak tercatat'}${d.terlambat_menit ? ` · terlambat ${d.terlambat_menit} mnt` : ''}${d.lupa_absen ? ' · lupa absen' : ''}`;
            return (
              <div
                key={d.tgl}
                title={hint}
                className="min-h-[46px] rounded-md border border-border px-[5px] py-1 text-[11px]"
                style={{ gridColumnStart: weekday(d.tgl) + 1, background: d.status ? STATUS_BG[d.status] : HATCH }}
              >
                <b className="block text-[11.5px]">{Number(d.tgl.slice(8))}</b>
                {d.status ? (present ? `${d.jam_masuk || '—'}–${d.jam_pulang || '—'}` : d.status) : '—'}
                {d.terlambat_menit > 0 && <span className="text-[#9a5a06]"> ⏰</span>}
                {d.lupa_absen && <span className="text-[#a3261b]"> ?</span>}
              </div>
            );
          })}
        </div>
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {LEGEND.map(([label, color]) => (
            <span key={label} className="flex items-center gap-1">
              <i className="inline-block h-2.5 w-2.5 rounded-sm border border-[#ccc]" style={{ background: color }} />{label}
            </span>
          ))}
          <span>⏰ terlambat</span>
          <span>? lupa absen</span>
        </div>
      </CardContent>
    </Card>
  );
}

export function StatsCard({ rekap: r }) {
  const rows = [
    ['Hari kerja', r.hari_kerja],
    ['Hadir (incl. DL/WFH)', `${r.hadir} (${r.dinas_wfh} DL/WFH)`],
    ['Tidak tercatat', r.tidak_tercatat],
    ['% kehadiran', `${dec(r.persen_hadir)}%`],
    ['Terlambat', `${r.terlambat_kali} kali · ${r.terlambat_menit} menit`],
    ['Rata-rata jam kerja', r.jam_kerja_rata == null ? '—' : `${dec(r.jam_kerja_rata, 2)} jam`],
    ['Lembur', `${dec(r.lembur_jam)} jam`],
    ['Lupa absen', r.lupa_absen],
    ['Bradford Factor', `${r.bradford} (S=${r.bradford_s}, D=${r.bradford_d})`],
  ];
  return (
    <Card className="gap-0 py-0 shadow-none">
      <CardContent className="p-4">
        <h3 className="mb-3 text-sm font-semibold">Angka periode</h3>
        <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1.5 text-sm">
          {rows.map(([label, value]) => (
            <div key={label} className="contents">
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="text-right font-medium">{value}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 text-xs text-muted-foreground">
          Bradford Factor lazimnya dihitung untuk 12 bulan; nilai pada periode pendek hanya indikasi awal.
        </p>
      </CardContent>
    </Card>
  );
}

export function SaldoCard() {
  return (
    <Card className="gap-0 py-0 shadow-none">
      <CardContent className="p-4">
        <h3 className="mb-2 text-sm font-semibold">Saldo cuti tahunan</h3>
        <p className="text-sm text-muted-foreground">Segera hadir: saldo dihitung otomatis dari menu Cuti &amp; saldo.</p>
      </CardContent>
    </Card>
  );
}