import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { BF_ITEMS, BF_QS, LIKERT, TRAITS } from '../data/bigfive';
import { scoreBigFive } from '../utils/scoring';

export default function BigFiveTest({ onComplete, onAbort }) {
  const [answers, setAnswers] = useState(Array(BF_ITEMS.length).fill(null));
  const [curQ, setCurQ] = useState(0);

  const total = BF_ITEMS.length; // 44
  const [, trait] = BF_ITEMS[curQ]; // [qnum, trait, reversed]
  const traitMeta = TRAITS[trait] || {};
  const text = BF_QS[curQ] || '';
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
      onComplete(scoreBigFive(finalAnswers));
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-4 py-2">
        <div className="max-w-[900px] mx-auto flex items-center gap-2.5">
          <span className="px-2.5 py-1 rounded-full bg-sky-100 text-sky-700 text-[11px] font-bold whitespace-nowrap">
            {curQ + 1} / {total}
          </span>
          <span
            className="text-[11px] font-bold px-2 py-0.5 rounded"
            style={{ background: (traitMeta.bg || '#EFF6FF'), color: (traitMeta.color || '#0369A1') }}
          >
            {traitMeta.nameID || trait}
          </span>
          <div className="flex-1 bg-slate-200 rounded-full h-1.5 overflow-hidden">
            <div className="h-1.5 rounded-full bg-sky-600 transition-all" style={{ width: `${pct}%` }} />
          </div>
          <span className="text-[11px] text-slate-400">{pct}%</span>
        </div>
      </div>

      <div className="max-w-[900px] mx-auto p-4 pb-20">
        <div className="bg-white border border-slate-200 rounded-xl p-5 md:p-6 shadow-sm">
          <div className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-sky-100 text-sky-700 font-serif font-bold text-sm mb-3">
            {curQ + 1}
          </div>
          <div className="text-xs text-slate-500 mb-3 px-3 py-2 bg-sky-50 rounded-lg">
            <strong>Petunjuk:</strong> Nilai seberapa sesuai pernyataan berikut dengan diri Anda — jawaban langsung lanjut otomatis.
          </div>

          <div className="text-base font-medium text-slate-700 leading-relaxed mb-4 p-3.5 bg-[#FAFAF8] rounded-lg border border-slate-200">
            Saya adalah seseorang yang… <strong>{text}</strong>
          </div>

          <div className="flex flex-col gap-2">
            {LIKERT.map((label, i) => {
              const value = i + 1;
              const sel = ans === value;
              return (
                <button
                  key={value}
                  onClick={() => setAns(value)}
                  className={[
                    'flex items-center gap-3 px-3.5 py-2.5 rounded-lg border-[1.5px] text-left transition',
                    sel ? 'border-sky-600 bg-sky-100/70' : 'border-slate-200 bg-slate-50 hover:border-sky-400 hover:bg-sky-50/40',
                  ].join(' ')}
                >
                  <div
                    className={[
                      'w-7 h-7 rounded-full grid place-items-center text-[12px] font-bold flex-shrink-0',
                      sel ? 'bg-sky-600 text-white' : 'bg-white border-[1.5px] border-slate-200 text-slate-600',
                    ].join(' ')}
                  >
                    {value}
                  </div>
                  <div className="text-sm leading-relaxed">{label}</div>
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
              <Button
                size="sm"
                disabled={ans == null}
                onClick={() => onComplete(scoreBigFive(answers))}
                className="bg-sky-600 hover:bg-sky-700"
              >
                Selesai →
              </Button>
            ) : (
              <Button
                size="sm"
                disabled={ans == null}
                onClick={() => setCurQ((q) => Math.min(total - 1, q + 1))}
                className="bg-sky-600 hover:bg-sky-700"
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
