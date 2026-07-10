import { Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';

// Fixed chip lists — not derived from a live distinct-value query, since the
// backend doesn't expose one. Ask backend for a `/applicant/facets` endpoint
// if you want these generated from real data instead of a fixed list.
const CITY_CHIPS  = ['Jakarta', 'Bandung', 'Surabaya'];
const SKILL_CHIPS = ['React', 'TypeScript', 'Next.js', 'Node.js', 'Vue', 'JavaScript', 'Tailwind'];

/*
 * Presentational only — all filter state (activeFilters, minScore) and the
 * handlers that change it (onClear, onChipClick, onMinScoreChange) live in
 * TalentPoolPage. This component just renders the current values and calls
 * back up on interaction.
 */
export default function TalentPoolFilterSidebar({
  totalCount,
  hasActiveFilters,
  onClearAll,
  minScore,
  onMinScoreChange,
  activeLocation,
  activeSkill,
  onChipClick,
}) {
  return (
    <Card className="lg:sticky lg:top-4">
      <CardContent className="p-4 space-y-5">

        <div>
          <div className="text-[10px] font-bold uppercase text-muted-foreground mb-2">Candidates</div>
          <button
            onClick={onClearAll}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition-colors
              ${!hasActiveFilters ? 'bg-primary/10 text-primary font-semibold' : 'hover:bg-muted/60 text-foreground'}`}
          >
            <span className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" /> All candidates
            </span>
            <span className="text-[10px] text-muted-foreground">{totalCount}</span>
          </button>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="text-[10px] font-bold uppercase text-muted-foreground">Min Score</div>
            <span className="text-[11px] font-semibold text-primary">{minScore || '0+'}</span>
          </div>
          <Slider
            value={[minScore]}
            onValueChange={(v) => onMinScoreChange(v[0])}
            min={0}
            max={100}
            step={5}
          />
          <div className="flex justify-between mt-1">
            <span className="text-[9px] text-muted-foreground">0</span>
            <span className="text-[9px] text-muted-foreground">100</span>
          </div>
          <p className="text-[9px] text-muted-foreground mt-1 leading-snug">
            Filters by each candidate's most recent score across any job.
          </p>
        </div>

        <div>
          <div className="text-[10px] font-bold uppercase text-muted-foreground mb-2">City</div>
          <div className="flex flex-wrap gap-1.5">
            {CITY_CHIPS.map(city => (
              <button
                key={city}
                onClick={() => onChipClick('location_q', city)}
                className={`px-2 py-1 rounded-md border text-[11px] transition-colors
                  ${activeLocation === city
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border hover:bg-muted/60'}`}
              >
                {city}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="text-[10px] font-bold uppercase text-muted-foreground mb-2">Skills</div>
          <div className="flex flex-wrap gap-1.5">
            {SKILL_CHIPS.map(skill => (
              <button
                key={skill}
                onClick={() => onChipClick('skill_q', skill)}
                className={`px-2 py-1 rounded-md border text-[11px] transition-colors
                  ${activeSkill === skill
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border hover:bg-muted/60'}`}
              >
                {skill}
              </button>
            ))}
          </div>
        </div>

      </CardContent>
    </Card>
  );
}