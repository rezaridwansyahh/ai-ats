import { Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { fmtDate, REF_DATE } from '@/components/dashboard/dashboardMetrics.js';

export default function InsightCard({ insights }) {
  return (
    <div className="rounded-xl border border-violet-200 bg-gradient-to-b from-violet-50 to-card px-4 py-3">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-violet-700">
        <Sparkles className="h-3.5 w-3.5" /> Insight demografi
        <Badge variant="secondary" className="bg-violet-100 text-[11px] text-violet-700">Saran AI</Badge>
      </div>
      {insights.length ? (
        <ul className="list-disc space-y-1.5 pl-5 text-[14px]">
          {insights.map((parts, i) => (
            <li key={i}>
              {parts.map((seg, j) => (typeof seg === 'string' ? <span key={j}>{seg}</span> : <b key={j}>{seg.b}</b>))}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">Belum ada insight.</p>
      )}
      <p className="mt-2 text-xs text-muted-foreground">
        Angka dihitung sistem dari data per {fmtDate(REF_DATE)}. Kalimat saran masih disusun berdasarkan aturan, belum oleh AI.
      </p>
    </div>
  );
}