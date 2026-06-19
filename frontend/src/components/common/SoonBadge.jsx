/**
 * SoonBadge
 *
 * Variants:
 *   default — muted "soon" pill (standalone)
 *   inline  — same but ml-auto for use inside NavItem
 *   new     — green "NEW" pill + optional orange count circle
 */
export function SoonBadge({ label = 'soon', variant = 'default', count }) {
  if (variant === 'new') {
    return (
      <span className="ml-auto inline-flex items-center gap-1">
        <span className="text-[9px] font-bold uppercase tracking-wide bg-emerald-500 text-white px-1.5 py-0.5 rounded-full">
          {label}
        </span>
        {count != null && (
          <span className="text-[9px] font-bold bg-orange-500 text-white h-4 min-w-[16px] px-1 rounded-full flex items-center justify-center">
            {count}
          </span>
        )}
      </span>
    );
  }

  return (
    <span className={`
      text-[9px] font-semibold uppercase tracking-wide
      text-muted-foreground/50 bg-muted px-1.5 py-0.5 rounded-full
      ${variant === 'inline' ? 'ml-auto' : ''}
    `}>
      {label}
    </span>
  );
}