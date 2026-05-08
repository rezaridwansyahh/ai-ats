import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ITEMS, EPPS_ANSKEY, SCALE_ORDER, CON_PAIRS } from '../data/epps';

export default function EPPSTest({ onComplete, onAbort }) {
  const [answers, setAnswers] = useState(Array(225).fill(null));
  const [curQ, setCurQ] = useState(0);

  const total = ITEMS.length; // 225
  const q = ITEMS[curQ];
  const ans = answers[curQ];
  const pct = Math.round((curQ / total) * 100);
  const blk = Math.floor(curQ / 15) + 1;
  const isLast = curQ === total - 1;

  const setAns = (v) => {
    setAnswers((p) => {
      const next = [...p];
      next[curQ] = v;
      return next;
    });
    if (curQ < total - 1) {
      setCurQ(curQ + 1);
    } else {
      finish([...answers.slice(0, curQ), v, ...answers.slice(curQ + 1)]);
    }
  };

  const finish = (final) => {
    const scores = {};
    SCALE_ORDER.forEach((s) => (scores[s] = 0));
    let conScore = 0;
    final.forEach((a, i) => {
      if (!a) return;
      const k = EPPS_ANSKEY[i];
      const correct = (a === 'A' && k.a === 'a') || (a === 'B' && k.a === 'b');
      if (correct) scores[k.s]++;
    });
    CON_PAIRS.forEach(([i1, i2]) => {
      const k1 = EPPS_ANSKEY[i1 - 1];
      const k2 = EPPS_ANSKEY[i2 - 1];
      const a1 = final[i1 - 1];
      const a2 = final[i2 - 1];
      if (!a1 || !a2) return;
      const c1 = (a1 === 'A' && k1.a === 'a') || (a1 === 'B' && k1.a === 'b');
      const c2 = (a2 === 'A' && k2.a === 'a') || (a2 === 'B' && k2.a === 'b');
      if (c1 === c2) conScore++;
    });
    onComplete({ scores, conScore });
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-4 py-2">
        <div className="max-w-[900px] mx-auto flex items-center gap-2.5">
          <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 text-[11px] font-bold whitespace-nowrap">
            {curQ + 1} / {total}
          </span>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-700">Blok {blk}/15</span>
          <div className="flex-1 bg-slate-200 rounded-full h-1.5 overflow-hidden">
            <div className="h-1.5 rounded-full bg-amber-600 transition-all" style={{ width: `${pct}%` }} />
          </div>
          <span className="text-[11px] text-slate-400">{pct}%</span>
        </div>
      </div>

      <div className="max-w-[900px] mx-auto p-4 pb-20">
        <div className="bg-white border border-slate-200 rounded-xl p-5 md:p-6 shadow-sm">
          <div className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-amber-100 text-amber-700 font-serif font-bold text-sm mb-3">
            {curQ + 1}
          </div>
          <div className="text-xs text-slate-500 mb-3 px-3 py-2 bg-amber-50 rounded-lg">
            <strong>Petunjuk:</strong> Pilih pernyataan <strong>a</strong> atau <strong>b</strong> yang paling sesuai dengan diri Anda
            — jawaban langsung lanjut otomatis.
          </div>

          <div className="flex flex-col gap-2.5">
            {[
              { key: 'A', txt: q.a, label: 'a' },
              { key: 'B', txt: q.b, label: 'b' },
            ].map(({ key, txt, label }) => {
              const sel = ans === key;
              return (
                <button
                  key={key}
                  onClick={() => setAns(key)}
                  className={[
                    'flex items-start gap-3 px-4 py-3 rounded-lg border-2 text-left transition',
                    sel ? 'border-amber-600 bg-amber-100/70' : 'border-slate-200 bg-slate-50 hover:border-amber-400 hover:bg-amber-50/40',
                  ].join(' ')}
                >
                  <div
                    className={[
                      'w-7 h-7 rounded-lg grid place-items-center text-[11px] font-bold flex-shrink-0 font-serif',
                      sel ? 'bg-amber-600 text-white' : 'bg-white border-[1.5px] border-slate-200 text-amber-700',
                    ].join(' ')}
                  >
                    {label}
                  </div>
                  <div className="text-sm leading-relaxed text-slate-700">{txt}</div>
                </button>
              );
            })}
          </div>

          <div className="text-center text-[11px] text-slate-400 mt-3">{curQ + 1} dari {total} · Menjawab otomatis lanjut</div>

          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-200">
            <Button variant="outline" size="sm" onClick={() => setCurQ((q) => Math.max(0, q - 1))} disabled={curQ === 0}>
              ← Sebelumnya
            </Button>
            <div className="flex-1" />
            {isLast ? (
              <Button size="sm" disabled={!ans} onClick={() => finish(answers)} className="bg-amber-600 hover:bg-amber-700">
                Selesai →
              </Button>
            ) : (
              <Button
                size="sm"
                disabled={!ans}
                onClick={() => setCurQ((q) => Math.min(total - 1, q + 1))}
                className="bg-amber-600 hover:bg-amber-700"
              >
                Selanjutnya →
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onAbort} className="text-slate-400">
              Batalkan
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
