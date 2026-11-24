import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function PageState({ error, retry }) {
  return (
    <Card className="gap-0 py-0 shadow-none">
      <CardContent className="flex items-center justify-between gap-3 px-4 py-3">
        {error ? (
          <>
            <p className="text-sm text-destructive">Gagal memuat data: {error}</p>
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={retry}>Coba lagi</Button>
          </>
        ) : (
          <p className="py-3 text-sm text-muted-foreground">Memuat data kehadiran…</p>
        )}
      </CardContent>
    </Card>
  );
}