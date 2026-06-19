import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingDown } from 'lucide-react';

// TODO: replace with API call keyed by `period`
const DATA_BY_PERIOD = {
  '30d': [
    { label: 'Jun 1',  days: 24 },
    { label: 'Jun 8',  days: 22 },
    { label: 'Jun 15', days: 21 },
    { label: 'Jun 22', days: 20 },
    { label: 'Jun 29', days: 19 },
  ],
  '90d': [
    { label: 'Apr', days: 27 },
    { label: 'May', days: 25 },
    { label: 'Jun', days: 23 },
    { label: 'Jul', days: 21 },
  ],
  'quarter': [
    { label: 'Q1', days: 32 },
    { label: 'Q2', days: 27 },
    { label: 'Q3', days: 22 },
  ],
  'year': [
    { label: 'Jan', days: 32 },
    { label: 'Feb', days: 30 },
    { label: 'Mar', days: 27 },
    { label: 'Apr', days: 25 },
    { label: 'May', days: 23 },
    { label: 'Jun', days: 22 },
    { label: 'Jul', days: 21 },
  ],
};

const TREND_LABEL = {
  '30d':     '17% improvement this month',
  '90d':     '22% improvement last 90 days',
  'quarter': '31% improvement this quarter',
  'year':    '34% improvement since January',
};

export default function TimeToHireChart({ period = '30d' }) {  // ← accepts period prop
  const data = DATA_BY_PERIOD[period] ?? DATA_BY_PERIOD['30d'];
  const trend = TREND_LABEL[period] ?? TREND_LABEL['30d'];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Time to Hire Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorDays" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="hsl(var(--primary))" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="label"   // ← was "month", now "label" to match all period shapes
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
                domain={['auto', 'auto']}  // ← was hardcoded [18,35]; auto adapts to data
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
          <span className="text-xs font-semibold text-green-600">{trend}</span>
        </div>
      </CardContent>
    </Card>
  );
}