import { Card, CardContent } from '@/components/ui/card';
import { dec } from '@/components/karyawan/karyawanUtils.js';

export default function DivisiTable({ divisions }) {
  const maxLembur = Math.max(1, ...divisions.map((d) => d.lembur));
  const th = 'px-3 py-2 font-medium';
  return (
    <Card className="gap-0 py-0 shadow-none">
      <CardContent className="overflow-auto p-4">
        <h3 className="mb-3 text-sm font-semibold">Per divisi</h3>
        <table className="w-full min-w-[720px] text-sm">
          <thead className="border-b border-border text-xs text-muted-foreground">
            <tr>
              <th className={`${th} text-left`}>Divisi</th>
              <th className={`${th} text-right`}>Karyawan</th>
              <th className={`${th} text-right`}>% Kehadiran</th>
              <th className={`${th} text-right`}>Kali terlambat</th>
              <th className={`${th} text-right`}>Rata menit terlambat</th>
              <th className={`${th} text-left`}>Lembur (jam)</th>
              <th className={`${th} text-right`}>Sakit+Izin+Alpa</th>
            </tr>
          </thead>
          <tbody>
            {divisions.map((d) => (
              <tr key={d.divisi} className="border-b border-border/60">
                <td className="px-3 py-2">{d.divisi}</td>
                <td className="px-3 py-2 text-right tabular-nums">{d.employees}</td>
                <td className="px-3 py-2 text-right tabular-nums">{dec(d.pctHadir)}%</td>
                <td className="px-3 py-2 text-right tabular-nums">{d.lateN}</td>
                <td className="px-3 py-2 text-right tabular-nums">{dec(d.avgLateMinutes)}</td>
                <td className="px-3 py-2">
                  <span
                    className="mr-1.5 inline-block h-[9px] rounded-r-[3px] bg-[#0D9276] align-middle"
                    style={{ width: `${(80 * d.lembur) / maxLembur}px` }}
                  />
                  {dec(d.lembur)}
                </td>
                <td className="px-3 py-2 text-right tabular-nums">{d.sia}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-3 text-xs text-muted-foreground">Rumus sama dengan template Dashboard Kehadiran v1.</p>
      </CardContent>
    </Card>
  );
}