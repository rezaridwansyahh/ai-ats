import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { SJT_QS, COMPS } from '../data/sjt';
import { fmtTime, scoreSJT } from '../utils/scoring';

const TOTAL_TIME = 30 * 60; // 1800 seconds, single global timer for the whole SJT
const FLASH_MS = 180;       // visual flash on selected option before auto-advance

export default function SJTTest({ onComplete, onAbort }) {
  const [phase, setPhase] = useState('active'); // active | timeup
  const [answers, setAnswers] = useState(Array(SJT_QS.length).fill(null));
  const [curQ, setCurQ] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  const [flashing, setFlashing] = useState(null); // option index being flashed
  const tickRef = useRef(null);
  const flashRef = useRef(null);

  const total = SJT_QS.length; // 22
  const q = SJT_QS[curQ];
  const comp = COMPS[q.comp] || { color: '#6366F1', colorLt: '#EEF2FF', name: q.comp };
  const ans = answers[curQ];
  const pct = Math.round((curQ / total) * 100);
  const lowTime = timeLeft <= 60;
  const isLast = curQ === total - 1;

  // Sticky countdown — auto-submit when timer hits zero.
  useEffect(() => {
    if (phase !== 'active') return;
    tickRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(tickRef.current);
          setPhase('timeup');
          // Auto-submit current state with whatever's been answered.
          setAnswers((curr) => {
            onComplete(scoreSJT(curr, SJT_QS, COMPS));
            return curr;
          });
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(tickRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  useEffect(() => () => {
    if (flashRef.current) clearTimeout(flashRef.current);
  }, []);

  const pick = (idx) => {
    if (flashing != null) return; // ignore rapid double-clicks during flash
    setFlashing(idx);
    setAnswers((prev) => {
      const next = [...prev];
      next[curQ] = idx;
      return next;
    });
    flashRef.current = setTimeout(() => {
      setFlashing(null);
      if (curQ < total - 1) {
        setCurQ(curQ + 1);
      } else {
        // Last question: compute final using the just-built answers.
        setAnswers((curr) => {
          onComplete(scoreSJT(curr, SJT_QS, COMPS));
          return curr;
        });
      }
    }, FLASH_MS);
  };

  const handleManualFinish = () => {
    const answered = answers.filter((a) => a != null).length;
    if (!window.confirm(`Selesaikan tes SJT?\n\nTerjawab: ${answered}/${total}\nWaktu tersisa: ${fmtTime(timeLeft)}`)) return;
    clearInterval(tickRef.current);
    onComplete(scoreSJT(answers, SJT_QS, COMPS));
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      {/* Global timer bar */}
      <div className="sticky top-0 z-10 px-4 py-2.5 text-white" style={{ background: '#312E81' }}>
        <div className="max-w-[900px] mx-auto flex items-center gap-3">
          <div className="text-[10px] font-bold px-2 py-1 rounded-full" style={{ background: comp.color, color: '#fff' }}>
            {q.comp}
          </div>
          <div className={`font-serif text-xl font-bold tracking-wider min-w-[60px] ${lowTime ? 'text-red-300 animate-pulse' : ''}`}>
            {fmtTime(timeLeft)}
          </div>
          <div className="flex-1 bg-white/20 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-1.5 rounded-full ${lowTime ? 'bg-red-300' : 'bg-white'}`}
              style={{ width: `${(timeLeft / TOTAL_TIME) * 100}%`, transition: 'width 1s linear' }}
            />
          </div>
          <div className="text-xs opacity-65 hidden md:block">
            Terjawab {answers.filter((a) => a != null).length}/{total}
          </div>
        </div>
      </div>

      {/* Question bar */}
      <div className="sticky top-[42px] z-10 bg-white border-b border-slate-200 px-4 py-2">
        <div className="max-w-[900px] mx-auto flex items-center gap-2.5">
          <span
            className="px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap"
            style={{ background: comp.colorLt, color: comp.color }}
          >
            Skenario {curQ + 1} / {total}
          </span>
          <span className="text-[11px] font-semibold text-slate-500 hidden md:inline">{comp.name}</span>
          <div className="flex-1 bg-slate-200 rounded-full h-1.5 overflow-hidden">
            <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, background: comp.color }} />
          </div>
          <span className="text-[11px] text-slate-400">{pct}%</span>
        </div>
      </div>

      <div className="max-w-[900px] mx-auto p-4 pb-20">
        <div className="bg-white border border-slate-200 rounded-xl p-5 md:p-6 shadow-sm">
          <div
            className="inline-flex items-center justify-center w-9 h-9 rounded-full font-serif font-bold text-sm mb-3"
            style={{ background: comp.colorLt, color: comp.color }}
          >
            {curQ + 1}
          </div>

          <div className="text-xs text-slate-500 mb-3 px-3 py-2 rounded-lg" style={{ background: comp.colorLt }}>
            <strong>Petunjuk:</strong> Bacalah situasi, lalu pilih tindakan yang menurut Anda paling tepat. Tidak ada pilihan yang sepenuhnya salah; pilih yang paling efektif menurut penilaian Anda. Memilih jawaban langsung lanjut ke skenario berikutnya.
          </div>

          <div className="text-sm leading-relaxed whitespace-pre-wrap text-slate-700 mb-3 p-3.5 bg-[#FAFAF8] rounded-lg border border-slate-200">
            <strong className="block mb-1.5 text-[11px] uppercase tracking-wider" style={{ color: comp.color }}>Situasi</strong>
            {q.situation}
          </div>

          <div className="text-sm font-semibold text-slate-700 mb-3">{q.q}</div>

          <div className="flex flex-col gap-2">
            {q.opts.map((opt, idx) => {
              const sel = ans === idx;
              const isFlashing = flashing === idx;
              return (
                <button
                  key={idx}
                  onClick={() => pick(idx)}
                  className={[
                    'flex items-start gap-3 px-3.5 py-2.5 rounded-lg border-[1.5px] text-left transition-all',
                    sel || isFlashing
                      ? 'border-indigo-600 bg-indigo-100/70'
                      : 'border-slate-200 bg-slate-50 hover:border-indigo-400 hover:bg-indigo-50/40',
                    isFlashing && 'ring-2 ring-indigo-400 ring-offset-1 scale-[1.01]',
                  ].filter(Boolean).join(' ')}
                  style={{
                    borderColor: sel || isFlashing ? comp.color : undefined,
                    background: sel || isFlashing ? comp.colorLt : undefined,
                  }}
                >
                  <div
                    className="w-7 h-7 rounded-lg grid place-items-center text-[12px] font-bold flex-shrink-0"
                    style={{
                      background: sel || isFlashing ? comp.color : '#fff',
                      color: sel || isFlashing ? '#fff' : comp.color,
                      border: `1.5px solid ${sel || isFlashing ? comp.color : '#E2E8F0'}`,
                    }}
                  >
                    {opt.l}
                  </div>
                  <div className="text-sm leading-relaxed">{opt.t}</div>
                </button>
              );
            })}
          </div>

          <div className="text-center text-[11px] text-slate-400 mt-3">
            {curQ + 1} dari {total} · Menjawab otomatis lanjut
          </div>

          <div className="mt-5 pt-4 border-t border-slate-200">
            <div className="flex flex-wrap gap-1 mb-3">
              {Array.from({ length: total }).map((_, i) => {
                const isCur = i === curQ;
                const isDone = answers[i] != null;
                return (
                  <button
                    key={i}
                    onClick={() => setCurQ(i)}
                    title={`Skenario ${i + 1}`}
                    className={[
                      'w-3 h-3 rounded-sm border-[1.5px]',
                      isCur
                        ? 'bg-indigo-600 border-indigo-700'
                        : isDone
                        ? 'bg-indigo-100 border-indigo-500'
                        : 'bg-transparent border-slate-300',
                    ].join(' ')}
                  />
                );
              })}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurQ((q) => Math.max(0, q - 1))}
                disabled={curQ === 0}
              >
                ← Sebelumnya
              </Button>
              <div className="flex-1" />
              {isLast ? (
                <Button
                  size="sm"
                  disabled={ans == null}
                  onClick={handleManualFinish}
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
    </div>
  );
}
