import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { CONSISTENCY } from '../data/holland';
import { getQuestionsByAssessmentCode } from '@/api/question.api';
import { saveAnswer } from '@/api/assessment-answer.api';
import { saveSubtestScore } from '@/api/assessment-score.api';
import { getPortalQuestions, savePortalAnswer, savePortalSubtestScore } from '@/api/portal-assessment.api';

// Scores off each question's fetched content.dimension (seeded from HOL_QS.t) —
// same reasoning as EPPSTest: the answer key travels with the question row.
// CONSISTENCY stays static — it's a fixed lookup table over RIASEC pair codes,
// not per-question content.

export default function HollandTest({ resultId, assessmentCode, portalHash, onComplete, onAbort }) {
  const [phase, setPhase] = useState('loading');
  const [items, setItems] = useState(null); // [{id, order_index, content:{text,dimension}}]
  const [subtestId, setSubtestId] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [curQ, setCurQ] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = portalHash ? await getPortalQuestions(portalHash) : await getQuestionsByAssessmentCode(assessmentCode);
        const group = data?.questions?.holland;
        if (cancelled) return;
        if (!group?.items?.length) throw new Error('No Holland questions found');
        const sorted = [...group.items].sort((a, b) => a.order_index - b.order_index);
        setItems(sorted);
        setSubtestId(group.subtest.id);
        setAnswers(Array(sorted.length).fill(null));
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
  const q = items[curQ].content;
  const ans = answers[curQ];
  const pct = Math.round((curQ / total) * 100);
  const isLast = curQ === total - 1;

  const persistAnswer = (v) => {
    if (!resultId) return;
    const payload = { result_id: resultId, question_id: items[curQ].id, answer: v, is_correct: null, score_earned: null };
    (portalHash ? savePortalAnswer(portalHash, payload) : saveAnswer(payload)).catch(() => {});
  };

  const setAns = (v) => {
    setAnswers((p) => {
      const next = [...p];
      next[curQ] = v;
      return next;
    });
    persistAnswer(v);
    if (curQ < total - 1) {
      setCurQ(curQ + 1);
    } else {
      finish([...answers.slice(0, curQ), v, ...answers.slice(curQ + 1)]);
    }
  };

  const finish = (final) => {
    const scores = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
    final.forEach((a, i) => {
      if (a === true) scores[items[i].content.dimension]++;
    });
    const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    const code3 = ranked.slice(0, 3).map((x) => x[0]).join('');
    const top1 = ranked[0][0];
    const top2 = ranked[1][0];
    const combo2 = top1 + top2;
    const consistency = CONSISTENCY[combo2] || CONSISTENCY[top2 + top1] || 'Tidak Diketahui';
    const top2Score = ranked.slice(0, 2).reduce((s, [, v]) => s + v, 0);
    const composite = Math.max(1, Math.min(10, Math.round(((top2Score / (18 * 2)) * 100) / 10)));
    const res = { scores, ranked, code3, top1, top2, combo2, consistency, composite };
    if (resultId && subtestId) {
      const payload = { result_id: resultId, subtest_id: subtestId, score: res };
      (portalHash ? savePortalSubtestScore(portalHash, payload) : saveSubtestScore(payload)).catch(() => {});
    }
    onComplete(res);
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
            {curQ + 1}. {q.text}
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
              <Button size="sm" disabled={ans == null} onClick={() => finish(answers)} className="bg-indigo-600 hover:bg-indigo-700">
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
