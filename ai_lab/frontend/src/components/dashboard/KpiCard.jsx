import { Card, CardContent } from '@/components/ui/card';

export default function KpiCard({ label, value, sub, onClick }) {
  const clickable = typeof onClick === 'function';
  return (
    <Card
      className={`gap-0 py-0 shadow-none ${clickable ? 'cursor-pointer transition-colors hover:border-primary' : ''}`}
      onClick={onClick}
    >
      <CardContent className="px-3.5 py-3">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-display text-[26px] font-bold leading-tight">{value}</p>
        {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
      </CardContent>
    </Card>
  );
}