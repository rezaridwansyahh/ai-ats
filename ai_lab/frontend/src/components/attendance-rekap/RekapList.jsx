import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { dec } from '@/components/karyawan/karyawanUtils.js';

const CRIT = new Set(['Ada alpa', 'Hari tidak tercatat']);
const SORTS = [['flag', 'Perlu perhatian'], ['pct', '% kehadiran'], ['late', 'Terlambat'], ['brad', 'Bradford'], ['nama', 'Nama']];
const inputCls = 'h-8 rounded-md border border-input bg-background px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring';

export function FlagTags({ flags, emptyLabel }) {
  if (!flags.length) {
    return emptyLabel
      ? <span className="inline-block rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-800">{emptyLabel}</span>
      : null;
  }
  return flags.map((f) => (
    <span
      key={f}
      className={`m-px inline-block rounded-full border px-2 py-0.5 text-[11px] font-medium ${
        CRIT.has(f) ? 'border-red-200 bg-red-50 text-red-700' : 'border-amber-200 bg-amber-50 text-amber-800'
      }`}
    >
      {f}
    </span>
  ));
}

export function RekapFilters({ from, to, onPeriod, sort, onSort, divisi, divisions, onDivisi, onExport, exporting }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-muted-foreground">Periode:</span>
      <input type="date" className={inputCls} value={from} onChange={(e) => onPeriod('from', e.target.value)} />
      <span className="text-xs text-muted-foreground">s.d.</span>
      <input type="date" className={inputCls} value={to} onChange={(e) => onPeriod('to', e.target.value)} />

      <span className="ml-2 text-xs text-muted-foreground">Urutkan:</span>
      {SORTS.map(([value, label]) => (
        <Button key={value} size="sm" variant={sort === value ? 'default' : 'outline'} className="h-7 text-xs" onClick={() => onSort(value)}>
          {label}
        </Button>
      ))}

      <select className={inputCls} value={divisi} onChange={(e) => onDivisi(e.target.value)}>
        <option value="">Semua divisi</option>
        {divisions.map((d) => <option key={d} value={d}>{d}</option>)}
      </select>

      <span className="flex-1" />
      <Button variant="outline" size="sm" className="h-7 text-xs" disabled={exporting} onClick={onExport}>
        {exporting ? 'Mengekspor…' : '⇩ Ekspor rekap'}
      </Button>
    </div>
  );
}

export function RekapTable({ rekap, onOpen }) {
  const num = 'px-3 py-2 text-right font-medium';
  const cell = 'px-3 py-2 text-right tabular-nums';
  return (
    <Card className="gap-0 py-0 shadow-none">
      <CardContent className="max-h-[72vh] overflow-auto p-0">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="sticky top-0 border-b border-border bg-card text-xs text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Karyawan</th>
              <th className={num}>Hari kerja</th>
              <th className={num}>Hadir</th>
              <th className={num}>Cuti</th>
              <th className={num}>Sakit</th>
              <th className={num}>Izin</th>
              <th className={num}>Alpa</th>
              <th className={num}>% hadir</th>
              <th className={num}>Terlambat</th>
              <th className={`${num} hidden md:table-cell`}>Lembur</th>
              <th className={`${num} hidden md:table-cell`}>Lupa</th>
              <th className={`${num} hidden md:table-cell`} title="Bradford Factor S²×D">BF</th>
              <th className="px-3 py-2 text-left font-medium">Tanda</th>
            </tr>
          </thead>
          <tbody>
            {rekap.map((r) => (
              <tr key={r.nik} className="cursor-pointer border-b border-border/60 hover:bg-muted/50" onClick={() => onOpen(r.nik)}>
                <td className="px-3 py-2">
                  <b>{r.nama}</b>
                  <div className="text-xs text-muted-foreground">{r.divisi}</div>
                </td>
                <td className={cell}>{r.hari_kerja}</td>
                <td className={cell}>{r.hadir}</td>
                <td className={cell}>{r.cuti}</td>
                <td className={cell}>{r.sakit}</td>
                <td className={cell}>{r.izin}</td>
                <td className={cell}>{r.alpa}</td>
                <td className={cell}>{dec(r.persen_hadir)}%</td>
                <td className={cell}>{r.terlambat_kali}×</td>
                <td className={`${cell} hidden md:table-cell`}>{dec(r.lembur_jam)}</td>
                <td className={`${cell} hidden md:table-cell`}>{r.lupa_absen}</td>
                <td className={`${cell} hidden md:table-cell`}>{r.bradford}</td>
                <td className="px-3 py-2"><FlagTags flags={r.tanda} /></td>
              </tr>
            ))}
            {!rekap.length && (
              <tr><td colSpan={13} className="px-4 py-4 text-sm text-muted-foreground">Tidak ada karyawan pada periode ini.</td></tr>
            )}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}