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
    <Card>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center gap-0 overflow-x-auto px-1 py-1">
          {PHASES.map((phase, i) => {
            const Icon = phase.icon;
            return (
              <div key={phase.num} className="flex items-center">
                <div className="flex flex-col items-center min-w-[70px] px-1 group cursor-default">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold mb-1 group-hover:scale-110 transition-transform">
                    {phase.num}
                  </div>
                  <Icon className="h-3.5 w-3.5 text-muted-foreground mb-0.5" />
                  <span className="text-[10px] font-semibold text-muted-foreground text-center leading-tight">
                    {phase.label}
                  </span>
                </div>
                {i < PHASES.length - 1 && (
                  <span className="text-muted-foreground/40 text-xs mx-0.5 flex-shrink-0">
                    &rarr;
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
