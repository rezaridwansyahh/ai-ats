import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BarChart3 } from 'lucide-react';

export default function DashboardHeader() {
  return (
    <div className="flex items-center justify-between flex-wrap gap-3">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <BarChart3 className="h-[18px] w-[18px] text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight leading-none">Dashboard</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Real-time command center — all recruitment phases at a glance
          </p>
        </div>
      </div>
      <Select defaultValue="30d">
        <SelectTrigger className="w-[140px] h-8 text-xs font-medium border-border/80">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="30d">Last 30 Days</SelectItem>
          <SelectItem value="90d">Last 90 Days</SelectItem>
          <SelectItem value="quarter">This Quarter</SelectItem>
          <SelectItem value="year">This Year</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
