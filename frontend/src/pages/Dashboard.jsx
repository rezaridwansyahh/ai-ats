import { useState } from 'react';
import {
  Briefcase,
  Users,
  UserCheck,
  Clock,
  FileText,
  CalendarDays,
  Send,
  Rocket,
  LayoutGrid,
  Kanban,
  Zap,
} from 'lucide-react';

import { StatCard } from '@/components/cards/StatCard';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import ProcessFlow from '@/components/dashboard/ProcessFlow';
import TimeToHireChart from '@/components/dashboard/TimeToHireChart';
import DepartmentChart from '@/components/dashboard/DepartmentChart';
import HiringFunnel from '@/components/dashboard/HiringFunnel';
import UpcomingInterviews from '@/components/dashboard/UpcomingInterviews';
import SourceChannelTable from '@/components/dashboard/SourceChannelTable';
import DepartmentProgress from '@/components/dashboard/DepartmentProgress';
import KanbanBoard from '@/components/dashboard/KanbanBoard';
import AutomationLog from '@/components/dashboard/AutomationLog';

const TABS = [
  { id: 'overview', label: 'Overview',          icon: LayoutGrid },
  { id: 'kanban',   label: 'Kanban Pipeline',   icon: Kanban },
  { id: 'auto',     label: 'Automation Log',    icon: Zap },
];

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* Header */}
      <DashboardHeader />

      {/* Tab navigation */}
      <div className="flex gap-0 border-b">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 -mb-px transition-all cursor-pointer ${
                isActive
                  ? 'text-primary border-primary'
                  : 'text-muted-foreground border-transparent hover:text-foreground hover:bg-muted/40'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div key={activeTab} className="animate-fade-in-up">
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'kanban' && <KanbanBoard />}
        {activeTab === 'auto' && <AutomationLog />}
      </div>
    </div>
  );
}

/* --- Overview Tab --- */
function OverviewTab() {
  return (
    <div className="space-y-5">
      {/* 9-Phase Process Flow */}
      <ProcessFlow />

      {/* KPI Row 1: Primary metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 stagger-children">
        <StatCard
          icon={<Briefcase className="h-5 w-5 text-primary" />}
          iconBg="bg-primary/10"
          label="Active Jobs"
          value={24}
          trend="up"
          trendLabel="+12%"
        />
        <StatCard
          icon={<Users className="h-5 w-5 text-blue-500" />}
          iconBg="bg-blue-50"
          label="Total Applicants"
          value="1,488"
          trend="up"
          trendLabel="+23%"
        />
        <StatCard
          icon={<UserCheck className="h-5 w-5 text-emerald-500" />}
          iconBg="bg-emerald-50"
          label="Hired This Month"
          value={18}
          trend="up"
          trendLabel="+8"
        />
        <StatCard
          icon={<Clock className="h-5 w-5 text-amber-500" />}
          iconBg="bg-amber-50"
          label="Avg. Time to Hire"
          value="21d"
          trend="down"
          trendLabel="-3 days"
        />
      </div>

      {/* KPI Row 2: Secondary metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 stagger-children">
        <StatCard
          icon={<FileText className="h-5 w-5 text-violet-500" />}
          iconBg="bg-violet-50"
          label="New Applicants (7d)"
          value={156}
        />
        <StatCard
          icon={<CalendarDays className="h-5 w-5 text-sky-500" />}
          iconBg="bg-sky-50"
          label="Interviews This Week"
          value={12}
        />
        <StatCard
          icon={<Send className="h-5 w-5 text-amber-500" />}
          iconBg="bg-amber-50"
          label="Pending Offers"
          value={5}
        />
        <StatCard
          icon={<Rocket className="h-5 w-5 text-emerald-500" />}
          iconBg="bg-emerald-50"
          label="Onboarding In Progress"
          value={8}
        />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TimeToHireChart />
        <DepartmentChart />
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <HiringFunnel />
        <UpcomingInterviews />
      </div>

      {/* Source Channel Performance */}
      <SourceChannelTable />

      {/* Time-to-Hire by Department */}
      <DepartmentProgress />
    </div>
  );
}
