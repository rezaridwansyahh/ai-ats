import { useNavigate, useLocation } from 'react-router-dom';

const STAGES = [
  { key: 'Source',    letter: 'S', count: 248, route: '/sourcing/source-candidate' },
  { key: 'Screen',    letter: 'A', count: 86,  route: '/selection/ai-screening' },
  { key: 'Interview', letter: 'I', count: 22,  route: '/selection/interview' },
  { key: 'Assess',    letter: 'P', count: 12,  route: '/selection/psych-assessment' }, 
  { key: 'Verify',    letter: 'V', count: 7,   route: '/selection/background-check' }, 
  { key: 'Offer',     letter: 'O', count: 4,   route: '/selection/offer-contract' },
  { key: 'Onboard',   letter: 'N', count: 2,   route: '/onboarding' }, // ⚠️ see below
];

export default function PipelineBar() {
  const navigate = useNavigate();
  const location = useLocation();

  // Active stage = whichever route matches current pathname
  const activeIndex = STAGES.findIndex(s =>
    location.pathname === s.route || location.pathname.startsWith(s.route + '/')
  );

  return (
    <div className="flex items-center gap-1 px-5 py-2.5 border-b border-border/70 bg-background overflow-x-auto">
      {STAGES.map((stage, i) => {
        const isActive = i === activeIndex;

        return (
          <div key={stage.key} className="flex items-center gap-1 flex-shrink-0">
            {/* Chevron separator */}
            {i > 0 && (
              <span className="text-muted-foreground/30 text-sm mx-1">›</span>
            )}

            {/* Stage pill */}
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
              {/* Letter avatar */}
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
                {stage.count}
              </span>
            </button>
          </div>
        );
      })}
    </div>
  );
}