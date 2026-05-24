import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Loader2, AlertTriangle, ArrowLeft, ArrowRight, Check, Save, Send, ChevronUp,
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

import { getJobById, createJob, updateJob, updateJobStatus, generateJobAI } from '@/api/job.api';
import { getJobPipeline } from '@/api/pipeline.api';

import JobStages from '@/components/job-management/JobStages';
import JobPosting from '@/components/job-management/JobPosting';

const WORK_OPTIONS = ['On-site', 'Hybrid', 'Remote'];
const WORK_TYPES = ['Full-time', 'Part-time', 'Contract', 'Casual'];
const PAY_TYPES = ['Hourly', 'Monthly', 'Annually'];
const CURRENCIES = ['AUD', 'HKD', 'IDR', 'MYR', 'NZD', 'PHP', 'SGD', 'THB', 'USD'];
const PAY_DISPLAY_OPTIONS = ['Show', 'Hide'];
const SENIORITY_LEVELS = [
  'Internship', 'Entry Level', 'Associate', 'Mid-Senior Level', 'Director', 'Executive',
];

const SECTIONS = [
  { id: 'basics',   label: 'Basics',           icon: Briefcase },
  { id: 'jd',       label: 'Job description',  icon: FileText },
  { id: 'pipeline', label: 'Pipeline & AI',    icon: Workflow },
  { id: 'posting',  label: 'Posting',          icon: Megaphone },
];

// Fields the form auto-saves. PATCH only sends changed fields.
const TRACKED_FIELDS = [
  'job_title', 'job_desc', 'job_location', 'work_option', 'work_type',
  'pay_type', 'currency', 'pay_min', 'pay_max', 'pay_display',
  'company', 'seniority_level', 'company_url',
  'qualifications', 'required_skills', 'preferred_skills',
  'sla_start_date', 'sla_end_date',
];

// Required fields for Publish (must be filled). Pipeline + posting validation
// lives inside their own sections (they have their own save flow today).
const REQUIRED_BASICS = [
  'job_title', 'company', 'company_url',
  'job_location', 'work_option', 'work_type', 'seniority_level',
  'pay_type', 'currency', 'pay_min', 'pay_max', 'pay_display',
];
const REQUIRED_JD = ['job_desc', 'qualifications', 'required_skills'];

// Date helpers (timezone-safe YYYY-MM-DD ↔ Date)
const parseLocalDate = (str) => {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
};
const formatLocalDate = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

function fieldsDiffer(a, b) {
  // Deep enough for our shapes (primitives, arrays of strings)
  if (a === b) return false;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return true;
    return a.some((v, i) => v !== b[i]);
  }
  return true;
}

