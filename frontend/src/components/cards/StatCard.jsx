import { TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function StatCard({ icon, label, value, loading, trend, trendLabel, iconBg }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 pt-6 transition-all duration-200 hover:-translate-y-0.5">
        <div className={`rounded-lg p-2.5 ${iconBg || 'bg-muted'}`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground truncate">{label}</p>
            {trend && (
              <span
                className={`inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                  trend === 'up'
                    ? 'bg-green-50 text-green-600'
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
          {loading ? (
            <Skeleton className="h-7 w-12 mt-0.5" />
          ) : (
            <p className="text-2xl font-bold">{value}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
