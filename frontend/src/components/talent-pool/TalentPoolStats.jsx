import { Users, UserPlus, Briefcase, Calendar } from 'lucide-react';
import { StatCard } from '@/components/cards/StatCard';

/*
 * Presentational only — receives the already-computed `stats` object from
 * TalentPoolPage (which derives it from the single getAllByCompanyWithScore
 * fetch). No data fetching or calculation happens in here.
 */
export default function TalentPoolStats({ stats, loading }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      <StatCard
        icon={<Users className="h-4 w-4 text-primary" />}
        iconBg="bg-primary/10"
        label="Total Applicants"
        value={stats.total}
        loading={loading}
      />
      <StatCard
        icon={<UserPlus className="h-4 w-4 text-emerald-600" />}
        iconBg="bg-emerald-50"
        label="New This Week"
        value={stats.newThisWeek}
        loading={loading}
      />
      <StatCard
        icon={<Briefcase className="h-4 w-4 text-blue-600" />}
        iconBg="bg-blue-50"
        label="Position Categories"
        value={stats.positionCategories}
        loading={loading}
      />
      <StatCard
        icon={<Calendar className="h-4 w-4 text-orange-600" />}
        iconBg="bg-orange-50"
        label="Avg Experience"
        value={stats.avgExperience}
        loading={loading}
      />
    </div>
  );
}