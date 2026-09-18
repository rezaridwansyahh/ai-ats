import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { FACTORS, FACTOR_MAX, FACTOR_ORDER } from '../data/pf';
import { getQuestionsByAssessmentCode } from '@/api/question.api';
import { saveAnswer } from '@/api/assessment-answer.api';
import { saveSubtestScore } from '@/api/assessment-score.api';
import { getPortalQuestions, getPortalProgress, savePortalAnswer, savePortalSubtestScore } from '@/api/portal-assessment.api';
import { findExistingScore, answersByQuestionId } from '@/utils/assessment-resume';

// 16PF — up to 105 items, 3 options (a/b/c). Auto-advance on pick.
// Scores off each question's fetched content (seeded from the old KEY map):
//  - Non-reasoning items: content.score_first/score_last are the a/c option points; 'b' (mid) always +1.
//  - Reasoning items (content.is_reasoning): content.correct_index (0/1/2) names the objectively
//    correct option — picking it → +2; picking 'b' (index 1) when it ISN'T correct → +1.
//  - Each raw[factor] is then standardized to 1–10 sten by raw / FACTOR_MAX[factor] × 10, clamped.
// FACTORS/FACTOR_MAX/FACTOR_ORDER stay static — presentational/scoring config, not question content.

const CHOICE_INDEX = { a: 0, b: 1, c: 2 };

export default function PFTest({ resultId, assessmentCode, portalHash, onComplete, onAbort }) {
  const [phase, setPhase] = useState('loading');
  const [items, setItems] = useState(null); // [{id, order_index, content:{text,choices,factor,is_reasoning,score_first,score_last,correct_index}}]
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
        const group = data?.questions?.pf;
        if (cancelled) return;
        if (!group?.items?.length) throw new Error('No 16PF questions found');
        const sorted = [...group.items].sort((a, b) => a.order_index - b.order_index);
        setItems(sorted);
        setSubtestId(group.subtest.id);

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
  const q = items[curQ].content;
  const factorCode = q.factor;
  const factor = FACTORS[factorCode] || { color: '#7C3AED', bg: '#F5F3FF', nameID: factorCode };
  const ans = answers[curQ];
  const pct = Math.round((curQ / total) * 100);
  const isLast = curQ === total - 1;
  const color = factor.color;
  const bg = factor.bg;

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
    const raw = {};
    FACTOR_ORDER.forEach((f) => (raw[f] = 0));
    final.forEach((choice, i) => {
      if (!choice) return;
      const c = items[i].content;
      const f = c.factor;
      if (!c.is_reasoning) {
        if (choice === 'a') raw[f] += c.score_first;
        else if (choice === 'b') raw[f] += 1;
        else if (choice === 'c') raw[f] += c.score_last;
      } else {
        const choiceIdx = CHOICE_INDEX[choice];
        if (choiceIdx === c.correct_index) raw[f] += 2;
        else if (choice === 'b' && c.correct_index !== 1) raw[f] += 1;
      }
    });
    const std = {};
    FACTOR_ORDER.forEach((f) => {
      const max = FACTOR_MAX[f] || 1;
      std[f] = Math.max(1, Math.min(10, Math.round((raw[f] / max) * 10)));
    });
    const res = { raw, std };
    if (resultId && subtestId) {
      const payload = { result_id: resultId, subtest_id: subtestId, score: res };
      (portalHash ? savePortalSubtestScore(portalHash, payload) : saveSubtestScore(payload)).catch(() => {});
    }
    onComplete(res);
  };

  const opts = [
    { key: 'a', txt: q.choices[0] },
    { key: 'b', txt: q.choices[1] },
    { key: 'c', txt: q.choices[2] },
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

          <div className="text-sm md:text-base font-medium text-slate-700 leading-relaxed mb-4">{q.text}</div>

          <div className="flex flex-col gap-2.5">
            {opts.map(({ key: k, txt }) => {
              const sel = ans === k;
              return (
                <button
                  key={k}
                  onClick={() => setAns(k)}
                  className="flex items-start gap-3 px-4 py-3 rounded-lg border-2 text-left transition hover:opacity-90"
                  style={{
                    borderColor: sel ? color : '#E9E3D5',
                    background: sel ? color + '15' : '#FAFAFA',
                  }}
                >
                  <div
                    className="w-7 h-7 rounded-lg grid place-items-center text-[12px] font-bold flex-shrink-0"
                    style={{
                      background: sel ? color : '#fff',
                      color: sel ? '#fff' : color,
                      border: sel ? `1.5px solid ${color}` : '1.5px solid #E9E3D5',
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
