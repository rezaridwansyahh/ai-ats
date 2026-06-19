import { useState, useEffect, useCallback } from 'react';
import { Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/common';
import { getJobs } from '@/api/job.api';
import JobSelection from '@/components/source-management/JobSelection';
import ListSource from '@/components/source-management/ListSource';
import SourceSetup from '@/components/source-management/SourceSetup';
import ListCandidate from '@/components/source-management/ListCandidate';

const STEPS = [
  { key: 'selection', label: 'Job Select'    },
  { key: 'sourcing',  label: 'List Source'   },
  { key: 'setting',   label: 'Source Setup'  },
  { key: 'candidate', label: 'List Candidate'},
];

export default function SourceManagementPage() {
  const [activeStep, setActiveStep] = useState(0);
  const [jobs, setJobs]             = useState([]);
  const [loading, setLoading]       = useState(true);
  const [selectedJob, setSelectedJob] = useState(null);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getJobs();
      setJobs(res.data.jobs || []);
    } catch {
      // no-op
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  const handleNext = () => setActiveStep(prev => Math.min(prev + 1, STEPS.length - 1));
  const handlePrev = () => setActiveStep(prev => Math.max(prev - 1, 0));

  return (
    <div className="space-y-5 p-6">

      {/* Header */}
      <PageHeader
        title="Source"
        highlight="Management"
        subtitle="End-to-end job lifecycle — create, configure stages, publish, source, and manage applicants."
      />

      {/* Stepper */}
      <div className="flex items-center justify-center py-2 border-b pb-5">
        {STEPS.map((step, i) => {
          const isCompleted = i < activeStep;
          const isActive    = i === activeStep;

          return (
            <div key={step.key} className="flex items-center">
              <div className="flex flex-col items-center gap-1.5">
                <div className={`
                  w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
                  transition-all duration-200
                  ${isCompleted
                    ? 'bg-primary/15 text-primary ring-1 ring-primary/30'
                    : isActive
                      ? 'bg-primary text-white shadow-sm'
                      : 'bg-muted text-muted-foreground'
                  }
                `}>
                  {isCompleted ? <Check className="h-3.5 w-3.5" /> : i + 1}
                </div>
                <span className={`
                  text-[11px] font-semibold transition-colors whitespace-nowrap
                  ${isActive ? 'text-primary' : 'text-muted-foreground'}
                `}>
                  {step.label}
                </span>
              </div>

              {/* Connector */}
              {i < STEPS.length - 1 && (
                <div className={`
                  w-16 h-px mx-3 mb-5 transition-colors duration-200
                  ${isCompleted ? 'bg-primary/40' : 'bg-border'}
                `} />
              )}
            </div>
          );
        })}
      </div>

      {/* Prev / Next navigation */}
      <div className="flex items-center justify-between">
        {activeStep > 0 ? (
          <Button variant="ghost" size="sm" className="text-xs" onClick={handlePrev}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous: {STEPS[activeStep - 1].label}
          </Button>
        ) : <div />}

        {activeStep < STEPS.length - 1 ? (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs"
            disabled={activeStep === 0 && !selectedJob}
            onClick={handleNext}
          >
            Next: {STEPS[activeStep + 1].label}
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        ) : <div />}
      </div>

      {/* Step content */}
      {activeStep === 0 && (
        <JobSelection
          jobs={jobs}
          loading={loading}
          selectedJob={selectedJob}
          onSelectJob={setSelectedJob}
        />
      )}
      {activeStep === 1 && (
        <ListSource selectedJob={selectedJob} />
      )}
      {activeStep === 2 && (
        <SourceSetup selectedJob={selectedJob} />
      )}
      {activeStep === 3 && (
        <ListCandidate selectedJob={selectedJob} />
      )}

    </div>
  );
}