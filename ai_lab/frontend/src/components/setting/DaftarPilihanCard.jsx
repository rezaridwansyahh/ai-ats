import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const STATIC_LISTS = [
  ['Level jabatan', ['Direktur', 'Manajer', 'Supervisor', 'Staf', 'Operator']],
  ['Status karyawan', ['PKWTT', 'PKWT', 'Magang']],
  ['Pendidikan', ['SD/SMP', 'SMA/SMK', 'D3', 'S1', 'S2', 'S3']],
  ['Alasan keluar', ['Resign sukarela', 'Kontrak berakhir', 'PHK', 'Pensiun', 'Meninggal dunia', 'Lainnya']],
];

export default function DaftarPilihanCard({ divisi, lokasi }) {
  const lists = [['Divisi', divisi], ['Lokasi', lokasi], ...STATIC_LISTS];
  return (
    <Card className="gap-0 py-0 shadow-none">
      <CardContent className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Daftar pilihan</h3>
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => toast('Coming soon')}>
            Kelola daftar
          </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {lists.map(([title, items]) => (
            <div key={title}>
              <p className="text-[13px] font-semibold">{title}</p>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {items.length ? (
                  items.map((x) => <Badge key={x} variant="secondary" className="font-normal">{x}</Badge>)
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">Divisi dan lokasi diambil dari data karyawan yang ada.</p>
      </CardContent>
    </Card>
  );
}