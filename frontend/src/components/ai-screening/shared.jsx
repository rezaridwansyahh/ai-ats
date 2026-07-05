import { Code2, Briefcase, TrendingUp, GraduationCap } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

/*
 * Shared pieces reused across the AI Screening stage dashboards
 * (ParseStageDashboard, MatchStageDashboard, QAStageDashboard, PipelineStageDashboard).
 *
 * NOTE: FIXED_KEYS / FIXED_META / DEFAULT_RUBRIC / totalWeight below are copied from
 * AIScreeningCandidate.jsx's existing rubric config (same shape, same defaults) so the
 * job-level Match dashboard and the per-candidate Match panel stay in sync. Once both
 * are live, consider having AIScreeningCandidate.jsx import from here too instead of
 * keeping two copies — flagging rather than changing that file now since it's out of
 * scope for this pass.
 */

export function StatCard({ label, value, tone = 'default', hint }) {
  const toneCls = {
    default: 'text-foreground',
    danger: 'text-rose-600',
    muted: 'text-muted-foreground',
  }[tone];
  return (
    <Card>
      <CardContent className="p-3">
        <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className={`mt-1 text-2xl font-bold font-mono ${toneCls}`}>{value}</div>
        {hint && <div className="mt-0.5 text-[10px] text-muted-foreground">{hint}</div>}
      </CardContent>
    </Card>
  );
}

export const FIXED_KEYS = ['skills', 'experience', 'career_trajectory', 'education'];

export const FIXED_META = {
  skills:            { label: 'Skills',            icon: Code2,         description: 'Match against the required + preferred skills' },
  experience:        { label: 'Experience',        icon: Briefcase,     description: 'Years, role relevance, progression vs seniority' },
  career_trajectory: { label: 'Career Trajectory', icon: TrendingUp,    description: 'Tenure pattern, stability, growth (validate via Q&A)' },
  education:         { label: 'Education',         icon: GraduationCap, description: 'Degree relevance + school tier vs qualifications' },
};

export const DEFAULT_RUBRIC = {
  fixed_criteria: {
    skills:            { weight: 45 },
    experience:        { weight: 35 },
    career_trajectory: { weight: 15 },
    education:         { weight: 5  },
  },
  custom_criteria: [],
};

export function totalWeight(rubric) {
  const fixedSum = FIXED_KEYS.reduce((s, k) => s + (Number(rubric.fixed_criteria[k]?.weight) || 0), 0);
  const customSum = (rubric.custom_criteria || []).reduce((s, c) => s + (Number(c.weight) || 0), 0);
  return fixedSum + customSum;
}