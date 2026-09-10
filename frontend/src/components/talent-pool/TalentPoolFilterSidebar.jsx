// import { Users, X } from 'lucide-react';
// import { Card, CardContent } from '@/components/ui/card';
// import { Slider } from '@/components/ui/slider';
// import {
//   Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
// } from '@/components/ui/select';

// const CITY_CHIPS = ['Jakarta', 'Bandung', 'Surabaya'];

// export default function TalentPoolFilterSidebar({
//   totalCount,
//   hasActiveFilters,
//   onClearAll,
//   minScore,
//   onMinScoreChange,
//   activeLocation,
//   onChipClick,
//   skillFilters = new Set(),
//   availableSkills = [],
//   onToggleSkill,
//   onRemoveSkill,
// }) {
//   // Skills not yet picked — sorted alphabetically (A-Z)
//   const addableSkills = availableSkills
//     .filter(({ skill }) => !skillFilters.has(skill))
//     .sort((a, b) => a.skill.localeCompare(b.skill, undefined, { sensitivity: 'base' }));

//   return (
//     <Card className="lg:sticky lg:top-4">
//       <CardContent className="p-4 space-y-5">

//         <div>
//           <div className="text-[10px] font-bold uppercase text-muted-foreground mb-2">Candidates</div>
//           <button
//             data-tour="talent-clear-all"
//             onClick={onClearAll}
//             className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition-colors
//               ${!hasActiveFilters ? 'bg-primary/10 text-primary font-semibold' : 'hover:bg-muted/60 text-foreground'}`}
//           >
//             <span className="flex items-center gap-1.5">
//               <Users className="h-3.5 w-3.5" /> All candidates
//             </span>
//             <span className="text-[10px] text-muted-foreground">{totalCount}</span>
//           </button>
//         </div>

//         <div data-tour="talent-min-score">
//           <div className="flex items-center justify-between mb-2">
//             <div className="text-[10px] font-bold uppercase text-muted-foreground">Min Score</div>
//             <span className="text-[11px] font-semibold text-primary">{minScore || '0+'}</span>
//           </div>
//           <Slider
//             value={[minScore]}
//             onValueChange={(v) => onMinScoreChange(v[0])}
//             min={0}
//             max={100}
//             step={5}
//           />
//           <div className="flex justify-between mt-1">
//             <span className="text-[9px] text-muted-foreground">0</span>
//             <span className="text-[9px] text-muted-foreground">100</span>
//           </div>
//           <p className="text-[9px] text-muted-foreground mt-1 leading-snug">
//             Filters by each candidate's most recent score across any job.
//           </p>
//         </div>

//         <div data-tour="talent-city-chips">
//           <div className="text-[10px] font-bold uppercase text-muted-foreground mb-2">City</div>
//           <div className="flex flex-wrap gap-1.5">
//             {CITY_CHIPS.map(city => (
//               <button
//                 key={city}
//                 onClick={() => onChipClick('location_q', city)}
//                 className={`px-2 py-1 rounded-md border text-[11px] transition-colors
//                   ${activeLocation === city
//                     ? 'bg-primary text-primary-foreground border-primary'
//                     : 'border-border hover:bg-muted/60'}`}
//               >
//                 {city}
//               </button>
//             ))}
//           </div>
//         </div>

//         <div data-tour="talent-skill-chips">
//           <div className="flex items-center justify-between mb-2">
//             <div className="text-[10px] font-bold uppercase text-muted-foreground">Skills</div>
//             {skillFilters.size > 0 && (
//               <span className="text-[10px] text-muted-foreground">{skillFilters.size} selected</span>
//             )}
//           </div>

//           {/* Selected skills — removable pills. Not capped: user can add as many as they want. */}
//           {skillFilters.size > 0 && (
//             <div className="flex flex-wrap gap-1.5 mb-2">
//               {[...skillFilters].map((skill) => (
//                 <button
//                   key={skill}
//                   onClick={() => onRemoveSkill(skill)}
//                   className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-primary bg-primary text-primary-foreground text-[11px]"
//                   title="Remove filter"
//                 >
//                   {skill} <X className="h-3 w-3" />
//                 </button>
//               ))}
//             </div>
//           )}

