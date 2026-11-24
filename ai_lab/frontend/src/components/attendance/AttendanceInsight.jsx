import { Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function AttendanceInsight({ title, insights }) {
  return (
    <div className="rounded-xl border border-violet-200 bg-gradient-to-b from-violet-50 to-card px-4 py-3">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-violet-700">
        <Sparkles className="h-3.5 w-3.5" /> {title}
        <Badge variant="secondary" className="bg-violet-100 text-[11px] text-violet-700">Saran AI</Badge>
      </div>
      {insights.length ? (
        <ul className="list-disc space-y-1.5 pl-5 text-[14px]">
          {insights.map((text) => <li key={text}>{text}</li>)}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">Belum ada insight.</p>
      )}
      <p className="mt-2 text-xs text-muted-foreground">
        Angka dihitung sistem dari data absensi. Kalimat saran masih disusun berdasarkan aturan, belum oleh AI.
      </p>
    </div>
  );
}