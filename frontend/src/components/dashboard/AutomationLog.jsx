import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import {
  Zap,
  Bot,
  Clock,
  CheckCircle,
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

/* ─── Stats ─── */
const STATS = [
  { icon: Zap,         label: 'Active Workflows',      value: 12,     sub: 'Across 5 open jobs',    color: 'text-primary' },
  { icon: Bot,         label: 'Auto-Actions This Month', value: 847,  sub: '+32% vs last month',    color: 'text-blue-500' },
  { icon: Clock,       label: 'Time Saved / Week',      value: '18 hrs', sub: '+3hrs vs last month', color: 'text-amber-500' },
  { icon: CheckCircle, label: 'Success Rate',           value: '96.4%', sub: 'Stable',              color: 'text-green-500' },
];

/* ─── Log entries ─── */
const LOGS = [
  {
    time: '03 Mar 2026, 09:14',
    workflow: 'Applied → AI Screening',
    trigger: 'New Application',
    triggerColor: 'default',
    candidate: 'Adi Nugroho',
    action: 'AI Parse CV + Confirmation Email + Slack Notify',
    status: 'Success',
    statusColor: 'default',
  },
  {
    time: '03 Mar 2026, 08:52',
    workflow: 'AI Screening → Interview',
    trigger: 'Score ≥ 80',
    triggerColor: 'secondary',
    candidate: 'Dewi Sartika',
    action: 'Calendar Invite + Panel Notify + WhatsApp Confirm',
    status: 'Success',
    statusColor: 'default',
  },
  {
    time: '02 Mar 2026, 17:30',
    workflow: 'SLA Breach Alert',
    trigger: 'Interview Overdue',
    triggerColor: 'destructive',
    candidate: 'Fajar Kurniawan',
    action: 'Escalation Email → HR Manager → Hiring Lead',
    status: 'Escalated',
    statusColor: 'destructive',
  },
  {
    time: '02 Mar 2026, 15:12',
    workflow: 'Applied → AI Screening',
    trigger: 'New Application',
    triggerColor: 'default',
    candidate: 'Rizki Hakim',
    action: 'AI Parse CV + Confirmation Email',
    status: 'Parse Error',
    statusColor: 'outline',
  },
  {
    time: '02 Mar 2026, 11:04',
    workflow: 'BG Check → Offering',
    trigger: 'BG Cleared',
    triggerColor: 'secondary',
    candidate: 'Aldi Tanjung',
    action: 'AI Offer Draft + Manager Approval Request',
    status: 'Success',
    statusColor: 'default',
  },
  {
    time: '01 Mar 2026, 16:42',
    workflow: 'Interview → Assessment',
    trigger: 'Interview Passed',
    triggerColor: 'secondary',
    candidate: 'Lina Susanti',
    action: 'Psych Test Invite + Skill Test Link',
    status: 'Success',
    statusColor: 'default',
  },
  {
    time: '01 Mar 2026, 14:20',
    workflow: 'Offering → Onboard',
    trigger: 'Offer Accepted',
    triggerColor: 'secondary',
    candidate: 'Putri Permata',
    action: 'E-Sign Contract + Welcome Email + HRIS Record',
    status: 'Success',
    statusColor: 'default',
  },
  {
    time: '01 Mar 2026, 09:55',
    workflow: 'Applied → AI Screening',
    trigger: 'New Application',
    triggerColor: 'default',
    candidate: 'Siti Wulandari',
    action: 'AI Parse CV + Confirmation Email + Slack Notify',
    status: 'Success',
    statusColor: 'default',
  },
];

export default function AutomationLog() {
  const [page, setPage] = useState(1);

  return (
    <div className="space-y-4">
      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {STATS.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="py-4">
              <CardContent className="pt-0 flex items-center gap-3">
                <div className="rounded-lg bg-muted p-2">
                  <Icon className={`h-5 w-5 ${s.color}`} />
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    {s.label}
                  </p>
                  <p className="text-xl font-bold">{s.value}</p>
                  <p className="text-[10px] text-muted-foreground">{s.sub}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Info banner */}
      <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0">
          i
        </div>
        <span className="text-xs text-muted-foreground">
          Automation log records all workflow triggers, actions taken, and their outcomes across your recruitment pipeline. Use filters to narrow down specific events.
        </span>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search by workflow, candidate, trigger..."
            className="pl-8 h-8 text-xs"
          />
        </div>
        <Select defaultValue="all">
          <SelectTrigger className="w-[140px] h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Triggers</SelectItem>
            <SelectItem value="application">New Application</SelectItem>
            <SelectItem value="score">Score Threshold</SelectItem>
            <SelectItem value="sla">SLA Breach</SelectItem>
          </SelectContent>
        </Select>
        <Select defaultValue="all-status">
          <SelectTrigger className="w-[120px] h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all-status">All Status</SelectItem>
            <SelectItem value="success">Success</SelectItem>
            <SelectItem value="error">Error</SelectItem>
            <SelectItem value="escalated">Escalated</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" className="h-8 text-xs gap-1">
          <Download className="h-3.5 w-3.5" />
          Export
        </Button>
      </div>

      {/* Activity table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[10px] font-semibold uppercase tracking-wider">Timestamp</TableHead>
                <TableHead className="text-[10px] font-semibold uppercase tracking-wider">Workflow</TableHead>
                <TableHead className="text-[10px] font-semibold uppercase tracking-wider">Trigger</TableHead>
                <TableHead className="text-[10px] font-semibold uppercase tracking-wider">Candidate</TableHead>
                <TableHead className="text-[10px] font-semibold uppercase tracking-wider">Action</TableHead>
                <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {LOGS.map((log, i) => (
                <TableRow key={i}>
                  <TableCell className="text-[11px] text-muted-foreground whitespace-nowrap">
                    {log.time}
                  </TableCell>
                  <TableCell className="text-[11px] font-semibold whitespace-nowrap">
                    {log.workflow}
                  </TableCell>
                  <TableCell>
                    <Badge variant={log.triggerColor} className="text-[9px]">
                      {log.trigger}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-[11px]">{log.candidate}</TableCell>
                  <TableCell className="text-[10px] text-muted-foreground max-w-[200px] truncate">
                    {log.action}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={log.statusColor} className="text-[9px]">
                      {log.status === 'Success' && '✓ '}
                      {log.status === 'Parse Error' && '⚠ '}
                      {log.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          Rows per page
          <Select defaultValue="10">
            <SelectTrigger className="w-[60px] h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
          <span>Showing 1-8 of 847</span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" className="h-7 w-7" disabled>
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <Button variant="default" size="sm" className="h-7 w-7 text-xs p-0">
            1
          </Button>
          <Button variant="outline" size="sm" className="h-7 w-7 text-xs p-0">
            2
          </Button>
          <Button variant="outline" size="sm" className="h-7 w-7 text-xs p-0">
            3
          </Button>
          <span className="text-xs text-muted-foreground px-1">...</span>
          <Button variant="outline" size="sm" className="h-7 w-7 text-xs p-0">
            85
          </Button>
          <Button variant="outline" size="icon" className="h-7 w-7">
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
