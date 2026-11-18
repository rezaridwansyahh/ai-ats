import { useState } from 'react';
import { toast } from 'sonner';
import { Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// PLACEHOLDER: no backend logic yet. Every action shows a "Coming soon" toast.
const SAMPLE_QUESTIONS = [
  'PKWT di Produksi yang habis ≤60 hari?',
  'Divisi dengan masa kerja rata-rata terpendek?',
  'Siapa yang masa percobaannya selesai bulan depan?',
  'Berapa % perempuan di level Supervisor ke atas?',
];

export default function TanyaDataCard() {
  const [q, setQ] = useState('');
  const ask = () => toast('Coming soon');

  return (
    <div className="rounded-xl border border-violet-200 bg-gradient-to-b from-violet-50 to-card px-4 py-3">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-violet-700">
        <Sparkles className="h-3.5 w-3.5" /> Tanya Data
        <Badge variant="secondary" className="bg-violet-100 text-[11px] text-violet-700">Segera hadir</Badge>
      </div>
      <div className="flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && ask()}
          placeholder="Tulis pertanyaan tentang data karyawan…"
          className="h-9 min-w-0 flex-1 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <Button onClick={ask}>Tanya</Button>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {SAMPLE_QUESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={ask}
            className="rounded-full border border-violet-200 bg-card px-2.5 py-1 text-left text-xs text-violet-700 hover:bg-violet-50"
          >
            {s}
          </button>
        ))}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Fitur ini belum dibuat. Nanti AI menerjemahkan pertanyaan menjadi filter, sistem menghitung, lalu AI menulis jawabannya.
      </p>
    </div>
  );
}