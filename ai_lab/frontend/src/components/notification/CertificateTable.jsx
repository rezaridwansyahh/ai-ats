import { Card, CardContent } from '@/components/ui/card';
import { fmtDate } from '@/components/dashboard/dashboardMetrics.js';
import { Tag } from '@/components/karyawan/EmployeeTags';

export default function SertifikatTable({ rows, warnDays }) {
  const th = 'px-3 py-2 text-left font-medium';
  return (
    <Card className="gap-0 py-0 shadow-none">
      <CardContent className="overflow-auto p-0">
        <div className="flex items-center gap-2 px-4 pb-1 pt-3">
          <h3 className="text-sm font-semibold">
            Sertifikat kedaluwarsa / ≤ {warnDays} hari ({rows.length})
          </h3>
          <Tag tone="muted">contoh fiktif</Tag>
        </div>
        <table className="w-full min-w-[560px] text-sm">
          <thead className="border-b border-border text-xs text-muted-foreground">
            <tr>
              <th className={th}>Karyawan</th>
              <th className={th}>Sertifikat</th>
              <th className={th}>Berlaku s.d.</th>
              <th className={th}>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={`${c.nama}-${c.sertifikat}`} className="border-b border-border/60">
                <td className="px-3 py-2 font-semibold">{c.nama}</td>
                <td className="px-3 py-2">{c.sertifikat}</td>
                <td className="px-3 py-2">{fmtDate(c.exp)}</td>
                <td className="px-3 py-2">
                  {c.sisa < 0 ? (
                    <Tag tone="crit">⛔ Kedaluwarsa {-c.sisa} hari</Tag>
                  ) : (
                    <Tag tone="warn">⚠ {c.sisa === 0 ? 'Hari ini' : `${c.sisa} hari lagi`}</Tag>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="px-4 pb-3 pt-2 text-xs text-muted-foreground">
          Berguna untuk sertifikat wajib (mis. K3, SIO forklift) yang harus diperbarui berkala.
        </p>
      </CardContent>
    </Card>
  );
}