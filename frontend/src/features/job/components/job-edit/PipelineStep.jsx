import { ArrowLeft, ArrowRight, Workflow } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import JobStages from '@/components/job-management/JobStages';
import RubricEditor from '@/components/job-management/RubricEditor';
import PositionFormEditor from '@/components/job-management/PositionFormEditor';

export default function PipelineStep({ job, step = 2, totalSteps = 5, onStepChange, onHasStagesChange }) {
  return (
    <Card data-wizard="pipeline-card" className="py-4 gap-3">
      <CardHeader className="flex flex-row items-center gap-2 pb-2">
        <Button
          variant="ghost" size="icon"
          className="h-7 w-7 shrink-0"
          disabled={step === 0}
          onClick={() => onStepChange?.(Math.max(0, step - 1))}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <CardTitle className="text-sm flex items-center gap-2 flex-1 justify-center">
          <Workflow className="h-4 w-4 text-primary" /> Pipeline & AI
          <span className="text-rose-600">*</span>
        </CardTitle>
        <Button
          variant="ghost" size="icon"
          className="h-7 w-7 shrink-0"
          disabled={step === totalSteps - 1}
          onClick={() => onStepChange?.(Math.min(totalSteps - 1, step + 1))}
        >
          <ArrowRight className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-5">
        {job?.id ? (
          <>
            <JobStages
              selectedJob={job}
              onPipelineChange={({ hasStages: hs }) => onHasStagesChange?.(hs)}
            />
            <RubricEditor jobId={job.id} />
            <PositionFormEditor jobId={job.id} />
          </>
        ) : (
          <p className="text-xs text-muted-foreground italic py-2">
            Pipeline can be configured after the draft is created. Fill the job title above to begin.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
