import { Card, CardContent } from '@/components/ui/card';
import { pct } from './demografiMetrics.js';

const MALE = '#0D9276';
const FEMALE = '#C2741A';

export default function GenderCard({ gender, perLevel, total, onPick }) {
  const L = gender.male.length;
  const P = gender.female.length;
  return (
    <Card className="gap-0 py-0 shadow-none">
      <CardContent className="p-4">
        <h3 className="mb-3 text-sm font-semibold">Jenis kelamin</h3>
        <div className="flex h-3.5 overflow-hidden rounded bg-muted" title={`Laki-laki ${L} · Perempuan ${P}`}>
          <span style={{ width: `${total ? (100 * L) / total : 0}%`, background: MALE }} />
          <span style={{ width: `${total ? (100 * P) / total : 0}%`, background: FEMALE }} />
        </div>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
          <button type="button" className="flex items-center gap-1.5 hover:underline" onClick={() => onPick({ title: 'Jenis kelamin: Laki-laki', list: gender.male })}>
            <i className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: MALE }} />Laki-laki {L} ({pct(L, total)})
          </button>
          <button type="button" className="flex items-center gap-1.5 hover:underline" onClick={() => onPick({ title: 'Jenis kelamin: Perempuan', list: gender.female })}>
            <i className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: FEMALE }} />Perempuan {P} ({pct(P, total)})
          </button>
        </div>

        <h3 className="mb-2 mt-5 text-sm font-semibold">Perempuan per level jabatan</h3>
        <div className="space-y-1">
          {perLevel.map((r) => (
            <button
              key={r.level}
              type="button"
              title={`${r.level}: ${r.n} orang · Laki-laki ${r.n - r.P} · Perempuan ${r.P}`}
              onClick={() => onPick({ title: `Level: ${r.level}`, list: r.list })}
              className="grid w-full grid-cols-[110px_minmax(0,1fr)_40px] items-center gap-2 rounded px-1 py-0.5 text-left text-xs hover:bg-muted/60"
            >
              <span className="truncate">{r.level}</span>
              <span className="flex h-3.5 overflow-hidden rounded bg-muted">
                <span style={{ flex: r.n - r.P, background: MALE }} />
                <span style={{ flex: r.P, background: FEMALE }} />
              </span>
              <span className="text-right tabular-nums">{pct(r.P, r.n, 0)}</span>
            </button>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">Angka kanan = % perempuan di level tersebut.</p>
      </CardContent>
    </Card>
  );
}