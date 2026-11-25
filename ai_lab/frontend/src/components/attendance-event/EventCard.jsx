import { Card, CardContent } from '@/components/ui/card';

const NOTES = [
  'Koordinat mentah tidak disimpan di modul; yang disimpan nama tempat (kasar), status lokasi, dan akurasi (minimisasi data lokasi).',
  'Foto selfie opsional per perusahaan; bila diaktifkan, foto = data biometrik? Perlu kajian PDP sebelum dipakai untuk pengenalan wajah.',
  'Sumber data dicatat (mesin / PWA / input HR) di setiap baris.',
];

export default function EventCard({ lastEvent }) {
  return (
    <Card className="gap-0 py-0 shadow-none">
      <CardContent className="p-4">
        <h3 className="mb-3 text-sm font-semibold">Yang diterima modul (event API)</h3>
        <pre className="overflow-auto rounded-lg bg-[#f6f8f7] p-2.5 font-mono text-xs">
          {JSON.stringify(
            lastEvent ?? { info: 'klik tombol absen untuk melihat event yang dikirim dan balasan server' },
            null,
            2
          )}
        </pre>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-muted-foreground">
          {NOTES.map((n) => <li key={n}>{n}</li>)}
        </ul>
      </CardContent>
    </Card>
  );
}