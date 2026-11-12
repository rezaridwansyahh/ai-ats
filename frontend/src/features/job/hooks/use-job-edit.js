import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getJobById, createJob, updateJob, updateJobStatus, generateJobAI, generateJobSkillsAI,
} from '../api/job.api';
import { getJobPipeline } from '@/api/pipeline.api';

// Fields the form auto-saves.
const TRACKED_FIELDS = [
  'job_title', 'job_desc', 'job_location', 'work_option', 'work_type',
  'pay_type', 'currency', 'pay_min', 'pay_max', 'pay_display',
  'company', 'seniority_level', 'company_url',
  'qualifications', 'required_skills', 'preferred_skills',
  'sla_start_date', 'sla_end_date',
  'assessment_battery',
];

// Required fields for Publish (must be filled). Pipeline + posting validation
// lives inside their own sections (they have their own save flow today).
export const REQUIRED_BASICS = [
  'job_title', 'company', 'company_url',
  'job_location', 'work_option', 'work_type', 'seniority_level',
  'pay_type', 'currency', 'pay_min', 'pay_max', 'pay_display',
];
export const REQUIRED_JD = ['job_desc', 'qualifications', 'required_skills'];
export const REQUIRED_BATTERY = ['assessment_battery'];

// Date helpers (timezone-safe YYYY-MM-DD ↔ Date). parseLocalDate is also used
// by BasicsSection's calendar popover in the page component.
export const parseLocalDate = (str) => {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
};
// Also used by BasicsSection's calendar popover in the page component.
export const formatLocalDate = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const isValidUrl1 = (str) => {
  if (!str) return false;
  try {
    const url1 = new URL(str);
    return url1.protocol === 'http:' || url1.protocol === 'https:';
  } catch {
    return false;
  }
};

function fieldsDiffer(a, b) {
  // Deep enough for our shapes (primitives, arrays of strings)
  if (a === b) return false;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return true;
    return a.some((v, i) => v !== b[i]);
  }
  return true;
}

// AI Generate — parses the streamed [JOB_DESC]/[QUALIFICATIONS] response.
function parseAIResponse(text) {
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
}

// All of JobEditPage's data/save/publish/AI-generate logic, lifted out of
// the component. `idParam` is undefined in create mode; `canEditNow` gates
// every write (auto-save, publish, AI generate) the same way it did inline.
export function useJobEdit(idParam, creating, canEditNow) {
  const navigate = useNavigate();

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
  const [generatingSkills, setGeneratingSkills] = useState(false);
  const [generateSkillsError, setGenerateSkillsError] = useState(null);
  const [step, setStep] = useState(0); // active step: 0=Basics 1=JD 2=Pipeline 3=Battery 4=Posting
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
        assessment_battery: null,
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
          assessment_battery: j.assessment_battery ?? null,
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
  // assessment_battery is locked once the job is live: candidates may already
  // have submitted results under whatever battery was chosen at publish time,
  // and switching it afterward would orphan those results (no way to "undo"
  // a submitted assessment) or leave the job pointing at an instrument some
  // candidates were never evaluated on.
  const isLocked = useCallback((field) => {
    if (!canEditNow) return true;
    if (!job || job.status === 'Draft') return false;
    const LOCKED_ON_ACTIVE = new Set([
      'job_title', 'company', 'pay_min', 'pay_max', 'pay_type', 'currency', 'assessment_battery',
    ]);
    return LOCKED_ON_ACTIVE.has(field);
  }, [canEditNow, job]);

  // --- Auto-save handler (called via setField) ---
  const doSave = useCallback(async () => {
    if (!form) return;
    if (!canEditNow) return; //blocked by permission - never autosave
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
  }, [form, job, creating, navigate, canEditNow]);

  // Debounce auto-save when form changes
  useEffect(() => {
    if (!form) return;
    if (creating && !form.job_title?.trim()) return; // wait for first real input
    const t = setTimeout(doSave, 1500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form]);

  const setField = useCallback((key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
  }, []);

  // AI Generate — fills job_desc + qualifications via the streamed OpenAI prompt.
  // Requires a Draft row to exist (job?.id) so the backend has context to read.
  const handleGenerateAI = useCallback(async () => {
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
  }, [job?.id, generating]);

  // AI Generate for skills — sends the current Description + Responsibilities
  // & qualifications text and merges the suggested skills in (keeps any
  // skills already typed manually, just appends new ones without duplicates).
  const handleGenerateSkillsAI = useCallback(async () => {
    if (generatingSkills) return;
    setGeneratingSkills(true);
    setGenerateSkillsError(null);
    try {
      const res = await generateJobSkillsAI(form.job_desc, form.qualifications);
      const { required_skills = [], preferred_skills = [] } = res.data || {};
      setForm((f) => {
        const mergeSkills = (existing, incoming) => {
          const cur = Array.isArray(existing) ? existing : [];
          const additions = incoming.filter((s) => !cur.includes(s));
          return [...cur, ...additions];
        };
        return {
          ...f,
          required_skills: mergeSkills(f.required_skills, required_skills),
          preferred_skills: mergeSkills(f.preferred_skills, preferred_skills),
        };
      });
    } catch (err) {
      setGenerateSkillsError(err.response?.data?.message || err.message || 'AI generation failed');
    } finally {
      setGeneratingSkills(false);
    }
  }, [generatingSkills, form?.job_desc, form?.qualifications]);

  // --- Validation ---
  const missingRequired = useMemo(() => {
    if (!form) return [];
    const missing = [];
    for (const k of [...REQUIRED_BASICS, ...REQUIRED_JD, ...REQUIRED_BATTERY]) {
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

  const invalidUrlFields = useMemo(() => {
    if (!form) return [];
    const invalid = [];
    if (form.company_url && !isValidUrl1(form.company_url)) invalid.push('company_url');
    return invalid;
  }, [form]);

  const handlePublish = useCallback(async () => {
    if (!canEditNow) return;
    if (!job?.id) {
      setValidationErrors(['Save the draft by filling Basics.']);
      return;
    }
    if (missingRequired.length > 0 || invalidUrlFields.length > 0 || !hasStages) {
      setValidationErrors([...missingRequired, ...invalidUrlFields, ...(!hasStages ? ['pipeline'] : [])]);
      let firstStep = 0;
      if (missingRequired.some((k) => REQUIRED_BASICS.includes(k)) || invalidUrlFields.length > 0) firstStep = 0;
      else if (missingRequired.some((k) => REQUIRED_JD.includes(k))) firstStep = 1;
      else if (!hasStages) firstStep = 2;
      else if (missingRequired.some((k) => REQUIRED_BATTERY.includes(k))) firstStep = 3;
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
  }, [canEditNow, job?.id, missingRequired, invalidUrlFields, hasStages, doSave, navigate]);

  return {
    job, form, setField,
    loading, error,
    savedAt, saving, publishing,
    validationErrors,
    generating, generateError, handleGenerateAI,
    generatingSkills, generateSkillsError, handleGenerateSkillsAI,
    step, setStep,
    hasStages, setHasStages,
    isLocked,
    missingRequired, invalidUrlFields,
    handlePublish,
  };
}
