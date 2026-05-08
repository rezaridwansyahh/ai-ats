import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SUBS, TK_ORDER, KEYS, WPT_RAW_QS, DATQS } from '../data/tk';
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

const QS_MAP = { GI: WPT_RAW_QS, PV: DATQS.PV, KN: DATQS.KN, PA: DATQS.PA, KA: DATQS.KA };

function emptyAnswers() {
  return {
    GI: {},
    PV: Array(25).fill(null),
    KN: Array(40).fill(null),
    PA: Array(40).fill(null),
    KA: Array(40).fill(null),
  };
}

export default function TKTest({ onComplete, onAbort }) {
  const [phase, setPhase] = useState('sub-intro'); // sub-intro | sub-active | sub-done
  const [code, setCode] = useState('GI');
  const [answers, setAnswers] = useState(emptyAnswers);
  const [curQ, setCurQ] = useState(0);
  const [timeLeft, setTimeLeft] = useState(SUBS.GI.time);
  const [done, setDone] = useState({}); // per-subtest result
  const tickRef = useRef(null);

  const sub = SUBS[code];
  const qs = QS_MAP[code];

  // Score current subtest
  const scoreSub = (subCode) => {
    const meta = SUBS[subCode];
    let ok = 0;
    if (subCode === 'GI') {
      for (const q of WPT_RAW_QS) {
        if (checkGIAnswer(q.n, answers.GI[q.n] || '', KEYS)) ok++;
      }
    } else {
      const list = QS_MAP[subCode];
      answers[subCode].forEach((ans, idx) => {
        if (!ans) return;
        const q = list[idx];
        if (q && ans === q.a) ok++;
      });
    }
    const pct = rawToPercentile(ok, meta.items);
    const score10 = pctToScore10(pct);
    const grade = getGrade(pct);
    const verdict = getVerdict(score10);
    const res = {
      ok,
      items: meta.items,
      pct,
      score10,
      g: grade.g,
      label: grade.l,
      verdict: verdict.v,
    };
    if (subCode === 'GI') {
      res.iq = getIQ(ok);
      res.iqCls = getIQClass(res.iq);
    }
    return res;
  };

  // Timer effect — only ticks during sub-active
  useEffect(() => {
    if (phase !== 'sub-active') return;
    tickRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(tickRef.current);
          // Auto-finish on time-out
          handleFinishSub(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(tickRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, code]);

  const startSub = () => {
    setCurQ(0);
    setTimeLeft(SUBS[code].time);
    setPhase('sub-active');
  };

  const handleFinishSub = (auto = false) => {
    if (!auto) {
      const answeredCount =
        code === 'GI'
          ? Object.values(answers.GI).filter((v) => v != null && v !== '').length
          : answers[code].filter((a) => a !== null).length;
      if (!window.confirm(`Selesaikan subtes ${code}?\n\nTerjawab: ${answeredCount}/${sub.items}\nWaktu tersisa: ${fmtTime(timeLeft)}`)) return;
    }
    clearInterval(tickRef.current);
    const res = scoreSub(code);
    setDone((d) => ({ ...d, [code]: res }));
    setPhase('sub-done');
  };

  const handleNextSub = () => {
    const idx = TK_ORDER.indexOf(code);
    if (idx === TK_ORDER.length - 1) {
      // Compute composite + finish
      const allDone = { ...done }; // last subtest already in 'done' from sub-done phase
      const composite =
        Math.round(
          (TK_ORDER.reduce((s, k) => s + (allDone[k]?.score10 || 0) * SUBS[k].weight, 0) /
            TK_ORDER.reduce((s, k) => s + SUBS[k].weight, 0)) *
            10,
        ) / 10;
      const compVerdict = getVerdict(Math.round(composite));
      onComplete({ sub: allDone, composite, compVerdict: compVerdict.v });
      return;
    }
    const next = TK_ORDER[idx + 1];
    setCode(next);
    setCurQ(0);
    setTimeLeft(SUBS[next].time);
    setPhase('sub-intro');
  };

  // ── PHASE: SUB-INTRO ──
  if (phase === 'sub-intro') {
    const idx = TK_ORDER.indexOf(code);
    return (
      <div className="max-w-[640px] mx-auto px-4 py-10">
        <div className="text-center mb-3 text-xs font-bold tracking-wider uppercase text-slate-500">
          Subtes {idx + 1} dari {TK_ORDER.length}
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-7 text-center shadow-lg">
          <div className="text-5xl mb-3">{sub.icon}</div>
          <h2 className="font-serif text-2xl mb-1" style={{ color: sub.color }}>
            {sub.code} — {sub.nameID}
          </h2>
          <div className="text-sm text-slate-500 mb-5 leading-relaxed">{sub.function}</div>
          <div className="flex justify-center gap-3 flex-wrap mb-5">
            <div className="px-4 py-2 rounded-lg border border-slate-200 text-center">
              <div className="font-serif text-xl font-bold">{sub.items}</div>
              <div className="text-[10px] text-slate-400">SOAL</div>
            </div>
            <div className="px-4 py-2 rounded-lg border border-slate-200 text-center">
              <div className="font-serif text-xl font-bold">{sub.time / 60} menit</div>
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

  // ── PHASE: SUB-DONE ──
  if (phase === 'sub-done') {
    const idx = TK_ORDER.indexOf(code);
    const isLast = idx === TK_ORDER.length - 1;
    const nextCode = TK_ORDER[idx + 1];
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
        {!isLast && nextCode && (
          <div
            className="rounded-lg px-4 py-3 mb-4 text-xs"
            style={{ background: SUBS[nextCode].bg, color: SUBS[nextCode].color, border: `1px solid ${SUBS[nextCode].color}30` }}
          >
            Subtes berikutnya — {SUBS[nextCode].nameID} · {SUBS[nextCode].items} soal · {SUBS[nextCode].time / 60} menit
          </div>
        )}
        <Button onClick={handleNextSub} className="bg-gradient-to-br from-teal-800 to-teal-600 hover:opacity-90 h-11 w-full max-w-[280px]">
          {isLast ? 'Lihat Hasil TK →' : 'Mulai Subtes Berikutnya →'}
        </Button>
      </div>
    );
  }

  // ── PHASE: SUB-ACTIVE ──
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
    />
  );
}

function SubActive({ code, qs, sub, curQ, setCurQ, timeLeft, answers, setAnswers, onFinish }) {
  const total = sub.items;
  const pct = Math.round((curQ / total) * 100);
  const lowTime = timeLeft <= 60;
  const timePct = (timeLeft / sub.totalTime || timeLeft / sub.time) * 100;

  const getAnswered = () =>
    code === 'GI'
      ? Object.values(answers.GI).filter((v) => v != null && v !== '').length
      : answers[code].filter((a) => a !== null).length;

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      {/* Timer bar */}
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

      {/* Q-bar */}
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
          <GIQuestion
            qs={qs}
            curQ={curQ}
            setCurQ={setCurQ}
            answers={answers}
            setAnswers={setAnswers}
            onFinish={onFinish}
          />
        ) : (
          <DATQuestion
            code={code}
            qs={qs}
            curQ={curQ}
            setCurQ={setCurQ}
            answers={answers}
            setAnswers={setAnswers}
            onFinish={onFinish}
          />
        )}
      </div>
    </div>
  );
}

