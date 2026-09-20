import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  STYLES,
  STYLE_ORDER,
  TO_STYLES,
  RO_STYLES,
  E_STYLES,
  TO_MAX,
  RO_MAX,
  E_MAX,
} from '../data/msdt';
import { pctToScore10, getVerdict } from '../utils/scoring';
import { getQuestionsByAssessmentCode } from '@/api/question.api';
import { saveAnswer } from '@/api/assessment-answer.api';
import { saveSubtestScore } from '@/api/assessment-score.api';
import { getPortalQuestions, getPortalProgress, savePortalAnswer, savePortalSubtestScore } from '@/api/portal-assessment.api';
import { findExistingScore, answersByQuestionId } from '@/utils/assessment-resume';

// MSDT — 64 paired statements (A vs B). Scores off each question's fetched
// content.a.scale/content.b.scale (seeded from item.sa/item.sb) — same reasoning
// as EPPSTest/PAPITest. STYLES/STYLE_ORDER/*_STYLES/*_MAX stay static — family
// grouping/normalization config, not per-question content.
// Family-normalized: TO = Σ(raw of TO_STYLES)/TO_MAX × 100, same for RO and E. Dominant = top raw style.
// effectPct = (TO + RO) / 2. Per Battery D mockup lines 2073-2087.

const COLOR = '#DB2777';
const BG = '#FDF2F8';

export default function MSDTTest({ resultId, assessmentCode, portalHash, onComplete, onAbort }) {
  const [phase, setPhase] = useState('loading');
  const [items, setItems] = useState(null); // [{id, order_index, content:{a:{text,scale},b:{text,scale}}}]
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
        const group = data?.questions?.msdt;
        if (cancelled) return;
        if (!group?.items?.length) throw new Error('No MSDT questions found');
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
    const raw = {};
    STYLE_ORDER.forEach((s) => (raw[s] = 0));
    final.forEach((choice, i) => {
      const c = items[i].content;
      if (choice === 'A') raw[c.a.scale]++;
      else if (choice === 'B') raw[c.b.scale]++;
    });
    const sumFamily = (arr) => arr.reduce((s, k) => s + raw[k], 0);
    const TO = Math.min(100, Math.round((sumFamily(TO_STYLES) / TO_MAX) * 100));
    const RO = Math.min(100, Math.round((sumFamily(RO_STYLES) / RO_MAX) * 100));
    const E  = Math.min(100, Math.round((sumFamily(E_STYLES)  / E_MAX)  * 100));
    const dominant = Object.entries(raw).sort((a, b) => b[1] - a[1])[0][0];
    const effectPct = Math.round((TO + RO) / 2);
    const score10 = pctToScore10(effectPct);
    const res = {
      raw,
      TO,
      RO,
      E,
      dominant,
      effectPct,
      score10,
      verdict: getVerdict(score10).v,
      styleInfo: STYLES[dominant],
    };
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
          <span
            className="px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap"
            style={{ background: BG, color: COLOR }}
          >
            {curQ + 1} / {total}
          </span>
          <div className="flex-1 bg-slate-200 rounded-full h-1.5 overflow-hidden">
            <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, background: COLOR }} />
          </div>
          <span className="text-[11px] text-slate-400">{pct}%</span>
        </div>
      </div>

      <div className="max-w-[900px] mx-auto p-4 pb-20">
        <div className="bg-white border border-slate-200 rounded-xl p-5 md:p-6 shadow-sm">
          <div
            className="inline-flex items-center justify-center w-9 h-9 rounded-full font-serif font-bold text-sm mb-3"
            style={{ background: BG, color: COLOR }}
          >
            {curQ + 1}
          </div>
          <div className="text-xs text-slate-500 mb-3 px-3 py-2 rounded-lg" style={{ background: COLOR + '0D' }}>
            <strong>Petunjuk:</strong> Pilih pernyataan yang paling mencerminkan gaya kepemimpinan Anda — jawaban langsung lanjut otomatis.
          </div>

          <div className="flex flex-col gap-2.5">
            {[
              { key: 'A', txt: q.a.text, label: 'A' },
              { key: 'B', txt: q.b.text, label: 'B' },
            ].map(({ key: k, txt, label }) => {
              const sel = ans === k;
              return (
                <button
                  key={k}
                  onClick={() => setAns(k)}
                  className="flex items-start gap-3 px-4 py-3 rounded-lg border-2 text-left transition"
                  style={{
                    borderColor: sel ? COLOR : '#E9E3D5',
                    background: sel ? COLOR + '15' : '#FAFAFA',
                  }}
                >
                  <div
                    className="w-7 h-7 rounded-lg grid place-items-center text-[12px] font-bold flex-shrink-0"
                    style={{
                      background: sel ? COLOR : '#fff',
                      color: sel ? '#fff' : COLOR,
                      border: sel ? `1.5px solid ${COLOR}` : '1.5px solid #E9E3D5',
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
              <Button size="sm" disabled={!ans} onClick={() => finish(answers)} style={{ background: COLOR }}>
                Selesai →
              </Button>
            ) : (
              <Button
                size="sm"
                disabled={!ans}
                onClick={() => setCurQ((q) => Math.min(total - 1, q + 1))}
                style={{ background: COLOR }}
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
