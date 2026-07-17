import { Check } from 'lucide-react';

/* ─────────────────────────────────────────────────────────────────────────────
   StatusPill — generic tone-mapped status badge, used across steps
   toneMap shape: { [status]: { pill: 'border/bg/text classes', dot: 'bg class', label: 'Display text' } }
───────────────────────────────────────────────────────────────────────────── */

export function StatusPill({ status, toneMap }) {
  const tone = toneMap[status];
  if (!tone) return null;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${tone.pill}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />
      {tone.label}
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   StepCard — the cream-panel wrapper used by every step body
───────────────────────────────────────────────────────────────────────────── */

export function StepCard({ icon: Icon, title, subtitle, headerRight, footerLeft, footerRight, children }) {
  return (
    <div className="border rounded-xl bg-card overflow-hidden">
      <div className="flex items-start justify-between gap-4 px-5 py-4 bg-muted/20 border-b">
        <div className="flex items-start gap-3">
          {Icon && (
            <div className="h-8 w-8 rounded-full border bg-card flex items-center justify-center flex-shrink-0 mt-0.5">
              <Icon className="h-4 w-4 text-foreground" />
            </div>
          )}
          <div>
            <h3 className="font-serif text-lg font-bold text-foreground">{title}</h3>
            {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
          </div>
        </div>
        {headerRight && (
          <div className="flex items-center gap-4 text-xs flex-shrink-0 pt-1">{headerRight}</div>
        )}
      </div>

      {children}

      {(footerLeft || footerRight) && (
        <div className="flex items-center justify-between gap-4 px-5 py-3.5 border-t bg-muted/10">
          <div className="text-sm text-muted-foreground">{footerLeft}</div>
          <div className="text-sm">{footerRight}</div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   StepRail — 5-step horizontal wizard nav (Configure → Schedule → Examine → Review → Decide)
───────────────────────────────────────────────────────────────────────────── */

export function StepRail({ steps, activeKey, onSelect }) {
  const activeIndex = steps.findIndex((s) => s.key === activeKey);

  return (
    <div className="border rounded-xl bg-card flex items-stretch overflow-hidden">
      {steps.map((step, i) => {
        const isActive = step.key === activeKey;
        const isDone = i < activeIndex;

        return (
          <div key={step.key} className="flex items-stretch flex-1">
            <button
              type="button"
              onClick={() => onSelect(step.key)}
              className={`flex items-center gap-3 flex-1 px-4 py-3 text-left transition-colors ${
                isActive ? 'bg-foreground text-background' : 'hover:bg-muted/30'
              }`}
            >
              <span
                className={`h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold ${
                  isActive
                    ? 'bg-amber-400 text-foreground'
                    : isDone
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                      : 'bg-muted text-muted-foreground'
                }`}
              >
                {isDone ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </span>
              <span>
                <div className={`text-sm font-bold ${isActive ? 'text-background' : 'text-foreground'}`}>
                  {step.label}
                </div>
                <div className={`text-xs ${isActive ? 'text-background/70' : 'text-muted-foreground'}`}>
                  {step.sub}
                </div>
              </span>
            </button>
            {i < steps.length - 1 && (
              <div className="flex items-center px-1 text-muted-foreground/40">›</div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   SplitRailHeader — the persistent Psych / Medical side-by-side context cards
───────────────────────────────────────────────────────────────────────────── */

function AssessmentContextCard({ data, emphasized }) {
  return (
    <div className={`border rounded-xl bg-card p-4 flex-1 ${emphasized ? 'border-foreground/30' : ''}`}>
      <h4 className="font-serif text-base font-bold text-foreground mb-1">{data.title}</h4>
      <div className="text-xs font-mono text-muted-foreground mb-3">{data.slaLabel}</div>
      <p className="text-sm text-foreground leading-relaxed">{data.flow}</p>
      <div className="border-t border-dashed mt-3 pt-3">
        <p className="text-xs text-muted-foreground">{data.rejectRoute}</p>
      </div>
    </div>
  );
}

export function SplitRailHeader({ psych, medical }) {
  return (
    <div className="space-y-3">
      <div className="font-serif text-sm font-bold text-foreground">Selection · split rail</div>
      <div className="flex flex-col lg:flex-row gap-4">
        <AssessmentContextCard data={psych} />
        <AssessmentContextCard data={medical} emphasized />
      </div>
    </div>
  );
}