import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Wand2, MessageSquare } from 'lucide-react';

export default function ScreeningMain({ screeningData, onSubStepClick, activeSubStep }) {
  const engineTiles = [
    {
      key: 'parse', num: 1, label: 'Resume Parsing', icon: FileText,
      done: !!screeningData?.parsedDone,
      footer: screeningData?.parsedDone ? 'Parsed' : 'Not Started',
    },
    {
      key: 'match', num: 2, label: 'AI Matching', icon: Wand2,
      done: !!screeningData?.scoredDone,
      footer: screeningData?.scoredDone ? 'Scored' : 'Not Started',
    },
    {
      key: 'qa', num: 3, label: 'Follow-up Q&A', icon: MessageSquare,
      done: !!screeningData?.qaDone,
      footer: screeningData?.qaDone ? 'Completed' : 'Not Started',
    },
  ];

  const handleClickSubStep = (num) => {
  const tile = engineTiles.find(t => t.num === num);
    if (tile?.done && onSubStepClick) {
      onSubStepClick(num);
    }
  };
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Engine progress
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {engineTiles.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => handleClickSubStep(t.num)}
                className={`
                  text-left p-3 rounded-lg border transition-colors
                  ${t.done 
                    ? 'bg-muted/20 hover:bg-muted/60 cursor-pointer' 
                    : 'bg-gray-100 cursor-not-allowed opacity-50'
                  }
                  `}
                disabled={!t.done}  
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold flex items-center gap-1.5">
                    <Icon className="h-3.5 w-3.5 text-primary" /> {t.num} · {t.label}
                  </span>
                </div>
                <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                  {t.done ?
                    <div className="h-full bg-primary transition-all"  /> 
                    : 
                    <div className="h-full bg-red-800 transition-all"  /> 
                  }
                </div>
                <div className="mt-1.5 text-[10px] text-muted-foreground">
                  {`${t.footer} · Click to see details`}
                </div>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  )
}