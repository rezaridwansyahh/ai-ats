import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function MasukDataCard({ onImport, onClock }) {
  return (
    <Card className="gap-0 py-0 shadow-none">
      <CardContent className="p-4">
        <h3 className="mb-3 text-sm font-semibold">Masuk data</h3>
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" className="h-auto justify-center py-3.5" onClick={onImport}>⇪ Impor mesin absensi</Button>
          <Button variant="outline" className="h-auto justify-center py-3.5" onClick={onClock}>📍 Absen klik (PWA)</Button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Dua sumber: ekspor mesin sidik jari/wajah, atau aplikasi absen klik + geo-tag milik tim.
          Status Cuti/Sakit/Izin datang dari pengajuan yang disetujui atau input HR.
        </p>
      </CardContent>
    </Card>
  );
}