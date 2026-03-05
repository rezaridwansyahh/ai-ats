import { TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function StatCard({ icon, label, value, loading, trend, trendLabel, iconBg }) {
  return (
    <Card className="group hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 border shadow-sm">
      <CardContent className="flex items-center gap-3.5 py-4 px-4">
        <div className={`rounded-lg p-2.5 ${iconBg || 'bg-muted'} transition-transform duration-200 group-hover:scale-105`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-muted-foreground truncate mb-0.5">{label}</p>
          <div className="flex items-center gap-2">
            {loading ? (
              <Skeleton className="h-7 w-14" />
            ) : (
              <p className="text-2xl font-bold tracking-tight font-display">{value}</p>
            )}
            {trend && (
              <span
                className={`inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${
                  trend === 'up'
                    ? 'bg-emerald-50 text-emerald-600'
                    : 'bg-red-50 text-red-600'
                }`}
              >
                {trend === 'up' ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
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
