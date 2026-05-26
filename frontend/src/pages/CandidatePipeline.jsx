import CandidatePipeline from '@/components/dashboard/CandidatePipeline';

export default function CandidatePipelinePage() {
  return (
    <div className="space-y-5 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Candidate Pipeline</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Pick a job to view its pipeline by stage. To take action on a candidate, open them in <span className="font-semibold">Selection → AI Screening</span>.
        </p>
      </div>
      <CandidatePipeline />
    </div>
  );
}
