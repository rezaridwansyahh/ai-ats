import { useState, useEffect, useCallback } from 'react';
import {
  Briefcase, FileText, Send, Users, GitBranch, Check,
  Plus, Loader2, Pencil, Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { getJobs, createJob, updateJob, deleteJob } from '@/api/job.api';

// Field options matching backend ENUMs (setup.sql)
const WORK_OPTIONS = ['On-site', 'Hybrid', 'Remote'];
const WORK_TYPES = ['Full-time', 'Part-time', 'Contract', 'Casual'];
const PAY_TYPES = ['Hourly', 'Monthly', 'Annually'];
const CURRENCIES = ['AUD', 'HKD', 'IDR', 'MYR', 'NZD', 'PHP', 'SGD', 'THB', 'USD'];
const PAY_DISPLAY_OPTIONS = ['Show', 'Hide'];
const SENIORITY_LEVELS = ['Internship', 'Entry Level', 'Associate', 'Mid-Senior Level', 'Director', 'Executive'];

const STEPS = [
  { key: 'creation', label: 'Job Creation', icon: FileText },
  { key: 'stages', label: 'Job Stages', icon: GitBranch },
  { key: 'posting', label: 'Job Posting', icon: Send },
  { key: 'sourcing', label: 'Job Sourcing', icon: Users },
  { key: 'pipeline', label: 'Applicant Pipeline', icon: Briefcase },
];

const INITIAL_FORM = {
  job_title: '',
  job_desc: '',
  job_location: '',
  work_option: '',
  work_type: '',
  pay_type: '',
  currency: '',
  pay_min: '',
  pay_max: '',
  pay_display: '',
  company: '',
  seniority_level: '',
  company_url: '',
};

// ── Step Components ─────────────────────────────────────────────────

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

function JobCreationStep({ jobs, loading, onCreateJob, onEditJob, onDeleteJob }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const isFormValid = () => {
    return form.job_title.trim() && form.job_location.trim() && form.work_option &&
      form.work_type && form.company.trim() && form.seniority_level && form.company_url.trim() &&
      form.job_desc.trim() && form.currency && form.pay_type && form.pay_min && form.pay_max &&
      form.pay_display;
  };

  const handleSubmit = async () => {
    if (!isFormValid()) return;
    setSubmitting(true);
    try {
      const payload = { ...form };
      // Convert pay_min/pay_max to numbers
      if (payload.pay_min) payload.pay_min = Number(payload.pay_min);
      if (payload.pay_max) payload.pay_max = Number(payload.pay_max);
      // Remove empty strings
      Object.keys(payload).forEach(k => {
        if (payload[k] === '') delete payload[k];
      });

      if (editingId) {
        await onEditJob(editingId, payload);
      } else {
        await onCreateJob(payload);
      }
      setForm(INITIAL_FORM);
      setEditingId(null);
      setShowForm(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (job) => {
    setForm({
      job_title: job.job_title || '',
      job_desc: job.job_desc || '',
      job_location: job.job_location || '',
      work_option: job.work_option || '',
      work_type: job.work_type || '',
      pay_type: job.pay_type || '',
      currency: job.currency || '',
      pay_min: job.pay_min ?? '',
      pay_max: job.pay_max ?? '',
      pay_display: job.pay_display || '',
      company: job.company || '',
      seniority_level: job.seniority_level || '',
      company_url: job.company_url || '',
    });
    setEditingId(job.id);
    setShowForm(true);
  };

  const handleCancel = () => {
    setForm(INITIAL_FORM);
    setEditingId(null);
    setShowForm(false);
  };

  return (
    <div className="space-y-5">
      {/* Step Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold">Job Creation</h3>
        {!showForm && (
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-1.5" /> New Job
          </Button>
        )}
      </div>

      {/* Job Form */}
      {showForm && (
        <>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">{editingId ? 'Edit Job' : 'New Job'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Job Title */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-[11px] text-muted-foreground font-semibold">Job Title <span className="text-red-500">*</span></Label>
                <Input
                  placeholder="e.g. Senior Frontend Developer"
                  value={form.job_title}
                  onChange={e => handleChange('job_title', e.target.value)}
                  required
                />
              </div>

              {/* Location + Work Option + Work Type */}
              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-[11px] text-muted-foreground font-semibold">Location <span className="text-red-500">*</span></Label>
                  <Input
                    placeholder="e.g. Jakarta"
                    value={form.job_location}
                    onChange={e => handleChange('job_location', e.target.value)}
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-[11px] text-muted-foreground font-semibold">Work Option <span className="text-red-500">*</span></Label>
                  <Select value={form.work_option} onValueChange={v => handleChange('work_option', v)} required>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Select work option" /></SelectTrigger>
                    <SelectContent>
                      {WORK_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-[11px] text-muted-foreground font-semibold">Work Type <span className="text-red-500">*</span></Label>
                  <Select value={form.work_type} onValueChange={v => handleChange('work_type', v)} required>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Select work type" /></SelectTrigger>
                    <SelectContent>
                      {WORK_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Company + Seniority Level + Company URL */}
              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-[11px] text-muted-foreground font-semibold">Company <span className="text-red-500">*</span></Label>
                  <Input
                    placeholder="e.g. Acme Corp"
                    value={form.company}
                    onChange={e => handleChange('company', e.target.value)}
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-[11px] text-muted-foreground font-semibold">Seniority Level <span className="text-red-500">*</span></Label>
                  <Select value={form.seniority_level} onValueChange={v => handleChange('seniority_level', v)} required>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Select level" /></SelectTrigger>
                    <SelectContent>
                      {SENIORITY_LEVELS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-[11px] text-muted-foreground font-semibold">Company URL <span className="text-red-500">*</span></Label>
                  <Input
                    placeholder="e.g. https://linkedin.com/company/..."
                    value={form.company_url}
                    onChange={e => handleChange('company_url', e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Job Description */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-[11px] text-muted-foreground font-semibold">Job Description <span className="text-red-500">*</span></Label>
                <Textarea
                  className="min-h-[100px] text-xs"
                  placeholder="Enter job description..."
                  value={form.job_desc}
                  onChange={e => handleChange('job_desc', e.target.value)}
                  required
                />
              </div>

              {/* ── Compensation ── */}
              <p className="text-xs font-semibold text-muted-foreground pt-2 border-t">Compensation</p>

              <div className="grid grid-cols-4 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-[11px] text-muted-foreground font-semibold">Currency <span className="text-red-500">*</span></Label>
                  <Select value={form.currency} onValueChange={v => handleChange('currency', v)} required>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Select currency" /></SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-[11px] text-muted-foreground font-semibold">Pay Type <span className="text-red-500">*</span></Label>
                  <Select value={form.pay_type} onValueChange={v => handleChange('pay_type', v)} required>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Select pay type" /></SelectTrigger>
                    <SelectContent>
                      {PAY_TYPES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-[11px] text-muted-foreground font-semibold">Pay Min <span className="text-red-500">*</span></Label>
                  <Input
                    type="number"
                    placeholder="e.g. 8000000"
                    value={form.pay_min}
                    onChange={e => handleChange('pay_min', e.target.value)}
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-[11px] text-muted-foreground font-semibold">Pay Max <span className="text-red-500">*</span></Label>
                  <Input
                    type="number"
                    placeholder="e.g. 15000000"
                    value={form.pay_max}
                    onChange={e => handleChange('pay_max', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-[11px] text-muted-foreground font-semibold">Display on Ad <span className="text-red-500">*</span></Label>
                  <Select value={form.pay_display} onValueChange={v => handleChange('pay_display', v)} required>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Show / Hide" /></SelectTrigger>
                    <SelectContent>
                      {PAY_DISPLAY_OPTIONS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button variant="outline" onClick={handleCancel} disabled={submitting}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={submitting || !isFormValid()}>
              {submitting && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
              {editingId ? 'Update Job' : 'Create Job'}
            </Button>
          </div>
        </>
      )}

      {/* Job List */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">All Jobs</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : jobs.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-10">
              No jobs created yet. Click "New Job" to get started.
            </p>
          ) : (
            <div className="space-y-2">
              {jobs.map(job => (
                <div
                  key={job.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold truncate">{job.job_title}</span>
                      <Badge variant="secondary" className={`text-[9px] ${
                        job.status === 'Active' ? 'bg-emerald-50 text-emerald-600' :
                        job.status === 'Draft' ? 'bg-orange-50 text-orange-600' :
                        job.status === 'Running' ? 'bg-blue-50 text-blue-600' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {job.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      {job.job_location && (
                        <span className="text-[10px] text-muted-foreground">{job.job_location}</span>
                      )}
                      {job.work_type && (
                        <span className="text-[10px] text-muted-foreground">{job.work_type}</span>
                      )}
                      {job.work_option && (
                        <span className="text-[10px] text-muted-foreground">{job.work_option}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(job)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-600" onClick={() => onDeleteJob(job.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ── Main Page Component ─────────────────────────────────────────────

export default function JobManagementPage() {
  const [activeStep, setActiveStep] = useState(0);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const handleCreateJob = async (data) => {
    await createJob(data);
    await fetchJobs();
  };

  const handleEditJob = async (id, data) => {
    await updateJob(id, data);
    await fetchJobs();
  };

  const handleDeleteJob = async (id) => {
    await deleteJob(id);
    await fetchJobs();
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
            <button
              onClick={() => setActiveStep(i)}
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
            </button>
            {i < STEPS.length - 1 && (
              <div className={`w-7 h-0.5 mx-1 ${i < activeStep ? 'bg-primary' : 'bg-muted'}`} />
            )}
          </div>
        ))}
      </div>
      <p className="text-center text-[9px] text-muted-foreground italic -mt-4">
        Progress indicator — navigate using the tabs below
      </p>

      {/* Tab Navigation */}
      <div className="flex border-b -mt-2">
        {STEPS.map((step, i) => (
          <button
            key={step.key}
            onClick={() => setActiveStep(i)}
            className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all -mb-px ${
              i === activeStep
                ? 'text-primary border-primary'
                : 'text-muted-foreground border-transparent hover:text-foreground hover:bg-accent/50'
            }`}
          >
            {step.label}
          </button>
        ))}
      </div>

      {/* Step Content */}
      {activeStep === 0 && (
        <JobCreationStep
          jobs={jobs}
          loading={loading}
          onCreateJob={handleCreateJob}
          onEditJob={handleEditJob}
          onDeleteJob={handleDeleteJob}
        />
      )}
      {activeStep === 1 && <StepPlaceholder title="Job Stages" stepNum={2} />}
      {activeStep === 2 && <StepPlaceholder title="Job Posting" stepNum={3} />}
      {activeStep === 3 && <StepPlaceholder title="Job Sourcing" stepNum={4} />}
      {activeStep === 4 && <StepPlaceholder title="Applicant Pipeline" stepNum={5} />}
    </div>
  );
}
