import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import KpiCard from '@/components/dashboard/KpiCard';
import { fmtDate } from '@/components/dashboard/dashboardMetrics.js';
import { StepNav } from './ImportSteps';

export function StepConfirm({ result, busy, onBack, onSave }) {
  const { counts, period } = result;
  return (
    <>
      <div className="mb-3 grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard label="Hari-orang" value={String(result.days)} />
        <KpiCard label="Baru" value={String(counts.insert)} />
        <KpiCard label="Diperbarui" value={String(counts.update)} sub="mengisi jam / menimpa" />
        <KpiCard label="Ditandai" value={String(counts.flagged)} sub="lupa absen" />
      </div>
      <Card className="gap-0 py-0 shadow-none">
        <CardContent className="p-4">
          <p className="text-sm">
            Data {fmtDate(period.from)} – {fmtDate(period.to)} akan ditambahkan
            {counts.unchanged > 0 && ` (${counts.unchanged} hari-orang tidak berubah)`}
            {counts.skip > 0 && ` dan ${counts.skip} hari-orang dilewati karena sudah ada data lain`}.
            {' '}Status Hadir diturunkan dari scan; Cuti/Sakit/Izin tetap dari pengajuan yang disetujui.
            {' '}Batch bisa dibatalkan 24 jam.
          </p>
          <StepNav onBack={onBack} onNext={onSave} nextLabel={busy ? 'Menyimpan…' : 'Simpan'} disabled={busy} />
        </CardContent>
      </Card>
    </>
  );
}

export function DoneCard({ result, undone, busy, onUndo, onDashboard, onAgain }) {
  return (
    <Card className="gap-0 py-0 shadow-none">
      <CardContent className="p-4">
        <h3 className="mb-2 text-sm font-semibold">{undone ? 'Impor dibatalkan' : '✓ Impor selesai'}</h3>
        <p className="mb-3 text-sm">
          {undone
            ? 'Data dari impor ini sudah dihapus atau dikembalikan seperti semula.'
            : `${result.days} hari-orang tersimpan (${result.insert} baru, ${result.update} diperbarui, ${result.flagged} ditandai lupa absen). Pemetaan kolom dan PIN disimpan untuk impor berikutnya.`}
        </p>
        <div className="flex flex-wrap gap-2">
          {!undone && <Button onClick={onDashboard}>Buka dashboard</Button>}
          <Button variant="outline" onClick={onAgain}>Impor lagi</Button>
          {!undone && (
            <Button variant="outline" disabled={busy} onClick={onUndo}>
              {busy ? 'Membatalkan…' : 'Batalkan impor (24 jam)'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}