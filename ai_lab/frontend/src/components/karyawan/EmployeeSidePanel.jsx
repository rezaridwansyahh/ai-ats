import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { fmtDate } from '@/components/dashboard/dashboardMetrics.js';
import { WarnTag } from './EmployeeTags';
import { dec, initials } from './karyawanUtils.js';

export default function EmployeeSidePanel({ employee: e, boss, isHr, onOpen }) {
  const rows = [
    ['Divisi', e.divisi || '—'],
    ['Atasan', boss ? boss.nama : '—'],
    ['Status', `${e.status ?? '—'} · ${e.aktif ?? '—'}`],
    ['Masuk', e.tgl_masuk ? `${fmtDate(e.tgl_masuk)} (${dec(e.masa)} thn)` : '—'],
  ];

  return (
    <Card className="gap-0 py-0 shadow-none">
      <CardContent className="p-4">
        <div className="flex items-center gap-2.5">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#cfe8e0] font-semibold text-primary">
            {initials(e.nama)}
          </div>
          <div className="min-w-0">
            <p className="font-semibold">{e.nama}</p>
            <p className="text-xs text-muted-foreground">{e.jabatan} · {e.nik}</p>
          </div>
        </div>

        <dl className="mt-3 grid grid-cols-[110px_1fr] gap-x-3 gap-y-1.5 text-[13px]">
          {rows.map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="text-muted-foreground">{k}</dt>
              <dd className="min-w-0 break-words">{v}</dd>
            </div>
          ))}
          {e.akhir_kontrak && (
            <>
              <dt className="text-muted-foreground">Akhir kontrak</dt>
              <dd className="flex flex-wrap items-center gap-1.5">{fmtDate(e.akhir_kontrak)} <WarnTag warn={e.warn} /></dd>
            </>
          )}
          <dt className="text-muted-foreground">Usia</dt>
          <dd>{e.usia ?? '—'} · {e.generasi}</dd>
        </dl>

        {isHr && e.cek.length > 0 && (
          <div className="mt-2.5 rounded-[10px] border border-[#f1d3a3] bg-warning/15 px-3 py-2.5 text-[13px]">
            ✎ {e.cek.join(' · ')}
          </div>
        )}

        <Button className="mt-3 w-full" onClick={onOpen}>Buka profil 360 →</Button>
      </CardContent>
    </Card>
  );
}