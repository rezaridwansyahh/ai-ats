import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function DashboardHeader({ period, onPeriodChange }) { // ← added period
  return (
    <div className="flex items-start justify-between flex-wrap gap-3">
      <div className="ml-auto">
        <Select value={period} onValueChange={onPeriodChange}> {/* ← defaultValue → value */}
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
    </div>
  );
}