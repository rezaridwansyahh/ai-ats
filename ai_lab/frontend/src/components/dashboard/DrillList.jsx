import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { rowKey } from '@/components/karyawan/karyawanUtils.js';

export default function DrillList({ drill, onClose }) {
  return (
    <Card className="gap-0 border-primary/40 py-0 shadow-none">
      <CardContent className="p-4">
        <div className="mb-2 flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold">
            {drill.title} <span className="font-normal text-muted-foreground">· {drill.list.length} orang</span>
          </h3>
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={onClose}>Tutup</Button>
        </div>
        {drill.list.length ? (
          <ul className="grid gap-x-4 gap-y-1 text-sm sm:grid-cols-2 lg:grid-cols-3">
            {drill.list.map((e) => (
              <li key={rowKey(e)} className="truncate">
                <Link to={`/karyawan/${rowKey(e)}`} className="text-primary underline-offset-2 hover:underline">{e.nama}</Link>
                <span className="text-xs text-muted-foreground"> · {e.jabatan}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">Tidak ada karyawan.</p>
        )}
      </CardContent>
    </Card>
  );
}