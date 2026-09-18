import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { scoreDISC } from '../utils/scoring';
import { getQuestionsByAssessmentCode } from '@/api/question.api';
import { saveAnswer } from '@/api/assessment-answer.api';
import { saveSubtestScore } from '@/api/assessment-score.api';
import { getPortalQuestions, savePortalAnswer, savePortalSubtestScore } from '@/api/portal-assessment.api';

// scoreDISC() still reads groups from the static data/disc.js file directly —
// same reasoning as BigFiveTest: DB content is a verbatim seed of that file.

// Each entry: { m: optionIdx|null, l: optionIdx|null }
const initAnswers = (n) => Array(n).fill(null).map(() => ({ m: null, l: null }));

export default function DISCTest({ resultId, assessmentCode, portalHash, onComplete, onAbort }) {
  const [phase, setPhase] = useState('loading');
  const [items, setItems] = useState(null); // [{id, order_index, content:{options:[{text,most_dim,least_dim}]}}]
  const [subtestId, setSubtestId] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [curQ, setCurQ] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = portalHash ? await getPortalQuestions(portalHash) : await getQuestionsByAssessmentCode(assessmentCode);
        const group = data?.questions?.disc;
        if (cancelled) return;
        if (!group?.items?.length) throw new Error('No DISC questions found');
        const sorted = [...group.items].sort((a, b) => a.order_index - b.order_index);
        setItems(sorted);
        setSubtestId(group.subtest.id);
        setAnswers(initAnswers(sorted.length));
        setPhase('active');
      } catch {
        if (!cancelled) setPhase('error');
      }
    })();
    return () => { cancelled = true; };
  }, [assessmentCode, portalHash]);

  if (phase === 'loading') {
    return <div className="max-w-[440px] mx-auto px-4 py-20 text-center text-sm text-slate-500">Memuat soal…</div>;
  }
  if (phase === 'error') {
    return (
      <div className="max-w-[440px] mx-auto px-4 py-20 text-center">
        <p className="text-sm text-rose-600 mb-4">Gagal memuat soal. Silakan coba lagi.</p>
        <Button variant="outline" onClick={onAbort}>← Kembali</Button>
      </div>
    );
  }

  const total = items.length;
  const q = items[curQ];
  const group = { options: q.content.options.map((o) => ({ t: o.text, p: o.most_dim, k: o.least_dim })) };
  const ans = answers[curQ];

  const persistAnswer = (m, l) => {
    if (!resultId) return;
    const payload = { result_id: resultId, question_id: q.id, answer: { m, l }, is_correct: null, score_earned: null };
    (portalHash ? savePortalAnswer(portalHash, payload) : saveAnswer(payload)).catch(() => {});
  };

  const finishAndScore = (finalAnswers) => {
    const res = scoreDISC(finalAnswers);
    if (resultId && subtestId) {
      const payload = { result_id: resultId, subtest_id: subtestId, score: res };
      (portalHash ? savePortalSubtestScore(portalHash, payload) : saveSubtestScore(payload)).catch(() => {});
    }
    onComplete(res);
  };
  const pct = Math.round((curQ / total) * 100);
  const isLast = curQ === total - 1;

  // Pick Most. If a Least is set on the same option, clear it.
  const pickMost = (idx) => {
    setAnswers((prev) => {
      const next = prev.map((row, i) => (i === curQ ? { m: idx, l: row.l === idx ? null : row.l } : row));
      persistAnswer(idx, next[curQ].l);
      maybeAdvance(next, idx, next[curQ].l);
      return next;
    });
  };

  const pickLeast = (idx) => {
    setAnswers((prev) => {
      const next = prev.map((row, i) => (i === curQ ? { l: idx, m: row.m === idx ? null : row.m } : row));
      persistAnswer(next[curQ].m, idx);
      maybeAdvance(next, next[curQ].m, idx);
      return next;
    });
  };

  const maybeAdvance = (nextAns, m, l) => {
    if (m == null || l == null) return;
    // Both picked → auto-advance after a brief tick so the user sees the row settle.
    setTimeout(() => {
      if (curQ < total - 1) {
        setCurQ(curQ + 1);
      } else {
        finishAndScore(nextAns);
      }
    }, 250);
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-4 py-2">
        <div className="max-w-[900px] mx-auto flex items-center gap-2.5">
          <span className="px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 text-[11px] font-bold whitespace-nowrap">
            Kelompok {curQ + 1} / {total}
          </span>
          <div className="flex-1 bg-slate-200 rounded-full h-1.5 overflow-hidden">
            <div className="h-1.5 rounded-full bg-purple-600 transition-all" style={{ width: `${pct}%` }} />
          </div>
          <span className="text-[11px] text-slate-400">{pct}%</span>
        </div>
      </div>

      <div className="max-w-[900px] mx-auto p-4 pb-20">
        <div className="bg-white border border-slate-200 rounded-xl p-5 md:p-6 shadow-sm">
          <div className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-purple-100 text-purple-700 font-serif font-bold text-sm mb-3">
            {curQ + 1}
          </div>
          <div className="text-xs text-slate-500 mb-3 px-3 py-2 bg-purple-50 rounded-lg leading-relaxed">
            <strong>Petunjuk:</strong> Untuk setiap kelompok 4 pernyataan, pilih satu yang <strong className="text-blue-700">PALING</strong> (M) mencerminkan Anda dan satu yang <strong className="text-red-700">PALING TIDAK</strong> (L) mencerminkan Anda. Setelah keduanya dipilih, otomatis lanjut.
          </div>

          <div className="flex flex-col gap-2">
            {group.options.map((opt, idx) => {
              const isM = ans.m === idx;
              const isL = ans.l === idx;
              const bothPicked = isM && isL; // Should never happen — clears handled above.
              const borderColor = bothPicked ? '#9333EA' : isM ? '#2563EB' : isL ? '#DC2626' : '#E9E3D5';
              const bg = bothPicked ? '#F3E8FF' : isM ? '#EFF6FF' : isL ? '#FEF2F2' : '#FAFAFA';
              return (
                <div
                  key={idx}
                  className="flex items-center gap-3 px-3.5 py-3 rounded-lg border-[1.5px] transition"
                  style={{ borderColor, background: bg }}
                >
                  <div className="flex-1 text-sm leading-relaxed text-slate-700">{opt.t}</div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => pickMost(idx)}
                      className={[
                        'px-3 py-1.5 rounded-md text-[11px] font-bold border-[1.5px] transition',
                        isM
                          ? 'bg-blue-600 border-blue-700 text-white'
                          : 'bg-white border-slate-200 text-slate-500 hover:border-blue-400 hover:text-blue-700',
                      ].join(' ')}
                    >
                      M (Paling)
                    </button>
                    <button
                      onClick={() => pickLeast(idx)}
                      className={[
                        'px-3 py-1.5 rounded-md text-[11px] font-bold border-[1.5px] transition',
                        isL
                          ? 'bg-red-600 border-red-700 text-white'
                          : 'bg-white border-slate-200 text-slate-500 hover:border-red-400 hover:text-red-700',
                      ].join(' ')}
                    >
                      L (Paling Tidak)
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-center text-[11px] text-slate-400 mt-3">
            {ans.m != null && ans.l != null
              ? 'Lanjut otomatis ke kelompok berikutnya…'
              : 'Pilih M dan L untuk melanjutkan'}
          </div>

          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-200">
            <Button variant="outline" size="sm" onClick={() => setCurQ((q) => Math.max(0, q - 1))} disabled={curQ === 0}>
              ← Sebelumnya
            </Button>
            <div className="flex-1" />
            {isLast ? (
              <Button
                size="sm"
                disabled={ans.m == null || ans.l == null}
                onClick={() => finishAndScore(answers)}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Selesai →
              </Button>
            ) : (
              <Button
                size="sm"
                disabled={ans.m == null || ans.l == null}
                onClick={() => setCurQ((q) => Math.min(total - 1, q + 1))}
                className="bg-purple-600 hover:bg-purple-700"
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
