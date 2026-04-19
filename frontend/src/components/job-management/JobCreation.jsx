import { useState, useEffect, useRef, useMemo } from 'react';
import {
  Plus, Loader2, Pencil, Trash2, Upload, Sparkles, X, Star, Check,
  Bold, Italic, Underline, List, ListOrdered, Link, Bot,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { generateJobAI } from '@/api/job.api';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';

const WORK_OPTIONS = ['On-site', 'Hybrid', 'Remote'];
const WORK_TYPES = ['Full-time', 'Part-time', 'Contract', 'Casual'];
const PAY_TYPES = ['Hourly', 'Monthly', 'Annually'];
const CURRENCIES = ['AUD', 'HKD', 'IDR', 'MYR', 'NZD', 'PHP', 'SGD', 'THB', 'USD'];
const PAY_DISPLAY_OPTIONS = ['Show', 'Hide'];
const SENIORITY_LEVELS = ['Internship', 'Entry Level', 'Associate', 'Mid-Senior Level', 'Director', 'Executive'];
const DEFAULT_BENEFITS = ['Health Insurance', 'Life Insurance', 'Housing', 'Company Car', 'Gym Membership', 'Training & Dev'];
const STATUS_OPTIONS = ['Draft', 'Active', 'Running', 'Expired', 'Failed', 'Blocked'];
const PAGE_SIZE = 5;

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
  recruiter: '',
  qualifications: '',
  sla_start_date: '',
  sla_end_date: '',
};

// ── Date helpers (timezone-safe YYYY-MM-DD ↔ Date) ─────────────────
const parseLocalDate = (str) => {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
};
const formatLocalDate = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// ── Star Rating Component ───────────────────────────────────────────
function StarRating({ value, onChange, accent }) {
  return (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i)}
          className={`text-[11px] leading-none cursor-pointer ${i <= value ? (accent ? 'text-amber-400' : 'text-muted-foreground') : 'text-muted-foreground/30'}`}
        >
          <Star className={`h-3 w-3 ${i <= value ? 'fill-current' : ''}`} />
        </button>
      ))}
    </span>
  );
}

