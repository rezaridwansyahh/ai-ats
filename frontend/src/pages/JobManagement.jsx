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
import { getRecruiters } from '@/api/recruiter.api';
import JobCreation from '@/components/job-management/JobCreation';
import JobStages from '@/components/job-management/JobStages';
import JobPosting from '@/components/job-management/JobPosting';

const STEPS = [
  { key: 'creation', label: 'Job Creation', icon: FileText },
  { key: 'stages', label: 'Job Stages', icon: GitBranch },
  { key: 'posting', label: 'Job Posting', icon: Send },
  { key: 'sourcing', label: 'Job Sourcing', icon: Users },
  { key: 'pipeline', label: 'Applicant Pipeline', icon: Briefcase },
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

// ── Main Page Component ─────────────────────────────────────────────
export default function JobManagementPage() {
  const [activeStep, setActiveStep] = useState(0);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recruiters, setRecruiters] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [validationErrors, setValidationErrors] = useState([]);
  const [postingSummary, setPostingSummary] = useState(null);
  const [showPostingConfirm, setShowPostingConfirm] = useState(false);

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

  const fetchRecruiters = useCallback(async () => {
    try {
      const res = await getRecruiters();
      setRecruiters(res.data.recruiters || []);
    } catch (err) {
      // no-op
    }
  }, []);

  useEffect(() => {
    fetchJobs();
    fetchRecruiters();
  }, [fetchJobs, fetchRecruiters]);

  const handleCreateJob = async (data) => {
    const res = await createJob(data);
    await fetchJobs();
    return res?.data;
  };

  const handleEditJob = async (id, data) => {
    await updateJob(id, data);
    await fetchJobs();
  };

  const handleDeleteJob = async (id) => {
    await deleteJob(id);
    await fetchJobs();
  };

  const REQUIRED_FIELDS = [
    { key: 'job_title', label: 'Job Title' },
    { key: 'job_location', label: 'Location' },
    { key: 'work_option', label: 'Work Option' },
    { key: 'work_type', label: 'Work Type' },
    { key: 'company', label: 'Company' },
    { key: 'seniority_level', label: 'Seniority Level' },
    { key: 'company_url', label: 'Company URL' },
    { key: 'job_desc', label: 'Job Description' },
    { key: 'currency', label: 'Currency' },
    { key: 'pay_type', label: 'Pay Type' },
    { key: 'pay_min', label: 'Pay Min' },
    { key: 'pay_max', label: 'Pay Max' },
    { key: 'pay_display', label: 'Pay Display' },
  ];

  const handleNext = () => {
    if (activeStep === 0) {
      if (!selectedJobId) return;
      const job = jobs.find(j => j.id === selectedJobId);
      if (!job) return;
      const missing = REQUIRED_FIELDS.filter(f => !job[f.key] || (typeof job[f.key] === 'string' && !job[f.key].trim()));
      if (missing.length > 0) {
        setValidationErrors(missing.map(f => f.label));
        return;
      }
    }
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
          <h2 className="text-lg font-bold tracking-tight">Job Management</h2>
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
            disabled={activeStep === 0 && !selectedJobId}
            onClick={handleNext}
          >
            Next: {STEPS[activeStep + 1].label}
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        ) : <div />}
      </div>

      {/* Validation Error Modal */}
      <Dialog open={validationErrors.length > 0} onOpenChange={() => setValidationErrors([])}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Incomplete Job Information</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">The following required fields are missing:</p>
            <ul className="list-disc pl-5 space-y-1">
              {validationErrors.map(err => (
                <li key={err} className="text-sm text-red-500">{err}</li>
              ))}
            </ul>
          </div>
          <DialogFooter>
            <Button onClick={() => setValidationErrors([])}>OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Step Content */}
      {activeStep === 0 && (
        <JobCreation
          jobs={jobs}
          loading={loading}
          recruiters={recruiters}
          onCreateJob={handleCreateJob}
          onEditJob={handleEditJob}
          onDeleteJob={handleDeleteJob}
          selectedJobId={selectedJobId}
          onSelectJob={setSelectedJobId}
        />
      )}
      {activeStep === 1 && (
        <JobStages selectedJob={jobs.find(j => j.id === selectedJobId)} />
      )}
      {activeStep === 2 && (
        <JobPosting
          selectedJob={jobs.find(j => j.id === selectedJobId)}
          onSelectionChange={setPostingSummary}
        />
      )}
      {activeStep === 3 && <StepPlaceholder title="Job Sourcing" stepNum={4} />}
      {activeStep === 4 && <StepPlaceholder title="Applicant Pipeline" stepNum={5} />}

      {/* Posting Confirmation Modal */}
      <Dialog open={showPostingConfirm} onOpenChange={setShowPostingConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Publishing Selection</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">You are about to proceed with the following selection:</p>
            {postingSummary?.public?.enabled && (
              <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200">
                <span className="h-2 w-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-emerald-800">Public</p>
                  <p className="text-[11px] text-emerald-700">
                    {postingSummary.public.channels.length > 0
                      ? postingSummary.public.channels.join(', ')
                      : 'No channels published yet'}
                  </p>
                </div>
              </div>
            )}
            {postingSummary?.private?.enabled && (
              <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200">
                <span className="h-2 w-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-amber-800">Private</p>
                  <p className="text-[11px] text-amber-700">
                    {postingSummary.private.channels.length > 0
                      ? postingSummary.private.channels.join(', ')
                      : 'No channels shared yet'}
                  </p>
                </div>
              </div>
            )}
            {postingSummary?.internal?.enabled && (
              <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/20">
                <span className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-primary">Internal Hire Only</p>
                  <p className="text-[11px] text-muted-foreground">
                    Candidates will be sourced from talent pool
                  </p>
                </div>
              </div>
            )}
            {!postingSummary?.public?.enabled && !postingSummary?.private?.enabled && !postingSummary?.internal?.enabled && (
              <div className="px-3 py-2 rounded-lg bg-muted text-xs text-muted-foreground text-center">
                No channels or groups selected.
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPostingConfirm(false)}>Back</Button>
            <Button onClick={() => { setShowPostingConfirm(false); setActiveStep(3); }}>Confirm &amp; Continue</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
