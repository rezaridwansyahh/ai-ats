import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { fmtDate } from '@/components/dashboard/dashboardMetrics.js';
import { Tag, WarnTag } from '@/components/karyawan/EmployeeTags';
import { rowKey } from '@/components/karyawan/karyawanUtils.js';

// type "k" = contract ending, type "p" = probation
export default function ReminderTable({ title, type, rows, bossOf, reviewed, onReview }) {
  const isK = type === 'k';
  const th = 'px-3 py-2 text-left font-medium';

  return (
    <Card className="gap-0 py-0 shadow-none">
      <CardContent className="overflow-auto p-0">
        <h3 className="px-4 pb-1 pt-3 text-sm font-semibold">{title} ({rows.length})</h3>
        <table className="w-full min-w-[640px] text-sm">
          <thead className="border-b border-border text-xs text-muted-foreground">
            <tr>
              <th className={th}>Karyawan</th>
              <th className={`${th} hidden md:table-cell`}>Atasan</th>
              <th className={th}>{isK ? 'Akhir kontrak' : 'Selesai'}</th>
              <th className={th}>{isK ? 'Peringatan' : 'Sisa'}</th>
              <th className={th}>Tindakan</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((e) => {
              const boss = bossOf(e);
              const done = reviewed.has(`${type}:${e.nik}`);
              return (
                <tr key={`${type}-${rowKey(e)}`} className="border-b border-border/60">
                  <td className="px-3 py-2">
                    <Link to={`/karyawan/${rowKey(e)}`} className="font-semibold hover:underline">{e.nama}</Link>
                    <div className="text-xs text-muted-foreground">{e.jabatan} · {e.divisi || '—'}</div>
                  </td>
                  <td className="hidden px-3 py-2 md:table-cell">{boss ? boss.nama : '—'}</td>
                  <td className="px-3 py-2">{fmtDate(isK ? e.akhir_kontrak : e.akhirProb)}</td>
                  <td className="px-3 py-2">
                    {isK ? (
                      <span className="flex items-center gap-1.5">
                        <WarnTag warn={e.warn} />
                        <span className="text-xs text-muted-foreground">
                          {e.sisa < 0 ? `lewat ${-e.sisa}` : e.sisa} hari
                        </span>
                      </span>
                    ) : (
                      <Tag tone="info">⏱ {e.probSisa} hari</Tag>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {done ? (
                      <Tag tone="ok">✓ Ditinjau</Tag>
                    ) : (
                      <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => onReview(`${type}:${e.nik}`)}>
                        Tandai ditinjau
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
            {!rows.length && (
              <tr><td colSpan={5} className="px-4 py-4 text-sm text-muted-foreground">Tidak ada.</td></tr>
            )}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}