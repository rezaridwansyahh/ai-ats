import { Badge } from '@/components/ui/badge';

const BASE = 'text-[11.5px] font-semibold';

const WARN = {
  Lewat:     { cls: 'bg-destructive/10 text-destructive',      label: '⛔ Lewat' },
  Segera:    { cls: 'bg-warning/15 text-warning-foreground',   label: '⚠ Segera' },
  Perhatian: { cls: 'bg-yellow-100 text-yellow-800',           label: '◔ Perhatian' },
};

const TONES = {
  muted: 'bg-muted text-muted-foreground',
  info:  'bg-blue-50 text-blue-700',
  warn:  'bg-warning/15 text-warning-foreground',
  ok:    'bg-emerald-50 text-emerald-700',
  crit:  'bg-destructive/10 text-destructive',
  ai:    'bg-violet-100 text-violet-700',
};

export function WarnTag({ warn }) {
  const w = WARN[warn];
  if (!w) return null;
  return <Badge variant="secondary" className={`${BASE} ${w.cls}`}>{w.label}</Badge>;
}

export function Tag({ tone = 'muted', title, children }) {
  return (
    <Badge variant="secondary" title={title} className={`${BASE} ${TONES[tone]}`}>
      {children}
    </Badge>
  );
}