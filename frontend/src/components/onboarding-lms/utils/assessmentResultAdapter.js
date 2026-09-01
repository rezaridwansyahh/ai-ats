import { COLOR_MAP, PROFILES } from '@/components/assessment-insights/data/insights';
import { MODES } from '@/components/assessment-tki/data/tki';

const QUADRANT_KEYS = ['RED', 'YEL', 'GRN', 'BLU'];

export function mapInsightSummaryToResult(summary) {
  if (!summary) return null;

  const quadrants = QUADRANT_KEYS
    .map((key) => ({ key, score: summary.colors?.[key] ?? 0, ...COLOR_MAP[key] }))
    .sort((a, b) => b.score - a.score);

  const profile = PROFILES[summary.profile_id] || null;
  const [dominant, secondary] = quadrants;

  return {
    primary_en: profile?.name ?? dominant?.name ?? '—',
    primary_id: profile?.name ?? dominant?.name ?? '—',
    secondary_en: secondary?.name ?? '—',
    secondary_id: secondary?.name ?? '—',
    bars: quadrants.map((q) => ({
      k_en: `${q.name} · ${q.label}`,
      k_id: `${q.name} · ${q.label}`,
      v: q.score,
      color: q.color,
    })),
    summary_en: profile?.desc ?? '',
    summary_id: profile?.desc ?? '',
  };
}

export function mapTkiSummaryToResult(summary) {
  if (!summary?.scores) return null;

  const sorted = Object.entries(summary.scores).sort((a, b) => b[1] - a[1]);
  const dominantKey = summary.dominant || sorted[0]?.[0];
  const secondaryKey = summary.secondary || sorted[1]?.[0];
  const dominant = MODES[dominantKey];
  const secondary = MODES[secondaryKey];

  return {
    primary_en: dominant?.name ?? '—',
    primary_id: dominant?.name ?? '—',
    secondary_en: secondary?.name ?? '—',
    secondary_id: secondary?.name ?? '—',
    bars: sorted.map(([key, v]) => ({
      k_en: MODES[key]?.name ?? key,
      k_id: MODES[key]?.name ?? key,
      v,
      color: MODES[key]?.color,
    })),
    summary_en: dominant?.desc ?? '',
    summary_id: dominant?.desc ?? '',
  };
}

const RESULT_MAPPERS = { I: mapInsightSummaryToResult, T: mapTkiSummaryToResult };

export function mergeLiveAssessments(assessments, resultsByBattery) {
  return assessments.map((a) => {
    if (!a.battery) return a;
    const row = resultsByBattery?.[a.battery];
    if (!row || row.status !== 'completed') {
      return { ...a, status: 'available', result: undefined };
    }
    const mapper = RESULT_MAPPERS[a.battery];
    const result = mapper ? mapper(row.summary) : a.result;
    return { ...a, status: 'done', result: result ?? a.result };
  });
}