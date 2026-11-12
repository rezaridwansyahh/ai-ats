import { ArrowLeft, ArrowRight, Megaphone } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import JobPosting from '@/components/job-management/JobPosting';

export default function PostingStep({ job, step = 4, totalSteps = 5, onStepChange }) {
  return (
    <Card className="py-4 gap-3">
      <CardHeader className="flex flex-row items-center gap-2 pb-2">
        <Button
          variant="ghost" size="icon"
          className="h-7 w-7 shrink-0"
          onClick={() => onStepChange?.(Math.max(0, step - 1))}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <CardTitle className="text-sm flex items-center gap-2 flex-1 justify-center">
          <Megaphone className="h-4 w-4 text-primary" /> Posting & channels
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
      <CardContent>
        {job?.id ? (
          <JobPosting selectedJob={job} />
        ) : (
          <p className="text-xs text-muted-foreground italic py-2">
            Channel selection unlocks after the draft is created.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
