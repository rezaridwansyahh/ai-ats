import { useEffect, useCallback, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Loader2, AlertTriangle, ArrowLeft, MessageSquare, ArrowRight, MapPin, Save, Send, ChevronUp,
  Briefcase, FileText, Wand2, Workflow, Megaphone, Sparkles, Calendar as CalendarIcon,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Pattern } from "@/components/examples/c-stepper-7"

import { getProgress } from '@/api/candidate.api';

export default function ReportCandidateDetailPage() {
  const { candidateId } = useParams();
  const navigate = useNavigate();

  const [candidate, setCandidate] = useState('');
  const [stages, setStages] = useState([]);
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCandidate = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getProgress(candidateId);
      setCandidate(res.data.candidate || '');
      setStages(res.data.stages || []);
    } catch {
      // no-op
    } finally {
      setLoading(false);
    }
  }, [candidateId]);
  
  useEffect(() => {
    fetchCandidate();
  }, [fetchCandidate]);

  const parsedDone = true;
  const scoredDone = true;
  const qaDone = true;

  const engineTiles = [
    {
      key: 'parse', num: 1, label: 'Resume Parsing', icon: FileText,
      done: parsedDone, word: 'parsed',
      footer: `${parsedDone ? 'Parsed' : 'Not Parsed' }`,
    },
    {
      key: 'match', num: 2, label: 'AI Matching', icon: Wand2,
      done: scoredDone, word: 'scored',
      footer: `${scoredDone ? 'Scored' : 'Not Scored'}`,
    },
    {
      key: 'qa', num: 3, label: 'Follow-up Q&A', icon: MessageSquare,
      done: true, pct: 0,
    },
  ];

  return (
    <>
      {/* Sticky header — lean, mirrors JobEdit's header. Posting + Re-sync live in the aside.
          -mt-5 -mx-5 px-5 cancels <main>'s p-5 so it pins flush under the breadcrumb. */}
      <div className="sticky top-[52px] z-10 bg-background/95 backdrop-blur-sm -mt-5 -mx-5 px-5 pt-5 pb-5 border-b border-border/60 space-y-3">
        {/* Action row */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate('/report-candidate')}>
            <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back to Jobs
          </Button>
        </div>
      </div>

      <div className="px-6 pb-6 pt-4">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_240px] gap-6">
          <div className="space-y-4 min-w-0">
            <Card className="py-8 gap-3">
                <CardContent className="flex items-center justify-center">
                  <Pattern 
                    candidate={candidate}
                    stages={stages}
                    activeStep={activeStep}
                    onActiveStepChange={setActiveStep}
                  />
                </CardContent>
              </Card>
            
              {activeStep === 1 && 
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
                            onClick={() => console.log("clicked")}
                            className="text-left p-3 rounded-lg border bg-muted/20 hover:bg-muted/60 transition-colors cursor-pointer"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-semibold flex items-center gap-1.5">
                                <Icon className="h-3.5 w-3.5 text-primary" /> {t.num} · {t.label}
                              </span>
                            </div>
                            <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                              <div className="h-full bg-primary transition-all"  /> 
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
              }
            
          </div>
        </div>
      </div>
    </>
  )
}