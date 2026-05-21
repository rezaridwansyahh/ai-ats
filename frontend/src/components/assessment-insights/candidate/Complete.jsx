import { Button } from '@/components/ui/button';
import { CheckCircle2, Check, FileText } from 'lucide-react';

export default function Complete({
  profile, onViewReport, onRestart,
  submitStatus = 'idle', submitError = null, onRetrySubmit,
}) {
  return (
    <div className="max-w-[700px] mx-auto px-4 py-6">
      <div
        className="rounded-xl p-10 text-center text-white mb-4 shadow-xl"
        style={{ background: 'linear-gradient(135deg,#0F766E,#064E3B)' }}
      >
        <div className="w-16 h-16 rounded-full bg-white/15 border-2 border-white/30 flex items-center justify-center mx-auto mb-4 text-emerald-200">
          <CheckCircle2 className="w-9 h-9" />
        </div>
        <div className="font-serif text-2xl md:text-3xl font-bold mb-1.5">Asesmen Selesai</div>
        <div className="text-sm opacity-85 leading-relaxed max-w-md mx-auto">
          Terima kasih{profile?.name ? `, ${profile.name}` : ''}. Jawaban Anda telah tersimpan.
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <p className="text-sm font-semibold mb-1.5">Apa selanjutnya?</p>
        <p className="text-[13px] text-slate-600 leading-relaxed">
          Hasil asesmen Anda telah dicatat dan akan ditinjau oleh tim HR / fasilitator. Anda akan menerima debrief
          dan pembahasan hasil pada sesi onboarding berikutnya.
        </p>
        <p className="text-[13px] text-slate-600 leading-relaxed mt-2">
          Profil kepribadian bukan penilaian baik/buruk — hanya gambaran gaya komunikasi dan preferensi kerja Anda.
        </p>

        {submitStatus === 'submitting' && (
          <div className="mt-3 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-600">
            Menyimpan hasil ke server…
          </div>
        )}
        {submitStatus === 'success' && (
          <div className="mt-3 bg-emerald-100 border border-emerald-300 rounded-lg px-3 py-2 text-xs text-emerald-800 flex items-center gap-2">
            <Check className="w-4 h-4" /> Hasil tersimpan di server
          </div>
        )}
        {submitStatus === 'error' && (
          <div className="mt-3 bg-red-50 border border-red-300 rounded-lg px-3 py-2.5 text-xs text-red-700">
            <p className="font-semibold mb-1.5">Gagal mengirim hasil ke server</p>
            <p className="opacity-90 mb-2">{submitError}</p>
            {onRetrySubmit && (
              <button
                onClick={onRetrySubmit}
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-[11px] font-bold uppercase tracking-wider"
              >
                Coba Lagi
              </button>
            )}
          </div>
        )}
      </div>

      {/* HR / facilitator report access — gated by allowViewReport in the parent */}
      {onViewReport && (
        <div
          className="rounded-xl p-5 mt-4 border-[1.5px]"
          style={{ background: 'linear-gradient(135deg,#FFFBEB,#FEF3C7)', borderColor: '#D97706' }}
        >
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="bg-amber-500 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">🔒 HR / Fasilitator</span>
            <div className="font-serif text-base font-bold text-amber-800">Buka Laporan Psikologis</div>
          </div>
          <p className="text-[13px] text-amber-900/80 leading-relaxed mb-3">
            Untuk meninjau laporan psikologis kandidat, klik tombol di bawah. Laporan dapat dicetak atau disimpan sebagai PDF.
          </p>
          <Button
            onClick={onViewReport}
            className="w-full bg-gradient-to-br from-indigo-700 to-violet-600 hover:opacity-90 h-11 gap-2"
          >
            <FileText className="w-5 h-5" />
            Buka Laporan Psikologis →
          </Button>
        </div>
      )}

      {onRestart && (
        <div className="flex mt-3">
          <Button variant="outline" onClick={onRestart}>← Kembali ke Beranda</Button>
        </div>
      )}
    </div>
  );
}
