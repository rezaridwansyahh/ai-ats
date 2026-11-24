import { Card, CardContent } from '@/components/ui/card';

export default function PolaHariCard({ byWeekday }) {
  const max = Math.max(1, ...byWeekday.flatMap((x) => [x.late, x.unplanned]));
  return (
    <Card className="gap-0 py-0 shadow-none">
      <CardContent className="p-4">
        <h3 className="mb-2 text-sm font-semibold">Pola per hari</h3>
        <div className="mb-2 flex gap-4 text-xs">
          <span className="flex items-center gap-1.5"><i className="inline-block h-2.5 w-2.5 rounded-sm bg-[#0D9276]" />Terlambat</span>
          <span className="flex items-center gap-1.5"><i className="inline-block h-2.5 w-2.5 rounded-sm bg-[#C2741A]" />Tidak terencana</span>
        </div>
        {byWeekday.map((x) => (
          <div
            key={x.weekday}
            title={`${x.weekday}: terlambat ${x.late} · tidak terencana ${x.unplanned}`}
            className="my-1 grid grid-cols-[60px_minmax(0,1fr)] items-center gap-1.5"
          >
            <span className="text-[12.5px]">{x.weekday}</span>
            <span>
              <span className="mb-0.5 block h-[9px]"><i className="block h-full rounded-[3px] bg-[#0D9276]" style={{ width: `${(100 * x.late) / max}%` }} /></span>
              <span className="block h-[9px]"><i className="block h-full rounded-[3px] bg-[#C2741A]" style={{ width: `${(100 * x.unplanned) / max}%` }} /></span>
            </span>
          </div>
        ))}
        <p className="mt-2 text-xs text-muted-foreground">Jumlah kejadian per hari dalam seminggu.</p>
      </CardContent>
    </Card>
  );
}