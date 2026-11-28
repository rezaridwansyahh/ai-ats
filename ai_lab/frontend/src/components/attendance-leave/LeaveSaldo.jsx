import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { fmtDate } from '@/components/dashboard/dashboardMetrics.js';

const inputCls = 'h-9 w-full rounded-md border border-input bg-background px-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring';

export function SaldoTable({ saldo, tanggal, onEdit }) {
  const th = 'px-3 py-2 font-medium';
  return (
    <Card className="gap-0 py-0 shadow-none">
      <CardContent className="max-h-[50vh] overflow-auto p-0">
        <h3 className="px-4 pb-1 pt-3 text-sm font-semibold">Saldo cuti tahunan per {fmtDate(tanggal)}</h3>
        <table className="w-full min-w-[560px] text-sm">
          <thead className="sticky top-0 border-b border-border bg-card text-xs text-muted-foreground">
            <tr>
              <th className={`${th} text-left`}>Karyawan</th>
              <th className={`${th} text-right`}>Hak</th>
              <th className={`${th} text-right`}>Terpakai</th>
              <th className={`${th} text-right`}>Disetujui</th>
              <th className={`${th} text-right`}>Sisa</th>
              <th className={th} />
            </tr>
          </thead>
          <tbody>
            {saldo.map((s) => (
              <tr key={s.nik} className="border-b border-border/60">
                <td className="px-3 py-2">
                  <Link to={`/attendance/rekap/${s.nik}`} className="hover:underline">{s.nama}</Link>
                  <div className="text-xs text-muted-foreground">{s.divisi}</div>
                </td>
                <td className="px-3 py-2 text-right tabular-nums">{s.berhak ? s.hak : '—'}</td>
                <td
                  className="px-3 py-2 text-right tabular-nums"
                  title={`Awal ${s.terpakai_awal} + tercatat di kehadiran ${s.terpakai_tercatat}`}
                >
                  {s.terpakai}
                </td>
                <td className="px-3 py-2 text-right tabular-nums">{s.disetujui_mendatang}</td>
                <td className="px-3 py-2 text-right tabular-nums"><b>{s.berhak ? s.sisa : '—'}</b></td>
                <td className="px-3 py-2">
                  <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => onEdit(s)}>Ubah</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="px-4 pb-3 pt-2 text-xs text-muted-foreground">
          Hak cuti diberikan setelah 12 bulan bekerja (aturan di Pengaturan). Terpakai = saldo awal tahun + cuti yang sudah tercatat
          di kehadiran; Disetujui = cuti disetujui yang belum terjadi.
        </p>
      </CardContent>
    </Card>
  );
}

export function BalanceEditor({ row, busy, onSave, onCancel }) {
  const [f, setF] = useState({ terpakai_awal: String(row.terpakai_awal), penyesuaian: String(row.penyesuaian), catatan: '' });
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));
  const valid = /^\d+$/.test(f.terpakai_awal) && /^-?\d+$/.test(f.penyesuaian);

  return (
    <Card className="gap-0 border-primary/30 py-0 shadow-none">
      <CardContent className="space-y-3 p-4">
        <h3 className="text-sm font-semibold">Ubah saldo · {row.nama}</h3>
        <div className="grid gap-3 md:grid-cols-3">
          <label className="space-y-1 text-xs text-muted-foreground">Terpakai sebelum sistem (saldo awal)
            <input className={inputCls} inputMode="numeric" value={f.terpakai_awal} onChange={set('terpakai_awal')} />
          </label>
          <label className="space-y-1 text-xs text-muted-foreground">Penyesuaian (+/− hari)
            <input className={inputCls} inputMode="numeric" value={f.penyesuaian} onChange={set('penyesuaian')} />
          </label>
          <label className="space-y-1 text-xs text-muted-foreground">Catatan (mengganti catatan sebelumnya)
            <input className={inputCls} maxLength={255} value={f.catatan} onChange={set('catatan')} />
          </label>
        </div>
        <div className="flex gap-2">
          <Button
            disabled={!valid || busy}
            onClick={() => onSave({ terpakai_awal: Number(f.terpakai_awal), penyesuaian: Number(f.penyesuaian), catatan: f.catatan })}
          >
            {busy ? 'Menyimpan…' : 'Simpan'}
          </Button>
          <Button variant="outline" onClick={onCancel}>Batal</Button>
        </div>
      </CardContent>
    </Card>
  );
}