import { Button } from '@/components/ui/button';

const INTRO = {
  tk: {
    icon: '🧠',
    title: 'Tes Kemampuan Kognitif',
    fn: 'Mengukur kapasitas berpikir, analisis, dan pemecahan masalah',
    items: '155 soal',
    time: '~80 menit',
    instr:
      'Lima subtes berurutan dengan timer aktif: GI (50 soal/12 menit), PV (25/15), KN (40/25), PA (40/20), KA (40/8). Selama tes, hindari pindah tab — setiap pindah dicatat sebagai indikator integritas.',
  },
  epps: {
    icon: '🌟',
    title: 'Tes Kepribadian',
    fn: 'Mengukur kebutuhan, motivasi, dan dorongan psikologis',
    items: '225 pasang',
    time: '~30 menit',
    instr:
      'Setiap soal berisi 2 pernyataan (a) dan (b). Pilih satu yang paling mencerminkan diri Anda. Tidak ada jawaban benar atau salah. Jawablah secara spontan, jangan terlalu lama berpikir.',
  },
  papi: {
    icon: '⚙️',
    title: 'Tes Preferensi Kerja',
    fn: 'Mengukur 20 dimensi preferensi & gaya kerja (PAPI Standard)',
    items: '90 pasang',
    time: '~15 menit',
    instr:
      'Pilih pernyataan yang paling mencerminkan cara Anda bekerja saat ini, bukan harapan ideal Anda. Jawablah dengan spontan dan jujur.',
  },
  sjt: {
    icon: '💡',
    title: 'Tes Penilaian Situasional (SJT)',
    fn: 'Mengukur penilaian situasional di 6 kompetensi kepemimpinan',
    items: '22 skenario',
    time: '30 menit',
    instr:
      'Bacalah setiap situasi kepemimpinan dengan cermat, lalu pilih satu dari empat tindakan yang paling efektif menurut Anda. Tidak ada pilihan yang sepenuhnya salah. Timer aktif 30 menit — hindari pindah tab. Memilih jawaban langsung lanjut ke skenario berikutnya.',
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
