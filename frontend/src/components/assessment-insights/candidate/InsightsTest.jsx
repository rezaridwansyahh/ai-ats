import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PAIRS, TOTAL_Q, sectionLabel } from '../data/insights';

/**
 * 72-item forced-choice runner. Selecting a choice auto-advances (except on the
 * last item). Calls onComplete(answers) where answers is length-72 of 'A'|'B'|null.
 */
export default function InsightsTest({ onComplete, onAbort }) {
  const [answers, setAnswers] = useState(() => new Array(TOTAL_Q).fill(null));
  const [cur, setCur] = useState(0);

  const q = PAIRS[cur];
  const ans = answers[cur];
  const answered = answers.filter((a) => a !== null).length;
  const pct = Math.round(((cur + 1) / TOTAL_Q) * 100);
  const section = sectionLabel(cur);
  const isLast = cur === TOTAL_Q - 1;

  const select = (v) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[cur] = v;
      return next;
    });
    if (!isLast) {
      setCur((c) => c + 1);
      window.scrollTo(0, 0);
    }
  };

  const prev = () => {
    if (cur > 0) {
      setCur((c) => c - 1);
      window.scrollTo(0, 0);
    }
  };
  const next = () => {
    if (!isLast) {
      setCur((c) => c + 1);
      window.scrollTo(0, 0);
    }
  };

  const finish = () => {
    const unanswered = answers.filter((a) => a === null).length;
    if (unanswered > 0 && !window.confirm(`${unanswered} soal belum dijawab. Lanjutkan ke hasil?`)) return;
    onComplete(answers);
  };

  return (
    <div className="max-w-[760px] mx-auto px-4 py-6">
      {/* Progress bar */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 bg-slate-200 rounded-full h-1.5 overflow-hidden">
          <div className="h-1.5 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 transition-all" style={{ width: `${pct}%` }} />
        </div>
        <span className="text-[11px] font-bold text-indigo-700 whitespace-nowrap">{answered}/{TOTAL_Q} terjawab</span>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm select-none">
        <div className="text-[11px] font-bold tracking-wider uppercase text-slate-400 mb-4">
          Soal {cur + 1} dari {TOTAL_Q} &nbsp;·&nbsp; {section}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { key: 'A', text: q.a },
            { key: 'B', text: q.b },
          ].map(({ key, text }) => {
            const selected = ans === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => select(key)}
                className={[
                  'text-left rounded-lg border-[1.5px] p-4 text-sm leading-relaxed transition-all',
                  selected
                    ? 'border-indigo-600 bg-indigo-50 font-semibold ring-2 ring-indigo-600/15'
                    : 'border-slate-200 bg-slate-50 hover:border-indigo-600 hover:bg-indigo-50/60',
                ].join(' ')}
              >
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 mb-1.5">Pilihan {key}</div>
                {text}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3 mt-5 pt-4 border-t border-slate-200">
          <Button variant="outline" size="sm" onClick={prev} disabled={cur === 0}>
            ← Sebelumnya
          </Button>
          <span className="flex-1 text-center text-[11px] text-slate-400">{cur + 1} / {TOTAL_Q}</span>
          {isLast ? (
            <Button size="sm" onClick={finish} className="bg-indigo-600 hover:bg-indigo-700">
              Lihat Hasil →
            </Button>
          ) : (
            <Button size="sm" onClick={next} disabled={ans === null} className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40">
              Berikutnya →
            </Button>
          )}
        </div>
      </div>

      {onAbort && (
        <div className="mt-3">
          <Button variant="ghost" size="sm" onClick={onAbort} className="text-slate-500">
            ← Batalkan & kembali
          </Button>
        </div>
      )}
    </div>
  );
}
