import { Card, CardContent } from '@/components/ui/card';
import { WEIGHTS } from './CreditData.js';

export default function AktivitasTable({ rows }) {
  const th = 'px-3 py-2 font-medium';
  return (
    <Card className="gap-0 py-0 shadow-none">
      <CardContent className="overflow-auto p-4">
        <h3 className="mb-3 text-sm font-semibold">Per aktivitas</h3>
        <table className="w-full min-w-[420px] text-sm">
          <thead className="border-b border-border text-xs text-muted-foreground">
            <tr>
              <th className={`${th} text-left`}>Aktivitas</th>
              <th className={`${th} text-left`}>Bobot</th>
              <th className={`${th} text-right`}>Kali</th>
              <th className={`${th} text-right`}>Kredit</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.act} className="border-b border-border/60">
                <td className="px-3 py-2">
                  {r.lbl}
                  <div className="font-mono text-[11px] text-muted-foreground">{r.act}</div>
                </td>
                <td className="px-3 py-2 text-xs text-muted-foreground">{WEIGHTS[r.act] ?? '—'}</td>
                <td className="px-3 py-2 text-right tabular-nums">{r.n}</td>
                <td className="px-3 py-2 text-right tabular-nums">{r.c}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-3 text-xs text-muted-foreground">
          Rencana: kredit dipotong setelah panggilan AI berhasil. Impor template Myralix, dashboard, filter dan pengingat tidak memakai kredit.
        </p>
      </CardContent>
    </Card>
  );
}