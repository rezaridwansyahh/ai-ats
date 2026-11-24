import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { initials } from '@/components/karyawan/karyawanUtils.js';

const SHOWN = 7;

export default function AttentionCard({ attention, onOpen, onAll }) {
  const rest = attention.length - SHOWN;
  return (
    <Card className="gap-0 py-0 shadow-none">
      <CardContent className="p-4">
        <h3 className="mb-2 text-sm font-semibold">Perlu perhatian</h3>
        {attention.slice(0, SHOWN).map((r) => (
          <div key={r.nik} className="flex items-center gap-3 border-b border-border/60 py-2 last:border-0">
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#cfe8e0] text-xs font-semibold text-primary">
              {initials(r.nama)}
            </div>
            <div className="min-w-0 flex-1">
              <b className="block truncate text-sm">{r.nama}</b>
              <span className="block truncate text-xs text-muted-foreground">{r.divisi} · {r.flags.join(' · ')}</span>
            </div>
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => onOpen(r.nik)}>Lihat</Button>
          </div>
        ))}
        {rest > 0 && (
          <div className="flex items-center gap-3 py-2">
            <b className="flex-1 text-sm">{rest} lainnya</b>
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={onAll}>Rekap</Button>
          </div>
        )}
        {!attention.length && <p className="text-sm text-muted-foreground">Tidak ada karyawan yang perlu perhatian.</p>}
      </CardContent>
    </Card>
  );
}