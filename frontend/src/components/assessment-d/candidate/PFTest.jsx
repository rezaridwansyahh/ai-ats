import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FACTORS, KEY, FACTOR_MAX, PF_QS, FACTOR_ORDER } from '../data/pf';

// 16PF — 105 items, 3 options (a/b/c). Auto-advance on pick.
// Scoring per Battery D mockup line 2034-2044:
//  - KEY[i+1] is the scoring entry for item index i (1-indexed: KEY[1] is for question 0).
//  - Trichotomous form: [factor, aScore, cScore] (length 3). 'a' → +aScore, 'b' → +1, 'c' → +cScore.
//  - B-factor "reasoning" form: [factor, correctLetter] (length 2). The matching letter → +2, 'b' (unless 'b' is the correct one) → +1.
//  - Each raw[factor] is then standardized to 1–10 sten by raw / FACTOR_MAX[factor] × 10, clamped.

export default function PFTest({ onComplete, onAbort }) {
  const [answers, setAnswers] = useState(Array(105).fill(null));
  const [curQ, setCurQ] = useState(0);

  const total = PF_QS.length;
  const q = PF_QS[curQ];
  const itemNum = curQ + 1;
  const key = KEY[itemNum];
  const factorCode = key?.[0];
  const factor = FACTORS[factorCode] || { color: '#7C3AED', bg: '#F5F3FF', nameID: factorCode };
  const ans = answers[curQ];
  const pct = Math.round((curQ / total) * 100);
  const isLast = curQ === total - 1;
  const color = factor.color;
  const bg = factor.bg;

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
    const raw = {};
    FACTOR_ORDER.forEach((f) => (raw[f] = 0));
    final.forEach((choice, i) => {
      if (!choice) return;
      const k = KEY[i + 1];
      if (!k) return;
      const f = k[0];
      if (k.length === 3) {
        // Trichotomous: a → +aScore, b → +1, c → +cScore
        if (choice === 'a') raw[f] += k[1];
        else if (choice === 'b') raw[f] += 1;
        else if (choice === 'c') raw[f] += k[2];
      } else {
        // B-factor letter form: correct letter → +2; otherwise 'b' (mid) → +1 if not also the correct one
        if (choice === k[1]) raw[f] += 2;
        else if (choice === 'b' && k[1] !== 'b') raw[f] += 1;
      }
    });
    const std = {};
    FACTOR_ORDER.forEach((f) => {
      const max = FACTOR_MAX[f] || 1;
      std[f] = Math.max(1, Math.min(10, Math.round((raw[f] / max) * 10)));
    });
    onComplete({ raw, std });
  };

  const opts = [
    { key: 'a', txt: q.o[0] },
    { key: 'b', txt: q.o[1] },
    { key: 'c', txt: q.o[2] },
  ];

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-4 py-2">
        <div className="max-w-[900px] mx-auto flex items-center gap-2.5">
          <span
            className="px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap"
            style={{ background: bg, color }}
          >
            {curQ + 1} / {total}
          </span>
          <div className="flex-1 bg-slate-200 rounded-full h-1.5 overflow-hidden">
            <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
          </div>
          <span className="text-[11px] text-slate-400">{pct}%</span>
        </div>
      </div>

      <div className="max-w-[900px] mx-auto p-4 pb-20">
        <div className="bg-white border border-slate-200 rounded-xl p-5 md:p-6 shadow-sm">
          <div
            className="inline-flex items-center justify-center w-9 h-9 rounded-full font-serif font-bold text-sm mb-3"
            style={{ background: bg, color }}
          >
            {curQ + 1}
          </div>
          <div className="text-xs text-slate-500 mb-3 px-3 py-2 rounded-lg" style={{ background: color + '0D' }}>
            <strong>Petunjuk:</strong> Pilih satu pilihan (a/b/c) yang paling mencerminkan diri Anda — jawaban langsung lanjut otomatis.
          </div>

          <div className="text-sm md:text-base font-medium text-slate-700 leading-relaxed mb-4">{q.s}</div>

          <div className="flex flex-col gap-2.5">
            {opts.map(({ key: k, txt }) => {
              const sel = ans === k;
              return (
                <button
                  key={k}
                  onClick={() => setAns(k)}
                  className="flex items-start gap-3 px-4 py-3 rounded-lg border-2 text-left transition hover:opacity-90"
                  style={{
                    borderColor: sel ? color : '#E2E8F0',
                    background: sel ? color + '15' : '#FAFAFA',
                  }}
                >
                  <div
                    className="w-7 h-7 rounded-lg grid place-items-center text-[12px] font-bold flex-shrink-0"
                    style={{
                      background: sel ? color : '#fff',
                      color: sel ? '#fff' : color,
                      border: sel ? `1.5px solid ${color}` : '1.5px solid #E2E8F0',
                    }}
                  >
                    {k}
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
              <Button size="sm" disabled={!ans} onClick={() => finish(answers)} style={{ background: color }}>
                Selesai →
              </Button>
            ) : (
              <Button
                size="sm"
                disabled={!ans}
                onClick={() => setCurQ((q) => Math.min(total - 1, q + 1))}
                style={{ background: color }}
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