//           {/* Add-skill dropdown */}
//           {addableSkills.length > 0 ? (
//             <Select value="" onValueChange={onToggleSkill}>
//               <SelectTrigger className="h-8 w-full text-[11px]">
//                 <SelectValue placeholder="+ Add skill filter…" />
//               </SelectTrigger>
//               <SelectContent
//                 position="popper"
//                 side="bottom"
//                 align="start"
//                 avoidCollisions={false}
//                 className="max-h-64 overflow-y-auto"
//               >
//                 {addableSkills.map(({ skill, count }) => (
//                   <SelectItem key={skill} value={skill} className="text-xs">
//                     {skill} ({count})
//                   </SelectItem>
//                 ))}
//               </SelectContent>
//             </Select>
//           ) : (
//             <p className="text-[10px] text-muted-foreground italic">
//               {skillFilters.size > 0 ? 'All available skills selected.' : 'No skill data yet.'}
//             </p>
//           )}
//         </div>

//       </CardContent>
//     </Card>
//   );
// }




import { useState } from 'react';
import { Users, X, Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';

const CITY_CHIPS = ['Jakarta', 'Bandung', 'Surabaya'];

export default function TalentPoolFilterSidebar({
  totalCount,
  hasActiveFilters,
  onClearAll,
  minScore,
  onMinScoreChange,
  activeLocation,
  onChipClick,
  skillFilters = new Set(),
  availableSkills = [],
  onToggleSkill,
  onRemoveSkill,
}) {
  const [skillSearch, setSkillSearch] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Filter out picked skills and sort remaining alphabetically A-Z
  const unselectedSkills = availableSkills
    .filter(({ skill }) => !skillFilters.has(skill))
    .sort((a, b) => a.skill.localeCompare(b.skill, undefined, { sensitivity: 'base' }));

  // Filter skills based on what the user types
  const filteredSkills = unselectedSkills.filter(({ skill }) =>
    skill.toLowerCase().includes(skillSearch.toLowerCase())
  );

  return (
    <Card className="lg:sticky lg:top-4">
      <CardContent className="p-4 space-y-5">

        <div>
          <div className="text-[10px] font-bold uppercase text-muted-foreground mb-2">Candidates</div>
          <button
            data-tour="talent-clear-all"
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

        <div data-tour="talent-min-score">
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

        <div data-tour="talent-city-chips">
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

        <div data-tour="talent-skill-chips">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[10px] font-bold uppercase text-muted-foreground">Skills</div>
            {skillFilters.size > 0 && (
              <span className="text-[10px] text-muted-foreground">{skillFilters.size} selected</span>
            )}
          </div>

          {/* Selected skills — removable pills */}
          {skillFilters.size > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {[...skillFilters].map((skill) => (
                <button
                  key={skill}
                  onClick={() => onRemoveSkill(skill)}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-primary bg-primary text-primary-foreground text-[11px]"
                  title="Remove filter"
                >
                  {skill} <X className="h-3 w-3" />
                </button>
              ))}
            </div>
          )}

          {/* Custom Typeable Search Dropdown */}
          {unselectedSkills.length > 0 ? (
            <div className="relative">
              <div className="relative flex items-center">
                <Search className="absolute left-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  value={skillSearch}
                  onChange={(e) => {
                    setSkillSearch(e.target.value);
                    setIsDropdownOpen(true);
                  }}
                  onFocus={() => setIsDropdownOpen(true)}
                  placeholder="+ Add skill filter…"
                  className="w-full h-8 pl-8 pr-3 text-[11px] bg-background border border-input rounded-md focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              {/* Floating results menu */}
              {isDropdownOpen && (
                <>
                  {/* Backdrop to close dropdown when clicking outside */}
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setIsDropdownOpen(false)}
                  />

                  <div className="absolute left-0 right-0 top-full mt-1 z-20 max-h-48 overflow-y-auto rounded-md border border-border bg-popover text-popover-foreground shadow-md py-1">
                    {filteredSkills.length > 0 ? (
                      filteredSkills.map(({ skill, count }) => (
                        <button
                          key={skill}
                          type="button"
                          onClick={() => {
                            onToggleSkill(skill);
                            setSkillSearch('');
                            setIsDropdownOpen(false);
                          }}
                          className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted transition-colors flex items-center justify-between"
                        >
                          <span>{skill}</span>
                          <span className="text-[10px] text-muted-foreground">({count})</span>
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-xs text-muted-foreground text-center">
                        No matching skills
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          ) : (
            <p className="text-[10px] text-muted-foreground italic">
              {skillFilters.size > 0 ? 'All available skills selected.' : 'No skill data yet.'}
            </p>
          )}
        </div>

      </CardContent>
    </Card>
  );
}