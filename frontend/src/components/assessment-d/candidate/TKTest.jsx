import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getQuestionsByAssessmentCode } from '@/api/question.api';
import { saveAnswer } from '@/api/assessment-answer.api';
import { saveSubtestScore } from '@/api/assessment-score.api';
import { getPortalQuestions, savePortalAnswer, savePortalSubtestScore } from '@/api/portal-assessment.api';
import {
  rawToPercentile,
  pctToScore10,
  getVerdict,
  getGrade,
  getIQ,
  getIQClass,
  fmtTime,
  checkGIAnswer,
} from '../utils/scoring';

// Presentational-only (icon/color/copy) — not question content or scoring config,
// so it stays local rather than living in the question bank. Structural data
// (weight, time_limit_seconds, item count) comes from the API and is merged in.
const SUBS_META = {
  GI: { code: 'GI', icon: '🧠', color: '#0A6E5C', bg: '#F0F8F6',
    function: 'Mengukur kecepatan belajar, kapasitas pemecahan masalah, dan kemampuan berpikir lintas domain — verbal, numerik, logis, dan spasial secara terpadu.',
    instruction: 'Kerjakan soal beragam (verbal, numerik, logika, spasial) semampu mungkin dalam waktu yang tersedia. Lewati soal sulit dan lanjutkan ke soal berikutnya.' },
  PV: { code: 'PV', icon: '📖', color: '#0369A1', bg: '#EFF6FF',
    function: 'Kemampuan memahami konsep verbal, menemukan hubungan antar kata, dan berpikir abstrak melalui bahasa.',
    instruction: 'Setiap soal terdiri dari kalimat analogi yang belum lengkap. Pilih pasangan kata (A–E) yang paling tepat.' },
  KN: { code: 'KN', icon: '🔢', color: '#7C3AED', bg: '#F5F3FF',
    function: 'Kemampuan menalar dengan angka, memahami hubungan numerik, dan memecahkan masalah matematika dengan efisien.',
    instruction: 'Selesaikan masalah numerik atau matematika. Pilih satu jawaban. Tidak diperbolehkan menggunakan kalkulator.' },
  PA: { code: 'PA', icon: '🔷', color: '#059669', bg: '#ECFDF5',
    function: 'Kemampuan menemukan pola dalam materi non-verbal. Mengukur kecerdasan umum (fluid intelligence).',
    instruction: 'Temukan aturan deret angka, huruf, atau pola logis dan pilih elemen yang paling tepat.' },
  KA: { code: 'KA', icon: '📋', color: '#DB2777', bg: '#FDF2F8',
    function: 'Kemampuan memindai dan membandingkan informasi (kode, nama, angka) dengan cepat dan akurat.',
    instruction: 'Pilih jawaban yang IDENTIK dengan referensi, atau yang BERBEDA dari empat lainnya. Kerjakan secepat dan setepat mungkin.' },
};

// GI's `content.correct` was seeded verbatim from the old KEYS map.
function buildGiKeys(items) {
  const keys = {};
  items.forEach((it, idx) => { keys[idx + 1] = it.content.correct; });
  return keys;
}

