import { Card, CardContent } from '@/components/ui/card';
import { PKG, fmtNum } from './CreditData.js';

export default function KuotaBar({ used, remaining }) {
  const usedPct = Math.min(100, (100 * used) / PKG.quota);
  const low = remaining <= PKG.quota * 0.2;
  const empty = remaining <= 0;
  const color = empty ? 'bg-destructive' : low ? 'bg-amber-500' : 'bg-primary';

  return (
    <Card className="gap-0 py-0 shadow-none">
      <CardContent className="p-4">
        <div className="mb-2 flex items-center justify-between text-xs">
          <span className="font-semibold">Pemakaian kuota</span>
          <span className="text-muted-foreground">
            {fmtNum(used)} / {fmtNum(PKG.quota)} kredit
          </span>
        </div>
        <div className="relative h-3 overflow-hidden rounded bg-muted">
          <div className={`h-full rounded ${color}`} style={{ width: `${usedPct}%` }} />
          <span className="absolute inset-y-0 left-[80%] w-px bg-foreground/30" title="Batas peringatan 20% tersisa" />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {empty
            ? 'Kuota habis. Fitur AI berhenti sampai periode berikutnya atau kuota ditambah.'
            : low
              ? 'Sisa kuota di bawah 20%. Pertimbangkan menambah kuota.'
              : 'Peringatan muncul saat sisa 20% dan saat kuota habis (garis di 80%).'}
        </p>
      </CardContent>
    </Card>
  );
}