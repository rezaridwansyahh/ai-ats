import { Button } from '@/components/ui/button';

const TEST_META = {
  tk: {
    name: 'Tes Kemampuan Kognitif',
    icon: '🧠',
    color: '#0A6E5C',
    time: '~20 menit',
    items: '90 soal (2 subtes)',
    desc: 'Dua subtes terpadu: GI Kemampuan Umum (50 soal/12 menit) dan KA Kecepatan & Akurasi (40 soal/8 menit).',
  },
  bigfive: {
    name: 'Tes Kepribadian',
    icon: '🌟',
    color: '#0369A1',
    time: '~10 menit',
    items: '44 pernyataan',
    desc: 'Nilai setiap pernyataan dalam skala 1–5 sesuai kesesuaian dengan diri Anda. Lima trait: E, A, C, N, O.',
  },
  disc: {
    name: 'Tes Gaya Kerja (DISC)',
    icon: '🎯',
    color: '#7C3AED',
    time: '~15 menit',
    items: '24 kelompok',
    desc: 'Pilih pernyataan yang PALING (M) dan PALING TIDAK (L) mencerminkan diri Anda di tiap kelompok 4 pilihan.',
  },
  holland: {
    name: 'Tes Minat Kerja',
    icon: '🗺️',
    color: '#4F46E5',
    time: '~15 menit',
    items: '108 pernyataan',
    desc: 'Jawab YA atau TIDAK untuk setiap pernyataan minat dan kemampuan.',
  },
};

export default function Overview({ profile, results, tests, onPick, onReset, onSeeComplete }) {
  const doneCount = Object.keys(results || {}).length;

  return (
    <div className="max-w-[900px] mx-auto px-4 py-6">
      <div
        className="rounded-xl p-6 mb-4 text-white relative overflow-hidden shadow-lg"
        style={{ background: 'linear-gradient(135deg,#0A2A22 0%,#064E3B 45%,#0A6E5C 100%)' }}
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-full border-2 border-white/40 grid place-items-center font-serif font-bold bg-white/15 text-lg">
            {profile?.name?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-serif text-xl">{profile?.name}</div>
            <div className="text-xs opacity-75">{profile?.position}</div>
          </div>
        </div>
        <div className="bg-white/15 border border-white/20 rounded-lg px-3 py-2.5 flex items-center justify-between">
          <div>
            <div className="text-sm font-bold">Battery A · v10</div>
            <div className="text-xs opacity-65 mt-0.5">{doneCount} dari {tests.length} tes selesai</div>
          </div>
          <div className="text-right">
            <div className="font-serif text-2xl font-bold">{Math.round((doneCount / tests.length) * 100)}%</div>
            <div className="text-xs opacity-70">Progres</div>
          </div>
        </div>
        <div className="bg-white/20 rounded-full h-2 overflow-hidden mt-3">
          <div
            className="h-2 rounded-full bg-white transition-all"
            style={{ width: `${(doneCount / tests.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="space-y-2.5">
        {tests.map((t, i) => {
          const meta = TEST_META[t];
          const isDone = !!results?.[t];
          const isActive = !isDone && tests.slice(0, i).every((p) => results?.[p]);
          const locked = !isDone && !isActive;

          return (
            <div
              key={t}
              className={[
                'border-2 rounded-lg p-4 flex items-center gap-3.5 transition',
                isDone && 'border-green-300 bg-green-50',
                isActive && 'border-teal-600 bg-teal-50 cursor-pointer hover:shadow-lg',
                locked && 'border-slate-200 opacity-50',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => isActive && onPick(t)}
            >
              <div
                className="w-10 h-10 rounded-full grid place-items-center font-serif font-bold text-sm flex-shrink-0 border-2"
                style={{
                  background: isDone ? '#059669' : isActive ? meta.color : '#E2E8F0',
                  borderColor: isDone ? '#059669' : isActive ? meta.color : '#E2E8F0',
                  color: isDone || isActive ? '#fff' : '#94A3B8',
                }}
              >
                {isDone ? '✓' : i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold flex items-center gap-2">
                  <span>{meta.icon}</span>
                  {meta.name}
                </div>
                <div className="text-xs text-slate-500 leading-relaxed mt-0.5">{meta.desc}</div>
                <div className="flex gap-1.5 mt-1.5 flex-wrap">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ background: meta.color + '20', color: meta.color }}>
                    {meta.items}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">⏱ {meta.time}</span>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                {isDone ? <div className="text-2xl">✅</div> : isActive ? <div className="text-2xl">▶️</div> : <div className="text-2xl opacity-40">🔒</div>}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2 mt-4">
        {doneCount > 0 && (
          <Button variant="outline" onClick={onSeeComplete}>
            📋 Lihat Ringkasan
          </Button>
        )}
        <Button variant="outline" onClick={onReset} className="text-red-600 hover:text-red-700 ml-auto">
          🗑 Reset
        </Button>
      </div>
    </div>
  );
}
