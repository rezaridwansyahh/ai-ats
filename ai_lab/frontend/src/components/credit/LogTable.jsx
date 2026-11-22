import { Card, CardContent } from '@/components/ui/card';

export default function LogTable({ rows }) {
  const th = 'px-3 py-2 font-medium';
  return (
    <Card className="gap-0 py-0 shadow-none">
      <CardContent className="max-h-[440px] overflow-auto p-4">
        <h3 className="mb-3 text-sm font-semibold">Log</h3>
        <table className="w-full min-w-[420px] text-sm">
          <thead className="sticky top-0 border-b border-border bg-card text-xs text-muted-foreground">
            <tr>
              <th className={`${th} text-left`}>Waktu</th>
              <th className={`${th} text-left`}>Aktivitas</th>
              <th className={`${th} text-left`}>Oleh</th>
              <th className={`${th} text-right`}>Kredit</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((l, i) => (
              <tr key={`${l.t}-${i}`} className="border-b border-border/60">
                <td className="whitespace-nowrap px-3 py-2 font-mono text-xs">{l.t}</td>
                <td className="px-3 py-2">{l.lbl}</td>
                <td className="px-3 py-2">{l.who}</td>
                <td className="px-3 py-2 text-right tabular-nums">−{l.cr}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}