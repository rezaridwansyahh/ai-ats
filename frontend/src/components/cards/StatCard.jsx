import { TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function StatCard({ icon, label, value, loading, trend, trendLabel, iconBg }) {
  return (
    <Card className="group relative overflow-hidden hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 border border-border/80 shadow-sm">
      {/* Top accent bar — fades in on hover */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-primary to-[#14B8A6] opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

      <CardContent className="flex items-center gap-3.5 py-4 px-4">
        <div className={`relative rounded-xl p-2.5 ${iconBg || 'bg-muted'} transition-all duration-200 group-hover:scale-105 flex-shrink-0`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide truncate mb-1">{label}</p>
          <div className="flex items-baseline gap-2">
            {loading ? (
              <Skeleton className="h-7 w-14" />
            ) : (
              <p className="text-2xl font-bold tracking-tight font-display leading-none">{value}</p>
            )}
            {trend && !loading && (
              <span
                className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  trend === 'up'
                    ? 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100'
                    : 'bg-red-50 text-red-600 ring-1 ring-red-100'
                }`}
              >
                {trend === 'up' ? (
                  <TrendingUp className="h-2.5 w-2.5" />
                ) : (
                  <TrendingDown className="h-2.5 w-2.5" />
                )}
                {trendLabel}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
