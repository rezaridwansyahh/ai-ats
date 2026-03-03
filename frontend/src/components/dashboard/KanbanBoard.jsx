import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertTriangle, TrendingUp, TrendingDown, Clock, CheckCircle } from 'lucide-react';

/* ─── Column definitions ─── */
const COLUMNS = [
  { id: 'applied',    label: 'Applied',      color: 'bg-primary',    count: 8 },
  { id: 'screening',  label: 'AI Screening',  color: 'bg-blue-500',   count: 6 },
  { id: 'interview',  label: 'Interview',     color: 'bg-purple-500', count: 4 },
  { id: 'assessment', label: 'Assessment',    color: 'bg-violet-500', count: 2 },
  { id: 'medical',    label: 'Medical',       color: 'bg-teal-500',   count: 1 },
  { id: 'bgcheck',    label: 'BG Check',      color: 'bg-sky-500',    count: 2 },
  { id: 'offering',   label: 'Offering',      color: 'bg-amber-500',  count: 3 },
  { id: 'hired',      label: 'Hired',         color: 'bg-green-500',  count: 5 },
];

/* ─── Candidate cards per column ─── */
const CANDIDATES = {
  applied: [
    { initials: 'AN', name: 'Adi Nugroho', role: 'Frontend Dev', exp: '5 yrs', tags: ['React', 'TS'], bg: 'bg-primary' },
    { initials: 'SW', name: 'Siti Wulandari', role: 'Backend Dev', exp: '3 yrs', tags: ['Node.js', 'Go'], bg: 'bg-amber-500' },
    { initials: 'RH', name: 'Rizki Hakim', role: 'Data Analyst', exp: '2 yrs', tags: ['Python', 'SQL'], bg: 'bg-blue-500' },
  ],
  screening: [
    { initials: 'DS', name: 'Dewi Sartika', role: 'Sr. Frontend', exp: '6 yrs', tags: ['React', 'Next.js'], bg: 'bg-primary', ai: 'Advance', score: 95 },
    { initials: 'BP', name: 'Budi Prasetyo', role: 'Full Stack', exp: '4 yrs', tags: ['Vue', 'Python'], bg: 'bg-amber-500', ai: 'Review', score: 78 },
  ],
  interview: [
    { initials: 'MH', name: 'Maya Hartono', role: 'UX Designer', exp: '4 yrs', tags: ['Figma', 'Research'], bg: 'bg-purple-500' },
    { initials: 'FK', name: 'Fajar Kurniawan', role: 'DevOps', exp: '5 yrs', tags: ['AWS', 'K8s'], bg: 'bg-teal-500', overdue: true },
  ],
  assessment: [
    { initials: 'LS', name: 'Lina Susanti', role: 'Marketing Mgr', exp: '7 yrs', tags: ['Growth', 'SEO'], bg: 'bg-violet-500' },
  ],
  medical: [
    { initials: 'YP', name: 'Yuda Pratama', role: 'Sales Rep', exp: '3 yrs', tags: ['B2B'], bg: 'bg-green-500' },
  ],
  bgcheck: [
    { initials: 'NR', name: 'Nadia Rahmawati', role: 'HR Officer', exp: '4 yrs', tags: ['HRIS'], bg: 'bg-sky-500' },
  ],
  offering: [
    { initials: 'AT', name: 'Aldi Tanjung', role: 'Backend Sr.', exp: '6 yrs', tags: ['Go', 'gRPC'], bg: 'bg-amber-500' },
  ],
  hired: [
    { initials: 'PP', name: 'Putri Permata', role: 'Content Writer', exp: '2 yrs', tags: ['Copywriting'], bg: 'bg-green-600' },
    { initials: 'TW', name: 'Teguh Widodo', role: 'QA Engineer', exp: '4 yrs', tags: ['Selenium', 'Cypress'], bg: 'bg-primary' },
  ],
};

/* ─── Pipeline stats ─── */
const STATS = [
  { label: 'Total in Pipeline', value: 32, trend: 'up', change: '+4 this week' },
  { label: 'Hired This Month',  value: 5,  trend: 'up', change: '+2 vs last month' },
  { label: 'Avg Stage Duration', value: '3.8d', trend: 'down', change: '-0.4d faster' },
  { label: 'SLA Breaches',       value: 2,  trend: null, change: 'Needs action', warn: true },
  { label: 'Pass-through Rate',  value: '87%', trend: null, change: 'Stable' },
  { label: 'Avg Time-to-Hire',   value: '24d', trend: 'down', change: '-3d vs Q3' },
];

