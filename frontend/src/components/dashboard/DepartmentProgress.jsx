import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const DEPARTMENTS = [
  { name: 'Engineering',  days: 28, max: 40 },
  { name: 'Marketing',    days: 21, max: 40 },
  { name: 'Sales',        days: 18, max: 40 },
  { name: 'Operations',   days: 35, max: 40 },
  { name: 'Design',       days: 24, max: 40 },
];

export default function DepartmentProgress() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Time-to-Hire by Department</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {DEPARTMENTS.map((dept) => {
          const pct = Math.round((dept.days / dept.max) * 100);
          const isHigh = dept.days > 30;
          return (
            <div key={dept.name}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium">{dept.name}</span>
                <span className={`text-xs font-bold ${isHigh ? 'text-amber-600' : 'text-primary'}`}>
                  {dept.days}d
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${isHigh ? 'bg-amber-500' : 'bg-primary'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
