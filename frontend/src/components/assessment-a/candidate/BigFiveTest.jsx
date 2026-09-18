import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { LIKERT, TRAITS } from '../data/bigfive';
import { scoreBigFive } from '../utils/scoring';
import { getQuestionsByAssessmentCode } from '@/api/question.api';
import { saveAnswer } from '@/api/assessment-answer.api';
import { saveSubtestScore } from '@/api/assessment-score.api';
import { getPortalQuestions, getPortalProgress, savePortalAnswer, savePortalSubtestScore } from '@/api/portal-assessment.api';
import { findExistingScore, answersByQuestionId } from '@/utils/assessment-resume';

// scoreBigFive() still reads trait/reverse mapping from the static data/bigfive.js
// file directly (not passed as a parameter, unlike TK's checkGIAnswer) — since the
// DB content is a verbatim seed of that same file, scoring stays correct as-is.
// An edit to a trait/reverse flag via the DB wouldn't affect scoring until
// scoreBigFive is also updated to take the mapping as an argument.

export default function BigFiveTest({ resultId, assessmentCode, portalHash, onComplete, onAbort }) {
  const [phase, setPhase] = useState('loading'); // loading | error | active
  const [items, setItems] = useState(null); // [{id, order_index, content:{text,trait,reverse}}, ...]
  const [subtestId, setSubtestId] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [curQ, setCurQ] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [{ data }, progress] = await Promise.all([
          portalHash ? getPortalQuestions(portalHash) : getQuestionsByAssessmentCode(assessmentCode),
          portalHash ? getPortalProgress(portalHash).then((r) => r.data) : Promise.resolve({ answers: [], scores: [] }),
        ]);
        const group = data?.questions?.bigfive;
        if (cancelled) return;
        if (!group?.items?.length) throw new Error('No Big Five questions found');
        const sorted = [...group.items].sort((a, b) => a.order_index - b.order_index);
        setItems(sorted);
        setSubtestId(group.subtest.id);

        // Resume: if already scored (refreshed right after finishing), skip
        // straight to the result; otherwise rehydrate whatever was answered.
        const existingScore = findExistingScore(progress.scores, group.subtest.id);
        if (existingScore) {
          onComplete(existingScore);
          return;
        }

        const answerMap = answersByQuestionId(progress.answers, sorted.map((it) => it.id));
        const restored = Array(sorted.length).fill(null);
        sorted.forEach((it, idx) => {
          const saved = answerMap.get(it.id);
          if (saved) restored[idx] = saved.answer;
        });
        setAnswers(restored);
        const firstUnanswered = restored.findIndex((a) => a == null);
        setCurQ(firstUnanswered === -1 ? sorted.length - 1 : firstUnanswered);
        setPhase('active');
      } catch {
        if (!cancelled) setPhase('error');
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
  const trait = q.content.trait;
  const traitMeta = TRAITS[trait] || {};
  const text = q.content.text;
  const ans = answers[curQ];

  const persistAnswer = (v) => {
    if (!resultId) return;
    const payload = { result_id: resultId, question_id: q.id, answer: v, is_correct: null, score_earned: null };
    (portalHash ? savePortalAnswer(portalHash, payload) : saveAnswer(payload)).catch(() => {});
  };

  const finishAndScore = (finalAnswers) => {
    const res = scoreBigFive(finalAnswers);
    if (resultId && subtestId) {
      const payload = { result_id: resultId, subtest_id: subtestId, score: res };
      (portalHash ? savePortalSubtestScore(portalHash, payload) : saveSubtestScore(payload)).catch(() => {});
    }
    onComplete(res);
  };
  const pct = Math.round((curQ / total) * 100);
  const isLast = curQ === total - 1;

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
      const finalAnswers = [...answers.slice(0, curQ), v, ...answers.slice(curQ + 1)];
      finishAndScore(finalAnswers);
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
                onClick={() => finishAndScore(answers)}
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
