import { Workflow } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function PipelinePanel({ candidateCount, onOpenPipeline }) {
  return (
    <Card className="py-4 gap-3">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Workflow className="h-4 w-4 text-primary" /> Pipeline
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-xs text-muted-foreground">
          {(candidateCount ?? 0)} candidate{(candidateCount ?? 0) === 1 ? '' : 's'} in this job's pipeline.
        </p>
        <Button
          size="sm"
          variant="outline"
          className="w-full text-xs"
          onClick={onOpenPipeline}
        >
          <Workflow className="h-3.5 w-3.5 mr-1.5" /> Open Candidate Pipeline
        </Button>
      </CardContent>
    </Card>
  );
}
