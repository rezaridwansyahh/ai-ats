import { Cell, PieChart, Pie, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// TODO: replace with API call keyed by `period`
const DATA_BY_PERIOD = {
  '30d': [
    { name: 'Engineering', value: 41, color: 'hsl(220, 70%, 55%)' },
    { name: 'Design',      value: 15, color: 'hsl(270, 60%, 60%)' },
    { name: 'Marketing',   value: 25, color: 'hsl(140, 60%, 45%)' },
    { name: 'Sales',       value: 19, color: 'hsl(30, 90%, 55%)' },
  ],
  '90d': [
    { name: 'Engineering', value: 38, color: 'hsl(220, 70%, 55%)' },
    { name: 'Design',      value: 18, color: 'hsl(270, 60%, 60%)' },
    { name: 'Marketing',   value: 27, color: 'hsl(140, 60%, 45%)' },
    { name: 'Sales',       value: 17, color: 'hsl(30, 90%, 55%)' },
  ],
  'quarter': [
    { name: 'Engineering', value: 45, color: 'hsl(220, 70%, 55%)' },
    { name: 'Design',      value: 12, color: 'hsl(270, 60%, 60%)' },
    { name: 'Marketing',   value: 22, color: 'hsl(140, 60%, 45%)' },
    { name: 'Sales',       value: 21, color: 'hsl(30, 90%, 55%)' },
  ],
  'year': [
    { name: 'Engineering', value: 40, color: 'hsl(220, 70%, 55%)' },
    { name: 'Design',      value: 14, color: 'hsl(270, 60%, 60%)' },
    { name: 'Marketing',   value: 26, color: 'hsl(140, 60%, 45%)' },
    { name: 'Sales',       value: 20, color: 'hsl(30, 90%, 55%)' },
  ],
};

export default function DepartmentChart({ period = '30d' }) {  // ← accepts period prop
  const data = DATA_BY_PERIOD[period] ?? DATA_BY_PERIOD['30d'];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Hiring by Department</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6">
          <div className="h-[180px] w-[180px] flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {data.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    fontSize: 12,
                    borderRadius: 8,
                    border: '1px solid hsl(var(--border))',
                  }}
                  formatter={(value) => [`${value}%`, 'Share']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-col gap-2.5">
            {data.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-xs text-muted-foreground">{item.name}</span>
                <span className="text-xs font-bold ml-auto">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}