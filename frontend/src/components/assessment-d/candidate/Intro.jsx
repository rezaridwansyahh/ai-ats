import { Button } from '@/components/ui/button';

const INTRO = {
  tk: {
    icon: '🧠',
    title: 'Tes Kemampuan Kognitif',
    fn: 'Mengukur kapasitas berpikir, analisis, dan pemecahan masalah',
    items: '155 soal',
    time: '~72 menit',
    instr:
      'Empat subtes berurutan dengan timer aktif: GI (50 soal/12 menit), PV (25/15), KN (40/25), PA (40/20). Selama tes, hindari pindah tab — setiap pindah dicatat sebagai indikator integritas.',
  },
  sjt: {
    icon: '💡',
    title: 'Tes Penilaian Situasional (SJT)',
    fn: 'Mengukur penilaian situasional di 6 kompetensi senior leadership',
    items: '22 skenario',
    time: '30 menit',
    instr:
      'Bacalah setiap situasi kepemimpinan dengan cermat, lalu pilih satu dari empat tindakan yang paling efektif menurut Anda. Tidak ada pilihan yang sepenuhnya salah. Timer aktif 30 menit — hindari pindah tab. Memilih jawaban langsung lanjut ke skenario berikutnya.',
  },
  pf: {
    icon: '🌟',
    title: 'Tes Kepribadian 16PF',
    fn: 'Mengukur 16 faktor kepribadian (Cattell 16PF)',
    items: '105 pernyataan',
    time: '~30 menit',
    instr:
      'Setiap pernyataan memiliki tiga pilihan (a/b/c). Pilih satu yang paling mencerminkan diri Anda. Tidak ada jawaban benar atau salah. Jawablah secara spontan — memilih jawaban langsung lanjut ke pernyataan berikutnya.',
  },
  msdt: {
    icon: '🧭',
    title: 'Tes Gaya Kepemimpinan MSDT',
    fn: 'Mengukur 8 gaya kepemimpinan & efektivitas manajerial',
    items: '64 pasang',
    time: '~20 menit',
    instr:
      'Setiap soal berisi dua pernyataan (A) dan (B). Pilih satu yang paling mencerminkan perilaku kepemimpinan Anda. Pilih berdasarkan perilaku nyata, bukan yang ideal — memilih jawaban langsung lanjut.',
  },
  papil: {
    icon: '🎯',
    title: 'Tes Preferensi Kepemimpinan PAPI-L',
    fn: 'Mengukur 10 dimensi Peran + 10 dimensi Kebutuhan dalam konteks kepemimpinan',
    items: '90 pasang',
    time: '~15 menit',
    instr:
      'Pilih pernyataan yang paling mencerminkan peran dan preferensi kepemimpinan Anda. Jawablah dengan spontan — memilih jawaban langsung lanjut ke pasangan berikutnya.',
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
