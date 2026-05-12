import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  PAPI_LD_QS,
  SCORING_KEY,
  ROLE_DIMS,
  NEED_DIMS,
  ASPECTS,
  ASPECT_COLORS,
} from '../data/papil';

// PAPI-L — 90 paired statements. SCORING_KEY[i] = [itemNum, dimIfA, dimIfB].
// A → scores[key[1]]++, B → scores[key[2]]++. Per Battery D mockup lines 2118-2122.

export default function PAPILTest({ onComplete, onAbort }) {
  const [answers, setAnswers] = useState(Array(90).fill(null));
  const [curQ, setCurQ] = useState(0);

  const total = PAPI_LD_QS.length;
  const q = PAPI_LD_QS[curQ];
  const key = SCORING_KEY[curQ];
  const ans = answers[curQ];
  const pct = Math.round((curQ / total) * 100);
  const isLast = curQ === total - 1;
  const asp = ASPECTS.find((a) => a.dims.includes(key[1])) || ASPECTS[0];
  const aspColor = ASPECT_COLORS[asp.id] || '#0891B2';

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
    [...ROLE_DIMS, ...NEED_DIMS].forEach((d) => (scores[d] = 0));
    final.forEach((a, i) => {
      if (!a) return;
      const k = SCORING_KEY[i];
      if (!k) return;
      const dim = a === 'A' ? k[1] : k[2];
      if (scores[dim] != null) scores[dim]++;
    });
    const roleTotal = ROLE_DIMS.reduce((s, d) => s + scores[d], 0);
    const needTotal = NEED_DIMS.reduce((s, d) => s + scores[d], 0);
    onComplete({ scores, roleTotal, needTotal });
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-4 py-2">
        <div className="max-w-[900px] mx-auto flex items-center gap-2.5">
          <span
            className="px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap"
            style={{ background: aspColor + '15', color: aspColor }}
          >
            {curQ + 1} / {total}
          </span>
          <div className="flex-1 bg-slate-200 rounded-full h-1.5 overflow-hidden">
            <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, background: aspColor }} />
          </div>
          <span className="text-[11px] text-slate-400">{pct}%</span>
        </div>
      </div>

      <div className="max-w-[900px] mx-auto p-4 pb-20">
        <div className="bg-white border border-slate-200 rounded-xl p-5 md:p-6 shadow-sm">
          <div
            className="inline-flex items-center justify-center w-9 h-9 rounded-full font-serif font-bold text-sm mb-3"
            style={{ background: aspColor + '15', color: aspColor }}
          >
            {curQ + 1}
          </div>
          <div className="text-xs text-slate-500 mb-3 px-3 py-2 rounded-lg" style={{ background: aspColor + '0D' }}>
            <strong>Petunjuk:</strong> Pilih pernyataan yang paling mencerminkan peran dan preferensi kepemimpinan Anda — jawaban langsung lanjut otomatis.
          </div>

          <div className="flex flex-col gap-2.5">
            {[
              { key: 'A', txt: q.a, label: 'a' },
              { key: 'B', txt: q.b, label: 'b' },
            ].map(({ key: k, txt, label }) => {
              const sel = ans === k;
              return (
                <button
                  key={k}
                  onClick={() => setAns(k)}
                  className="flex items-start gap-3 px-4 py-3 rounded-lg border-2 text-left transition"
                  style={{
                    borderColor: sel ? aspColor : '#E2E8F0',
                    background: sel ? aspColor + '15' : '#FAFAFA',
                  }}
                >
                  <div
                    className="w-7 h-7 rounded-lg grid place-items-center text-[11px] font-bold flex-shrink-0 font-serif"
                    style={{
                      background: sel ? aspColor : '#fff',
                      color: sel ? '#fff' : aspColor,
                      border: sel ? `1.5px solid ${aspColor}` : '1.5px solid #E2E8F0',
                    }}
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
              <Button size="sm" disabled={!ans} onClick={() => finish(answers)} style={{ background: aspColor }}>
                Selesai →
              </Button>
            ) : (
              <Button
                size="sm"
                disabled={!ans}
                onClick={() => setCurQ((q) => Math.min(total - 1, q + 1))}
                style={{ background: aspColor }}
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
