import { Button } from '@/components/ui/button';
import { calc3Pillar, pillarVerdict, deriveOverallVerdict, genManagerSummary, PILLAR_THRESHOLDS } from './report-utils';

const PILL_CLS = {
  pass: 'bg-green-50 text-green-700 border-green-300',
  warn: 'bg-amber-50 text-amber-700 border-amber-300',
  fail: 'bg-red-50 text-red-700 border-red-300',
  empty: 'bg-slate-50 text-slate-500 border-slate-200',
};
const PILL_LABEL = { pass: '✓ Passed', warn: '⚠ Warn', fail: '✗ Failed', empty: '— Pending' };

export default function ManagerView({ profile, results, finalRec, onSetFinalRec }) {
  const pillar = calc3Pillar(results);
  const verdict = deriveOverallVerdict(results, finalRec);
  const summary = genManagerSummary(results, verdict, profile);

  const pv = {
    cognitive: pillarVerdict(pillar.cognitive, PILLAR_THRESHOLDS.cognitive),
    personality: pillarVerdict(pillar.personality, PILLAR_THRESHOLDS.personality),
    workAttitude: pillarVerdict(pillar.workAttitude, PILLAR_THRESHOLDS.workAttitude),
    overall: pillarVerdict(pillar.overall, PILLAR_THRESHOLDS.overall),
  };

  const heroBg = {
    pass: 'bg-gradient-to-br from-green-50 to-green-100 border-green-300 text-green-800',
    warn: 'bg-gradient-to-br from-amber-50 to-amber-100 border-amber-300 text-amber-800',
    fail: 'bg-gradient-to-br from-red-50 to-red-100 border-red-300 text-red-800',
    empty: 'bg-slate-50 border-slate-200 text-slate-500',
  };

  return (
    <section className="space-y-3.5 my-5">
      {/* 3-Pillar Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="text-[10.5px] font-bold tracking-widest uppercase text-slate-500 mb-3 flex items-center gap-2">
          📊 Skor 3-Pilar · Format Platform Myralix
          <div className="flex-1 h-px bg-slate-200" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 border-[1.5px] border-slate-200 rounded-lg overflow-hidden">
          {[
            { key: 'cognitive', icon: '🧠', name: 'Cognitive', score: pillar.cognitive, threshold: PILLAR_THRESHOLDS.cognitive, verdict: pv.cognitive },
            { key: 'personality', icon: '🎭', name: 'Personality', score: pillar.personality, threshold: PILLAR_THRESHOLDS.personality, verdict: pv.personality },
            { key: 'workAttitude', icon: '💼', name: 'Work Attitude', score: pillar.workAttitude, threshold: PILLAR_THRESHOLDS.workAttitude, verdict: pv.workAttitude },
            { key: 'overall', icon: '🏆', name: 'Overall', score: pillar.overall, threshold: PILLAR_THRESHOLDS.overall, verdict: pv.overall, isOverall: true },
          ].map((p, i, arr) => (
            <div
              key={p.key}
              className={[
                'p-4 text-center border-r border-slate-200 last:border-r-0 bg-white',
                p.isOverall && 'bg-gradient-to-b from-teal-50 to-white',
                i < arr.length - 2 && 'border-b md:border-b-0',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <div className="text-lg mb-1 opacity-80">{p.icon}</div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">{p.name}</div>
              <div className={`font-serif font-bold leading-none mb-1 ${p.isOverall ? 'text-3xl text-teal-800' : 'text-2xl'}`}>
                {p.score ?? '—'}
                <span className="text-xs text-slate-400 font-normal ml-0.5">/100</span>
              </div>
              <div className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${PILL_CLS[p.verdict]}`}>
                {PILL_LABEL[p.verdict]}
              </div>
              <div className="text-[9.5px] text-slate-400 mt-1">Min {p.threshold}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Hero Verdict */}
      <div className={`border-2 rounded-xl p-6 ${heroBg[verdict.kind]}`}>
        <div className="text-[11px] font-bold tracking-[.18em] uppercase opacity-85">Rekomendasi Akhir</div>
        <div className="font-serif text-2xl md:text-3xl font-bold mt-1.5 leading-tight">{verdict.label}</div>
        <div className="text-sm mt-2.5 text-slate-600 max-w-[780px]">{verdict.sub}</div>
      </div>

      {/* Manager Summary */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <h3 className="font-serif text-lg text-teal-800 font-bold flex items-center gap-2 mb-3">
          <span className="w-1 h-4 bg-teal-600 rounded-sm" /> 📘 Ringkasan untuk Manajer
        </h3>

        {[
          { icon: '🧠', title: 'Kemampuan Berpikir & Analisis', desc: 'Kapasitas belajar, pemecahan masalah, akurasi', score: pillar.cognitive, verdict: pv.cognitive, passLbl: '✅ Memadai', failLbl: '❌ Belum Memadai' },
          { icon: '🌟', title: 'Kesesuaian Kepribadian', desc: 'Karakter bawaan kandidat vs tuntutan peran', score: pillar.personality, verdict: pv.personality, passLbl: '✅ Sesuai', failLbl: '❌ Tidak Sesuai' },
          { icon: '💼', title: 'Kesesuaian Sikap & Gaya Kerja', desc: 'Orientasi kerja, minat, dan preferensi posisi', score: pillar.workAttitude, verdict: pv.workAttitude, passLbl: '✅ Selaras', failLbl: '❌ Tidak Selaras' },
        ].map((row) => (
          <div key={row.title} className="flex items-center gap-3.5 py-3 border-b last:border-b-0 border-slate-100 flex-wrap">
            <div className="text-xl w-9 text-center opacity-85">{row.icon}</div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold">{row.title}</div>
              <div className="text-xs text-slate-500 mt-0.5">{row.desc}</div>
            </div>
            <div className="font-serif text-xl font-bold text-teal-800 text-right min-w-[56px]">
              {row.score ?? '—'}
              <span className="text-xs text-slate-400 font-normal">/100</span>
            </div>
            <div className={`px-3 py-1 rounded-full text-[11px] font-bold border min-w-[110px] text-center ${PILL_CLS[row.verdict]}`}>
              {row.verdict === 'pass' ? row.passLbl : row.verdict === 'warn' ? '⚠️ Pertimbangkan' : row.verdict === 'fail' ? row.failLbl : '— Pending'}
            </div>
          </div>
        ))}

        <div
          className="mt-4 pl-4 pr-4.5 py-3 bg-teal-50 border-l-4 border-teal-600 rounded-r-md text-sm text-slate-600 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: summary }}
        />

        <div className="mt-4">
          <div className="text-[11px] font-bold tracking-wider uppercase text-slate-500 mb-2.5">Tindak Lanjut Manajer</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
            {[
              { val: 'direkomendasikan', icon: '✅', label: 'Lanjutkan ke Wawancara', cls: 'bg-teal-700 text-white border-teal-700 hover:bg-teal-800' },
              { val: 'evaluasi', icon: '⚠️', label: 'Butuh Evaluasi Lanjutan', cls: 'bg-white text-amber-700 border-amber-300 hover:bg-amber-50' },
              { val: 'tidak', icon: '❌', label: 'Tidak Dilanjutkan', cls: 'bg-white text-red-600 border-red-300 hover:bg-red-50' },
            ].map((b) => {
              const active = finalRec === b.val;
              return (
                <Button
                  key={b.val}
                  onClick={() => onSetFinalRec(b.val)}
                  variant="outline"
                  className={`h-auto py-3 flex flex-col gap-1 border-2 ${b.cls} ${active ? 'ring-2 ring-current ring-offset-2' : ''}`}
                >
                  <span className="text-lg">{b.icon}</span>
                  <span className="text-xs font-semibold">{b.label}</span>
                </Button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
