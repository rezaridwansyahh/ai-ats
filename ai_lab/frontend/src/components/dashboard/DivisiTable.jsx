import { Card, CardContent } from '@/components/ui/card';
import { fmt1 } from './demografiMetrics.js';

export default function DivisiTable({ rows, totals, year, onPick }) {
  const th = 'px-3 py-2 text-right font-medium';
  return (
    <Card className="gap-0 py-0 shadow-none">
      <CardContent className="overflow-auto p-4">
        <h3 className="mb-3 text-sm font-semibold">Tabel per divisi</h3>
        <table className="w-full min-w-[640px] text-sm">
          <thead className="border-b border-border text-xs text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Divisi</th>
              <th className={th}>Aktif</th>
              <th className={th}>L</th>
              <th className={th}>P</th>
              <th className={th}>PKWT+Magang</th>
              <th className={th}>Rata usia</th>
              <th className={th}>Rata masa kerja</th>
              <th className={th}>Keluar {year}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.divisi}
                className="cursor-pointer border-b border-border/60 hover:bg-muted/50"
                onClick={() => onPick({ title: `Divisi: ${r.divisi}`, list: r.list })}
              >
                <td className="px-3 py-2">{r.divisi}</td>
                <td className="px-3 py-2 text-right tabular-nums">{r.n}</td>
                <td className="px-3 py-2 text-right tabular-nums">{r.L}</td>
                <td className="px-3 py-2 text-right tabular-nums">{r.P}</td>
                <td className="px-3 py-2 text-right tabular-nums">{r.K}</td>
                <td className="px-3 py-2 text-right tabular-nums">{fmt1(r.usia)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{fmt1(r.masa)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{r.keluar}</td>
              </tr>
            ))}
            <tr className="font-semibold">
              <td className="px-3 py-2">Total</td>
              <td className="px-3 py-2 text-right tabular-nums">{totals.n}</td>
              <td className="px-3 py-2 text-right tabular-nums">{totals.L}</td>
              <td className="px-3 py-2 text-right tabular-nums">{totals.P}</td>
              <td className="px-3 py-2 text-right tabular-nums">{totals.K}</td>
              <td className="px-3 py-2 text-right tabular-nums">{fmt1(totals.usia)}</td>
              <td className="px-3 py-2 text-right tabular-nums">{fmt1(totals.masa)}</td>
              <td className="px-3 py-2 text-right tabular-nums">{totals.keluar}</td>
            </tr>
          </tbody>
        </table>
        <p className="mt-3 text-xs text-muted-foreground">
          Baris dengan data kosong tetap dihitung dan muncul sebagai "(kosong)".
        </p>
      </CardContent>
    </Card>
  );
}