function CandidateCard({ c }) {
  return (
    <div className="bg-card rounded-lg p-3 border shadow-sm hover:shadow-md hover:border-primary/30 transition-all cursor-default">
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-7 h-7 rounded-full ${c.bg} text-white flex items-center justify-center text-[9px] font-bold flex-shrink-0`}>
          {c.initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold truncate">{c.name}</p>
          <p className="text-[9px] text-muted-foreground truncate">{c.role} · {c.exp}</p>
        </div>
      </div>
      <div className="flex gap-1 flex-wrap">
        {c.tags.map((tag) => (
          <span
            key={tag}
            className="text-[8px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-semibold"
          >
            {tag}
          </span>
        ))}
        {c.score && (
          <span className="text-[8px] px-1.5 py-0.5 rounded bg-green-50 text-green-700 font-bold ml-auto">
            {c.score}%
          </span>
        )}
      </div>
      {c.ai && (
        <p className="text-[9px] text-muted-foreground mt-1.5">
          AI: <span className="font-semibold text-primary">{c.ai}</span>
        </p>
      )}
      {c.overdue && (
        <div className="flex items-center gap-1 mt-1.5 text-[9px] text-red-600 font-semibold">
          <AlertTriangle className="h-3 w-3" />
          9d — Overdue
        </div>
      )}
    </div>
  );
}

export default function KanbanBoard() {
  return (
    <div className="space-y-4">
      {/* Job filter */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs font-semibold text-muted-foreground">Pipeline for:</span>
        <Select defaultValue="fe">
          <SelectTrigger className="w-[240px] h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="fe">Sr. Frontend Developer (45)</SelectItem>
            <SelectItem value="mkt">Marketing Manager (67)</SelectItem>
            <SelectItem value="da">Data Analyst (31)</SelectItem>
            <SelectItem value="sales">Sales Representative (92)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Kanban columns */}
      <div className="flex gap-3 overflow-x-auto pb-3">
        {COLUMNS.map((col) => (
          <div
            key={col.id}
            className="min-w-[200px] flex-1 bg-muted/40 border rounded-xl"
          >
            {/* Column header */}
            <div className="flex items-center justify-between p-3 border-b">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${col.color}`} />
                <span className="text-[11px] font-bold">{col.label}</span>
              </div>
              <span className="text-[10px] font-semibold text-muted-foreground bg-card px-2 py-0.5 rounded border">
                {col.count}
              </span>
            </div>

            {/* Cards */}
            <div className="p-2 space-y-2 min-h-[80px]">
              {(CANDIDATES[col.id] || []).map((c) => (
                <CandidateCard key={c.name} c={c} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Pipeline stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {STATS.map((s) => (
          <Card key={s.label} className="py-3">
            <CardContent className="pt-0 px-4">
              <p className="text-[10px] font-semibold text-muted-foreground mb-1 truncate">
                {s.label}
              </p>
              <p className={`text-lg font-bold ${s.warn ? 'text-red-600' : ''}`}>
                {s.value}
              </p>
              <p className={`text-[10px] mt-0.5 flex items-center gap-0.5 ${
                s.trend === 'up' ? 'text-green-600' :
                s.trend === 'down' ? 'text-green-600' :
                s.warn ? 'text-red-600' :
                'text-muted-foreground'
              }`}>
                {s.trend === 'up' && <TrendingUp className="h-3 w-3" />}
                {s.trend === 'down' && <TrendingDown className="h-3 w-3" />}
                {s.warn && <AlertTriangle className="h-3 w-3" />}
                {s.change}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Stage conversion rates */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Stage Conversion Rates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Conversion bars */}
            <div className="space-y-3">
              {[
                { from: 'Applied', to: 'Screening', pct: 65 },
                { from: 'Screening', to: 'Interview', pct: 54 },
                { from: 'Interview', to: 'Assessment', pct: 39 },
                { from: 'Assessment', to: 'Offering', pct: 72 },
                { from: 'Offering', to: 'Hired', pct: 81 },
              ].map((item) => (
                <div key={item.from}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] text-muted-foreground">
                      {item.from} → {item.to}
                    </span>
                    <span className="text-[11px] font-bold">{item.pct}%</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${item.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Bottleneck alerts */}
            <div className="space-y-2">
              <div className="p-3 rounded-lg border border-red-200 bg-red-50/50 border-l-3 border-l-red-500">
                <p className="text-[11px] font-bold text-red-700 flex items-center gap-1">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Interview → Assessment: 39% conversion
                </p>
                <p className="text-[10px] text-red-600 mt-1">
                  2 candidates stuck &gt;7 days. Consider reassigning assessments.
                </p>
              </div>
              <div className="p-3 rounded-lg border border-amber-200 bg-amber-50/50 border-l-3 border-l-amber-500">
                <p className="text-[11px] font-bold text-amber-700 flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  SLA Warning: BG Check stage
                </p>
                <p className="text-[10px] text-amber-600 mt-1">
                  1 candidate at 80% SLA limit. Auto-escalation in 2 days.
                </p>
              </div>
              <div className="p-3 rounded-lg border border-green-200 bg-green-50/50 border-l-3 border-l-green-500">
                <p className="text-[11px] font-bold text-green-700 flex items-center gap-1">
                  <CheckCircle className="h-3.5 w-3.5" />
                  Offering → Hired: 81% acceptance
                </p>
                <p className="text-[10px] text-green-600 mt-1">
                  Above industry average (72%). Strong offer competitiveness.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
