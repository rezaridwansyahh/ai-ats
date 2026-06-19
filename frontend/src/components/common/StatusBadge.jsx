const VARIANT_CLASSES = {
  screening:  'bg-blue-100   text-blue-700   border-blue-200',
  psych:      'bg-purple-100 text-purple-700 border-purple-200',
  bgcheck:    'bg-orange-100 text-orange-700 border-orange-200',
  offer:      'bg-emerald-100 text-emerald-700 border-emerald-200',
  onboarding: 'bg-teal-100   text-teal-700   border-teal-200',
  success:    'bg-emerald-100 text-emerald-700 border-emerald-200',
  warning:    'bg-amber-100  text-amber-700  border-amber-200',
  danger:     'bg-red-100    text-red-700    border-red-200',
  muted:      'bg-muted      text-muted-foreground border-border',
};

const DOT_CLASSES = {
  screening:  'bg-blue-500',
  psych:      'bg-purple-500',
  bgcheck:    'bg-orange-500',
  offer:      'bg-emerald-500',
  onboarding: 'bg-teal-500',
  success:    'bg-emerald-500',
  warning:    'bg-amber-500',
  danger:     'bg-red-500',
  muted:      'bg-muted-foreground',
};

export function StatusBadge({ label, variant = 'muted', dot = false, className = '' }) {
  const colors = VARIANT_CLASSES[variant] ?? VARIANT_CLASSES.muted;
  const dotColor = DOT_CLASSES[variant] ?? DOT_CLASSES.muted;

  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full border text-[10px] font-semibold ${colors} ${className}`}>
      {dot && <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${dotColor}`} />}
      {label}
    </span>
  );
}