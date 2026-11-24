import { Card, CardContent } from '@/components/ui/card';
import { dec } from '@/components/karyawan/karyawanUtils.js';
import { fmtDate } from '@/components/dashboard/dashboardMetrics.js';

const shortDate = (s) => `${Number(s.slice(8, 10))}/${Number(s.slice(5, 7))}`;

export default function TrenMingguanCard({ weekly }) {
  return (
    <Card className="gap-0 py-0 shadow-none">
      <CardContent className="p-4">
        <h3 className="mb-3 text-sm font-semibold">Tren mingguan % hadir</h3>
        <div className="flex h-[170px] items-end gap-3">
          {weekly.map((w) => (
            <div
              key={w.weekStart}
              title={`Minggu ${fmtDate(w.weekStart)}: ${dec(w.pctHadir)}% hari-orang hadir`}
              className="flex flex-1 flex-col items-center justify-end gap-1"
            >
              <em className="text-[11px] not-italic text-muted-foreground">{dec(w.pctHadir)}%</em>
              <i
                className="block w-full rounded-t bg-[#0D9276]"
                style={{ height: `${Math.max(4, Math.round(((w.pctHadir / 100 - 0.8) / 0.2) * 110))}px` }}
              />
              <span className="text-[11px] text-muted-foreground">{shortDate(w.weekStart)}</span>
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Sumbu dimulai dari 80% agar perbedaan terlihat; label angka adalah nilai sebenarnya.
        </p>
      </CardContent>
    </Card>
  );
}