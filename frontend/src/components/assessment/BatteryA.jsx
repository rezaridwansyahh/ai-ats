import { useState, useEffect, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const SUBTEST_META = {
  GI:      { label: 'Tes Kemampuan Kognitif (GI)', short: 'GI',      color: '#0A6E5C' },
  KA:      { label: 'Kecepatan & Akurasi (KA)',    short: 'KA',      color: '#DB2777' },
  BigFive: { label: 'Tes Kepribadian (Big Five)',  short: 'BigFive', color: '#7C3AED' },
  DISC:    { label: 'Tes Gaya Kerja (DISC)',       short: 'DISC',    color: '#0369A1' },
  Holland: { label: 'Tes Minat Kerja (Holland)',   short: 'Holland', color: '#059669' },
};

const SUBTEST_ORDER = ['GI', 'KA', 'BigFive', 'DISC', 'Holland'];

const SUBTEST_DURATIONS = { GI: 720, KA: 480 };

const SUBTEST_INTRO = {
  GI: {
    instructions: 'Pilih jawaban paling tepat untuk setiap soal. Soal mengukur penalaran logis, numerik, dan verbal. Jawablah secepat dan setepat mungkin.',
    note: 'Timer subtes dimulai otomatis saat Anda menekan "Mulai Tes". Pastikan tidak terganggu selama sesi berlangsung.',
    timed: true,
  },
  KA: {
    instructions: 'Soal mengukur kecepatan dan akurasi. Bacalah dengan cermat namun jangan terlalu lama berpikir. Pilih jawaban paling tepat.',
    note: 'Timer subtes dimulai otomatis saat Anda menekan "Mulai Tes". Fokus pada kecepatan tanpa mengabaikan ketelitian.',
    timed: true,
  },
  BigFive: {
    instructions: 'Untuk setiap pernyataan, pilih angka 1–5 yang paling mencerminkan diri Anda (1 = Sangat Tidak Sesuai, 5 = Sangat Sesuai). Menjawab langsung lanjut otomatis.',
    note: 'Tidak ada timer. Jawab jujur dan spontan — tidak ada benar/salah.',
    timed: false,
  },
  DISC: {
    instructions: 'Untuk setiap kelompok berisi 4 pernyataan, pilih satu yang PALING menggambarkan Anda (M) dan satu yang PALING TIDAK menggambarkan Anda (L). M dan L harus pada baris yang berbeda.',
    note: 'Tidak ada timer. Setelah M dan L terpilih pada baris berbeda, sistem otomatis melanjutkan ke kelompok berikutnya.',
    timed: false,
  },
  Holland: {
    instructions: 'Jawab Ya atau Tidak untuk setiap pernyataan tentang minat dan aktivitas. Menjawab langsung lanjut otomatis.',
    note: 'Tidak ada timer. Tidak ada benar/salah — pilih sesuai minat Anda.',
    timed: false,
  },
};

const fmtTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

const isAnswered = (subtest, ans) => {
  if (ans == null) return false;
  if (subtest === 'DISC') {
    const sel = ans.selected;
    return Number.isInteger(sel?.most) && Number.isInteger(sel?.least) && sel.most !== sel.least;
  }
  return ans.selected !== undefined && ans.selected !== null;
};

export default function BatteryA({ questions, completedSubtests = [], onSubtestComplete, submitting }) {
  const subtests = useMemo(
    () => SUBTEST_ORDER.filter((k) => Array.isArray(questions?.[k]) && questions[k].length > 0),
    [questions]
  );

  const [screen, setScreen]               = useState('overview');
  const [activeSubtest, setActiveSubtest] = useState(null);
  const [questionIdx, setQuestionIdx]     = useState(0);
  const [answers, setAnswers]             = useState({});
  const [timeLeft, setTimeLeft]           = useState(null);
  const [discFlash, setDiscFlash]         = useState(null);

  const finishingRef = useRef(false);
  const answersRef   = useRef({});
  const doneSet = useMemo(() => new Set(completedSubtests), [completedSubtests]);

  const finishSubtest = async (subtestKey = activeSubtest) => {
    if (finishingRef.current || !subtestKey) return;
    finishingRef.current = true;

    const flat = (answersRef.current[subtestKey] ?? [])
      .map((a, i) => a ? { subtest: subtestKey, index: i, selected: a.selected } : null)
      .filter(Boolean);

    try {
      await onSubtestComplete?.(subtestKey, flat);
      setActiveSubtest(null);
      setQuestionIdx(0);
      setTimeLeft(null);
      setScreen('overview');
    } catch {
      // parent surfaces the error; stay on the test screen so the user can retry
    } finally {
      finishingRef.current = false;
    }
  };

  useEffect(() => {
    if (screen !== 'test') return undefined;
    const t = setInterval(() => {
      setTimeLeft((s) => {
        if (s == null) return s;
        if (s <= 1) {
          clearInterval(t);
          finishSubtest();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [screen, activeSubtest]); // eslint-disable-line react-hooks/exhaustive-deps

  const startSubtest = (subtest) => {
    if (doneSet.has(subtest)) return;
    if (!answersRef.current[subtest]) {
      const next = { ...answersRef.current, [subtest]: [] };
      answersRef.current = next;
      setAnswers(next);
    }
    setActiveSubtest(subtest);
    setQuestionIdx(0);
    setScreen('intro');
  };

  const beginTest = () => {
    const dur = SUBTEST_DURATIONS[activeSubtest];
    setTimeLeft(dur ?? null);
    setQuestionIdx(0);
    setScreen('test');
  };

  const backToOverview = () => {
    setActiveSubtest(null);
    setTimeLeft(null);
    setScreen('overview');
  };

  const items = activeSubtest ? (questions[activeSubtest] ?? []) : [];
  const currentAnswer = activeSubtest ? answers[activeSubtest]?.[questionIdx] : null;

  const writeAnswer = (selected) => {
    const list = [...(answersRef.current[activeSubtest] ?? [])];
    list[questionIdx] = { index: questionIdx, selected };
    const next = { ...answersRef.current, [activeSubtest]: list };
    answersRef.current = next;
    setAnswers(next);
  };

  const goNext = () => {
    if (questionIdx + 1 < items.length) {
      setQuestionIdx((i) => i + 1);
    } else {
      finishSubtest();
    }
  };

  const goPrev = () => {
    if (questionIdx > 0) setQuestionIdx((i) => i - 1);
  };

  const recordAndAdvance = (selected) => {
    writeAnswer(selected);
    setTimeout(goNext, 0);
  };

  const handleDiscPick = (kind, idx) => {
    const prev = currentAnswer?.selected ?? {};
    const otherKind = kind === 'most' ? 'least' : 'most';
    if (prev[otherKind] === idx) {
      setDiscFlash(idx);
      setTimeout(() => setDiscFlash(null), 350);
      return;
    }
    const next = { ...prev, [kind]: idx };
    writeAnswer(next);
    if (Number.isInteger(next.most) && Number.isInteger(next.least) && next.most !== next.least) {
      setTimeout(() => {
        if (questionIdx + 1 < items.length) setQuestionIdx((i) => i + 1);
        else finishSubtest();
      }, 180);
    }
  };

  if (screen === 'overview') {
    return (
      <div className="space-y-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Battery A · Pilih tes untuk dimulai</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {subtests.map((k, i) => {
              const meta = SUBTEST_META[k];
              const done = doneSet.has(k);
              const itemsCount = (questions[k] ?? []).length;
              const locked = !done && i > 0 && !doneSet.has(subtests[i - 1]);
              return (
                <button
                  key={k}
                  onClick={() => !done && !locked && startSubtest(k)}
                  disabled={done || locked}
                  className="w-full flex items-center gap-3 p-3.5 rounded-lg border-2 text-left transition disabled:opacity-50"
                  style={{
                    borderColor: done ? '#BBF7D0' : locked ? '#E2E8F0' : meta.color,
                    background: done ? '#ECFDF5' : '#FAFBFC',
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-lg grid place-items-center text-[11px] font-bold flex-shrink-0"
                    style={{ background: done ? '#059669' : meta.color, color: '#fff' }}
                  >
                    {done ? 'OK' : meta.short}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-slate-700">{meta.label}</div>
                    <div className="text-xs text-muted-foreground">
                      {itemsCount} item{SUBTEST_DURATIONS[k] ? ` · ~${Math.round(SUBTEST_DURATIONS[k] / 60)} menit` : ' · Tanpa timer'}
                    </div>
                  </div>
                  <div className="text-xs font-bold" style={{ color: done ? '#059669' : '#64748B' }}>
                    {done ? 'SELESAI' : locked ? 'TERKUNCI' : 'MULAI →'}
                  </div>
                </button>
              );
            })}
          </CardContent>
        </Card>
        {submitting && (
          <p className="text-center text-xs text-muted-foreground">Mengirim hasil...</p>
        )}
      </div>
    );
  }

  if (screen === 'intro') {
    return (
      <SubtestIntro
        subtest={activeSubtest}
        items={items.length}
        onBegin={beginTest}
        onBack={backToOverview}
      />
    );
  }

  // ── test screen ──
  const meta = SUBTEST_META[activeSubtest];
  const q = items[questionIdx];
  if (!q) return null;

  const answered      = isAnswered(activeSubtest, currentAnswer);
  const isLast        = questionIdx + 1 === items.length;
  const total         = items.length;
  const totalAnswered = (answers[activeSubtest] ?? []).filter((a, i) => isAnswered(activeSubtest, a) && i < total).length;
  const progressPct   = Math.round(((questionIdx + 1) / total) * 100);
  const isAutoAdvance = activeSubtest === 'BigFive' || activeSubtest === 'Holland';
  const dur           = SUBTEST_DURATIONS[activeSubtest];

  return (
    <div className="space-y-3">
      {dur != null && timeLeft != null && (
        <div
          className="rounded-lg px-4 py-3 flex items-center gap-3 text-white sticky top-2 z-10"
          style={{ background: meta.color }}
        >
          <span className="text-xs font-bold px-2 py-1 rounded-full bg-white/20">{meta.short}</span>
          <span className="font-mono text-base font-bold tabular-nums">{fmtTime(timeLeft)}</span>
          <div className="flex-1 h-1.5 rounded-full bg-white/20 overflow-hidden">
            <div
              className="h-full bg-white transition-all"
              style={{ width: `${Math.max(0, Math.min(100, ((dur - timeLeft) / dur) * 100))}%` }}
            />
          </div>
          <span className="text-[11px] opacity-90">{total} soal</span>
        </div>
      )}

      <Card>
        <div className="px-6 pt-5 flex items-center gap-3">
          <span
            className="text-xs font-bold px-2.5 py-1 rounded-full"
            style={{ background: `${meta.color}15`, color: meta.color }}
          >
            {questionIdx + 1} / {total}
          </span>
          <div className="flex-1 h-2 rounded-full bg-border overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${progressPct}%`, background: meta.color }}
            />
          </div>
          <span className="text-xs text-muted-foreground">{totalAnswered}/{total} dijawab</span>
        </div>

        <CardHeader className="pt-5 pb-3">
          <p className="text-xs uppercase font-bold tracking-wider text-muted-foreground">
            {activeSubtest === 'DISC' ? `Kelompok ${questionIdx + 1} dari ${total}` : meta.label}
          </p>
          {activeSubtest === 'DISC' && (
            <p className="text-xs mt-1">
              <span className="font-bold" style={{ color: meta.color }}>M</span> = Paling Sesuai dengan Anda{'  '}
              <span className="font-bold text-red-600 ml-2">L</span> = Paling Tidak Sesuai
            </p>
          )}
          {activeSubtest !== 'DISC' && q.text && (
            <p className="text-base text-slate-700 mt-1">{q.text}</p>
          )}
        </CardHeader>

        <CardContent className="space-y-4 pb-6">
          {(activeSubtest === 'GI' || activeSubtest === 'KA') && (
            <McChoices q={q} color={meta.color} selected={currentAnswer?.selected} onPick={writeAnswer} />
          )}

          {activeSubtest === 'BigFive' && (
            <LikertScale color={meta.color} selected={currentAnswer?.selected} onPick={recordAndAdvance} />
          )}

          {activeSubtest === 'DISC' && (
            <DiscPicker
              q={q}
              color={meta.color}
              selected={currentAnswer?.selected ?? {}}
              flashIdx={discFlash}
              onPickMost={(i) => handleDiscPick('most', i)}
              onPickLeast={(i) => handleDiscPick('least', i)}
            />
          )}

          {activeSubtest === 'Holland' && (
            <YesNoChoice color={meta.color} selected={currentAnswer?.selected} onPick={recordAndAdvance} />
          )}

          <DotGrid
            count={total}
            currentIdx={questionIdx}
            isDone={(i) => isAnswered(activeSubtest, (answers[activeSubtest] ?? [])[i])}
            color={meta.color}
            onJump={(i) => setQuestionIdx(i)}
          />

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={goPrev}
              disabled={questionIdx === 0}
              className="text-sm px-4 py-2 rounded-lg border bg-white disabled:opacity-40"
            >
              ← Sebelumnya
            </button>
            {!isAutoAdvance && (
              <button
                onClick={goNext}
                disabled={!answered || submitting}
                className="text-sm px-5 py-2 rounded-lg text-white font-semibold disabled:opacity-40"
                style={{ background: meta.color }}
              >
                {isLast ? 'Selesai Subtes →' : 'Selanjutnya →'}
              </button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SubtestIntro({ subtest, items, onBegin, onBack }) {
  const meta  = SUBTEST_META[subtest];
  const intro = SUBTEST_INTRO[subtest];
  const dur   = SUBTEST_DURATIONS[subtest];
  const order = SUBTEST_ORDER.indexOf(subtest) + 1;

  return (
    <Card>
      <CardContent className="py-8 px-6 text-center space-y-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Tes {order} dari {SUBTEST_ORDER.length}
          </p>
          <h2 className="text-xl font-bold mt-1" style={{ color: meta.color, fontFamily: 'Georgia, serif' }}>
            {meta.label}
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            {items} item{dur ? ` · ~${Math.round(dur / 60)} menit` : ' · Tanpa timer'}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto">
          <div className="rounded-lg border p-3" style={{ borderColor: `${meta.color}40` }}>
            <div className="text-2xl font-bold" style={{ color: meta.color, fontFamily: 'Georgia, serif' }}>{items}</div>
            <div className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">Item</div>
          </div>
          <div className="rounded-lg border p-3" style={{ borderColor: `${meta.color}40` }}>
            <div className="text-2xl font-bold" style={{ color: meta.color, fontFamily: 'Georgia, serif' }}>
              {dur ? `${Math.round(dur / 60)}m` : '—'}
            </div>
            <div className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">Waktu</div>
          </div>
        </div>

        <div className="text-left max-w-md mx-auto rounded-lg p-4 bg-slate-50 border">
          <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground mb-1">Petunjuk</p>
          <p className="text-sm text-slate-700 leading-relaxed">{intro.instructions}</p>
        </div>

        <div
          className="text-left max-w-md mx-auto rounded-lg p-3 text-xs leading-relaxed"
          style={{
            background: intro.timed ? '#FEF3C7' : `${meta.color}10`,
            color: intro.timed ? '#92400E' : '#334155',
          }}
        >
          {intro.note}
        </div>

        <div className="flex flex-col items-center gap-2">
          <button
            onClick={onBegin}
            className="px-8 py-3 rounded-lg text-white font-semibold text-sm transition hover:-translate-y-0.5"
            style={{ background: meta.color }}
          >
            Mulai Tes →
          </button>
          <button onClick={onBack} className="text-xs text-muted-foreground hover:underline">
            ← Kembali ke Daftar
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

function DotGrid({ count, currentIdx, isDone, color, onJump }) {
  return (
    <div className="flex flex-wrap gap-1 pt-1">
      {Array.from({ length: count }, (_, i) => {
        const cur  = i === currentIdx;
        const done = isDone(i);
        return (
          <button
            key={i}
            onClick={() => onJump(i)}
            aria-label={`Soal ${i + 1}`}
            className="w-3.5 h-3.5 rounded-sm border transition"
            style={{
              background: cur ? color : done ? `${color}55` : '#fff',
              borderColor: cur ? color : done ? `${color}80` : '#E2E8F0',
            }}
          />
        );
      })}
    </div>
  );
}

function McChoices({ q, color, selected, onPick }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {q.choices.map((opt, i) => {
        const sel = selected === i;
        return (
          <button
            key={i}
            onClick={() => onPick(i)}
            className="text-left p-4 rounded-lg border-2 transition"
            style={{
              borderColor: sel ? color : '#E2E8F0',
              background: sel ? `${color}15` : '#FAFBFC',
            }}
          >
            <div
              className="w-7 h-7 rounded-md grid place-items-center text-xs font-bold mb-2"
              style={{
                background: sel ? color : '#fff',
                color: sel ? '#fff' : '#64748B',
                border: `1.5px solid ${sel ? color : '#E2E8F0'}`,
              }}
            >
              {String.fromCharCode(65 + i)}
            </div>
            <p className="text-sm leading-relaxed">{opt}</p>
          </button>
        );
      })}
    </div>
  );
}

function LikertScale({ color, selected, onPick }) {
  return (
    <>
      <div className="flex justify-center gap-2">
        {[1, 2, 3, 4, 5].map((v) => (
          <button
            key={v}
            onClick={() => onPick(v)}
            className="w-12 h-12 rounded-full border-2 font-bold transition"
            style={{
              borderColor: selected === v ? color : '#E2E8F0',
              background: selected === v ? `${color}15` : '#fff',
              color: selected === v ? color : '#334155',
            }}
          >
            {v}
          </button>
        ))}
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground px-2">
        <span className="w-12 text-center leading-tight">Sangat Tidak Sesuai</span>
        <span className="w-12 text-center leading-tight">Sangat Sesuai</span>
      </div>
    </>
  );
}

function DiscPicker({ q, color, selected, flashIdx, onPickMost, onPickLeast }) {
  const most  = selected.most;
  const least = selected.least;
  return (
    <>
      <div className="space-y-2">
        {q.options.map((opt, i) => {
          const isMost  = most === i;
          const isLeast = least === i;
          const flash   = flashIdx === i;
          return (
            <div
              key={i}
              className="flex items-center gap-3 p-3 rounded-lg border-2 transition"
              style={{
                borderColor: flash ? '#DC2626' : isMost ? color : isLeast ? '#DC2626' : '#E2E8F0',
                background: flash ? '#FEF2F2' : isMost ? `${color}10` : isLeast ? '#FEF2F2' : '#FAFBFC',
              }}
            >
              <span className="text-xs font-bold text-slate-500 w-5">{String.fromCharCode(65 + i)}.</span>
              <p className="flex-1 text-sm text-slate-700">{opt.text}</p>
              <button
                onClick={() => onPickMost(i)}
                aria-label="Paling sesuai"
                className="w-9 h-9 rounded-md border-2 font-bold text-xs transition"
                style={{
                  borderColor: isMost ? color : '#E2E8F0',
                  background: isMost ? color : '#fff',
                  color: isMost ? '#fff' : '#64748B',
                }}
              >
                M
              </button>
              <button
                onClick={() => onPickLeast(i)}
                aria-label="Paling tidak sesuai"
                className="w-9 h-9 rounded-md border-2 font-bold text-xs transition"
                style={{
                  borderColor: isLeast ? '#DC2626' : '#E2E8F0',
                  background: isLeast ? '#DC2626' : '#fff',
                  color: isLeast ? '#fff' : '#64748B',
                }}
              >
                L
              </button>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-center text-muted-foreground">
        Pilih M dan L pada baris yang berbeda — otomatis lanjut saat keduanya dipilih
      </p>
    </>
  );
}

function YesNoChoice({ color, selected, onPick }) {
  return (
    <div className="flex justify-center gap-3">
      {[
        { label: 'YA', value: true },
        { label: 'TIDAK', value: false },
      ].map(({ label, value }) => {
        const sel = selected === value;
        return (
          <button
            key={label}
            onClick={() => onPick(value)}
            className="flex-1 max-w-[200px] py-4 px-6 rounded-lg border-2 font-bold transition"
            style={{
              borderColor: sel ? color : '#E2E8F0',
              background: sel ? `${color}15` : '#fff',
              color: sel ? color : '#334155',
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
