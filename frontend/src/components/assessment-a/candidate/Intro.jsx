import { Button } from '@/components/ui/button';

const INTRO = {
  tk: {
    icon: '🧠',
    title: 'Tes Kemampuan Kognitif',
    fn: 'Mengukur kapasitas berpikir, analisis, dan kecepatan akurasi klerikal',
    items: '90 soal',
    time: '~20 menit',
    instr:
      'Dua subtes bertimer: GI Kemampuan Umum (50 soal, 12 menit) dan KA Kecepatan & Akurasi (40 soal, 8 menit). Selama tes, hindari pindah tab — setiap pindah dicatat sebagai indikator integritas.',
  },
  bigfive: {
    icon: '🌟',
    title: 'Tes Kepribadian (Big Five)',
    fn: 'Mengukur 5 trait kepribadian: E, A, C, N, O',
    items: '44 pernyataan',
    time: '~10 menit',
    instr:
      'Nilai setiap pernyataan dalam skala 1 (Sangat Tidak Sesuai) sampai 5 (Sangat Sesuai). Tidak ada jawaban benar atau salah. Menjawab langsung lanjut ke soal berikutnya secara otomatis.',
  },
  disc: {
    icon: '🎯',
    title: 'Tes Gaya Kerja (DISC)',
    fn: 'Mengukur gaya perilaku dominan: Dominance, Influence, Steadiness, Compliance',
    items: '24 kelompok',
    time: '~15 menit',
    instr:
      'Untuk setiap kelompok 4 pernyataan, pilih satu yang PALING mencerminkan Anda (M) dan satu yang PALING TIDAK mencerminkan Anda (L). Setelah keduanya dipilih, otomatis lanjut.',
  },
  holland: {
    icon: '🗺️',
    title: 'Tes Minat Kerja (Holland RIASEC)',
    fn: 'Mengukur minat vokasional menggunakan model Holland RIASEC',
    items: '108 pernyataan',
    time: '~15 menit',
    instr:
      'Jawab YA jika pernyataan mencerminkan minat, kemampuan, atau kepribadian Anda. Jawab TIDAK jika tidak. Menjawab langsung lanjut ke soal berikutnya secara otomatis.',
  },
};

export default function Intro({ test, onStart, onBack }) {
  const meta = INTRO[test];
  if (!meta) return null;

  return (
    <div className="max-w-[640px] mx-auto px-4 py-10">
      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center shadow-lg">
        <div className="text-5xl mb-3">{meta.icon}</div>
        <h2 className="font-serif text-2xl mb-1">{meta.title}</h2>
        <div className="text-sm font-semibold text-slate-500 mb-5">{meta.fn}</div>

        <div className="flex justify-center gap-3 flex-wrap mb-5">
          <div className="px-4 py-2 rounded-lg border border-slate-200 text-center">
            <div className="font-serif text-xl font-bold">{meta.items}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">JUMLAH SOAL</div>
          </div>
          <div className="px-4 py-2 rounded-lg border border-slate-200 text-center">
            <div className="font-serif text-xl font-bold">{meta.time}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">DURASI</div>
          </div>
        </div>

        <div className="bg-slate-50 rounded-lg p-3.5 text-left mb-4">
          <div className="text-[11px] font-bold tracking-wider uppercase text-slate-500 mb-1.5">Petunjuk</div>
          <div className="text-sm text-slate-600 leading-relaxed">{meta.instr}</div>
        </div>

        <Button onClick={onStart} className="w-full max-w-[300px] bg-gradient-to-br from-teal-800 to-teal-600 hover:opacity-90 h-11">
          Mulai Tes →
        </Button>
        <div>
          <Button variant="outline" onClick={onBack} className="mt-2.5">
            ← Kembali ke Daftar Tes
          </Button>
        </div>
      </div>
    </div>
  );
}
