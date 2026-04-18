import { useState, useEffect, useCallback } from 'react';
import {
  Briefcase, FileText, Send, Users, GitBranch, Check,
  ChevronLeft, ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { getJobs, createJob, updateJob, deleteJob } from '@/api/job.api';
import { getJobAccountsByUserId } from '@/api/job-accounts.api';
import JobSelection from '@/components/source-management/JobSelection';
import ListSource from '@/components/source-management/ListSource';
import SourceSetup from '@/components/source-management/SourceSetup';

const STEPS = [
  { key: 'selection', label: 'Job Select', icon: FileText },
  { key: 'sourcing', label: 'List Source', icon: GitBranch },
  { key: 'setting', label: 'Source Setup', icon: Send },
  { key: 'candidate', label: 'List Candidate', icon: Briefcase }
];

// ── Step Placeholder ────────────────────────────────────────────────
function StepPlaceholder({ title, stepNum }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
        <span className="text-2xl font-bold text-primary">{stepNum}</span>
      </div>
      <h3 className="text-lg font-bold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-md">
        This step will be available once Job Creation is configured. Content coming soon.
      </p>
    </div>
  );
}

export default function SourceManagementPage() {
  const [activeStep, setActiveStep] = useState(0);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState(null);
  const [validationErrors, setValidationErrors] = useState([]);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getJobs();
      setJobs(res.data.jobs || []);
    } catch (err) {
      // no-op
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleNext = () => {
    if (activeStep === 2) {
      setShowPostingConfirm(true);
      return;
    }
    setValidationErrors([]);
    setActiveStep(prev => Math.min(prev + 1, STEPS.length - 1));
  };

  const handlePrev = () => {
    setValidationErrors([]);
    setActiveStep(prev => Math.max(prev - 1, 0));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold tracking-tight">Source Management</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            End-to-end job lifecycle — create, configure stages, publish, source, and manage applicants
          </p>
        </div>
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-center gap-0 py-3 border-b">
        {STEPS.map((step, i) => (
          <div key={step.key} className="flex items-center">
            <div
              className={`flex items-center gap-2 px-1 py-1 transition-all ${
                i === activeStep ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                i < activeStep
                  ? 'bg-primary text-white'
                  : i === activeStep
                    ? 'bg-primary text-white'
                    : 'bg-muted text-muted-foreground'
              }`}>
                {i < activeStep ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </div>
              <span className={`text-[11px] font-bold transition-colors ${
                i === activeStep ? 'text-primary' : 'text-muted-foreground'
              }`}>{step.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`w-7 h-0.5 mx-1 ${i < activeStep ? 'bg-primary' : 'bg-muted'}`} />
            )}
          </div>
        ))}
      </div>
      <p className="text-center text-[9px] text-muted-foreground italic -mt-4">
        Progress indicator — navigate using the tabs below
      </p>

      {/* Step Navigation */}
      <div className="flex justify-between items-center border-b -mt-2 pb-2">
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
            disabled={activeStep === 0 && !selectedJob }
            onClick={handleNext}
          >
            Next: {STEPS[activeStep + 1].label}
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        ) : <div />}
      </div>

      {/* Step Content */}
      {activeStep === 0 && (
        <JobSelection
          jobs={jobs}
          loading={loading}
          selectedJob={selectedJob}
          onSelectJob={setSelectedJob}
        />
      )}

      {activeStep === 1 && (
        <ListSource
          selectedJob={selectedJob}
        />
      )}

      {activeStep === 2 && (
        <SourceSetup
          selectedJob={selectedJob}
        />
      )}
    </div>
  )
}