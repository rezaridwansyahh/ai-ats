import { Button } from '@/components/ui/button';

export default function TestDone({ label, isLast, onNext, onBack }) {
  return (
    <div className="max-w-[480px] mx-auto px-4 py-16 text-center">
      <div className="w-20 h-20 rounded-full bg-green-50 border-[3px] border-green-600 inline-flex items-center justify-center text-4xl mb-5">
        ✅
      </div>
      <h2 className="font-serif text-2xl text-green-800 mb-2">{label} Selesai</h2>
      <p className="text-sm text-slate-500 leading-relaxed mb-7">
        Jawaban Anda telah direkam dengan baik.
        <br />
        {isLast ? 'Seluruh rangkaian tes Battery C telah selesai.' : 'Lanjutkan ke tes berikutnya saat Anda siap.'}
      </p>
      <Button onClick={onNext} className="bg-gradient-to-br from-teal-800 to-teal-600 hover:opacity-90 h-11 w-full max-w-[280px]">
        {isLast ? 'Lihat Ringkasan Akhir →' : 'Lanjut ke Tes Berikutnya →'}
      </Button>
      <div className="mt-3">
        <Button variant="outline" onClick={onBack}>
          ← Kembali ke Daftar Tes
        </Button>
      </div>
    </div>
  );
}
