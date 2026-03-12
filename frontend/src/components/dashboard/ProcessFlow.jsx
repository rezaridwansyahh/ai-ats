import { Card, CardContent } from '@/components/ui/card';
import {
  Briefcase,
  Search,
  FileText,
  MessageSquare,
  Video,
  ClipboardCheck,
  Stethoscope,
  ShieldCheck,
  Gift,
} from 'lucide-react';

const PHASES = [
  { num: 1, label: 'Job Mgmt',   icon: Briefcase },
  { num: 2, label: 'Sourcing',   icon: Search },
  { num: 3, label: 'Screening',  icon: FileText },
  { num: 4, label: 'Q&A',        icon: MessageSquare },
  { num: 5, label: 'Interview',  icon: Video },
  { num: 6, label: 'Assessment', icon: ClipboardCheck },
  { num: 7, label: 'Medical',    icon: Stethoscope },
  { num: 8, label: 'BG Check',   icon: ShieldCheck },
  { num: 9, label: 'Onboard',    icon: Gift },
];

export default function ProcessFlow() {
  return (
    <Card className="border border-border/80 shadow-sm overflow-hidden">
      <CardContent className="pt-4 pb-4 px-4">
        <div className="flex items-center justify-between gap-0 overflow-x-auto py-1 min-w-0">
          {PHASES.map((phase, i) => {
            const Icon = phase.icon;
            const isLast = i === PHASES.length - 1;
            return (
              <div key={phase.num} className="flex items-center flex-1 min-w-0">
                <div className="flex flex-col items-center group cursor-default w-full">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-[#0d8a73] text-primary-foreground flex items-center justify-center text-xs font-bold mb-1.5 group-hover:scale-110 group-hover:shadow-md group-hover:shadow-primary/20 transition-all duration-200 ring-2 ring-primary/15">
                    {phase.num}
                  </div>
                  <div className="h-5 w-5 rounded-md bg-primary/8 flex items-center justify-center mb-1">
                    <Icon className="h-3 w-3 text-primary/70" />
                  </div>
                  <span className="text-[10px] font-semibold text-muted-foreground text-center leading-tight whitespace-nowrap">
                    {phase.label}
                  </span>
                </div>
                {!isLast && (
                  <div className="flex-shrink-0 h-[1px] w-full max-w-[28px] bg-gradient-to-r from-primary/30 to-primary/10 mx-0.5" />
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
