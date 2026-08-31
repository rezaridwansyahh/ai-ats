import { useState } from 'react';
import { Check, Lock, ChevronDown, ChevronUp } from 'lucide-react';
import { LMS_DATA } from './mockData';

const STATUS_BADGE = {
  done:   { key: 'complete',    className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  active: { key: 'in_progress', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  locked: { key: 'locked',      className: 'bg-muted text-muted-foreground border-transparent' },
};

function ModuleRow({ mod, t, lang, goTo }) {
  const title = lang === 'id' ? mod.t_id : mod.t_en;
  const isDone = mod.status === 'done';
  const isActive = mod.status === 'active';

  return (
    <button
      onClick={() => goTo('module', { moduleId: mod.id })}
      className="w-full flex items-center gap-3 px-6 py-3 text-left border-t hover:bg-muted/30 transition-colors"
    >
      <span
        className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border ${
          isDone ? 'bg-emerald-600 border-emerald-600'
          : isActive ? 'border-emerald-600'
          : 'border-muted-foreground/40'
        }`}
      >
        {isDone && <Check className="h-3 w-3 text-white" />}
        {isActive && <span className="h-2 w-2 rounded-full bg-emerald-600" />}
      </span>

      <span className="flex-1 text-sm">{title}</span>

      <span className="hidden sm:block text-[11px] font-semibold tracking-wide text-muted-foreground uppercase w-24">
        {mod.cat}
      </span>

      <span className={`text-xs w-24 text-right flex-shrink-0 ${isDone ? 'text-muted-foreground' : 'text-amber-700 font-medium'}`}>
        {isDone
          ? (mod.score != null ? `${mod.score}%` : t.done)
          : `${t.due} ${mod.due}`}
      </span>
    </button>
  );
}

function PhaseCard({ phase, modules, t, lang, goTo }) {
  const [open, setOpen] = useState(phase.status === 'active');

  const doneCount = modules.filter((m) => m.status === 'done').length;
  const pct = modules.length ? Math.round((doneCount / modules.length) * 100) : 0;
  const totalMinutes = modules.reduce((sum, m) => sum + (m.dur || 0), 0);
  const hours = Math.round((totalMinutes / 60) * 10) / 10;

  const badge = STATUS_BADGE[phase.status];
  const isLocked = phase.status === 'locked';

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <button
        onClick={() => !isLocked && setOpen((o) => !o)}
        disabled={isLocked}
        className={`w-full flex items-center gap-4 px-6 py-5 text-left ${isLocked ? 'opacity-50 cursor-default' : 'hover:bg-muted/20'}`}
      >
        <span className="font-serif text-2xl text-emerald-700 w-9 flex-shrink-0">
          {String(phase.id).padStart(2, '0')}
        </span>

        <div className="flex-1 min-w-0">
          <div className="font-serif text-lg font-semibold truncate">
            {phase.key} · {phase.when}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {modules.length} {t.modules} · {hours}{t.hours} · {phase.range}
          </div>
        </div>

        {phase.status === 'active' && (
          <div className="hidden sm:flex items-center gap-2 w-28 flex-shrink-0">
            <div className="h-1 flex-1 rounded-full bg-muted overflow-hidden">
              <div className="h-full bg-blue-600" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-xs text-muted-foreground">{pct}%</span>
          </div>
        )}

        <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide flex-shrink-0 ${badge.className}`}>
          {isLocked && <Lock className="h-3 w-3" />}
          {t[badge.key]}
        </span>

        {!isLocked && (
          open ? <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        )}
      </button>

      {open && !isLocked && (
        <div className="pb-1">
          {modules.map((mod) => (
            <ModuleRow key={mod.id} mod={mod} t={t} lang={lang} goTo={goTo} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Journey({ t, lang, goTo }) {
  const { PHASES, MODULES } = LMS_DATA;
  const currentPhase = PHASES.find((p) => p.status === 'active');

  const trackLabel = lang === 'id' ? 'Jalur Backend Engineer · 6 Bulan' : 'Backend Engineer Track · 6 Months';
  const sixMonthLabel = lang === 'id' ? 'Jalur enam bulan' : 'Six-month track';
  const trackDates = lang === 'id' ? '9 Mar 2026 → 8 Sep 2026' : 'Mar 9, 2026 → Sep 8, 2026';

  return (
    <div className="max-w-3xl mx-auto pb-12">
      <div className="text-[11px] font-semibold tracking-wide text-emerald-700 uppercase mb-3">
        — {trackLabel}
      </div>
      <h1 className="font-serif text-3xl mb-2">
        {t.jr_title} <span className="italic">{t.jr_em}</span>
      </h1>
      <p className="text-sm text-muted-foreground mb-8 max-w-xl">{t.jr_sub}</p>

      <div className="rounded-xl border bg-card px-6 py-5 mb-6">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
          <span className="font-semibold text-foreground">{sixMonthLabel}</span>
          <span>{trackDates}</span>
        </div>
        <div className="text-center text-[11px] text-muted-foreground mb-2">{t.tl_today}</div>
        <div className="flex items-center">
          {PHASES.map((phase, i) => (
            <div key={phase.id} className="flex-1 flex items-center">
              <span
                className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${
                  phase.status === 'done' ? 'bg-emerald-600'
                  : phase.status === 'active' ? 'bg-white border-2 border-emerald-600'
                  : 'bg-muted border border-muted-foreground/30'
                }`}
              />
              {i < PHASES.length - 1 && (
                <div className={`h-px flex-1 ${phase.status === 'done' ? 'bg-emerald-600' : 'bg-muted-foreground/20'}`} />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2">
          {PHASES.map((phase) => (
            <span
              key={phase.id}
              className={`text-[10px] uppercase tracking-wide ${phase.id === currentPhase?.id ? 'text-emerald-700 font-semibold' : 'text-muted-foreground'}`}
            >
              {t.phase} {phase.id}
            </span>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {PHASES.map((phase) => (
          <PhaseCard
            key={phase.id}
            phase={phase}
            modules={MODULES.filter((m) => m.phase === phase.id)}
            t={t}
            lang={lang}
            goTo={goTo}
          />
        ))}
      </div>
    </div>
  );
}