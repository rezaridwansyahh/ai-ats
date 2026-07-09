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
 *
 * NOTE: scoreRecommendation below replaces two previously-separate, disagreeing copies:
 * AIScreeningCandidatePage.jsx had its own scoreRecommendation() using 70/50 thresholds
 * and "Recommended / Consider / Not Recommended" labels; PipelineStageDashboard.jsx had
 * its own recommendation() using 80/60 and "Advance / Hold / Reject" labels. Standardized
 * on the Pipeline version since its labels map directly onto the real decision values
 * the backend accepts (setScreeningDecision only takes advance | hold | reject) — the
 * candidate-page wording didn't correspond to any real backend state. Both files should
 * import this instead of defining their own.
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

// Score → recommendation mapping. Labels match the real decision values the
// backend accepts (advance / hold / reject) so what a recruiter sees always
// lines up with what they can actually click. `bucket` groups scores for
// PipelineStageDashboard's three-column layout (advance / awaiting / archive).
export function scoreRecommendation(score) {
  if (score == null) {
    return { label: 'Awaiting score', tone: 'bg-muted text-muted-foreground border-border', bucket: 'awaiting' };
  }
  if (score >= 80) {
    return { label: 'Advance', tone: 'bg-emerald-50 text-emerald-700 border-emerald-200', bucket: 'advance' };
  }
  if (score >= 60) {
    return { label: 'Hold · borderline', tone: 'bg-amber-50 text-amber-700 border-amber-200', bucket: 'awaiting' };
  }
  return { label: 'Reject · below threshold', tone: 'bg-rose-50 text-rose-700 border-rose-200', bucket: 'archive' };
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