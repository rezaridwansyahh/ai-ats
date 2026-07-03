import { Badge } from '@/components/ui/badge';

/* ─────────────────────────────────────────────────────────────────────────────
   StepCard — shared chrome wrapper for every onboarding step's content
   (mirrors components/offer-contract/shared.jsx)
───────────────────────────────────────────────────────────────────────────── */

export function StepCard({ icon: Icon, title, badge, subtitle, headerRight, footerLeft, footerRight, children }) {
  return (
    <div className="border rounded-xl overflow-hidden bg-card">
      <div className="flex items-start justify-between gap-4 flex-wrap px-6 py-5 bg-muted/30 border-b">
        <div className="flex items-start gap-3">
          {Icon && (
            <div className="h-9 w-9 rounded-lg border bg-card flex items-center justify-center flex-shrink-0">
              <Icon className="h-4 w-4 text-muted-foreground" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif text-lg font-bold">{title}</span>
              {badge && (
                <Badge variant="outline" className="text-[10px] border-emerald-200 bg-emerald-50 text-emerald-700">
                  {badge}
                </Badge>
              )}
            </div>
            {subtitle && <p className="text-sm text-muted-foreground mt-0.5 max-w-2xl">{subtitle}</p>}
          </div>
        </div>
        {headerRight && (
          <div className="flex items-center gap-4 text-sm font-medium flex-shrink-0">{headerRight}</div>
        )}
      </div>

      <div>{children}</div>

      {(footerLeft || footerRight) && (
        <div className="flex items-center justify-between gap-3 flex-wrap px-6 py-4 bg-muted/30 border-t text-xs">
          <div className="text-muted-foreground">{footerLeft}</div>
          <div className="flex items-center gap-2">{footerRight}</div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Generic status pill — pass a TONE map matching your step's vocabulary
   (e.g. DOC_TONE in PreBoardingStep, CHECKIN_TONE in ProbationStep)
───────────────────────────────────────────────────────────────────────────── */

export function StatusPill({ status, toneMap }) {
  const t = toneMap[status];
  if (!t) return null;
  return (
    <Badge variant="outline" className={`text-[10px] gap-1.5 whitespace-nowrap ${t.pill}`}>
      <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${t.dot}`} />
      {t.label}
    </Badge>
  );
}