// ── Skills List Component ───────────────────────────────────────────
function SkillsList({ skills, setSkills, accent, placeholder }) {
  const rows = skills.length > 0 ? skills : [{ name: '', weight: 3 }];

  const addRow = () => {
    setSkills([...rows, { name: '', weight: 3 }]);
  };

  const removeRow = (idx) => {
    const updated = rows.filter((_, i) => i !== idx);
    setSkills(updated.length > 0 ? updated : [{ name: '', weight: 3 }]);
  };

  const updateName = (idx, val) => {
    const updated = [...rows];
    updated[idx] = { ...updated[idx], name: val };
    setSkills(updated);
  };

  const setWeight = (idx, w) => {
    const updated = [...rows];
    updated[idx] = { ...updated[idx], weight: w };
    setSkills(updated);
  };

  return (
    <div className="flex flex-col gap-1.5">
      {rows.map((skill, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <input
            type="text"
            value={skill.name}
            onChange={(e) => updateName(idx, e.target.value)}
            placeholder={placeholder}
            className="w-[200px] rounded-md border border-input bg-background px-2.5 py-1.5 text-sm outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-ring"
          />
          <StarRating value={skill.weight} onChange={(w) => setWeight(idx, w)} accent={accent} />
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
            accent
              ? 'bg-primary/10 text-primary'
              : 'bg-muted text-muted-foreground border border-border'
          }`}>
            {skill.weight}/5
          </span>
          {rows.length > 1 && (
            <button
              type="button"
              onClick={() => removeRow(idx)}
              className="shrink-0 rounded-md p-1 text-muted-foreground hover:text-destructive hover:bg-muted transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={addRow}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors w-fit"
      >
        <Plus className="h-3.5 w-3.5" />
        Add more
      </button>
    </div>
  );
}

// ── Job Creation Step ───────────────────────────────────────────────
export default function JobCreationStep({ jobs, loading, recruiters, onCreateJob, onEditJob, onDeleteJob, selectedJob, onSelectJob }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [isActive, setIsActive] = useState(false);

  // Job Details state
  const [requiredSkills, setRequiredSkills] = useState([]);
  const [preferredSkills, setPreferredSkills] = useState([]);
  const [benefitOptions, setBenefitOptions] = useState(DEFAULT_BENEFITS);
  const [benefits, setBenefits] = useState([]);
  const [newBenefit, setNewBenefit] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [generating, setGenerating] = useState(false);
  const fileInputRef = useRef(null);

  // error validation handler
  const [validationErrors, setValidationErrors] = useState([]);

  // Search, filter & pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);

  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      const matchesSearch = !searchQuery || job.job_title?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || job.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [jobs, searchQuery, statusFilter]);

  const totalPages = Math.ceil(filteredJobs.length / PAGE_SIZE);
  const paginatedJobs = filteredJobs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [searchQuery, statusFilter]);

  const slaDuration = useMemo(() => {
    if (!form.sla_start_date || !form.sla_end_date) return null;
    const start = new Date(form.sla_start_date);
    const end = new Date(form.sla_end_date);
    const days = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;
    return days > 0 ? days : null;
  }, [form.sla_start_date, form.sla_end_date]);

  // Auto-save draft state
  const [saveStatus, setSaveStatus] = useState('idle');
  const [draftId, setDraftId] = useState(null);
  const savingRef = useRef(false);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  // Debounce auto-save draft (5 seconds after last change)
  useEffect(() => {
    if (!showForm || !form.job_title.trim()) return;
    if (savingRef.current) return;

    setSaveStatus('idle');
    const timer = setTimeout(async () => {
      savingRef.current = true;
      setSaveStatus('saving');
      try {
        const payload = { ...form, status: 'Draft' };
        if (payload.pay_min) payload.pay_min = Number(payload.pay_min);
        if (payload.pay_max) payload.pay_max = Number(payload.pay_max);
        if (requiredSkills.length > 0) payload.required_skills = requiredSkills;
        if (preferredSkills.length > 0) payload.preferred_skills = preferredSkills;
        if (benefits.length > 0) payload.benefits = benefits;
        Object.keys(payload).forEach(k => { if (payload[k] === '') delete payload[k]; });

        const currentDraftId = editingId || draftId;
        if (currentDraftId) {
          await onEditJob(currentDraftId, payload);
        } else {
          const res = await onCreateJob(payload);
          if (res?.job?.id) setDraftId(res.job.id);
        }
        setSaveStatus('saved');
      } catch {
        setSaveStatus('error');
      } finally {
        savingRef.current = false;
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [form, requiredSkills, preferredSkills, benefits]); // eslint-disable-line react-hooks/exhaustive-deps

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
      if (payload.pay_min) payload.pay_min = Number(payload.pay_min);
      if (payload.pay_max) payload.pay_max = Number(payload.pay_max);
      if (requiredSkills.length > 0) payload.required_skills = requiredSkills;
      if (preferredSkills.length > 0) payload.preferred_skills = preferredSkills;
      Object.keys(payload).forEach(k => {
        if (payload[k] === '') delete payload[k];
      });

      const currentId = editingId || draftId;
      if (currentId) {
        await onEditJob(currentId, payload);
      } else {
        await onCreateJob(payload);
      }
      setForm(INITIAL_FORM);
      setRequiredSkills([]);
      setPreferredSkills([]);
      setBenefits([]);
      setUploadedFile(null);
      setEditingId(null);
      setDraftId(null);
      setSaveStatus('idle');
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
      recruiter: '',
      qualifications: job.qualifications || '',
      sla_start_date: job.sla_start_date ? formatLocalDate(new Date(job.sla_start_date)) : '',
      sla_end_date: job.sla_end_date ? formatLocalDate(new Date(job.sla_end_date)) : '',
    });
    setRequiredSkills(job.required_skills || []);
    setPreferredSkills(job.preferred_skills || []);
    const savedBenefits = job.benefits || [];
    setBenefits(savedBenefits);
    setBenefitOptions([...new Set([...DEFAULT_BENEFITS, ...savedBenefits])]);
    setEditingId(job.id);
    setShowForm(true);
  };

  const handleCancel = () => {
    setForm(INITIAL_FORM);
    setRequiredSkills([]);
    setPreferredSkills([]);
    setBenefits([]);
    setBenefitOptions(DEFAULT_BENEFITS);
    setNewBenefit('');
    setUploadedFile(null);
    setDraftId(null);
    setSaveStatus('idle');
    setEditingId(null);
    setShowForm(false);
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0] || e.target?.files?.[0];
    if (file) setUploadedFile(file);
  };

  const parseAIResponse = (text) => {
    const descMatch = text.match(/\[JOB_DESC\]([\s\S]*?)\[\/JOB_DESC\]/);
    const qualMatch = text.match(/\[QUALIFICATIONS\]([\s\S]*?)\[\/QUALIFICATIONS\]/);
    if (descMatch && qualMatch) {
      return { job_desc: descMatch[1].trim(), qualifications: qualMatch[1].trim() };
    }

    const splitMatch = text.match(/\n\s*(Required [Qq]ualifications|Qualifications)\s*:?\s*\n/);
    if (splitMatch) {
      const idx = text.indexOf(splitMatch[0]);
      return {
        job_desc: text.slice(0, idx).trim(),
        qualifications: text.slice(idx).trim(),
      };
    }

    return { job_desc: text.trim(), qualifications: '' };
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const jobId = editingId || draftId;
      const fullText = await generateJobAI(jobId, uploadedFile);
      console.log('AI response:', fullText);
      const { job_desc, qualifications } = parseAIResponse(fullText);
      setForm(prev => ({ ...prev, job_desc, qualifications }));
    } catch (err) {
      console.log(err);
      setValidationErrors(err.missing || [err.message || 'Unknown Error']);
    } finally {
      setGenerating(false);
    }
  };

  const toggleBenefit = (b) => {
    setBenefits(prev => prev.includes(b) ? prev.filter(x => x !== b) : [...prev, b]);
  };

  return (
    <div className="space-y-5">
      {/* Validation Error AI Generate */}
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
      {/* Step Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold">Job Creation</h3>
        <Button size="sm" onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-1.5" /> New Job
        </Button>
      </div>
      

      {/* Job Form Dialog */}
      <Dialog open={showForm} onOpenChange={(open) => { if (!open) handleCancel(); }}>
        <DialogContent className="max-w-[90vw] sm:max-w-[90vw] h-[90vh] overflow-hidden rounded-lg flex flex-col">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <DialogTitle>{editingId ? 'Edit Job' : 'New Job'}</DialogTitle>
              {saveStatus === 'saving' && (
                <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-amber-600">
                  <Loader2 className="h-3 w-3 animate-spin" /> Saving...
                </span>
              )}
              {saveStatus === 'saved' && (
                <span className="inline-flex items-center gap-1.5 tex-[10px] font-semibold text-emerald-600">
                  <Check className="h-3 w-3" /> Draft saved
                </span>
              )}
              {saveStatus === 'error' && (
                <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-red-500">
                  <X className="h-3 w-3" /> Save failed
                </span>
              )}
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-5 pr-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Job Information</CardTitle>
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

              {/* ── Recruiter Assignment ── */}
              <p className="text-xs font-semibold text-muted-foreground pt-2 border-t">Recruiter Assignment</p>

              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Select value={form.recruiter} onValueChange={v => handleChange('recruiter', v)}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Select recruiter" /></SelectTrigger>
                    <SelectContent>
                      {recruiters.length === 0 ? (
                        <div className="px-2 py-4 text-xs text-muted-foreground text-center">No recruiter available</div>
                      ) : (
                        recruiters.map(r => (
                          <SelectItem key={r.id} value={r.id.toString()}>
                            {r.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <span className="text-[10px] text-muted-foreground">This recruiter will manage all city pipelines for this job.</span>
                </div>
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

              {/* ── Benefits ── */}
              <p className="text-xs font-semibold text-muted-foreground pt-2 border-t">Benefits</p>

              <div className="flex flex-wrap gap-3">
                {benefitOptions.map(b => (
                  <label key={b} className="flex items-center gap-1.5 text-[11px] cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={benefits.includes(b)}
                      onChange={() => toggleBenefit(b)}
                      className="accent-primary h-3.5 w-3.5 rounded"
                    />
                    {b}
                  </label>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newBenefit}
                  onChange={e => setNewBenefit(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && newBenefit.trim()) {
                      e.preventDefault();
                      if (!benefitOptions.includes(newBenefit.trim())) {
                        setBenefitOptions(prev => [...prev, newBenefit.trim()]);
                      }
                      setNewBenefit('');
                    }
                  }}
                  placeholder="+ Add custom benefit"
                  className="w-[200px] rounded-md border border-input bg-background px-2.5 py-1.5 text-[11px] outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-ring"
                />
              </div>
            </CardContent>
          </Card>

          {/* ── Job Details Card ── */}
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm">Job Details</CardTitle>
              <Button size="sm" onClick={handleGenerate} disabled={generating}>
                {generating
                  ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Generating...</>
                  : <><Sparkles className="h-3.5 w-3.5 mr-1.5" /> AI Generate</>
                }
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* AI Tags */}
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="text-[10px] font-semibold bg-emerald-50 text-emerald-600 border-0">
                  &#10003; Bias-Free Language
                </Badge>
                <Badge variant="secondary" className="text-[10px] font-semibold bg-primary/8 text-primary border-0">
                  &#128269; SEO Optimized
                </Badge>
                <Badge variant="secondary" className="text-[10px] font-semibold bg-blue-50 text-blue-600 border-0">
                  &#127760; Multi-Language (ID+EN)
                </Badge>
                <Badge variant="secondary" className="text-[10px] font-semibold bg-red-50 text-red-600 border-0">
                  &#9878; Compliance
                </Badge>
              </div>

              {/* Upload JD */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-[11px] text-muted-foreground font-semibold">Upload Job Description (Optional)</Label>
                <div
                  className="border-2 border-dashed border-border rounded-lg p-6 text-center bg-muted/30 cursor-pointer hover:border-primary/40 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={e => e.preventDefault()}
                  onDrop={handleFileDrop}
                >
                  <Upload className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-xs font-semibold">
                    {uploadedFile ? uploadedFile.name : 'Drag file here or click to browse'}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Upload existing Job Desc: PDF, DOCX, TXT (max 10MB)
                    <br />AI will auto-extract all fields from uploaded document
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.docx,.txt"
                    className="hidden"
                    onChange={handleFileDrop}
                  />
                </div>
              </div>

              {/* Job Description with toolbar */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-[11px] text-muted-foreground font-semibold">Job Description <span className="text-red-500">*</span></Label>
                <div className="border rounded-lg overflow-hidden">
                  <div className="flex gap-0.5 px-2 py-1.5 border-b bg-muted/40">
                    <button type="button" className="w-7 h-7 rounded flex items-center justify-center hover:bg-muted transition-colors" title="Bold">
                      <Bold className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" className="w-7 h-7 rounded flex items-center justify-center hover:bg-muted transition-colors" title="Italic">
                      <Italic className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" className="w-7 h-7 rounded flex items-center justify-center hover:bg-muted transition-colors" title="Underline">
                      <Underline className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" className="w-7 h-7 rounded flex items-center justify-center hover:bg-muted transition-colors" title="Bullet list">
                      <List className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" className="w-7 h-7 rounded flex items-center justify-center hover:bg-muted transition-colors" title="Number list">
                      <ListOrdered className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" className="w-7 h-7 rounded flex items-center justify-center hover:bg-muted transition-colors" title="Link">
                      <Link className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" className="w-7 h-7 rounded flex items-center justify-center hover:bg-muted transition-colors" title="AI Assist">
                      <Bot className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <Textarea
                    className="min-h-[200px] text-xs border-0 rounded-none focus-visible:ring-0 resize-y"
                    placeholder="Enter job description or use AI Generate..."
                    value={form.job_desc}
                    onChange={e => handleChange('job_desc', e.target.value)}
                  />
                </div>
              </div>

              {/* Qualifications */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-[11px] text-muted-foreground font-semibold">Qualifications <span className="text-red-500">*</span></Label>
                <Textarea
                  className="min-h-[150px] text-xs resize-y"
                  placeholder="Enter qualifications or use AI Generate..."
                  value={form.qualifications}
                  onChange={e => handleChange('qualifications', e.target.value)}
                />
              </div>

              {/* Required Skills */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-[11px] text-muted-foreground font-semibold">
                  Required Skills <span className="text-red-500">*</span>
                  <span className="ml-2 text-[9px] font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary">WITH WEIGHT</span>
                </Label>
                <SkillsList
                  skills={requiredSkills}
                  setSkills={setRequiredSkills}
                  accent
                  placeholder="Enter Required Skill"
                />
              </div>

              {/* Preferred Skills */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-[11px] text-muted-foreground font-semibold">Preferred Skills</Label>
                <SkillsList
                  skills={preferredSkills}
                  setSkills={setPreferredSkills}
                  accent={false}
                  placeholder="Enter Preferred Skill"
                />
              </div>

            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Timeline for job </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Popover>
                <PopoverTrigger asChild>
                  <div
                    role="button"
                    tabIndex={0}
                    className="grid grid-cols-2 rounded-md border border-input bg-background cursor-pointer hover:bg-muted/30 transition-colors focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <div className="flex flex-col gap-1 p-3 border-r">
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Start Date</span>
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className={`text-sm ${form.sla_start_date ? 'font-medium' : 'text-muted-foreground'}`}>
                          {form.sla_start_date || 'Pick start date'}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 p-3">
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">End Date</span>
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className={`text-sm ${form.sla_end_date ? 'font-medium' : 'text-muted-foreground'}`}>
                          {form.sla_end_date || 'Pick end date'}
                        </span>
                      </div>
                    </div>
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="center">
                  <Calendar
                    mode="range"
                    selected={{
                      from: form.sla_start_date ? parseLocalDate(form.sla_start_date) : undefined,
                      to: form.sla_end_date ? parseLocalDate(form.sla_end_date) : undefined,
                    }}
                    onSelect={(range) => {
                      handleChange('sla_start_date', range?.from ? formatLocalDate(range.from) : '');
                      handleChange('sla_end_date', range?.to ? formatLocalDate(range.to) : '');
                    }}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>

              {slaDuration && (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-muted-foreground">Duration:</span>
                  <Badge variant="secondary" className="bg-primary/10 text-primary border-0 text-[10px] font-semibold">
                    {slaDuration} {slaDuration === 1 ? 'day' : 'days'}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
          </div>

          <DialogFooter className="pt-2 border-t">
            <Button variant="outline" onClick={handleCancel} disabled={submitting}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={submitting || !isFormValid()}>
              {submitting && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
              {editingId ? 'Update Job' : 'Save Job'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Job List */}
      <Card>
        <CardHeader className="pb-3 space-y-3">
          <CardTitle className="text-sm">All Jobs</CardTitle>
          <div className="flex items-center gap-3">
            <Input
              placeholder="Search jobs..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="max-w-[250px] text-xs"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px] text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : filteredJobs.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-10">
              {jobs.length === 0 ? 'No jobs created yet. Click "New Job" to get started.' : 'No jobs match your search.'}
            </p>
          ) : (
            <div className="space-y-2">
              {paginatedJobs.map(job => (
                <div
                  key={job.id}
                  onClick={() => (job.status === 'Draft' || job.status === 'Reconfigure' || job.status === 'Active') && onSelectJob(selectedJob === job ? null : job)}
                  className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${
                    selectedJob === job
                      ? 'ring-2 ring-primary bg-primary/5'
                      : (job.status === 'Draft' || job.status === 'Reconfigure' || job.status === 'Active')
                        ? 'hover:bg-muted/30 cursor-pointer'
                        : 'opacity-60'
                  }`}
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
                    <Button disabled={job.status === 'Active'} variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(job)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button disabled={job.status === 'Active'} variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-600" onClick={() => onDeleteJob(job.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="flex flex-col items-center gap-2 pt-3 border-t mt-3">
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" className="h-7 text-xs" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                Previous
              </Button>
              {(() => {
                const pages = [];
                pages.push(1);
                if (page > 3) pages.push('...');
                for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
                  pages.push(i);
                }
                if (page < totalPages - 2) pages.push('...');
                if (totalPages > 1) pages.push(totalPages);
                return pages.map((p, idx) =>
                  p === '...' ? (
                    <span key={`dots-${idx}`} className="text-xs text-muted-foreground px-1">...</span>
                  ) : (
                    <Button
                      key={p}
                      variant={page === p ? 'default' : 'outline'}
                      size="sm"
                      className="h-7 w-7 text-xs p-0"
                      onClick={() => setPage(p)}
                    >
                      {p}
                    </Button>
                  )
                );
              })()}
              <Button variant="outline" size="sm" className="h-7 text-xs" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                Next
              </Button>
            </div>
            <span className="text-[10px] text-muted-foreground">
              {filteredJobs.length > 0
                ? `Showing ${(page - 1) * PAGE_SIZE + 1}\u2013${Math.min(page * PAGE_SIZE, filteredJobs.length)} of ${filteredJobs.length}`
                : 'No results'}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
