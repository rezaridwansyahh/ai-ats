import { Card, CardContent } from '@/components/ui/card';
import { pct } from './demografiMetrics.js';

export default function BarCard({ title, items, total, onPick }) {
  const max = Math.max(1, ...items.map((i) => i.n));
  return (
    <Card className="gap-0 py-0 shadow-none">
      <CardContent className="p-4">
        <h3 className="mb-3 text-sm font-semibold">{title}</h3>
        <div className="space-y-1">
          {items.map((i) => (
            <button
              key={i.label}
              type="button"
              title={`${i.label}: ${i.n} orang (${pct(i.n, total)})`}
              onClick={() => onPick?.({ title: `${title}: ${i.label}`, list: i.list })}
              className="grid w-full grid-cols-[110px_minmax(0,1fr)_32px] items-center gap-2 rounded px-1 py-0.5 text-left text-xs hover:bg-muted/60"
            >
              <span className="truncate">{i.label}</span>
              <span className="h-3 rounded bg-muted">
                <span className="block h-full rounded bg-primary" style={{ width: `${(100 * i.n) / max}%` }} />
              </span>
              <span className="text-right tabular-nums">{i.n}</span>
            </button>
          ))}
          {!items.length && <p className="text-xs text-muted-foreground">Belum ada data.</p>}
        </div>
      </CardContent>
    </Card>
  );
}