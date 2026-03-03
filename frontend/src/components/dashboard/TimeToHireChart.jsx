import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { TrendingDown } from 'lucide-react';

const DATA = [
  { month: 'Jan', days: 32 },
  { month: 'Feb', days: 30 },
  { month: 'Mar', days: 27 },
  { month: 'Apr', days: 25 },
  { month: 'May', days: 23 },
  { month: 'Jun', days: 22 },
  { month: 'Jul', days: 21 },
];

export default function TimeToHireChart() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Time to Hire Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={DATA} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorDays" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
                domain={[18, 35]}
              />
              <Tooltip
                contentStyle={{
                  fontSize: 12,
                  borderRadius: 8,
                  border: '1px solid hsl(var(--border))',
                  boxShadow: '0 2px 8px rgba(0,0,0,.08)',
                }}
                formatter={(value) => [`${value} days`, 'Avg. Time']}
              />
              <Area
                type="monotone"
                dataKey="days"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#colorDays)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center gap-1.5 mt-2">
          <TrendingDown className="h-3.5 w-3.5 text-green-600" />
          <span className="text-xs font-semibold text-green-600">
            34% improvement since January
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
