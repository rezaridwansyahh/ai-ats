import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { HOL_QS } from '../data/holland';
import { scoreHolland } from '../utils/scoring';

export default function HollandTest({ onComplete, onAbort }) {
  const [answers, setAnswers] = useState(Array(HOL_QS.length).fill(null));
  const [curQ, setCurQ] = useState(0);

  const total = HOL_QS.length; // 108
  const q = HOL_QS[curQ];
  const ans = answers[curQ];
  const pct = Math.round((curQ / total) * 100);
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
      const finalAnswers = [...answers.slice(0, curQ), v, ...answers.slice(curQ + 1)];
      onComplete(scoreHolland(finalAnswers));
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-4 py-2">
        <div className="max-w-[900px] mx-auto flex items-center gap-2.5">
          <span className="px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-700 text-[11px] font-bold whitespace-nowrap">
            {curQ + 1} / {total}
          </span>
          <div className="flex-1 bg-slate-200 rounded-full h-1.5 overflow-hidden">
            <div className="h-1.5 rounded-full bg-indigo-600 transition-all" style={{ width: `${pct}%` }} />
          </div>
          <span className="text-[11px] text-slate-400">{pct}%</span>
        </div>
      </div>

      <div className="max-w-[900px] mx-auto p-4 pb-20">
        <div className="bg-white border border-slate-200 rounded-xl p-5 md:p-6 shadow-sm">
          <div className="text-xs text-slate-500 mb-3 px-3 py-2 bg-indigo-50 rounded-lg">
            <strong>Petunjuk:</strong> Jawab <strong>YA</strong> jika pernyataan mencerminkan minat, kemampuan, atau kepribadian
            Anda — <strong>TIDAK</strong> jika tidak.
          </div>
          <div className="text-base font-medium text-slate-700 leading-relaxed mb-4 p-3.5 bg-[#FAFAF8] rounded-lg border border-slate-200">
            {curQ + 1}. {q.q}
          </div>

          <div className="flex gap-2.5 mb-3">
            <button
              onClick={() => setAns(true)}
              className={[
                'flex-1 px-3 py-2.5 rounded-lg border-[1.5px] text-sm font-bold transition',
                ans === true
                  ? 'border-green-600 bg-green-50 text-green-700'
                  : 'border-slate-200 bg-slate-50 hover:border-green-400',
              ].join(' ')}
            >
              👍 YA
            </button>
            <button
              onClick={() => setAns(false)}
              className={[
                'flex-1 px-3 py-2.5 rounded-lg border-[1.5px] text-sm font-bold transition',
                ans === false
                  ? 'border-red-600 bg-red-50 text-red-700'
                  : 'border-slate-200 bg-slate-50 hover:border-red-400',
              ].join(' ')}
            >
              👎 TIDAK
            </button>
          </div>

          <div className="text-center text-[11px] text-slate-400 mt-3">{curQ + 1} dari {total} · Menjawab otomatis lanjut</div>

          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-200">
            <Button variant="outline" size="sm" onClick={() => setCurQ((q) => Math.max(0, q - 1))} disabled={curQ === 0}>
              ← Sebelumnya
            </Button>
            <div className="flex-1" />
            {isLast ? (
              <Button
                size="sm"
                disabled={ans == null}
                onClick={() => onComplete(scoreHolland(answers))}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                Selesai →
              </Button>
            ) : (
              <Button
                size="sm"
                disabled={ans == null}
                onClick={() => setCurQ((q) => Math.min(total - 1, q + 1))}
                className="bg-indigo-600 hover:bg-indigo-700"
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
