import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const SUBTEST_META = {
  GI:      { label: 'Tes Kemampuan Kognitif (GI)',      icon: '🧠', color: '#0A6E5C' },
  KA:      { label: 'Kecepatan & Akurasi (KA)',         icon: '📋', color: '#DB2777' },
  BigFive: { label: 'Tes Kepribadian (Big Five)',       icon: '🌟', color: '#7C3AED' },
  DISC:    { label: 'Tes Gaya Kerja (DISC)',            icon: '⚙️', color: '#0369A1' },
  Holland: { label: 'Tes Minat Kerja (Holland)',        icon: '🎯', color: '#059669' },
};

const SUBTEST_ORDER = ['GI', 'KA', 'BigFive', 'DISC', 'Holland'];

export default function BatteryA({ questions, onComplete, submitting }) {
  const subtests = useMemo(
    () => SUBTEST_ORDER.filter((k) => Array.isArray(questions?.[k]) && questions[k].length > 0),
    [questions]
  );

  const [screen, setScreen] = useState('overview');
  const [activeSubtest, setActiveSubtest] = useState(null);
  const [questionIdx, setQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState({});

  const completedSubtests = Object.keys(answers).filter(
    (k) => answers[k]?.length === questions[k]?.length
  );

  const startSubtest = (subtest) => {
    setActiveSubtest(subtest);
    setQuestionIdx(0);
    setAnswers((prev) => ({ ...prev, [subtest]: prev[subtest] ?? [] }));
    setScreen('test');
  };

  const recordAnswer = (selected) => {
    const items = questions[activeSubtest];
    const current = answers[activeSubtest] ?? [];
    const next = [...current];
    next[questionIdx] = { index: questionIdx, selected };
    const updated = { ...answers, [activeSubtest]: next };
    setAnswers(updated);

    if (questionIdx + 1 < items.length) {
      setQuestionIdx(questionIdx + 1);
    } else {
      const finishedAll =
        SUBTEST_ORDER
          .filter((k) => questions[k]?.length)
          .every((k) => updated[k]?.length === questions[k].length);
      if (finishedAll) {
        const flat = [];
        for (const k of SUBTEST_ORDER) {
          for (const a of updated[k] ?? []) flat.push({ subtest: k, ...a });
        }
        onComplete(flat);
      } else {
        setActiveSubtest(null);
        setScreen('overview');
      }
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
              const done = completedSubtests.includes(k);
              const items = questions[k] ?? [];
              const locked = !done && i > 0 && !completedSubtests.includes(subtests[i - 1]);
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
                    className="w-9 h-9 rounded-lg grid place-items-center text-base flex-shrink-0"
                    style={{ background: done ? '#059669' : meta.color, color: '#fff' }}
                  >
                    {done ? '✓' : meta.icon}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-slate-700">{meta.label}</div>
                    <div className="text-xs text-muted-foreground">{items.length} item</div>
                  </div>
                  <div className="text-xs font-bold" style={{ color: done ? '#059669' : '#64748B' }}>
                    {done ? 'SELESAI' : locked ? '🔒' : 'MULAI →'}
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

  // ── test screen ──
  const items = questions[activeSubtest] ?? [];
  const q = items[questionIdx];
  if (!q) return null;
  const pct = Math.round(((questionIdx + 1) / items.length) * 100);
  const meta = SUBTEST_META[activeSubtest];
  const currentSelected = answers[activeSubtest]?.[questionIdx]?.selected;

  return (
    <Card>
      <div className="px-6 pt-5 flex items-center gap-3">
        <span
          className="text-xs font-bold px-2.5 py-1 rounded-full"
          style={{ background: `${meta.color}15`, color: meta.color }}
        >
          {questionIdx + 1} / {items.length}
        </span>
        <div className="flex-1 h-2 rounded-full bg-border overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${pct}%`, background: meta.color }}
          />
        </div>
        <span className="text-xs text-muted-foreground">{pct}%</span>
      </div>

      <CardHeader className="pt-5 pb-3">
        <p className="text-xs uppercase font-bold tracking-wider text-muted-foreground">
          {meta.label}
        </p>
        <p className="text-base text-slate-700 mt-1">{q.text}</p>
      </CardHeader>

      <CardContent className="space-y-4 pb-6">
        {(activeSubtest === 'GI' || activeSubtest === 'KA') && (
          <McChoices q={q} color={meta.color} selected={currentSelected} onPick={recordAnswer} />
        )}

        {activeSubtest === 'BigFive' && (
          <LikertScale color={meta.color} selected={currentSelected} onPick={recordAnswer} />
        )}

        {activeSubtest === 'DISC' && (
          <DiscPicker
            q={q}
            color={meta.color}
            selected={currentSelected}
            onPick={recordAnswer}
          />
        )}

        {activeSubtest === 'Holland' && (
          <YesNoChoice color={meta.color} selected={currentSelected} onPick={recordAnswer} />
        )}
      </CardContent>
    </Card>
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

function DiscPicker({ q, color, selected, onPick }) {
  const most = selected?.most;
  const least = selected?.least;
  const update = (kind, idx) => {
    const next = { most, least, [kind]: idx };
    if (next.most !== undefined && next.least !== undefined && next.most !== next.least) {
      onPick(next);
    } else if ((kind === 'most' && next.least !== idx) || (kind === 'least' && next.most !== idx)) {
      // partial — just record locally by emitting the partial selection
      onPick(next);
    }
  };
  return (
    <>
      <p className="text-xs text-center text-muted-foreground">
        Pilih <strong style={{ color }}>M</strong> untuk yang PALING seperti Anda dan{' '}
        <strong className="text-red-600">L</strong> untuk yang PALING TIDAK seperti Anda.
      </p>
      <div className="space-y-2">
        {q.options.map((opt, i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-lg border bg-slate-50">
            <button
              onClick={() => update('most', i)}
              className="w-8 h-8 rounded-md border-2 font-bold text-xs"
              style={{
                borderColor: most === i ? color : '#E2E8F0',
                background: most === i ? color : '#fff',
                color: most === i ? '#fff' : '#64748B',
              }}
            >
              M
            </button>
            <p className="flex-1 text-sm text-slate-700">{opt.text}</p>
            <button
              onClick={() => update('least', i)}
              className="w-8 h-8 rounded-md border-2 font-bold text-xs"
              style={{
                borderColor: least === i ? '#DC2626' : '#E2E8F0',
                background: least === i ? '#DC2626' : '#fff',
                color: least === i ? '#fff' : '#64748B',
              }}
            >
              L
            </button>
          </div>
        ))}
      </div>
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
