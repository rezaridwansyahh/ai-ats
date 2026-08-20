import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import { getWorkboard as getScreeningWorkboard } from '@/api/screening.api';
import { getWorkboard as getInterviewWorkboard } from '@/api/interview.api';
import { getWorkboard as getVerifyWorkboard } from '@/api/background-check.api';
import { getWorkboard as getOfferWorkboard } from '@/api/offer.api';
import { getOnboardingWorkboard } from '@/api/onboarding.api';
import { getCandidatePipelineSummary } from '@/api/candidate.api';

// Assess is served by a different endpoint shape than the other stages:
// /candidate-pipeline/summary?category=Assessment returns an array of
// { job_id, job_title, total } — one row per job — not { counts, positions }.
const getAssessWorkboard = () => getCandidatePipelineSummary('Assessment');

// Each stage's /{stage}/workboard endpoint returns:
//   { message, counts: { <status>: number, ... }, positions: [...] }
// counts has no single "total" key — the stage total is the sum of its
// status buckets (equivalent to summing positions[].total).
const sumCounts = (counts) =>
  Object.values(counts || {}).reduce((sum, n) => sum + (Number(n) || 0), 0);

// Assess's summary is an array of per-job rows instead of a counts object —
// sum their `total` fields to get the stage-wide count.
const sumSummaryRows = (rows) =>
  (rows || []).reduce((sum, row) => sum + (Number(row.total) || 0), 0);

// Onboard's workboard is a flat array of onboarding records (one row per
// candidate), wrapped as { success, data: [...] } — the count is just the
// row count, not a counts object to sum.
const countRows = (rows) => (Array.isArray(rows) ? rows.length : 0);

const STAGES = [
  { key: 'Screen',    letter: 'S', route: '/selection/ai-screening',      fetcher: getScreeningWorkboard },
  { key: 'Interview', letter: 'I', route: '/selection/interview',         fetcher: getInterviewWorkboard },
  { key: 'Assess',    letter: 'A', route: '/selection/psych-assessment',  fetcher: getAssessWorkboard },
  { key: 'BG Check',  letter: 'BG', route: '/selection/background-check', fetcher: getVerifyWorkboard },
  { key: 'Offer',     letter: 'O', route: '/selection/offer-contract',    fetcher: getOfferWorkboard },
  { key: 'Onboard',   letter: 'N', route: '/selection/onboarding',        fetcher: getOnboardingWorkboard },
];

export default function PipelineBar() {
  const navigate = useNavigate();
  const location = useLocation();

  // counts[stage.key] = number | null (null = not loaded / failed, rendered as "–")
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);

  const loadCounts = useCallback(async () => {
    setLoading(true);

    const results = await Promise.allSettled(
      STAGES.map((stage) => stage.fetcher())
    );

    const next = {};
    results.forEach((result, i) => {
      const stageKey = STAGES[i].key;
      if (result.status === 'fulfilled') {
        if (stageKey === 'Assess') {
          next[stageKey] = sumSummaryRows(result.value?.data?.summary);
        } else if (stageKey === 'Onboard') {
          next[stageKey] = countRows(result.value?.data?.data);
        } else if (stageKey === 'Offer') {
          next[stageKey] = Number(result.value?.data?.summary?.total) || 0;
        } else {
          next[stageKey] = sumCounts(result.value?.data?.counts);
        }
      } else {
        // Endpoint missing/erroring for this stage shouldn't break the bar —
        // just show it as unavailable rather than crashing or showing 0.
        console.error(`PipelineBar: failed to load workboard for "${stageKey}"`, result.reason);
        next[stageKey] = null;
      }
    });

    setCounts(next);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadCounts();
  }, [loadCounts]);

  const activeIndex = STAGES.findIndex(s =>
    location.pathname === s.route || location.pathname.startsWith(s.route + '/')
  );

  return (
    <div className="flex items-center gap-1 px-5 py-2.5 border-b border-border/70 bg-background overflow-x-auto">
      {STAGES.map((stage, i) => {
        const isActive = i === activeIndex;
        const count = counts[stage.key];
        const displayCount = loading ? '…' : (count === null ? '–' : count);

        return (
          <div key={stage.key} className="flex items-center gap-1 flex-shrink-0">
            {i > 0 && (
              <span className="text-muted-foreground/30 text-sm mx-1">›</span>
            )}

            <button
              onClick={() => navigate(stage.route)}
              className={`
                flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold
                transition-all duration-150 cursor-pointer
                ${isActive
                  ? 'bg-foreground text-background shadow-sm'
                  : 'hover:bg-muted/60 text-muted-foreground hover:text-foreground'
                }
              `}
            >
              <span className={`
                h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0
                ${isActive
                  ? 'bg-white/20 text-background'
                  : 'bg-muted text-muted-foreground'
                }
              `}>
                {stage.letter}
              </span>
              <span>{stage.key}</span>
              <span className={`
                text-[11px] font-semibold
                ${isActive ? 'text-background/70' : 'text-muted-foreground/70'}
              `}>
                {displayCount}
              </span>
            </button>
          </div>
        );
      })}
    </div>
  );
}