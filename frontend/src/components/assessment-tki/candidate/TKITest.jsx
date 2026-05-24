import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ITEMS, ORDER } from '../data/tki';

const TOTAL_Q = ORDER.length; // 30

/**
 * 30-item forced-choice runner. Items are shown in the fixed shuffled ORDER.
 * Selecting a choice auto-advances (except on the last item). Calls
 * onComplete(answers) where answers is length-30 of 'A'|'B'|null (by display position).
 */
export default function TKITest({ onComplete, onAbort }) {
  const [answers, setAnswers] = useState(() => new Array(TOTAL_Q).fill(null));
  const [cur, setCur] = useState(0);

  const item = ITEMS[ORDER[cur]];
  const ans = answers[cur];
  const answered = answers.filter((a) => a !== null).length;
  const pct = Math.round(((cur + 1) / TOTAL_Q) * 100);
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

  const prev = () => { if (cur > 0) { setCur((c) => c - 1); window.scrollTo(0, 0); } };
  const next = () => { if (!isLast) { setCur((c) => c + 1); window.scrollTo(0, 0); } };

  const finish = () => {
    const unanswered = answers.filter((a) => a === null).length;
    if (unanswered > 0 && !window.confirm(`${unanswered} pernyataan belum dijawab. Lanjutkan ke hasil?`)) return;
    onComplete(answers);
  };

  return (
    <div className="max-w-[760px] mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-[11px] font-bold text-teal-700 bg-teal-50 rounded-full px-2.5 py-1 whitespace-nowrap">
          Pernyataan {cur + 1} / {TOTAL_Q}
        </span>
        <div className="flex-1 bg-slate-200 rounded-full h-1.5 overflow-hidden">
          <div className="h-1.5 rounded-full bg-teal-600 transition-all" style={{ width: `${pct}%` }} />
        </div>
        <span className="text-[11px] text-slate-400 whitespace-nowrap">{answered}/{TOTAL_Q}</span>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm select-none">
        <p className="text-xs text-slate-600 bg-teal-50/70 border-l-[3px] border-teal-600 rounded px-3.5 py-2.5 mb-4 leading-relaxed">
          Pilih <strong>satu pernyataan</strong> yang paling menggambarkan cara Anda biasanya menghadapi ketidaksepakatan atau konflik.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { key: 'A', text: item.a.t },
            { key: 'B', text: item.b.t },
          ].map(({ key, text }) => {
            const selected = ans === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => select(key)}
                className={[
                  'text-left rounded-lg border-2 p-4 transition-all',
                  selected ? 'border-teal-600 bg-teal-50' : 'border-slate-200 bg-slate-50 hover:border-teal-600 hover:bg-teal-50/60',
                ].join(' ')}
              >
                <div
                  className={[
                    'w-7 h-7 rounded-md inline-flex items-center justify-center font-extrabold text-xs mb-2 font-serif border-[1.5px]',
                    selected ? 'bg-teal-600 border-teal-600 text-white' : 'bg-white border-slate-200 text-slate-500',
                  ].join(' ')}
                >
                  {key}
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">{text}</p>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3 mt-5 pt-4 border-t border-slate-200">
          <Button variant="outline" size="sm" onClick={prev} disabled={cur === 0}>← Kembali</Button>
          <span className="flex-1 text-center text-[11px] text-slate-400">{cur + 1} / {TOTAL_Q}</span>
          {isLast ? (
            <Button size="sm" onClick={finish} className="bg-teal-700 hover:bg-teal-800">Lihat Hasil ✓</Button>
          ) : (
            <Button size="sm" onClick={next} disabled={ans === null} className="bg-teal-700 hover:bg-teal-800 disabled:opacity-40">
              Selanjutnya →
            </Button>
          )}
        </div>
      </div>

      {onAbort && (
        <div className="mt-3">
          <Button variant="ghost" size="sm" onClick={onAbort} className="text-slate-500">← Batalkan & kembali</Button>
        </div>
      )}
    </div>
  );
}
