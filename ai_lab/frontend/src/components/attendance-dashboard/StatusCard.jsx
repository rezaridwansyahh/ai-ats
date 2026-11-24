import { Card, CardContent } from '@/components/ui/card';

export default function StatusCard({ status }) {
  const rows = status.filter((s) => s.count > 0);
  const max = Math.max(1, ...rows.map((s) => s.count));
  return (
    <Card className="gap-0 py-0 shadow-none">
      <CardContent className="p-4">
        <h3 className="mb-3 text-sm font-semibold">Status kehadiran (hari-orang)</h3>
        <div className="space-y-1.5">
          {rows.map((s) => (
            <div
              key={s.status}
              title={`${s.status}: ${s.count} hari-orang`}
              className="grid grid-cols-[90px_minmax(0,1fr)_40px] items-center gap-2 text-xs"
            >
              <span className="truncate">{s.status}</span>
              <span className="h-3 rounded bg-muted">
                <span className="block h-full rounded bg-primary" style={{ width: `${(100 * s.count) / max}%` }} />
              </span>
              <span className="text-right tabular-nums">{s.count}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}