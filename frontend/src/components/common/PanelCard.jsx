export function PanelCard({ title, subtitle, label, badge, footer, children }) {
  return (
    <div className="rounded-xl border border-border bg-card">

      {/* Header */}
      <div className="flex items-start justify-between gap-2 px-4 py-3 border-b border-border">
        <div>
          {label && (
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">
              {label}
            </p>
          )}
          <p className={label ? 'text-sm font-semibold' : 'text-xs font-semibold text-muted-foreground'}>
            {title}
          </p>
          {subtitle && (
            <p className="text-[11px] text-muted-foreground/70 mt-0.5">{subtitle}</p>
          )}
        </div>
        {badge && (
          <span className="text-xs font-bold bg-foreground text-background rounded-full px-2 py-0.5 flex-shrink-0">
            {badge}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="divide-y divide-border">
        {children}
      </div>

      {/* Footer strip */}
      {footer && (
        <div className="px-4 py-2.5 border-t border-border bg-muted/30 rounded-b-xl">
          <p className="text-[10px] text-muted-foreground leading-snug">{footer}</p>
        </div>
      )}

    </div>
  );
}