export default function JobEditPage() {
  const navigate = useNavigate();
  const { id: idParam } = useParams();
  const creating = !idParam; // /new vs /:id/edit

  const [job, setJob] = useState(null);                   // server state
  const [form, setForm] = useState(null);                 // editable form
  const [loading, setLoading] = useState(!creating);
  const [error, setError] = useState(null);
  const [savedAt, setSavedAt] = useState(null);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState(null);
  const [step, setStep] = useState(0); // active step: 0=Basics 1=JD 2=Pipeline 3=Posting
  const [hasStages, setHasStages] = useState(false); // server-confirmed pipeline presence

  // Ref to coalesce auto-save requests
  const savingRef = useRef(false);
  const pendingRef = useRef(false);

  // Load existing job (edit mode) or initialise blank form (create mode)
  useEffect(() => {
    if (creating) {
      setJob(null);
      setForm({
        job_title: '', job_desc: '', job_location: '',
        work_option: '', work_type: '',
        pay_type: '', currency: '', pay_min: '', pay_max: '', pay_display: '',
        company: '', seniority_level: '', company_url: '',
        qualifications: '',
        required_skills: [],
        preferred_skills: [],
        sla_start_date: '', sla_end_date: '',
      });
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getJobById(idParam);
        const j = res.data?.job;
        if (cancelled) return;
        setJob(j);
        setForm({
          ...j,
          pay_min: j.pay_min ?? '',
          pay_max: j.pay_max ?? '',
          required_skills:  Array.isArray(j.required_skills)  ? j.required_skills  : [],
          preferred_skills: Array.isArray(j.preferred_skills) ? j.preferred_skills : [],
          sla_start_date: j.sla_start_date ? formatLocalDate(new Date(j.sla_start_date)) : '',
          sla_end_date:   j.sla_end_date   ? formatLocalDate(new Date(j.sla_end_date))   : '',
        });
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || err.message || 'Failed to load job');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [idParam, creating]);

  // Pipeline is a publish requirement — track whether the server has stages.
  // Refetched when the job id changes (after load or after the draft is created);
  // kept live by JobStages' onPipelineChange while the user is on that step.
  useEffect(() => {
    if (!job?.id) { setHasStages(false); return; }
    let cancelled = false;
    getJobPipeline(job.id)
      .then((res) => { if (!cancelled) setHasStages((res.data?.data?.stages?.length || 0) > 0); })
      .catch(() => { if (!cancelled) setHasStages(false); });
    return () => { cancelled = true; };
  }, [job?.id]);

  // --- Field locks for non-Draft jobs (plan §6) ---
  const isLocked = useCallback((field) => {
    if (!job || job.status === 'Draft') return false;
    const LOCKED_ON_ACTIVE = new Set([
      'job_title', 'company', 'pay_min', 'pay_max', 'pay_type', 'currency',
    ]);
    return LOCKED_ON_ACTIVE.has(field);
  }, [job]);

  // --- Auto-save handler (called via setField) ---
  const doSave = useCallback(async () => {
    if (!form) return;
    if (savingRef.current) { pendingRef.current = true; return; }
    savingRef.current = true;
    setSaving(true);
    setError(null);
    try {
      const payload = {};
      for (const k of TRACKED_FIELDS) {
        if (form[k] === undefined) continue;
        if (job && !fieldsDiffer(form[k], job[k])) continue;
        // Skip empty title on first save (avoid creating empty Draft rows)
        if (creating && k === 'job_title' && !form.job_title?.trim()) continue;
        payload[k] = form[k] === '' ? null : form[k];
      }
      if (Object.keys(payload).length === 0) {
        setSaving(false);
        savingRef.current = false;
        if (pendingRef.current) { pendingRef.current = false; doSave(); }
        return;
      }

      if (creating || !job?.id) {
        // First-time POST. Need at least job_title; backend rejects otherwise.
        if (!payload.job_title?.trim()) {
          setSaving(false);
          savingRef.current = false;
          return;
        }
        const res = await createJob(payload);
        const created = res.data?.job;
        setJob(created);
        // Redirect to /:id/edit without remount (replaces URL, keeps state)
        if (created?.id) navigate(`/sourcing/job-management/${created.id}/edit`, { replace: true });
      } else {
        const res = await updateJob(job.id, payload);
        const updated = res.data?.job;
        if (updated) setJob(updated);
      }
      setSavedAt(new Date());
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Auto-save failed');
    } finally {
      setSaving(false);
      savingRef.current = false;
      if (pendingRef.current) { pendingRef.current = false; doSave(); }
    }
  }, [form, job, creating, navigate]);

  // Debounce auto-save when form changes
  useEffect(() => {
    if (!form) return;
    if (creating && !form.job_title?.trim()) return; // wait for first real input
    const t = setTimeout(doSave, 1500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form]);

  const setField = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  // AI Generate — fills job_desc + qualifications via the streamed OpenAI prompt.
  // Requires a Draft row to exist (job?.id) so the backend has context to read.
  const parseAIResponse = (text) => {
    const descMatch = text.match(/\[JOB_DESC\]([\s\S]*?)\[\/JOB_DESC\]/);
    const qualMatch = text.match(/\[QUALIFICATIONS\]([\s\S]*?)\[\/QUALIFICATIONS\]/);
    if (descMatch && qualMatch) {
      return { job_desc: descMatch[1].trim(), qualifications: qualMatch[1].trim() };
    }
    const splitMatch = text.match(/\n\s*(Required [Qq]ualifications|Qualifications)\s*:?\s*\n/);
    if (splitMatch) {
      const idx = text.indexOf(splitMatch[0]);
      return { job_desc: text.slice(0, idx).trim(), qualifications: text.slice(idx).trim() };
    }
    return { job_desc: text.trim(), qualifications: '' };
  };

  const handleGenerateAI = async () => {
    if (!job?.id || generating) return;
    setGenerating(true);
    setGenerateError(null);
    try {
      const fullText = await generateJobAI(job.id, null);
      const { job_desc, qualifications } = parseAIResponse(fullText);
      setForm((f) => ({ ...f, job_desc, qualifications }));
    } catch (err) {
      setGenerateError(
        err.missing
          ? `Missing fields for AI generation: ${err.missing.join(', ')}`
          : (err.message || 'AI generation failed')
      );
    } finally {
      setGenerating(false);
    }
  };

  // --- Validation ---
  const missingRequired = useMemo(() => {
    if (!form) return [];
    const missing = [];
    for (const k of [...REQUIRED_BASICS, ...REQUIRED_JD]) {
      const v = form[k];
      if (
        v == null ||
        (typeof v === 'string' && !v.trim()) ||
        (Array.isArray(v) && v.length === 0)
      ) missing.push(k);
    }
    if (form.pay_min !== '' && form.pay_max !== '' && Number(form.pay_min) >= Number(form.pay_max)) {
      missing.push('pay_max'); // logical error — show under pay_max
    }
    return missing;
  }, [form]);

  const handlePublish = async () => {
    if (!job?.id) {
      setValidationErrors(['Save the draft first by filling Basics.']);
      return;
    }
    if (missingRequired.length > 0 || !hasStages) {
      setValidationErrors([...missingRequired, ...(!hasStages ? ['pipeline'] : [])]);
      // jump to the first incomplete step: Basics → JD → Pipeline
      let firstStep = 0;
      if (missingRequired.some((k) => REQUIRED_BASICS.includes(k))) firstStep = 0;
      else if (missingRequired.some((k) => REQUIRED_JD.includes(k))) firstStep = 1;
      else if (!hasStages) firstStep = 2;
      setStep(firstStep);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setPublishing(true);
    setError(null);
    try {
      // Ensure latest auto-save flushed before publishing
      await doSave();
      await updateJobStatus(job.id, 'Active');
      navigate(`/sourcing/job-management/${job.id}`);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Publish failed');
    } finally {
      setPublishing(false);
    }
  };

  // `/new` initial render has loading=false but form=null (useEffect hasn't
  // initialised form yet). Gate on both so sections never receive null form.
  if (loading || !form) {
    if (error) {
      return (
        <div className="p-6">
          <div className="flex items-center gap-2 px-4 py-3 rounded-lg border border-red-200 bg-red-50 text-sm text-red-600">
            <AlertTriangle className="h-4 w-4" />
            {error}
          </div>
        </div>
      );
    }
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const titleText = creating
    ? 'New Job'
    : `Edit Job · ${form?.job_title || `#${idParam}`}`;
  const isPublished = job?.status && job.status !== 'Draft';

  return (
    <>
      {/* Sticky header — sibling of (not nested inside) the padded content wrapper
          so the sticky containing block is <main>, not a padded inner div.
          top-[52px] = sits right below Dashboard-Layout's sticky breadcrumb (h-13).
          -mx-5 + px-5 cancels <main>'s p-5 so the bar spans edge-to-edge. */}
      <div className="sticky top-[52px] z-10 bg-background/95 backdrop-blur-sm -mt-5 -mx-5 px-5 pt-5 pb-5 border-b border-border/60 space-y-3">
        {/* Top action row */}
        <div className="flex items-center gap-3 flex-wrap">
          <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate('/sourcing/job-management')}>
            <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back to Jobs
          </Button>
        </div>

        {/* Title + lede */}
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <h1 className="text-xl font-bold tracking-tight">{titleText}</h1>
              {job?.status && (
                <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
                  {job.status}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {creating
                ? 'Start with a job title — we auto-save the rest as you type.'
                : isPublished
                  ? <>Active job · most fields are locked. <span className="text-[11px]">Editable: JD, skills, channels, automation.</span></>
                  : 'Auto-saving as Draft. Click Publish job when all required fields are green.'}
            </p>
          </div>
        </div>
      </div>

      <div className="px-6 pb-6 pt-4">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_240px] gap-6">
          {/* MAIN COLUMN — renders only the active step. */}
          <div className="space-y-4 min-w-0">
            {/* STEP 0 · BASICS */}
            {step === 0 && (
              <BasicsSection
                form={form}
                setField={setField}
                isLocked={isLocked}
                missingRequired={missingRequired}
                showValidation={validationErrors.length > 0}
              />
            )}

            {/* STEP 1 · JD */}
            {step === 1 && (
              <JDSection
                form={form}
                setField={setField}
                missingRequired={missingRequired}
                showValidation={validationErrors.length > 0}
                onGenerateAI={handleGenerateAI}
                generating={generating}
                generateError={generateError}
                canGenerate={!!job?.id}
              />
            )}

            {/* STEP 2 · PIPELINE & AI */}
            {step === 2 && (
              <Card className="py-4 gap-3">
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Workflow className="h-4 w-4 text-primary" /> Pipeline & AI
                    <span className="text-rose-600">*</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {job?.id ? (
                    <JobStages
                      selectedJob={job}
                      onPipelineChange={({ hasStages: hs }) => setHasStages(hs)}
                    />
                  ) : (
                    <p className="text-xs text-muted-foreground italic py-2">
                      Pipeline can be configured after the draft is created. Fill the job title above to begin.
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* STEP 3 · POSTING */}
            {step === 3 && (
              <Card className="py-4 gap-3">
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Megaphone className="h-4 w-4 text-primary" /> Posting & channels
                  </CardTitle>
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
            )}

            {/* STEP PAGINATION — numbered paginator with caption below */}
            <div className="border-t border-border/60 pt-4 space-y-2">
              <div className="flex items-center justify-center gap-1.5">
                {/* Prev arrow */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  disabled={step === 0}
                  onClick={() => { setStep((s) => Math.max(0, s - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>

                {/* Numbered page pills */}
                {SECTIONS.map((s, i) => {
                  const active = step === i;
                  const missing = s.id === 'basics'
                    ? missingRequired.filter((k) => REQUIRED_BASICS.includes(k)).length
                    : s.id === 'jd'
                      ? missingRequired.filter((k) => REQUIRED_JD.includes(k)).length
                      : s.id === 'pipeline'
                        ? (hasStages ? 0 : 1)
                        : 0;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      title={s.label}
                      onClick={() => { setStep(i); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      className={`h-8 w-8 rounded-md text-xs font-semibold flex items-center justify-center transition-colors ${
                        active
                          ? 'bg-primary text-primary-foreground'
                          : missing > 0
                            ? 'border border-amber-300 text-amber-700 hover:bg-amber-50'
                            : 'border border-border text-muted-foreground hover:bg-muted/60'
                      }`}
                    >
                      {i + 1}
                    </button>
                  );
                })}

                {/* Next arrow — disabled on the last step */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  disabled={step === SECTIONS.length - 1}
                  onClick={() => { setStep((s) => Math.min(SECTIONS.length - 1, s + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                >
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Caption */}
              <p className="text-center text-[11px] text-muted-foreground">
                Step {step + 1} of {SECTIONS.length} · {SECTIONS[step].label}
              </p>
            </div>
          </div>

          {/* SIDEBAR — anchor nav + completeness.
              Sticky offset = Dashboard topbar (52px) + JobEdit sticky header (~110px) + breathing space. */}
          <aside className="hidden lg:block">
            <div className="sticky top-[200px] space-y-3">
              {/* Save status (left) + publish (right) — moved out of the sticky header */}
              <div className="flex items-center justify-between gap-2 px-1">
                <SavedIndicator saving={saving} savedAt={savedAt} error={error} />
                {!isPublished ? (
                  <Button
                    size="sm"
                    className="text-xs"
                    onClick={handlePublish}
                    disabled={publishing || !job?.id}
                    title={!job?.id ? 'Fill Basics to start (auto-creates draft)' : ''}
                  >
                    {publishing ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Send className="h-3.5 w-3.5 mr-1.5" />}
                    Publish job
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs"
                    onClick={() => navigate(`/sourcing/job-management/${job.id}`)}
                  >
                    View detail
                  </Button>
                )}
              </div>

              <Card>
                <CardContent className="p-3 space-y-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
                    Steps
                  </p>
                  {SECTIONS.map((s, i) => {
                    const Icon = s.icon;
                    const active = step === i;
                    const missing = s.id === 'basics'
                      ? missingRequired.filter((k) => REQUIRED_BASICS.includes(k)).length
                      : s.id === 'jd'
                        ? missingRequired.filter((k) => REQUIRED_JD.includes(k)).length
                        : s.id === 'pipeline'
                          ? (hasStages ? 0 : 1)
                          : 0;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          setStep(i);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-left transition-colors ${
                          active
                            ? 'bg-primary/10 text-primary font-medium'
                            : 'hover:bg-muted/50 text-foreground'
                        }`}
                      >
                        <span className={`flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-semibold ${
                          active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                        }`}>
                          {i + 1}
                        </span>
                        <Icon className={`h-3 w-3 ${active ? 'text-primary' : 'text-muted-foreground'}`} />
                        <span className="flex-1 truncate">{s.label}</span>
                        {missing > 0 && (
                          <Badge variant="outline" className="text-[9px] border-amber-200 text-amber-700">
                            {missing}
                          </Badge>
                        )}
                      </button>
                    );
                  })}
                </CardContent>
              </Card>

              <CompletenessCard
                missing={missingRequired.length + (hasStages ? 0 : 1)}
                total={REQUIRED_BASICS.length + REQUIRED_JD.length + 1}
              />

              {isPublished && (
                <Card>
                  <CardContent className="p-3">
                    <Badge variant="outline" className="text-[10px] border-emerald-200 text-emerald-700">
                      {job.status}
                    </Badge>
                    <p className="text-[10px] text-muted-foreground mt-2 leading-relaxed">
                      Compensation and core identity fields are locked. Pause the job to unlock them.
                    </p>
                  </CardContent>
                </Card>
              )}

              <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1 px-2"
              >
                <ChevronUp className="h-3 w-3" /> Back to top
              </button>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}

/* ───── Basics section ───── */
function BasicsSection({ form, setField, isLocked, missingRequired, showValidation }) {
  const isMissing = (k) => showValidation && missingRequired.includes(k);

  // Live salary band preview shown beneath the pay fields.
  const salaryPreview = useMemo(() => {
    const min = form.pay_min;
    const max = form.pay_max;
    if (!min && !max) return null;
    if (form.pay_display === 'Hide') return 'Hidden from candidates';
    const fmt = (n) => {
      if (n == null || n === '') return '';
      if (form.currency === 'IDR') return `Rp ${Number(n).toLocaleString('id-ID')}`;
      return `${form.currency || ''} ${Number(n).toLocaleString()}`.trim();
    };
    const unit = form.pay_type === 'Hourly' ? '/hour'
              : form.pay_type === 'Monthly' ? '/month'
              : form.pay_type === 'Annually' ? '/year' : '';
    if (min && max) return `${fmt(min)} – ${fmt(max)}${unit}`;
    return `${fmt(min || max)}${unit}`;
  }, [form.pay_min, form.pay_max, form.currency, form.pay_type, form.pay_display]);

  // Target hiring window length, in days (inclusive).
  const slaDuration = useMemo(() => {
    if (!form.sla_start_date || !form.sla_end_date) return null;
    const days = Math.round(
      (parseLocalDate(form.sla_end_date) - parseLocalDate(form.sla_start_date)) / 86400000
    ) + 1;
    return days > 0 ? days : null;
  }, [form.sla_start_date, form.sla_end_date]);

  return (
    <Card className="py-4 gap-3">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Briefcase className="h-4 w-4 text-primary" /> Basics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* ── Identity ── */}
        <Field
          label="Job title"
          help="The role's official posting title."
          required missing={isMissing('job_title')}
        >
          <Input
            value={form.job_title || ''}
            onChange={(e) => setField('job_title', e.target.value)}
            disabled={isLocked('job_title')}
            placeholder="e.g. Senior Frontend Engineer"
            className="text-sm"
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Company" help="Legal entity name." required missing={isMissing('company')}>
            <Input
              value={form.company || ''}
              onChange={(e) => setField('company', e.target.value)}
              disabled={isLocked('company')}
              placeholder="e.g. PT Cahaya Nusantara"
              className="text-sm"
            />
          </Field>
          <Field label="Company URL" help="Where candidates can learn more." required missing={isMissing('company_url')}>
            <Input
              type="url"
              value={form.company_url || ''}
              onChange={(e) => setField('company_url', e.target.value)}
              placeholder="https://your-company.com"
              className="text-sm"
            />
          </Field>
        </div>

        {/* ── Location (left) + engagement (right) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Field label="Location" help="City + country (or hybrid base)." required missing={isMissing('job_location')}>
            <Input
              value={form.job_location || ''}
              onChange={(e) => setField('job_location', e.target.value)}
              placeholder="e.g. Jakarta, Indonesia"
              className="text-sm"
            />
          </Field>
          <div className="grid grid-cols-3 gap-2">
            <Field label="Work option" required missing={isMissing('work_option')}>
              <SelectBox value={form.work_option || ''} onChange={(v) => setField('work_option', v)} options={WORK_OPTIONS} />
            </Field>
            <Field label="Work type" required missing={isMissing('work_type')}>
              <SelectBox value={form.work_type || ''} onChange={(v) => setField('work_type', v)} options={WORK_TYPES} />
            </Field>
            <Field label="Seniority" required missing={isMissing('seniority_level')}>
              <SelectBox value={form.seniority_level || ''} onChange={(v) => setField('seniority_level', v)} options={SENIORITY_LEVELS} />
            </Field>
          </div>
        </div>

        {/* ── Compensation (left) + hiring timeline (right) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2 border-t">
          {/* Compensation */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Compensation
              </p>
              {salaryPreview && (
                <span className="text-[11px] font-mono text-muted-foreground">
                  {salaryPreview}
                </span>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Field label="Pay type" required missing={isMissing('pay_type')}>
                <SelectBox
                  value={form.pay_type || ''}
                  onChange={(v) => setField('pay_type', v)}
                  options={PAY_TYPES}
                  disabled={isLocked('pay_type')}
                />
              </Field>
              <Field label="Currency" required missing={isMissing('currency')}>
                <SelectBox
                  value={form.currency || ''}
                  onChange={(v) => setField('currency', v)}
                  options={CURRENCIES}
                  disabled={isLocked('currency')}
                />
              </Field>
              <Field label="Show salary?" required missing={isMissing('pay_display')}>
                <SelectBox value={form.pay_display || ''} onChange={(v) => setField('pay_display', v)} options={PAY_DISPLAY_OPTIONS} />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-3">
              <Field label="Pay min" required missing={isMissing('pay_min')}>
                <Input
                  type="number"
                  value={form.pay_min ?? ''}
                  onChange={(e) => setField('pay_min', e.target.value === '' ? '' : Number(e.target.value))}
                  disabled={isLocked('pay_min')}
                  className="text-sm font-mono"
                  placeholder="0"
                />
              </Field>
              <Field label="Pay max" required missing={isMissing('pay_max')}>
                <Input
                  type="number"
                  value={form.pay_max ?? ''}
                  onChange={(e) => setField('pay_max', e.target.value === '' ? '' : Number(e.target.value))}
                  disabled={isLocked('pay_max')}
                  className="text-sm font-mono"
                  placeholder="0"
                />
              </Field>
            </div>
          </div>

          {/* Hiring timeline (SLA) */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Hiring timeline
              </p>
              {slaDuration && (
                <span className="text-[11px] font-mono text-muted-foreground">
                  {slaDuration} day{slaDuration > 1 ? 's' : ''} target
                </span>
              )}
            </div>

            <Popover>
            <PopoverTrigger asChild>
              <div
                role="button"
                tabIndex={0}
                className="grid grid-cols-2 rounded-md border border-input bg-background cursor-pointer hover:bg-muted/30 transition-colors focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <div className="flex flex-col gap-1 p-3 border-r">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Start date</span>
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className={`text-sm ${form.sla_start_date ? 'font-medium' : 'text-muted-foreground'}`}>
                      {form.sla_start_date || 'Pick start date'}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-1 p-3">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">End date</span>
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className={`text-sm ${form.sla_end_date ? 'font-medium' : 'text-muted-foreground'}`}>
                      {form.sla_end_date || 'Pick end date'}
                    </span>
                  </div>
                </div>
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="range"
                selected={{
                  from: form.sla_start_date ? parseLocalDate(form.sla_start_date) : undefined,
                  to: form.sla_end_date ? parseLocalDate(form.sla_end_date) : undefined,
                }}
                onSelect={(range) => {
                  setField('sla_start_date', range?.from ? formatLocalDate(range.from) : '');
                  setField('sla_end_date', range?.to ? formatLocalDate(range.to) : '');
                }}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
            <p className="text-[10px] text-muted-foreground mt-1 leading-snug">
              Optional — the target window to fill this role. A job's age is counted from the start date.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ───── Job description section ───── */
function JDSection({
  form, setField, missingRequired, showValidation,
  onGenerateAI, generating, generateError, canGenerate,
}) {
  const isMissing = (k) => showValidation && missingRequired.includes(k);

  const onSkillInput = (k) => (e) => {
    if (e.key !== 'Enter') return;
    const v = e.target.value.trim();
    if (!v) return;
    e.preventDefault();
    const cur = Array.isArray(form[k]) ? form[k] : [];
    if (cur.includes(v)) { e.target.value = ''; return; }
    setField(k, [...cur, v]);
    e.target.value = '';
  };

  const removeSkill = (k, idx) => {
    setField(k, (form[k] || []).filter((_, i) => i !== idx));
  };

  return (
    <Card className="py-4 gap-3">
      <CardHeader>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" /> Job description
          </CardTitle>
          <Button
            size="sm"
            variant="outline"
            className="text-xs"
            onClick={onGenerateAI}
            disabled={!canGenerate || generating}
            title={!canGenerate ? 'Save the draft first by filling the job title in Basics.' : ''}
          >
            {generating ? (
              <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Generating…</>
            ) : (
              <><Sparkles className="h-3.5 w-3.5 mr-1.5 text-primary" /> AI Generate</>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {generateError && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-md border border-red-200 bg-red-50 text-xs text-red-600">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            {generateError}
          </div>
        )}
        <Field label="Summary" required missing={isMissing('job_desc')}>
          <Textarea
            value={form.job_desc || ''}
            onChange={(e) => setField('job_desc', e.target.value)}
            placeholder="2–3 sentence overview of the role."
            rows={4}
            className="text-sm"
          />
        </Field>

        <Field label="Responsibilities & qualifications" required missing={isMissing('qualifications')}>
          <Textarea
            value={form.qualifications || ''}
            onChange={(e) => setField('qualifications', e.target.value)}
            placeholder="Bullet points — what they'll do and what they need."
            rows={6}
            className="text-sm"
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Required skills" required missing={isMissing('required_skills')}>
            <SkillChips
              values={form.required_skills || []}
              onRemove={(i) => removeSkill('required_skills', i)}
              onAddKey={onSkillInput('required_skills')}
              placeholder="Type a skill, press Enter"
              tone="primary"
            />
          </Field>
          <Field label="Preferred skills">
            <SkillChips
              values={form.preferred_skills || []}
              onRemove={(i) => removeSkill('preferred_skills', i)}
              onAddKey={onSkillInput('preferred_skills')}
              placeholder="Type a skill, press Enter"
              tone="muted"
            />
          </Field>
        </div>
      </CardContent>
    </Card>
  );
}

/* ───── Tiny helpers ───── */

function Field({ label, required, missing, help, children }) {
  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1 flex items-center gap-1.5">
        {label}
        {required && <span className="text-rose-600">*</span>}
        {missing && (
          <span className="text-[10px] text-rose-600 inline-flex items-center gap-1 font-normal normal-case">
            <AlertTriangle className="h-3 w-3" /> required
          </span>
        )}
      </div>
      {children}
      {help && (
        <p className="text-[10px] text-muted-foreground mt-1 leading-snug">{help}</p>
      )}
    </div>
  );
}

function SelectBox({ value, onChange, options, disabled }) {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="text-sm">
        <SelectValue placeholder="Select…" />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

function SkillChips({ values, onRemove, onAddKey, placeholder, tone = 'primary' }) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5 min-h-[1rem]">
        {values.length === 0 && (
          <span className="text-[11px] text-muted-foreground italic">none</span>
        )}
        {values.map((v, i) => (
          <Badge
            key={`${v}-${i}`}
            variant="secondary"
            className={`text-[10px] gap-1 cursor-default ${
              tone === 'primary' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
            }`}
          >
            {v}
            <button
              type="button"
              onClick={() => onRemove(i)}
              className="hover:text-rose-600 text-[12px] leading-none"
              aria-label="Remove"
            >×</button>
          </Badge>
        ))}
      </div>
      <Input
        placeholder={placeholder}
        onKeyDown={onAddKey}
        className="text-xs"
      />
    </div>
  );
}

function SavedIndicator({ saving, savedAt, error }) {
  if (error) {
    return (
      <span className="text-[11px] text-rose-600 flex items-center gap-1">
        <AlertTriangle className="h-3 w-3" /> Save failed
      </span>
    );
  }
  if (saving) {
    return (
      <span className="text-[11px] text-muted-foreground flex items-center gap-1">
        <Loader2 className="h-3 w-3 animate-spin" /> Saving…
      </span>
    );
  }
  if (savedAt) {
    return (
      <span className="text-[11px] text-muted-foreground flex items-center gap-1">
        <Check className="h-3 w-3 text-emerald-600" />
        Saved {timeAgo(savedAt)}
      </span>
    );
  }
  return <span className="text-[11px] text-muted-foreground"><Save className="inline h-3 w-3 mr-1" />Auto-save on</span>;
}

function CompletenessCard({ missing, total }) {
  const filled = total - missing;
  const pct = total === 0 ? 100 : Math.round((filled / total) * 100);
  const ok = missing === 0;
  return (
    <Card>
      <CardContent className="p-3">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
          Required fields
        </p>
        <div className="flex items-baseline gap-1 mb-1.5">
          <span className={`text-lg font-bold font-mono ${ok ? 'text-emerald-600' : 'text-amber-600'}`}>
            {filled}/{total}
          </span>
          <span className="text-[10px] text-muted-foreground">{pct}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full ${ok ? 'bg-emerald-500' : 'bg-amber-500'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        {!ok && (
          <p className="text-[10px] text-muted-foreground mt-2 leading-relaxed">
            Fill required fields to enable Publish.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function timeAgo(date) {
  const sec = Math.floor((Date.now() - date.getTime()) / 1000);
  if (sec < 5) return 'just now';
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  return date.toLocaleTimeString();
}