export default function TKTest({ resultId, assessmentCode, portalHash, onComplete, onAbort }) {
  const [phase, setPhase] = useState('loading'); // loading | error | sub-intro | sub-active | sub-done
  const [subtests, setSubtests] = useState(null); // { GI: {subtest, items}, PV: {...}, ... }
  const [tkOrder, setTkOrder] = useState([]);
  const [code, setCode] = useState(null);
  const [answers, setAnswers] = useState({});
  const [curQ, setCurQ] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [done, setDone] = useState({});
  const tickRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = portalHash ? await getPortalQuestions(portalHash) : await getQuestionsByAssessmentCode(assessmentCode);
        const grouped = data?.questions ?? {};
        const tkParts = Object.values(grouped)
          .filter((g) => g.subtest.group_key === 'tk')
          .sort((a, b) => a.subtest.order_index - b.subtest.order_index);
        if (cancelled) return;
        if (tkParts.length === 0) throw new Error('No TK subtests found');
        const bySubtestKey = {};
        const initAnswers = {};
        tkParts.forEach((g) => {
          bySubtestKey[g.subtest.subtest_key] = g;
          initAnswers[g.subtest.subtest_key] = g.subtest.subtest_key === 'GI' ? {} : Array(g.items.length).fill(null);
        });
        setSubtests(bySubtestKey);
        setTkOrder(tkParts.map((g) => g.subtest.subtest_key));
        setAnswers(initAnswers);
        setCode(tkParts[0].subtest.subtest_key);
        setTimeLeft(tkParts[0].subtest.time_limit_seconds);
        setPhase('sub-intro');
      } catch {
        if (!cancelled) setPhase('error');
      }
    })();
    return () => { cancelled = true; };
  }, [assessmentCode, portalHash]);

  useEffect(() => {
    if (phase !== 'sub-active') return;
    tickRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(tickRef.current);
          handleFinishSub(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(tickRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, code]);

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

  const sub = code ? { ...SUBS_META[code], ...subtests?.[code]?.subtest } : null;
  const qs = code ? subtests?.[code]?.items : null;

  const persistAnswer = (questionId, answer, isCorrect, scoreEarned) => {
    if (!resultId || !questionId) return;
    const payload = { result_id: resultId, question_id: questionId, answer, is_correct: isCorrect, score_earned: scoreEarned };
    (portalHash ? savePortalAnswer(portalHash, payload) : saveAnswer(payload)).catch(() => {});
  };

  const scoreSub = (subCode) => {
    const meta = subtests[subCode].subtest;
    const items = subtests[subCode].items;
    let ok = 0;
    if (subCode === 'GI') {
      const giKeys = buildGiKeys(items);
      items.forEach((it, idx) => {
        if (checkGIAnswer(idx + 1, answers.GI[idx + 1] || '', giKeys)) ok++;
      });
    } else {
      answers[subCode].forEach((ans, idx) => {
        if (!ans) return;
        const q = items[idx];
        if (q && ans === q.content.correct) ok++;
      });
    }
    const pct = rawToPercentile(ok, items.length);
    const score10 = pctToScore10(pct);
    const grade = getGrade(pct);
    const verdict = getVerdict(score10);
    const res = { ok, items: items.length, pct, score10, g: grade.g, label: grade.l, verdict: verdict.v };
    if (subCode === 'GI') {
      res.iq = getIQ(ok);
      res.iqCls = getIQClass(res.iq);
    }
    if (resultId && meta.id) {
      const payload = { result_id: resultId, subtest_id: meta.id, score: res };
      (portalHash ? savePortalSubtestScore(portalHash, payload) : saveSubtestScore(payload)).catch(() => {});
    }
    return res;
  };

  const startSub = () => {
    setCurQ(0);
    setTimeLeft(sub.time_limit_seconds);
    setPhase('sub-active');
  };

  const handleFinishSub = (auto = false) => {
    if (!auto) {
      const answeredCount =
        code === 'GI'
          ? Object.values(answers.GI).filter((v) => v != null && v !== '').length
          : answers[code].filter((a) => a !== null).length;
      if (!window.confirm(`Selesaikan subtes ${code}?\n\nTerjawab: ${answeredCount}/${qs.length}\nWaktu tersisa: ${fmtTime(timeLeft)}`)) return;
    }
    clearInterval(tickRef.current);
    const res = scoreSub(code);
    setDone((d) => ({ ...d, [code]: res }));
    setPhase('sub-done');
  };

  const handleNextSub = () => {
    const idx = tkOrder.indexOf(code);
    if (idx === tkOrder.length - 1) {
      const allDone = { ...done };
      const composite =
        Math.round(
          (tkOrder.reduce((s, k) => s + (allDone[k]?.score10 || 0) * Number(subtests[k].subtest.weight), 0) /
            tkOrder.reduce((s, k) => s + Number(subtests[k].subtest.weight), 0)) *
            10,
        ) / 10;
      const compVerdict = getVerdict(Math.round(composite));
      onComplete({ sub: allDone, composite, compVerdict: compVerdict.v });
      return;
    }
    const next = tkOrder[idx + 1];
    setCode(next);
    setCurQ(0);
    setTimeLeft(subtests[next].subtest.time_limit_seconds);
    setPhase('sub-intro');
  };

  if (phase === 'sub-intro') {
    const idx = tkOrder.indexOf(code);
    return (
      <div className="max-w-[640px] mx-auto px-4 py-10">
        <div className="text-center mb-3 text-xs font-bold tracking-wider uppercase text-slate-500">
          Subtes {idx + 1} dari {tkOrder.length}
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-7 text-center shadow-lg">
          <div className="text-5xl mb-3">{sub.icon}</div>
          <h2 className="font-serif text-2xl mb-1" style={{ color: sub.color }}>
            {sub.code} — {sub.name}
          </h2>
          <div className="text-sm text-slate-500 mb-5 leading-relaxed">{sub.function}</div>
          <div className="flex justify-center gap-3 flex-wrap mb-5">
            <div className="px-4 py-2 rounded-lg border border-slate-200 text-center">
              <div className="font-serif text-xl font-bold">{qs.length}</div>
              <div className="text-[10px] text-slate-400">SOAL</div>
            </div>
            <div className="px-4 py-2 rounded-lg border border-slate-200 text-center">
              <div className="font-serif text-xl font-bold">{sub.time_limit_seconds / 60} menit</div>
              <div className="text-[10px] text-slate-400">DURASI</div>
            </div>
          </div>
          <div className="bg-slate-50 rounded-lg p-3.5 text-left mb-3">
            <div className="text-[11px] font-bold tracking-wider uppercase text-slate-500 mb-1.5">Petunjuk</div>
            <div className="text-sm text-slate-600 leading-relaxed">{sub.instruction}</div>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 text-left mb-4">
            ⚠️ Timer aktif. Tidak dapat di-pause. Pindah tab dicatat sebagai indikator integritas.
          </div>
          <Button onClick={startSub} className="w-full max-w-[280px] h-11 bg-gradient-to-br from-teal-800 to-teal-600 hover:opacity-90">
            Mulai {sub.code} →
          </Button>
          <div>
            <Button variant="outline" className="mt-2.5" onClick={onAbort}>
              ← Batalkan
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'sub-done') {
    const idx = tkOrder.indexOf(code);
    const isLast = idx === tkOrder.length - 1;
    const nextCode = tkOrder[idx + 1];
    const nextMeta = nextCode ? { ...SUBS_META[nextCode], ...subtests[nextCode].subtest } : null;
    return (
      <div className="max-w-[440px] mx-auto px-4 py-14 text-center">
        <div
          className="w-20 h-20 rounded-full inline-flex items-center justify-center text-4xl mb-5 border-[3px]"
          style={{ background: sub.bg, borderColor: sub.color }}
        >
          ✅
        </div>
        <h2 className="font-serif text-2xl mb-2" style={{ color: sub.color }}>
          Subtes {sub.code} Selesai
        </h2>
        <p className="text-sm text-slate-500 leading-relaxed mb-6">
          {isLast ? 'Semua subtes TK selesai!' : 'Lanjutkan ke subtes berikutnya saat Anda siap.'}
        </p>
        {!isLast && nextMeta && (
          <div
            className="rounded-lg px-4 py-3 mb-4 text-xs"
            style={{ background: nextMeta.bg, color: nextMeta.color, border: `1px solid ${nextMeta.color}30` }}
          >
            Subtes berikutnya — {nextMeta.name} · {subtests[nextCode].items.length} soal · {nextMeta.time_limit_seconds / 60} menit
          </div>
        )}
        <Button onClick={handleNextSub} className="bg-gradient-to-br from-teal-800 to-teal-600 hover:opacity-90 h-11 w-full max-w-[280px]">
          {isLast ? 'Lihat Hasil TK →' : 'Mulai Subtes Berikutnya →'}
        </Button>
      </div>
    );
  }

  return (
    <SubActive
      code={code}
      qs={qs}
      sub={sub}
      curQ={curQ}
      setCurQ={setCurQ}
      timeLeft={timeLeft}
      answers={answers}
      setAnswers={setAnswers}
      onFinish={() => handleFinishSub(false)}
      persistAnswer={persistAnswer}
    />
  );
}

function SubActive({ code, qs, sub, curQ, setCurQ, timeLeft, answers, setAnswers, onFinish, persistAnswer }) {
  const total = qs.length;
  const pct = Math.round((curQ / total) * 100);
  const lowTime = timeLeft <= 60;
  const timePct = (timeLeft / sub.time_limit_seconds) * 100;

  const getAnswered = () =>
    code === 'GI'
      ? Object.values(answers.GI).filter((v) => v != null && v !== '').length
      : answers[code].filter((a) => a !== null).length;

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <div className="sticky top-0 z-10 px-4 py-2.5 text-white" style={{ background: '#064E3B' }}>
        <div className="max-w-[900px] mx-auto flex items-center gap-3">
          <div className="text-[10px] font-bold px-2 py-1 rounded-full" style={{ background: sub.color, color: '#fff' }}>
            {code}
          </div>
          <div className={`font-serif text-xl font-bold tracking-wider min-w-[60px] ${lowTime ? 'text-red-300 animate-pulse' : ''}`}>
            {fmtTime(timeLeft)}
          </div>
          <div className="flex-1 bg-white/20 rounded-full h-1.5 overflow-hidden">
            <div className={`h-1.5 rounded-full ${lowTime ? 'bg-red-300' : 'bg-white'}`} style={{ width: `${timePct}%`, transition: 'width 1s linear' }} />
          </div>
          <div className="text-xs opacity-65 hidden md:block">Terjawab {getAnswered()}/{total}</div>
        </div>
      </div>

      <div className="sticky top-[42px] z-10 bg-white border-b border-slate-200 px-4 py-2">
        <div className="max-w-[900px] mx-auto flex items-center gap-2.5">
          <span className="px-2.5 py-1 rounded-full bg-teal-100 text-teal-700 text-[11px] font-bold whitespace-nowrap">
            {curQ + 1} / {total}
          </span>
          <div className="flex-1 bg-slate-200 rounded-full h-1.5 overflow-hidden">
            <div className="h-1.5 rounded-full bg-teal-600 transition-all" style={{ width: `${pct}%` }} />
          </div>
          <span className="text-[11px] text-slate-400">{pct}%</span>
        </div>
      </div>

      <div className="max-w-[900px] mx-auto p-4 pb-20">
        {code === 'GI' ? (
          <GIQuestion qs={qs} curQ={curQ} setCurQ={setCurQ} answers={answers} setAnswers={setAnswers} onFinish={onFinish} persistAnswer={persistAnswer} />
        ) : (
          <DATQuestion code={code} qs={qs} curQ={curQ} setCurQ={setCurQ} answers={answers} setAnswers={setAnswers} onFinish={onFinish} persistAnswer={persistAnswer} />
        )}
      </div>
    </div>
  );
}

function GIQuestion({ qs, curQ, setCurQ, answers, setAnswers, onFinish, persistAnswer }) {
  const q = qs[curQ];
  const n = q.order_index;
  const c = q.content;
  const ans = answers.GI[n] || '';
  const isLast = curQ === qs.length - 1;

  const setAns = (v) => {
    setAnswers((p) => ({ ...p, GI: { ...p.GI, [n]: v } }));
    persistAnswer(q.id, v, null, null);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 md:p-6 shadow-sm">
      <div className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-teal-100 text-teal-700 font-serif font-bold text-sm mb-3">
        {n}
      </div>
      <div className="text-sm leading-relaxed whitespace-pre-wrap text-slate-700 mb-4 select-none">{c.text}</div>

      {c.svg_html && (
        <div className="mb-4 overflow-x-auto" dangerouslySetInnerHTML={{ __html: c.svg_html }} />
      )}

      {q.question_type === 'input' ? (
        <>
          <Input
            value={ans}
            onChange={(e) => setAns(e.target.value)}
            placeholder={c.hint || 'Jawaban'}
            className={`max-w-[300px] ${ans ? 'border-teal-500 bg-teal-50' : ''}`}
          />
          {c.hint && <div className="text-[11px] text-slate-400 mt-1.5">{c.hint}</div>}
        </>
      ) : (
        <div className="flex flex-col gap-2">
          {c.choices.map((opt, i) => {
            const letter = String(i + 1);
            const sel = ans === letter;
            return (
              <button
                key={i}
                onClick={() => setAns(letter)}
                className={[
                  'flex items-start gap-3 px-3.5 py-2.5 rounded-lg border-[1.5px] text-left transition',
                  sel ? 'border-teal-600 bg-teal-100/70' : 'border-slate-200 bg-slate-50 hover:border-teal-400 hover:bg-teal-50/40',
                ].join(' ')}
              >
                <div
                  className={[
                    'w-6 h-6 rounded grid place-items-center text-[11px] font-bold flex-shrink-0',
                    sel ? 'bg-teal-600 text-white' : 'bg-white border-[1.5px] border-slate-200 text-slate-600',
                  ].join(' ')}
                >
                  {letter}
                </div>
                <div className="text-sm leading-relaxed">{opt}</div>
              </button>
            );
          })}
        </div>
      )}

      <NavFooter
        curQ={curQ}
        total={qs.length}
        canNext={isLast || ans}
        isLast={isLast}
        onPrev={() => setCurQ((q) => Math.max(0, q - 1))}
        onNext={() => (isLast ? onFinish() : setCurQ((q) => q + 1))}
        onJump={setCurQ}
        answeredAt={(i) => {
          const qq = qs[i];
          const a = answers.GI[qq.order_index];
          return a != null && a !== '';
        }}
      />
    </div>
  );
}

function DATQuestion({ code, qs, curQ, setCurQ, answers, setAnswers, onFinish, persistAnswer }) {
  const q = qs[curQ];
  const c = q.content;
  const ans = answers[code][curQ];
  const isLast = curQ === qs.length - 1;
  const setAns = (v) => {
    setAnswers((p) => {
      const arr = [...p[code]];
      arr[curQ] = v;
      return { ...p, [code]: arr };
    });
    persistAnswer(q.id, v, v === c.correct, v === c.correct ? 1 : 0);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 md:p-6 shadow-sm">
      <div className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-teal-100 text-teal-700 font-serif font-bold text-sm mb-3">
        {curQ + 1}
      </div>
      <div className="text-sm leading-relaxed whitespace-pre-wrap text-slate-700 mb-4">{c.text}</div>

      <div className="flex flex-col gap-2">
        {Object.entries(c.choices).map(([k, txt]) => {
          const sel = ans === k;
          return (
            <button
              key={k}
              onClick={() => setAns(k)}
              className={[
                'flex items-start gap-3 px-3.5 py-2.5 rounded-lg border-[1.5px] text-left transition',
                sel ? 'border-teal-600 bg-teal-100/70' : 'border-slate-200 bg-slate-50 hover:border-teal-400 hover:bg-teal-50/40',
              ].join(' ')}
            >
              <div
                className={[
                  'w-6 h-6 rounded grid place-items-center text-[11px] font-bold flex-shrink-0',
                  sel ? 'bg-teal-600 text-white' : 'bg-white border-[1.5px] border-slate-200 text-slate-600',
                ].join(' ')}
              >
                {k}
              </div>
              <div className="text-sm leading-relaxed">{txt}</div>
            </button>
          );
        })}
      </div>

      <NavFooter
        curQ={curQ}
        total={qs.length}
        canNext={isLast || ans}
        isLast={isLast}
        onPrev={() => setCurQ((q) => Math.max(0, q - 1))}
        onNext={() => (isLast ? onFinish() : setCurQ((q) => q + 1))}
        onJump={setCurQ}
        answeredAt={(i) => answers[code][i] != null}
      />
    </div>
  );
}

function NavFooter({ curQ, total, canNext, isLast, onPrev, onNext, onJump, answeredAt }) {
  return (
    <div className="mt-5 pt-4 border-t border-slate-200">
      <div className="flex flex-wrap gap-1 mb-3">
        {Array.from({ length: total }).map((_, i) => {
          const isCur = i === curQ;
          const isDone = answeredAt(i);
          return (
            <button
              key={i}
              onClick={() => onJump(i)}
              title={`Soal ${i + 1}`}
              className={[
                'w-3 h-3 rounded-sm border-[1.5px]',
                isCur ? 'bg-teal-600 border-teal-700' : isDone ? 'bg-teal-100 border-teal-500' : 'bg-transparent border-slate-300',
              ].join(' ')}
            />
          );
        })}
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onPrev} disabled={curQ === 0}>
          ← Sebelumnya
        </Button>
        <div className="flex-1" />
        <Button size="sm" disabled={!canNext} onClick={onNext} className="bg-teal-600 hover:bg-teal-700 disabled:opacity-40">
          {isLast ? 'Selesai →' : 'Selanjutnya →'}
        </Button>
      </div>
    </div>
  );
}