function GIQuestion({ qs, curQ, setCurQ, answers, setAnswers, onFinish }) {
  const q = qs[curQ];
  const ans = answers.GI[q.n] || '';
  const isLast = curQ === qs.length - 1;

  const setAns = (v) => setAnswers((p) => ({ ...p, GI: { ...p.GI, [q.n]: v } }));

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 md:p-6 shadow-sm">
      <div className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-teal-100 text-teal-700 font-serif font-bold text-sm mb-3">
        {q.n}
      </div>
      <div className="text-sm leading-relaxed whitespace-pre-wrap text-slate-700 mb-4 select-none">{q.text}</div>

      {q.svgHtml && (
        <div className="mb-4 overflow-x-auto" dangerouslySetInnerHTML={{ __html: q.svgHtml }} />
      )}

      {q.type === 'input' ? (
        <>
          <Input
            value={ans}
            onChange={(e) => setAns(e.target.value)}
            placeholder={q.hint || 'Jawaban'}
            className={`max-w-[300px] ${ans ? 'border-teal-500 bg-teal-50' : ''}`}
          />
          {q.hint && <div className="text-[11px] text-slate-400 mt-1.5">{q.hint}</div>}
        </>
      ) : (
        <div className="flex flex-col gap-2">
          {q.opts.map((opt, i) => {
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
          const a = answers.GI[qq.n];
          return a != null && a !== '';
        }}
      />
    </div>
  );
}

function DATQuestion({ code, qs, curQ, setCurQ, answers, setAnswers, onFinish }) {
  const q = qs[curQ];
  const ans = answers[code][curQ];
  const isLast = curQ === qs.length - 1;
  const setAns = (v) =>
    setAnswers((p) => {
      const arr = [...p[code]];
      arr[curQ] = v;
      return { ...p, [code]: arr };
    });

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 md:p-6 shadow-sm">
      <div className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-teal-100 text-teal-700 font-serif font-bold text-sm mb-3">
        {curQ + 1}
      </div>
      <div className="text-sm leading-relaxed whitespace-pre-wrap text-slate-700 mb-4">{q.s}</div>

      <div className="flex flex-col gap-2">
        {Object.entries(q.o).map(([k, txt]) => {
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
  // For sub-tests with a lot of questions show compact dots
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
