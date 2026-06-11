import { useEffect, useCallback, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Loader2, AlertTriangle, ArrowLeft, ArrowRight, MapPin, Save, Send, ChevronUp,
  Briefcase, FileText, Workflow, Megaphone, Sparkles, Calendar as CalendarIcon,
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

const SECTIONS = [
  { id: 'basics',   label: 'Basics',           icon: Briefcase },
  { id: 'jd',       label: 'Job description',  icon: FileText },
  { id: 'pipeline', label: 'Pipeline & AI',    icon: Workflow },
  { id: 'posting',  label: 'Posting',          icon: Megaphone },
];

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

        {/* Title + meta */}
        <div>
          <div className="flex items-center gap-3 mb-1.5 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight">{candidate.name}</h1>
          </div>
          <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1">
            {candidate.address && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {candidate.address}</span>}
            {candidate.last_position && <span>{candidate.last_position}</span>}
            {candidate.education && <span>· {candidate.education}</span>}
            {candidate.latest_stage && <span>· Latest stage: {candidate.latest_stage}</span>}
          </div>
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
            
              <div>Step still {activeStep}</div>
            
          </div>
        </div>
      </div>
    </>
  )
}