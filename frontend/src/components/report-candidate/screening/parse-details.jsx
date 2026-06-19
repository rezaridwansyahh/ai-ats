import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Timeline,
  TimelineContent,
  TimelineDate,
  TimelineHeader,
  TimelineIndicator,
  TimelineItem,
  TimelineSeparator,
  TimelineTitle,
} from "@/components/reui/timeline"

import { cn } from "@/lib/utils"

import { FileText } from 'lucide-react';

export default function ParseDetails({ data }) {
  const skills    = data?.skills ? data.skills : [];
  const education = data?.education ? data.education : [];
  const exp       = data?.experience || {};
  const positions = data?.positions ? data.positions : [];
  const jobPos    = data?.job_position || {};
  console.log(exp);
  console.log(exp.positions);

  return (
    <Card className="py-4 gap-3">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" /> Parse — Result
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex">
          <div className='w-1/2 flex justify-center'>
            {exp.positions ?
              <Timeline defaultValue={3} className="w-full max-w-md">
                {exp.positions.map((item, index) => (
                <TimelineItem
                  key={index}
                  step={index}
                  className={cn(
                    "w-[calc(50%-1.5rem)] odd:ms-auto even:me-auto even:text-right even:group-data-[orientation=vertical]/timeline:ms-0 even:group-data-[orientation=vertical]/timeline:me-8",
                    "even:group-data-[orientation=vertical]/timeline:**:data-[slot=timeline-indicator]:-right-6 even:group-data-[orientation=vertical]/timeline:**:data-[slot=timeline-indicator]:left-auto",
                    "even:group-data-[orientation=vertical]/timeline:**:data-[slot=timeline-indicator]:translate-x-1/2 even:group-data-[orientation=vertical]/timeline:**:data-[slot=timeline-separator]:-right-6",
                    "even:group-data-[orientation=vertical]/timeline:**:data-[slot=timeline-separator]:left-auto even:group-data-[orientation=vertical]/timeline:**:data-[slot=timeline-separator]:translate-x-1/2"
                  )}
                >
                  <TimelineHeader>
                    <TimelineSeparator />
                    <TimelineDate>{`${item.years} Years`}</TimelineDate>
                    <TimelineTitle>{item.title}</TimelineTitle>
                    <TimelineContent>{item.company}</TimelineContent>
                    <TimelineIndicator />
                  </TimelineHeader>
                </TimelineItem>
              ))}
              </Timeline>
              :
              <div className='flex items-center'>
                <span className="text-muted-foreground italic">No Experience</span>
              </div>
            }
            
          </div>
          <div className='w-1/2 space-y-4'>
            <FacetRow label="Current role">
              <span className="font-medium">{jobPos.current || '—'}</span>
              {jobPos.category && <span className="text-muted-foreground ml-2">· {jobPos.category}</span>}
            </FacetRow>
            <FacetRow label="Total experience">
              <span className="font-medium font-mono">{exp.years_total ?? '—'} Years</span>
              {positions.length > 0 && (
                <span className="text-muted-foreground ml-2">across {positions.length} role{positions.length === 1 ? '' : 's'}</span>
              )}
            </FacetRow>
            <FacetRow label="Skills">
              {skills.length === 0 ? <span className="text-muted-foreground text-[11px] italic">none extracted</span> : (
                <div className="flex flex-wrap gap-1">
                  {skills.map((s) => (
                    <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>
                  ))}
                </div>
              )}
            </FacetRow>
            <FacetRow label="Education">
              {education.length === 0 ? <span className="text-muted-foreground text-[11px] italic">none</span> : (
                <ul className="space-y-1">
                  {education.map((e, i) => (
                    <li key={i} className="text-xs">
                      <span className="font-medium">{e.school || '—'}</span>
                      {e.degree && <span className="text-muted-foreground"> · {e.degree}</span>}
                      {e.year && <span className="text-muted-foreground font-mono"> · {e.year}</span>}
                      {e.tier && <Badge variant="outline" className="text-[9px] ml-1.5">{e.tier}</Badge>}
                    </li>
                  ))}
                </ul>
              )}
            </FacetRow>
            {positions.length > 0 && (
              <FacetRow label="Positions">
                <ul className="space-y-1">
                  {positions.map((p, i) => (
                    <li key={i} className="text-xs">
                      <span className="font-medium">{p.title || '—'}</span>
                      {p.company && <span className="text-muted-foreground"> · {p.company}</span>}
                      {p.years != null && <span className="text-muted-foreground font-mono"> · {p.years}y</span>}
                    </li>
                  ))}
                </ul>
              </FacetRow>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function FacetRow({ label, children }) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-3 items-start">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground pt-0.5">{label}</div>
      <div className="text-xs">{children}</div>
    </div>
  );
}