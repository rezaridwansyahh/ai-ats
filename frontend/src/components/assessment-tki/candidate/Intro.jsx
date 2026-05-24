import { Button } from '@/components/ui/button';
import { FileText, Clock, Target, Lightbulb } from 'lucide-react';

const INFO = [
  { Icon: FileText, title: '30 Pernyataan Berpasangan', desc: 'Pilih satu dari dua pernyataan yang paling menggambarkan Anda.' },
  { Icon: Clock, title: '~15 Menit', desc: 'Jawab berdasarkan intuisi pertama Anda.' },
  { Icon: Target, title: '5 Mode Konflik', desc: 'Bersaing, Berkolaborasi, Berkompromi, Menghindar, Mengakomodasi.' },
  { Icon: Lightbulb, title: 'Untuk Pengembangan', desc: 'Hasil membangun kesadaran diri — tidak ada jawaban salah.' },
];

export default function Intro({ onStart, onBack }) {
  return (
    <div className="max-w-[760px] mx-auto px-4 py-8">
      <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-lg">
        <div className="text-center mb-6">
          <h2 className="font-serif text-2xl mb-1">Thomas-Kilmann Assessment</h2>
          <div className="text-sm font-semibold text-slate-500">30 pernyataan berpasangan · ~15 menit · 5 mode konflik</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
          {INFO.map((item) => (
            <div key={item.title} className="rounded-lg border border-slate-200 p-4">
              <item.Icon className="w-5 h-5 text-teal-700 mb-1.5" />
              <div className="text-sm font-bold mb-1">{item.title}</div>
              <div className="text-xs text-slate-600 leading-relaxed">{item.desc}</div>
            </div>
          ))}
        </div>

        <div className="bg-teal-50 border border-teal-200 rounded-lg p-3.5 mb-5">
          <div className="text-[11px] font-bold tracking-wider uppercase text-teal-800 mb-1.5">📌 Petunjuk Penting</div>
          <ul className="text-xs text-teal-900/90 leading-relaxed list-disc pl-4 space-y-0.5">
            <li>Setiap soal menyajikan dua pernyataan — pilih satu yang PALING menggambarkan cara Anda menghadapi konflik</li>
            <li>Tidak ada jawaban benar atau salah; setiap mode berguna pada konteks yang tepat</li>
            <li>Jawab berdasarkan intuisi pertama Anda — jangan terlalu lama berpikir</li>
          </ul>
        </div>

        <Button onClick={onStart} className="w-full bg-gradient-to-br from-teal-800 to-teal-600 hover:opacity-90 h-11">
          Mulai Tes →
        </Button>
        {onBack && (
          <div className="text-center">
            <Button variant="outline" onClick={onBack} className="mt-2.5">← Kembali</Button>
          </div>
        )}
      </div>
    </div>
  );
}
