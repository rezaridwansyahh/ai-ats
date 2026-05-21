import { Button } from '@/components/ui/button';
import { Scale, Puzzle, BarChart3, ShieldCheck } from 'lucide-react';

const INFO = [
  { Icon: Scale, title: 'Format Pilihan Paksa', desc: 'Setiap soal menyajikan dua pernyataan — pilih satu yang LEBIH mencerminkan cara Anda bekerja dan berpikir sehari-hari. Tidak ada jawaban benar atau salah.' },
  { Icon: Puzzle, title: '3 Dimensi Kepribadian', desc: 'Mengukur orientasi energi (E/I), cara pengambilan keputusan (T/F), dan pendekatan terhadap informasi (S/N) — menghasilkan 1 dari 8 profil kepribadian kerja.' },
  { Icon: BarChart3, title: 'Profil Lengkap', desc: 'Hasil mencakup profil dominan, kekuatan dan area pengembangan, serta panduan interpretasi untuk rekruter.' },
  { Icon: ShieldCheck, title: 'Jawab Jujur', desc: 'Pilih berdasarkan cara Anda BENAR-BENAR bekerja — bukan yang terlihat paling ideal. Hasilnya lebih akurat jika Anda jujur tentang preferensi nyata.' },
];

export default function Intro({ onStart, onBack }) {
  return (
    <div className="max-w-[760px] mx-auto px-4 py-8">
      <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-lg">
        <div className="text-center mb-6">
          <h2 className="font-serif text-2xl mb-1">Insights-Discovery Assessment</h2>
          <div className="text-sm font-semibold text-slate-500">72 pasang pernyataan · ±25 menit · 8 profil kerja</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
          {INFO.map((item) => (
            <div key={item.title} className="rounded-lg border border-slate-200 p-4">
              <item.Icon className="w-5 h-5 text-indigo-600 mb-1.5" />
              <div className="text-sm font-bold mb-1">{item.title}</div>
              <div className="text-xs text-slate-600 leading-relaxed">{item.desc}</div>
            </div>
          ))}
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3.5 mb-5">
          <div className="text-[11px] font-bold tracking-wider uppercase text-amber-800 mb-1.5">📌 Petunjuk Penting</div>
          <ul className="text-xs text-amber-900/90 leading-relaxed list-disc pl-4 space-y-0.5">
            <li>Tidak ada batas waktu formal — kerjakan dengan santai namun fokus</li>
            <li>Pilih berdasarkan PREFERENSI alami, bukan yang terlihat paling profesional</li>
            <li>Perpindahan tab saat tes berlangsung akan dicatat</li>
            <li>Jawaban pertama Anda biasanya yang paling akurat — jangan terlalu lama berpikir</li>
          </ul>
        </div>

        <Button onClick={onStart} className="w-full bg-gradient-to-br from-indigo-700 to-violet-600 hover:opacity-90 h-11">
          Mulai Tes →
        </Button>
        {onBack && (
          <div className="text-center">
            <Button variant="outline" onClick={onBack} className="mt-2.5">
              ← Kembali
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
