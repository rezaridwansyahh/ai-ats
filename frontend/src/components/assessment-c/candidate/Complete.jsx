import { Button } from '@/components/ui/button';

const TEST_LABELS = {
  tk: 'Tes 1 — Kemampuan Kognitif',
  epps: 'Tes 2 — Kepribadian',
  papi: 'Tes 3 — Preferensi Kerja',
  sjt: 'Tes 4 — Penilaian Situasional',
};

export default function Complete({
  profile, results, tests, onBack, onContinue,
  submitStatus = 'idle', submitError = null, onRetrySubmit,
}) {
  const allDone = tests.every((t) => results[t]);
  const doneCount = Object.keys(results || {}).length;
  const firstUndone = tests.find((t) => !results[t]);

  return (
    <div className="max-w-[700px] mx-auto px-4 py-6">
      {allDone && (
        <div className="bg-gradient-to-br from-green-50 to-green-100/40 border-2 border-green-600 rounded-xl p-7 text-center mb-4">
          <div className="text-5xl mb-2">🎉</div>
          <div className="font-serif text-2xl text-green-800 mb-1.5">Semua Tes Selesai!</div>
          <div className="text-sm text-slate-500 leading-relaxed mb-4">
            Selamat <strong>{profile?.name}</strong>! Anda telah menyelesaikan seluruh rangkaian tes Battery C.
            <br />
            Informasikan kepada rekruter bahwa proses tes telah selesai.
          </div>
          <div className="bg-white/70 rounded-lg p-3 text-xs text-slate-500 border border-green-200 text-left">
            <strong>Langkah selanjutnya:</strong> Hubungi rekruter Anda dan informasikan bahwa semua tes telah selesai. Hasil
            akan diproses oleh tim asesor.
          </div>

          {submitStatus === 'submitting' && (
            <div className="mt-3 bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-600">
              Menyimpan hasil ke server…
            </div>
          )}
          {submitStatus === 'success' && (
            <div className="mt-3 bg-emerald-100 border border-emerald-300 rounded-lg px-3 py-2 text-xs text-emerald-800">
              ✓ Hasil tersimpan di server
            </div>
          )}
          {submitStatus === 'error' && (
            <div className="mt-3 bg-red-50 border border-red-300 rounded-lg px-3 py-2.5 text-xs text-red-700 text-left">
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
      )}

      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">
          Daftar Tes — {doneCount} dari {tests.length} Selesai
        </div>

        {tests.map((t, i) => {
          const isDone = !!results[t];
          return (
            <div
              key={t}
              className={[
                'flex items-center gap-3.5 py-3 px-4 rounded-lg border-2 mb-2',
                isDone ? 'border-green-200 bg-green-50' : 'border-slate-200 bg-slate-50',
              ].join(' ')}
            >
              <div
                className={[
                  'w-9 h-9 rounded-full grid place-items-center font-bold flex-shrink-0',
                  isDone ? 'bg-green-600 text-white text-lg' : 'bg-slate-200 text-slate-400 text-sm',
                ].join(' ')}
              >
                {isDone ? '✓' : i + 1}
              </div>
              <div className="flex-1">
                <div className={['text-sm font-bold', isDone ? 'text-green-800' : 'text-slate-400'].join(' ')}>
                  {TEST_LABELS[t]}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">{isDone ? 'Selesai' : 'Belum dikerjakan'}</div>
              </div>
              <div className="text-xl">{isDone ? '✅' : '⭕'}</div>
            </div>
          );
        })}
      </div>

      <div className="flex gap-2 flex-wrap mt-3">
        <Button variant="outline" onClick={onBack}>
          ← Kembali ke Daftar Tes
        </Button>
        {!allDone && firstUndone && (
          <Button onClick={() => onContinue(firstUndone)} className="bg-gradient-to-br from-teal-800 to-teal-600 hover:opacity-90 ml-auto">
            Lanjutkan Tes →
          </Button>
        )}
      </div>
    </div>
  );
}
