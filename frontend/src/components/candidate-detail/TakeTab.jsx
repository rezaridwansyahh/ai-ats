import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BATTERIES } from '@/lib/batteries';

// Tab 2: read-only per-subtest status. Action buttons + portal link omitted intentionally (per spec).
// Status is derived from results.by_subtest in the real impl — "scored" if scores exist, else "invited".
export default function TakeTab({ battery, subtestStatus }) {
  if (!battery) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-xs text-muted-foreground">
          No battery selected. Go back to <span className="font-bold">Setup</span> to pick a battery first.
        </CardContent>
      </Card>
    );
  }

  const def = BATTERIES[battery];
  const scoredCount = def.tests.filter((t) => subtestStatus?.[t.key] === 'scored').length;

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-sm font-bold">Take · candidate-facing portal</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Battery {def.code} · {def.label}
            </p>
          </div>
          <span className="text-[11px] text-primary font-semibold">
            {scoredCount} of {def.tests.length} tests scored
            {scoredCount === def.tests.length ? ' · auto-advances to Score & Decide' : ''}
          </span>
        </div>

        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider">Test</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider w-[140px]">Status</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider">Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {def.tests.map((t) => {
                const status = subtestStatus?.[t.key] || 'invited';
                return (
                  <TableRow key={t.key}>
                    <TableCell className="font-bold text-xs">{t.name}</TableCell>
                    <TableCell>
                      <StatusPill status={status} />
                    </TableCell>
                    <TableCell className="text-[11px] text-muted-foreground">{t.detail}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusPill({ status }) {
  const map = {
    scored:  { label: 'Scored',  cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    invited: { label: 'Invited', cls: 'bg-slate-50 text-slate-500 border-slate-200'       },
  };
  const v = map[status] || map.invited;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${v.cls}`}>
      {v.label}
    </span>
  );
}
