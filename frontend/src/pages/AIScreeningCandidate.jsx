import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Loader2, AlertTriangle, ArrowLeft, ArrowRight, Check,
  Briefcase, MapPin, GraduationCap, FileText, Wand2, ShieldCheck,
  ThumbsUp, ThumbsDown, Pause, MessageSquare,
  Plus, X, Target, TrendingUp, Code2, Info,
  Send, RefreshCw, Mail, Clock, Pencil,
  ClipboardList, ChevronDown, ChevronRight, Upload
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import {
  getScreening, setScreeningDecision, getRubric, runMatching,
  getQa, getQaResponses, generateQa, updateQa, sendQa,
  getApplicationFormTemplate, extractFacetsFromFile, extractFacetsFromText,
} from '@/api/screening.api';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

/* ─── Engine config (mirrors the spec) ─── */
const ENGINES = [
  { key: 'parse', label: 'Parse',  sub: 'extract CV',  icon: FileText },
  { key: 'match', label: 'Match',  sub: 'score fit',   icon: Wand2 },
  { key: 'qa',    label: 'Q&A',    sub: 'follow-up',   icon: MessageSquare, comingSoon: true },
];

/* ─── AI Matching rubric config ─── */
const FIXED_KEYS = ['skills', 'experience', 'career_trajectory', 'education'];

const FIXED_META = {
  skills:            { label: 'Skills',            icon: Code2,        description: 'Match against the required + preferred skills' },
  experience:        { label: 'Experience',        icon: Briefcase,    description: 'Years, role relevance, progression vs seniority' },
  career_trajectory: { label: 'Career Trajectory', icon: TrendingUp,   description: 'Tenure pattern, stability, growth (validate via Q&A)' },
  education:         { label: 'Education',         icon: GraduationCap,description: 'Degree relevance + school tier vs qualifications' },
};

const DEFAULT_RUBRIC = {
  fixed_criteria: {
    skills:            { weight: 45 },
    experience:        { weight: 35 },
    career_trajectory: { weight: 15 },
    education:         { weight: 5  },
  },
  custom_criteria: [],
};

function totalWeight(rubric) {
  const fixedSum = FIXED_KEYS.reduce((s, k) => s + (Number(rubric.fixed_criteria[k]?.weight) || 0), 0);
  const customSum = (rubric.custom_criteria || []).reduce((s, c) => s + (Number(c.weight) || 0), 0);
  return fixedSum + customSum;
}

function fmt(d) {
  if (!d) return '—';
  try { return new Date(d).toISOString().slice(0, 10); } catch { return '—'; }
}

/* ─── Follow-up Q&A config ─── */
const QA_FOCUS_OPTIONS = [
  'Technical depth + culture',
  'Technical only',
  'Motivation + availability',
  'Leadership scope',
  'Job Requirement',
];
// Locked to Bahasa Indonesia for now (EN / mixed deferred).
const QA_LANGUAGES = [
  { value: 'id', label: 'Bahasa Indonesia' },
];
const QA_NUM_OPTIONS = [2, 3, 4, 5, 6]; // backend clamps 2–6, default 3
const QA_STATUS_META = {
  draft:     { label: 'Draft',     cls: 'border-slate-300 text-slate-600 bg-slate-50' },
  sent:      { label: 'Sent',      cls: 'border-blue-300 text-blue-700 bg-blue-50' },
  responded: { label: 'Responded', cls: 'border-emerald-300 text-emerald-700 bg-emerald-50' },
  expired:   { label: 'Expired',   cls: 'border-rose-300 text-rose-700 bg-rose-50' },
};

const DECISION_BADGE_CLS = {
  advance: 'border-emerald-300 text-emerald-700 bg-emerald-50',
  hold:    'border-amber-300 text-amber-700 bg-amber-50',
  reject:  'border-rose-300 text-rose-700 bg-rose-50',
};

/* Match engine: rubric config + run. */
function useMatch(data, onScored) {
  const { job_id } = data || {};

  const [roleProfileSel, setRoleProfileSel] = useState('experienced');
  const [rubric, setRubric] = useState(DEFAULT_RUBRIC);
  const [running, setRunning] = useState(false);
  const [runError, setRunError] = useState(null);

  // Reflect the candidate's last-scored role profile once it's known.
  useEffect(() => {
    if (data?.role_profile) setRoleProfileSel(data.role_profile);
  }, [data?.role_profile]);

  // Load this job's saved rubric (once per job).
  useEffect(() => {
    if (!job_id) return;
    let cancelled = false;
    (async () => {
      try {
        const r = await getRubric(job_id);
        if (cancelled) return;
        if (r.data?.rubric?.fixed_criteria) {
          setRubric({
            fixed_criteria: { ...DEFAULT_RUBRIC.fixed_criteria, ...r.data.rubric.fixed_criteria },
            custom_criteria: Array.isArray(r.data.rubric.custom_criteria) ? r.data.rubric.custom_criteria : [],
          });
        }
      } catch { /* keep default rubric */ }
    })();
    return () => { cancelled = true; };
  }, [job_id]);

  const total = totalWeight(rubric);
  const totalIs100 = Math.round(total) === 100;

  const setFixedWeight = (key, weight) =>
    setRubric((rb) => ({ ...rb, fixed_criteria: { ...rb.fixed_criteria, [key]: { ...rb.fixed_criteria[key], weight } } }));

  const addCustom = (desc, weight) => {
    const d = (desc || '').trim();
    if (!d) return;
    const w = Math.max(0, Math.min(100, Number(weight) || 0));
    setRubric((rb) => ({ ...rb, custom_criteria: [...(rb.custom_criteria || []), { description: d, weight: w }] }));
  };

  const removeCustom = (idx) =>
    setRubric((rb) => ({ ...rb, custom_criteria: (rb.custom_criteria || []).filter((_, i) => i !== idx) }));

  const setCustomWeight = (idx, weight) =>
    setRubric((rb) => ({ ...rb, custom_criteria: (rb.custom_criteria || []).map((c, i) => (i === idx ? { ...c, weight } : c)) }));

  const handleRun = async () => {
    if (!job_id || !totalIs100 || running) return;
    setRunning(true);
    setRunError(null);
    try {
      await runMatching(job_id, { rubric, role_profile: roleProfileSel });
      await onScored?.();
    } catch (err) {
      setRunError(err.response?.data?.message || err.message || 'AI matching failed');
    } finally {
      setRunning(false);
    }
  };

  return {
    roleProfileSel, setRoleProfileSel,
    rubric, setFixedWeight, addCustom, removeCustom, setCustomWeight,
    total, totalIs100, running, runError, handleRun,
  };
}

function useQa(screeningId, scored, enabled) {
  const [tab, setTab] = useState('generate'); // 'generate' | 'inbox' — generate first per spec
  const [qa, setQa] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Generate controls
  const [focusArea, setFocusArea] = useState(QA_FOCUS_OPTIONS[0]);
  const [numQuestions, setNumQuestions] = useState('3');
  const [language, setLanguage] = useState('id');
  const [generating, setGenerating] = useState(false);

  // Editable working copy of the question set (flushed to the backend on send)
  const [questions, setQuestions] = useState([]); // [{ topic, text }]
  const [sending, setSending] = useState(false);

  // Standard Application Form template — read-only preview of what gets sent
  // alongside the questions. Static, so fetched once when the Q&A step opens.
  const [formTemplate, setFormTemplate] = useState(null);

  const status = qa?.status || (qa ? 'draft' : null);
  const meta = status ? QA_STATUS_META[status] : null;

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getQa(screeningId);
      let row = res.data?.qa || null;
      if (row && row.status === 'responded') {
        const full = await getQaResponses(screeningId);
        row = full.data?.qa || row;
      }
      setQa(row);
      const qs = Array.isArray(row?.questions) ? row.questions : [];
      setQuestions(qs.map((q) => ({ topic: q.topic || '', text: q.text || '' })));
      if (row) {
        if (row.focus_area) setFocusArea(row.focus_area);
        if (row.num_questions) setNumQuestions(String(row.num_questions));
        if (row.language && QA_LANGUAGES.some((l) => l.value === row.language)) setLanguage(row.language);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load Q&A');
    } finally {
      setLoading(false);
    }
  };

  // One-way latch: flip true the first time the Q&A step is opened.
  const [latched, setLatched] = useState(false);
  useEffect(() => {
    if (enabled && !latched) setLatched(true);
  }, [enabled, latched]);

  useEffect(() => {
    if (!latched) return;
    if (scored) load();
    else setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screeningId, scored, latched]);

  // Fetch the static Application Form template once the step is opened.
  useEffect(() => {
    if (!latched || formTemplate) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await getApplicationFormTemplate();
        if (!cancelled) setFormTemplate(res.data?.template || null);
      } catch { /* preview is non-critical — ignore */ }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latched]);

  const handleGenerate = async () => {
    if (!scored || generating) return;
    if (qa && status !== 'draft') {
      const ok = window.confirm(
        'Regenerating replaces the sent questions and permanently deletes the candidate’s answers. Continue?'
      );
      if (!ok) return;
    }
    setGenerating(true);
    setError(null);
    try {
      const n = Math.max(2, Math.min(6, Number(numQuestions) || 3));
      const res = await generateQa(screeningId, { focus_area: focusArea, num_questions: n, language });
      const row = res.data?.qa || null;
      setQa(row);
      const qs = Array.isArray(row?.questions) ? row.questions : [];
      setQuestions(qs.map((q) => ({ topic: q.topic || '', text: q.text || '' })));
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to generate questions');
    } finally {
      setGenerating(false);
    }
  };

  const setQuestionField = (idx, field, val) =>
    setQuestions((qs) => qs.map((q, i) => (i === idx ? { ...q, [field]: val } : q)));

  const addQuestion = () => setQuestions((qs) => [...qs, { topic: '', text: '' }]);

  const removeQuestion = (idx) => setQuestions((qs) => qs.filter((_, i) => i !== idx));

  const handleSend = async () => {
    if (sending) return;
    const cleaned = questions
      .map((q) => ({ topic: (q.topic || '').trim(), text: (q.text || '').trim() }))
      .filter((q) => q.text.length > 0);
    if (cleaned.length === 0) {
      setError('Add at least one question with text before sending.');
      return;
    }
    setSending(true);
    setError(null);
    try {
      await updateQa(screeningId, cleaned); 
      await sendQa(screeningId);            
      await load();                         
      setTab('inbox');                      
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to send Q&A');
    } finally {
      setSending(false);
    }
  };

  return {
    tab, setTab, qa, status, meta, loading, error,
    focusArea, setFocusArea, numQuestions, setNumQuestions, language, setLanguage,
    generating, questions, setQuestionField, addQuestion, removeQuestion, sending,
    handleGenerate, handleSend, formTemplate,
  };
}

export default function AIScreeningCandidatePage() {
  const { screeningId } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Active engine panel — defaults to the candidate's current engine.
  const [activeEngine, setActiveEngine] = useState('parse');

  // Decision drawer state
  const [decisionDraft, setDecisionDraft] = useState(null); // 'advance' | 'hold' | 'reject' | null
  const [decisionReason, setDecisionReason] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getScreening(screeningId);
      const row = res.data?.screening;
      setData(row);
      if (row?.engine) setActiveEngine(row.engine === 'done' ? 'match' : row.engine);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load screening');
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [screeningId]);

  // Engine state lifted to the page so the sidebar can host the primary actions.
  const match = useMatch(data, load);
  const qa = useQa(screeningId, data?.engine === 'done', activeEngine === 'qa');

  const handleDecide = async (decision) => {
    setSaving(true);
    try {
      await setScreeningDecision(screeningId, {
        decision,
        decision_reason: decisionReason || null,
      });
      setDecisionDraft(null);
      setDecisionReason('');
      await load();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to save decision');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg border border-red-200 bg-red-50 text-sm text-red-600">
          <AlertTriangle className="h-4 w-4" />
          {error || 'Screening not found'}
        </div>
      </div>
    );
  }

    const { candidate_name, applicant_id, applied_at,
          job_id, job_title, job_location, work_type, seniority_level,
          engine, decision, decision_reason: existingReason, decided_at, rubric_is_stale,
          facets, attachment } = data;

  const cvText = [data.last_position, data.address, data.education_text]
  .filter(Boolean).join('\n');

  const initials = (candidate_name || '?').split(/\s+/).map((s) => s[0]).join('').slice(0, 2).toUpperCase();
  const scored = engine === 'done';

  // Switch engine step + scroll to top (mirrors JobEdit's step navigation).
  const goToStep = (key) => { setActiveEngine(key); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  return (
    <>
      <div className="sticky top-[52px] z-10 bg-background/95 backdrop-blur-sm -mt-5 -mx-5 px-5 pt-5 pb-4 border-b border-border/60">
        <div className="animate-fade-in-up space-y-3">
          <Button variant="ghost" size="sm" className="text-xs -ml-2 w-fit" onClick={() => navigate(`/selection/ai-screening/job/${job_id}`)}>
            <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back to position
          </Button>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="h-11 w-11 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold flex-shrink-0 text-sm">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg font-bold tracking-tight truncate">{candidate_name || `Applicant #${applicant_id}`}</h1>
              <div className="text-[11px] text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5">
                <Link to={`/selection/ai-screening/job/${job_id}`} className="hover:text-primary inline-flex items-center gap-1 transition-colors">
                  <Briefcase className="h-3 w-3" /> {job_title}
                </Link>
                {job_location && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {job_location}</span>}
                {work_type && <span>· {work_type}</span>}
                {seniority_level && <span>· {seniority_level}</span>}
                {applied_at && <span>· applied {fmt(applied_at)}</span>}
              </div>
            </div>
            {decision && (
              <Badge variant="outline" className={`text-[10px] uppercase tracking-wide ${DECISION_BADGE_CLS[decision] || ''}`}>
                {decision} · {fmt(decided_at)}
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="px-6 pb-6 pt-4">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_260px] gap-6">
          {/* MAIN COLUMN — active engine panel + decision bar. */}
          <div className="space-y-4 min-w-0">
            {/* Stale rubric warning */}
            {rubric_is_stale && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-amber-200 bg-amber-50 text-xs text-amber-700 animate-scale-in">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                <span>Rubric has changed since this candidate was scored — score may be stale. Rescore from the position page.</span>
              </div>
            )}

            {/* Engine panel (re-animates on each step switch) */}
            <div key={activeEngine} className="animate-fade-in-up">
              {activeEngine === 'parse' && (
                <ParsePanel
                  facets={facets}
                  applicant_id={applicant_id}
                  cv_text={cvText}
                  attachment={attachment}
                  onParsed={load}
                />
              )}
              {activeEngine === 'match' && <MatchPanel data={data} match={match} />}
              {activeEngine === 'qa'    && (
                <QAPanel
                  qaCtl={qa}
                  jobTitle={job_title}
                  scored={scored}
                />
              )}
            </div>

            {/* Step paginator (mirrors JobEdit) */}
            <StepPaginator activeEngine={activeEngine} onStep={goToStep} engine={engine} parsed={!!facets} scored={scored} />
          </div>

          {/* SIDEBAR — contextual primary action + steps nav.
              Stacks below the main column on narrow widths. */}
          <aside>
            <div className="sticky top-[184px] space-y-3">
              <SidebarAction
                activeEngine={activeEngine}
                match={match}
                qa={qa}
                scored={scored}
                parsed={!!facets}
                onStep={goToStep}
                candidateName={candidate_name}
              />
              <DecisionCard
                decision={decision}
                existingReason={existingReason}
                scored={scored}
                onPick={setDecisionDraft}
              />
              <StepsNav
                activeEngine={activeEngine}
                onStep={goToStep}
                engine={engine}
                parsed={!!facets}
                scored={scored}
              />
            </div>
          </aside>
        </div>
      </div>

      <DecisionDialog
        decision={decisionDraft}
        reason={decisionReason}
        setReason={setDecisionReason}
        saving={saving}
        onConfirm={() => handleDecide(decisionDraft)}
        onClose={() => { setDecisionDraft(null); setDecisionReason(''); }}
      />
    </>
  );
}

/* ─────────── Sidebar: contextual primary action ─────────── */
function SidebarAction({ activeEngine, match, qa, scored, parsed, onStep, candidateName }) {
  if (activeEngine === 'parse') {
    return (
      <Card className="animate-scale-in">
        <CardContent className="p-3 space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Next step</p>
          <Button
            size="sm"
            className="w-full text-xs"
            onClick={() => onStep('match')}
            disabled={!parsed}
          >
            Continue to Match <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
          </Button>
          {!parsed ? (
            <p className="text-[10px] text-amber-600 flex items-start gap-1 leading-snug">
              <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" /> Parse the CV first before proceeding to Match.
            </p>
          ) : (
            <p className="text-[10px] text-muted-foreground leading-snug">
              CV parsed. Configure the rubric and score this candidate in Match.
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  if (activeEngine === 'match') {
    return (
      <Card className="animate-scale-in">
        <CardContent className="p-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              {scored ? 'Matching done' : 'Run matching'}
            </p>
            <Badge className={`text-[10px] ${match.totalIs100 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
              {Math.round(match.total)}%
            </Badge>
          </div>

          {/* Primary action changes once scored */}
          {scored ? (
            <Button size="sm" className="w-full text-xs" onClick={() => onStep('qa')}>
              Continue to Q&A <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
            </Button>
          ) : (
            <Button className="w-full text-xs" onClick={match.handleRun} disabled={!match.totalIs100 || match.running}>
              {match.running ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5 mr-1.5" />}
              Run AI Matching
            </Button>
          )}

          {/* Re-run as secondary when already scored */}
          {scored && (
            <Button variant="outline" size="sm" className="w-full text-xs" onClick={match.handleRun} disabled={!match.totalIs100 || match.running}>
              {match.running ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5 mr-1.5" />}
              Re-run Matching
            </Button>
          )}

          {!match.totalIs100 && (
            <p className="text-[10px] text-rose-600 flex items-start gap-1 leading-snug">
              <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" /> Weights must total 100% (currently {Math.round(match.total)}%).
            </p>
          )}
          {match.runError && (
            <div className="flex items-start gap-1.5 px-2 py-1.5 rounded-md border border-red-200 bg-red-50 text-[10px] text-red-600 animate-scale-in">
              <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" /> {match.runError}
            </div>
          )}
          {!scored && (
            <p className="text-[10px] text-muted-foreground leading-snug">
              Scores this candidate against the job rubric.
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  // Q&A step
  return (
    <Card className="animate-scale-in">
      <CardContent className="p-3 space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Send Q&A</p>
        {!scored ? (
          <p className="text-[10px] text-muted-foreground leading-snug">
            Run AI Matching first — follow-up Q&A unlocks once this candidate has a fit score.
          </p>
        ) : (
          <>
            <Button className="w-full text-xs" onClick={qa.handleSend} disabled={qa.sending || qa.questions.length === 0}>
              {qa.sending ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Send className="h-3.5 w-3.5 mr-1.5" />}
              Send to candidate
            </Button>
            <p className="text-[10px] text-muted-foreground leading-snug">
              Sent to {candidateName || 'the candidate'} · response window 48h.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

/* ─── Decision meta (shared by the card + the modal) ─── */
const DECISION_META = {
  advance: { label: 'Advance', title: 'Advance candidate', icon: ThumbsUp,   iconCls: 'text-emerald-600' },
  hold:    { label: 'Hold',    title: 'Hold candidate',    icon: Pause,      iconCls: 'text-amber-600' },
  reject:  { label: 'Reject',  title: 'Reject candidate',  icon: ThumbsDown, iconCls: 'text-rose-600' },
};

/* ─────────── Sidebar: decision trigger card ─────────── */
function DecisionCard({ decision, existingReason, scored, onPick }) {
  return (
    <Card className="animate-scale-in">
      <CardContent className="p-3 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Decision
          </p>
          {decision && (
            <Badge variant="outline" className={`text-[9px] uppercase tracking-wide ${DECISION_BADGE_CLS[decision] || ''}`}>
              {decision}
            </Badge>
          )}
        </div>

        {!scored ? (
          <p className="text-[10px] text-muted-foreground leading-snug italic">
            Decision unlocks after Q&A is complete.
          </p>
        ) : (
          <>
            {existingReason && (
              <div className="text-[10px] text-muted-foreground italic px-2 py-1.5 rounded-md bg-muted/30 border leading-snug">
                "{existingReason}"
              </div>
            )}
            <div className="grid gap-1.5">
              {['advance', 'hold', 'reject'].map((key) => {
                const meta = DECISION_META[key];
                const Icon = meta.icon;
                return (
                  <Button
                    key={key}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-xs"
                    onClick={() => onPick(key)}
                  >
                    <Icon className={`h-3.5 w-3.5 mr-1.5 ${meta.iconCls}`} /> {meta.label}
                  </Button>
                );
              })}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

/* ─────────── Decision modal (reason + confirm) ─────────── */
function DecisionDialog({ decision, reason, setReason, saving, onConfirm, onClose }) {
  const meta = decision ? DECISION_META[decision] : null;
  const Icon = meta?.icon;
  return (
    <Dialog open={!!decision} onOpenChange={(o) => { if (!o && !saving) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            {Icon && <Icon className={`h-4 w-4 ${meta.iconCls}`} />}
            {meta?.title || 'Decision'}
          </DialogTitle>
          <DialogDescription>
            Add an optional note explaining this decision. It's saved with the candidate's record.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          placeholder={`Why ${decision ?? ''}? (optional)`}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          className="text-sm"
        />
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={onConfirm} disabled={saving}>
            {saving ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : null}
            Confirm {decision}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ─────────── Step paginator (numbered, JobEdit-style) ─────────── */
function StepPaginator({ activeEngine, onStep, engine, parsed, scored }) {
  const activeIdx = ENGINES.findIndex((e) => e.key === activeEngine);
  return (
    <div className="border-t border-border/60 pt-4 space-y-2">
      <div className="flex items-center justify-center gap-1.5">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          disabled={activeIdx <= 0}
          onClick={() => onStep(ENGINES[activeIdx - 1].key)}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>

        {ENGINES.map((eng, i) => {
          const active = i === activeIdx;
          const isDone =
            (engine === 'match' && i === 0) ||
            (engine === 'done'  && i <= 1);
            const locked = (i === 1 && !parsed) || (i === 2 && !scored);
          return (
            <button
              key={eng.key}
              type="button"
              title={locked ? 'Parse CV first' : eng.label}
              onClick={() => !locked && onStep(eng.key)}
              disabled={locked}
              className={`h-8 w-8 rounded-md text-xs font-semibold flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                active
                  ? 'bg-primary text-primary-foreground'
                  : isDone
                    ? 'border border-emerald-300 text-emerald-700 hover:bg-emerald-50'
                    : 'border border-border text-muted-foreground hover:bg-muted/60'
              }`}
            >
              {i + 1}
            </button>
          );
        })}

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          disabled={
            activeIdx >= ENGINES.length - 1 ||
            (activeIdx === 0 && !parsed) ||
            (activeIdx === 1 && !scored)
          }
          onClick={() => onStep(ENGINES[activeIdx + 1].key)}
        >
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
      <p className="text-center text-[11px] text-muted-foreground">
        Step {activeIdx + 1} of {ENGINES.length} · {ENGINES[activeIdx]?.label}
      </p>
    </div>
  );
}

/* ─────────── Sidebar: vertical steps nav ─────────── */
function StepsNav({ activeEngine, onStep, engine, parsed, scored }) {
  return (
    <Card>
      <CardContent className="p-3 space-y-1">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">Steps</p>
        {ENGINES.map((eng, idx) => {
          const Icon = eng.icon;
          const isDone =
            (engine === 'match' && idx === 0) ||
            (engine === 'done'  && idx <= 1);
          const active = eng.key === activeEngine;
          const locked = (idx === 1 && !parsed) || (idx === 2 && !scored);
          return (
            <button
              key={eng.key}
              type="button"
              disabled={locked}
              onClick={() => !locked && onStep(eng.key)}
              title={locked ? 'Parse CV first' : undefined}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                active ? 'bg-primary/10 text-primary' : 'hover:bg-muted/50 text-foreground'
              }`}
            >
              <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-semibold shrink-0 ${
                isDone
                  ? 'bg-emerald-500 text-white'
                  : active
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
              }`}>
                {isDone ? <Check className="h-3 w-3" /> : (idx + 1)}
              </span>
              <Icon className={`h-3.5 w-3.5 shrink-0 ${active ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className="flex-1 min-w-0 leading-tight">
                <span className={`block text-xs truncate ${active ? 'font-semibold' : 'font-medium'}`}>{eng.label}</span>
                <span className="block text-[9px] text-muted-foreground truncate">{eng.sub}</span>
              </span>
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
}

/* ─────────── Parse panel ─────────── */
function ParsePanel({ facets, applicant_id, cv_text, attachment, onParsed }) {
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState(null);
  const fileRef = useRef(null);

  const parseFromText = async () => {
    if (!cv_text?.trim()) return;
    setParsing(true);
    setParseError(null);
    try {
      await extractFacetsFromText(applicant_id, cv_text);
      onParsed?.();
    } catch (err) {
      setParseError(err.response?.data?.message || err.message || 'Parse failed');
    } finally {
      setParsing(false);
    }
  };

  const parseFromFile = async (file) => {
    setParsing(true);
    setParseError(null);
    try {
      await extractFacetsFromFile(applicant_id, file);
      onParsed?.();
    } catch (err) {
      setParseError(err.response?.data?.message || err.message || 'Parse failed');
    } finally {
      setParsing(false);
    }
  };

  if (!facets) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" /> Parse
          </CardTitle>
        </CardHeader>
        <CardContent className="py-8">
          <div className="flex flex-col items-center gap-4 text-center max-w-xs mx-auto">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
              <FileText className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">CV not parsed yet</p>
              <p className="text-xs text-muted-foreground">
                Extract skills, experience and education so the Match engine can score this candidate.
              </p>
            </div>

            {parseError && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-md border border-red-200 bg-red-50 text-xs text-red-600 w-full text-left">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> {parseError}
              </div>
            )}

            <div className="flex flex-col gap-2 w-full">
              {/* Primary — parse from existing row data */}
              {cv_text?.trim() && (
                <Button
                  size="sm"
                  onClick={parseFromText}
                  disabled={parsing}
                  className="gap-2 w-full"
                >
                  {parsing
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : <Wand2 className="h-3.5 w-3.5" />}
                  {parsing ? 'Parsing…' : 'Parse from profile data'}
                </Button>
              )}

              {/* Secondary — upload a better file */}
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.docx,.doc,.txt"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) parseFromFile(f);
                  e.target.value = '';
                }}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileRef.current?.click()}
                disabled={parsing}
                className="gap-2 w-full"
              >
                <Upload className="h-3.5 w-3.5" />
                Upload CV file
              </Button>
            </div>

            {attachment && (
              <p className="text-[10px] text-muted-foreground italic">
                Stored attachment: <span className="font-mono">{attachment}</span>
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  const skills    = Array.isArray(facets.skills) ? facets.skills : [];
  const education = Array.isArray(facets.education) ? facets.education : [];
  const exp       = facets.experience || {};
  const positions = Array.isArray(exp.positions) ? exp.positions : [];
  const jobPos    = facets.job_position || {};

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" /> Parse — extracted facets
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FacetRow label="Current role">
          <span className="font-medium">{jobPos.current || '—'}</span>
          {jobPos.category && <span className="text-muted-foreground ml-2">· {jobPos.category}</span>}
        </FacetRow>
        <FacetRow label="Total experience">
          <span className="font-medium font-mono">{exp.years_total ?? '—'}y</span>
          {positions.length > 0 && (
            <span className="text-muted-foreground ml-2">across {positions.length} role{positions.length === 1 ? '' : 's'}</span>
          )}
        </FacetRow>
        <FacetRow label="Skills">
          {skills.length === 0 ? <span className="text-muted-foreground text-[11px] italic">none extracted</span> : (
            <div className="flex flex-wrap gap-1">
              {skills.map((s) => (
                <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>
              ))}
            </div>
          )}
        </FacetRow>
        <FacetRow label="Education">
          {education.length === 0 ? <span className="text-muted-foreground text-[11px] italic">none</span> : (
            <ul className="space-y-1">
              {education.map((e, i) => (
                <li key={i} className="text-xs">
                  <span className="font-medium">{e.school || '—'}</span>
                  {e.degree && <span className="text-muted-foreground"> · {e.degree}</span>}
                  {e.year && <span className="text-muted-foreground font-mono"> · {e.year}</span>}
                  {e.tier && <Badge variant="outline" className="text-[9px] ml-1.5">{e.tier}</Badge>}
                </li>
              ))}
            </ul>
          )}
        </FacetRow>
        {positions.length > 0 && (
          <FacetRow label="Positions">
            <ul className="space-y-1">
              {positions.map((p, i) => (
                <li key={i} className="text-xs">
                  <span className="font-medium">{p.title || '—'}</span>
                  {p.company && <span className="text-muted-foreground"> · {p.company}</span>}
                  {p.years != null && <span className="text-muted-foreground font-mono"> · {p.years}y</span>}
                </li>
              ))}
            </ul>
          </FacetRow>
        )}
      </CardContent>
    </Card>
  );
}

function FacetRow({ label, children }) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-3 items-start">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground pt-0.5">{label}</div>
      <div className="text-xs">{children}</div>
    </div>
  );
}

/* ─────────── Match panel (rubric config + fit breakdown) ─────────── */
function MatchPanel({ data, match }) {
  const { score_id, overall_score, skills_score, experience_score, career_trajectory_score, education_score,
          matched_skills, missing_skills, score_summary, role_profile, scored_at,
          required_skills, preferred_skills } = data;

  const {
    roleProfileSel, setRoleProfileSel,
    rubric, setFixedWeight, addCustom, removeCustom, setCustomWeight,
    total, totalIs100,
  } = match;

  const [customDraftDesc, setCustomDraftDesc] = useState('');
  const [customDraftWeight, setCustomDraftWeight] = useState(5);

  const onAddCustom = () => {
    if (!customDraftDesc.trim()) return;
    addCustom(customDraftDesc, customDraftWeight);
    setCustomDraftDesc('');
    setCustomDraftWeight(5);
  };

  const matched   = Array.isArray(matched_skills) ? matched_skills : [];
  const missing   = Array.isArray(missing_skills) ? missing_skills : [];
  const reqSkills  = Array.isArray(required_skills) ? required_skills : [];
  const prefSkills = Array.isArray(preferred_skills) ? preferred_skills : [];

  return (
    <Card>
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-sm flex items-center gap-2">
          <Wand2 className="h-4 w-4 text-primary" /> Match — fit breakdown
        </CardTitle>
        {score_id && (
          <span className="text-[10px] text-muted-foreground">
            scored {fmt(scored_at)}{role_profile ? ` · ${role_profile}` : ''}
          </span>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Rubric */}
        <div className="space-y-4">
          {/* Role profile */}
          <div>
            <div className="text-[11px] font-medium text-muted-foreground uppercase mb-2">Role profile</div>
            <div className="flex gap-3">
              {[
                { value: 'experienced', label: 'Experienced', desc: 'Years, role progression, prior responsibilities matter.' },
                { value: 'fresh_graduate', label: 'Fresh Graduate', desc: 'Lack of senior titles will not penalize. Education weighed higher.' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setRoleProfileSel(opt.value)}
                  className={`flex-1 text-left px-4 py-3 rounded-lg border transition-colors ${
                    roleProfileSel === opt.value ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/30'
                  }`}
                >
                  <div className="text-xs font-semibold">{opt.label}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Skills from job */}
          <div className="pt-3 border-t space-y-2">
            <div className="text-[11px] font-medium text-muted-foreground uppercase">Skills (from job)</div>
            <div className="flex flex-wrap gap-1">
              {reqSkills.length === 0 && prefSkills.length === 0 && (
                <span className="text-[10px] text-muted-foreground">None set on this job.</span>
              )}
              {reqSkills.map((s) => (
                <Badge key={`req-${s}`} className="text-[10px] bg-primary/10 text-primary border-primary/20">{s}</Badge>
              ))}
              {prefSkills.map((s) => (
                <Badge key={`pref-${s}`} variant="secondary" className="text-[10px]">{s}</Badge>
              ))}
            </div>
            <div className="flex items-start gap-1.5 text-[10px] text-muted-foreground">
              <Info className="h-3 w-3 mt-0.5 shrink-0" />
              <span>The Skills criterion scores against these lists. Running re-scores all candidates of this job.</span>
            </div>
          </div>

          {/* Criteria & weights */}
          <div className="pt-3 border-t space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-medium text-muted-foreground uppercase">Criteria & weights</div>
              <div className="flex items-center gap-2">
                <Badge className={`text-[10px] ${totalIs100 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                  Total {Math.round(total)}%
                </Badge>
                <span className="text-[10px] text-muted-foreground">must equal 100%</span>
              </div>
            </div>

            {FIXED_KEYS.map((key) => {
              const meta = FIXED_META[key];
              const Icon = meta.icon;
              const weight = Number(rubric.fixed_criteria[key]?.weight) || 0;
              return (
                <div key={key} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Icon className="h-3.5 w-3.5 text-primary" />
                      <span className="text-xs font-semibold">{meta.label}</span>
                      <span className="text-[10px] text-muted-foreground">{meta.description}</span>
                    </div>
                    <span className="text-xs font-mono font-semibold w-10 text-right">{weight}%</span>
                  </div>
                  <Slider value={[weight]} onValueChange={(v) => setFixedWeight(key, v[0])} min={0} max={100} step={5} />
                </div>
              );
            })}

            {/* Custom criteria */}
            <div className="pt-3 border-t space-y-3">
              <div className="text-[11px] font-medium text-muted-foreground uppercase">Custom criteria</div>
              {(rubric.custom_criteria || []).length === 0 && (
                <div className="text-[10px] text-muted-foreground italic">No custom criteria. Add one below.</div>
              )}
              {(rubric.custom_criteria || []).map((c, i) => (
                <div key={i} className="space-y-1.5 p-3 rounded-lg border bg-muted/20">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Target className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span className="text-xs truncate">{c.description}</span>
                    </div>
                    <span className="text-xs font-mono font-semibold w-10 text-right">{c.weight}%</span>
                    <button onClick={() => removeCustom(i)} className="p-1 hover:bg-rose-50 rounded text-rose-600 transition-colors" type="button">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                  <Slider value={[c.weight]} onValueChange={(v) => setCustomWeight(i, v[0])} min={0} max={50} step={5} />
                </div>
              ))}

              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <label className="text-[10px] text-muted-foreground">Description</label>
                  <Input
                    value={customDraftDesc}
                    onChange={(e) => setCustomDraftDesc(e.target.value)}
                    placeholder="e.g. Fluent in Bahasa Indonesia"
                    className="text-xs h-9"
                    onKeyDown={(e) => { if (e.key === 'Enter' && customDraftDesc.trim()) { e.preventDefault(); onAddCustom(); } }}
                  />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground">Weight</label>
                  <Input
                    type="number" min={0} max={100} value={customDraftWeight}
                    onChange={(e) => setCustomDraftWeight(Number(e.target.value) || 0)}
                    className="text-xs h-9 w-20"
                  />
                </div>
                <Button size="sm" variant="outline" className="text-xs" onClick={onAddCustom} disabled={!customDraftDesc.trim()}>
                  <Plus className="h-3 w-3 mr-1" /> Add
                </Button>
              </div>
            </div>
          </div>

          {/* Fit breakdown OR not-scored hint */}
          {!score_id ? (
            <p className="border-t pt-4 text-center text-xs text-muted-foreground italic">
              Not scored yet. Configure the rubric above and Run AI Matching from the sidebar.
            </p>
          ) : (
            <div className="space-y-4 border-t pt-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <ScoreTile label="Overall"     score={overall_score} bold />
                <ScoreTile label="Skills"      score={skills_score} />
                <ScoreTile label="Experience"  score={experience_score} />
                <ScoreTile label="Trajectory"  score={career_trajectory_score} />
                <ScoreTile label="Education"   score={education_score} />
              </div>

              {score_summary && (
                <div className="text-[11px] text-muted-foreground italic px-3 py-2 rounded-md bg-muted/30 border">
                  {score_summary}
                </div>
              )}

              {(matched.length > 0 || missing.length > 0) && (
                <Table className="w-full">
                  <TableHeader className="bg-muted/40">
                    <TableRow>
                      <TableHead className="text-[10px] font-bold uppercase">Matched skills</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase">Missing skills</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="align-top">
                        <div className="flex flex-wrap gap-1">
                          {matched.length === 0 ? <span className="text-[11px] text-muted-foreground italic">—</span> :
                            matched.map((s) => <Badge key={s} variant="secondary" className="text-[10px] bg-emerald-50 text-emerald-700">{s}</Badge>)}
                        </div>
                      </TableCell>
                      <TableCell className="align-top">
                        <div className="flex flex-wrap gap-1">
                          {missing.length === 0 ? <span className="text-[11px] text-muted-foreground italic">—</span> :
                            missing.map((s) => <Badge key={s} variant="secondary" className="text-[10px] bg-rose-50 text-rose-700">{s}</Badge>)}
                        </div>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              )}

              {reqSkills.length > 0 && (
                <div className="text-[10px] text-muted-foreground">
                  <span className="font-semibold uppercase tracking-wide">JD required: </span>
                  {reqSkills.join(', ')}
                  {prefSkills.length > 0 && (
                    <>
                      <br />
                      <span className="font-semibold uppercase tracking-wide">JD preferred: </span>
                      {prefSkills.join(', ')}
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ScoreTile({ label, score, bold }) {
  return (
    <div className={`rounded-lg border bg-card px-3 py-2`}>
      <div className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`mt-0.5 font-mono ${bold ? 'text-xl font-bold' : 'text-base font-semibold'} ${
        score == null ? 'text-muted-foreground'
          : score >= 80 ? 'text-emerald-700'
          : score >= 60 ? 'text-amber-700'
          : 'text-rose-700'
      }`}>
        {score ?? '—'}
      </div>
    </div>
  );
}

/* ─────────── QA panel (follow-up Q&A) ─────────── */
function QAPanel({ qaCtl, jobTitle, scored }) {
  const {
    tab, setTab, qa: qaRow, status, meta, loading, error,
    focusArea, setFocusArea, numQuestions, setNumQuestions, language, setLanguage,
    generating, questions, setQuestionField, addQuestion, removeQuestion,
    handleGenerate, formTemplate,
  } = qaCtl;

  // `editingIdx` is purely presentational — which drafted card is in edit mode.
  const [editingIdx, setEditingIdx] = useState(null);

  const onGenerate = async () => {
    await handleGenerate();
    setEditingIdx(null);
  };

  const onAddQuestion = () => {
    addQuestion();
    setEditingIdx(questions.length);
  };

  const onRemoveQuestion = (idx) => {
    removeQuestion(idx);
    setEditingIdx(null);
  };

  // Follow-up Q&A is the step after AI Matching — gate the whole panel until the candidate is scored.
  if (!scored) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" /> Follow-up Q&A
          </CardTitle>
        </CardHeader>
        <CardContent className="py-8 text-center text-xs text-muted-foreground italic">
          Run AI Matching first — follow-up Q&A unlocks once this candidate has a fit score.
          Open the <span className="font-medium not-italic">Match</span> step and click <span className="font-medium not-italic">Run AI Matching</span>.
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-10 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <CardTitle className="text-sm flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" />
            Follow-up Q&A
            <span className="text-[10px] font-normal text-muted-foreground">· auto-generated for borderline candidates</span>
          </CardTitle>
          {meta && (
            <Badge variant="outline" className={`text-[10px] uppercase tracking-wide ${meta.cls}`}>
              {meta.label}
              {status === 'sent'      && qaRow?.expired_at   && ` · closes ${fmt(qaRow.expired_at)}`}
              {status === 'responded' && qaRow?.responded_at && ` · ${fmt(qaRow.responded_at)}`}
              {status === 'expired'   && qaRow?.expired_at   && ` · ${fmt(qaRow.expired_at)}`}
            </Badge>
          )}
        </div>

        <div className="mt-3 flex w-full gap-1 rounded-lg border bg-muted p-1">
          {[
            { key: 'generate', label: 'Generate' },
            { key: 'inbox',    label: 'Response Inbox' },
          ].map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`flex-1 rounded-md px-4 py-2 text-center text-xs font-semibold transition-colors ${
                tab === t.key
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-md border border-red-200 bg-red-50 text-xs text-red-600 animate-scale-in">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> {error}
          </div>
        )}

        {tab === 'generate' ? (
          <>
            <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Generate · tuned to {jobTitle || 'the role'} + parsed CV
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Focus area</label>
                <Select value={focusArea} onValueChange={setFocusArea}>
                  <SelectTrigger className="w-full text-xs h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {QA_FOCUS_OPTIONS.map((f) => (
                      <SelectItem key={f} value={f} className="text-xs">{f}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"># Questions</label>
                <Select value={numQuestions} onValueChange={setNumQuestions}>
                  <SelectTrigger className="w-full text-xs h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {QA_NUM_OPTIONS.map((n) => (
                      <SelectItem key={n} value={String(n)} className="text-xs">{n}{n === 3 ? ' (recommended)' : ''}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Language</label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger className="w-full text-xs h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {QA_LANGUAGES.map((l) => (
                      <SelectItem key={l.value} value={l.value} className="text-xs">{l.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {qaRow && status !== 'draft' && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-amber-200 bg-amber-50 text-xs text-amber-700">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                <span>Already {meta?.label.toLowerCase()}. Regenerating or re-sending replaces the questions and deletes the candidate’s answers.</span>
              </div>
            )}

            <div className="rounded-lg border bg-muted/20 p-4">
              <div className="mb-3 flex items-center justify-between gap-2 flex-wrap">
                <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Drafted questions · click to edit
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="text-xs" onClick={onGenerate} disabled={generating}>
                    {generating ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <RefreshCw className="h-3 w-3 mr-1" />}
                    {questions.length ? 'Regenerate' : 'Generate'}
                  </Button>
                  <Button size="sm" variant="outline" className="text-xs" onClick={onAddQuestion} disabled={generating}>
                    <Plus className="h-3 w-3 mr-1" /> Add custom
                  </Button>
                </div>
              </div>

              {questions.length === 0 ? (
                <div className="py-6 text-center text-[11px] text-muted-foreground italic">
                  No questions yet. Pick a focus area and Generate, or Add custom.
                </div>
              ) : (
                <div className="space-y-2">
                  {questions.map((q, i) => (
                    <div key={i} className="rounded-lg border bg-background p-3 transition-colors">
                      {editingIdx === i ? (
                        <div className="space-y-2">
                          <Input
                            value={q.topic}
                            onChange={(e) => setQuestionField(i, 'topic', e.target.value)}
                            placeholder="Topic (e.g. Technical depth)"
                            className="text-xs h-8"
                          />
                          <Textarea
                            value={q.text}
                            onChange={(e) => setQuestionField(i, 'text', e.target.value)}
                            placeholder="Question text"
                            rows={2}
                            className="text-xs"
                          />
                          <div className="flex items-center justify-between">
                            <button
                              type="button"
                              onClick={() => onRemoveQuestion(i)}
                              className="text-[11px] text-rose-600 inline-flex items-center gap-1"
                            >
                              <X className="h-3 w-3" /> Remove
                            </button>
                            <Button size="sm" variant="ghost" className="text-xs" onClick={() => setEditingIdx(null)}>Done</Button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setEditingIdx(i)}
                          className="w-full text-left text-xs leading-relaxed group"
                        >
                          <span className="font-semibold">{i + 1}. {q.topic || 'Untitled'}</span>
                          <span className="text-muted-foreground"> — {q.text || <em>click to add text</em>}</span>
                          <Pencil className="inline h-3 w-3 ml-1.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <ApplicationFormPreview template={formTemplate} />
          </>
        ) : (
          <>
            {(!qaRow || status === 'draft') && (
              <div className="py-10 text-center text-xs text-muted-foreground italic">
                Nothing sent yet. Draft questions in the Generate tab and Send to the candidate.
              </div>
            )}

            {status === 'sent' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-muted/20 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5 shrink-0" />
                  Sent {fmt(qaRow.sent_at)} · awaiting response · window closes {fmt(qaRow.expired_at)}
                </div>
                <SentQuestionList questions={qaRow.questions} />
                <SubmittedApplicationForm schema={qaRow.application_form_schema} awaiting />
              </div>
            )}

            {status === 'responded' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  <Mail className="h-3.5 w-3.5" /> Responded {fmt(qaRow.responded_at)}
                </div>
                {(Array.isArray(qaRow.answers) ? qaRow.answers : []).map((a, i) => (
                  <div key={i} className="rounded-lg border bg-background p-3 space-y-1.5">
                    <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {a.topic || qaRow.questions?.[i]?.topic || `Question ${i + 1}`}
                    </div>
                    <div className="text-xs font-medium">{a.question || qaRow.questions?.[i]?.text}</div>
                    <div className="text-[11px] text-muted-foreground italic px-3 py-2 rounded-md bg-muted/30 border">
                      {a.answer ? `“${a.answer}”` : <span className="not-italic">No answer provided.</span>}
                    </div>
                  </div>
                ))}
                <SubmittedApplicationForm
                  schema={qaRow.application_form_schema}
                  values={qaRow.application_form}
                />
              </div>
            )}

            {status === 'expired' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-rose-200 bg-rose-50 text-xs text-rose-700">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  Response window expired {fmt(qaRow.expired_at)}. Regenerate from the Generate tab to send a fresh set.
                </div>
                <SentQuestionList questions={qaRow.questions} />
                <SubmittedApplicationForm
                  schema={qaRow.application_form_schema}
                  values={qaRow.application_form}
                  awaiting
                />
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

/* Flat field list across all sections of an application-form schema. */
function flattenFields(schema) {
  const sections = Array.isArray(schema?.sections) ? schema.sections : [];
  return sections.flatMap((s) => (Array.isArray(s?.fields) ? s.fields : []));
}

/* ─────────── Application Form — read-only template preview (Generate tab) ─────────── */
function ApplicationFormPreview({ template }) {
  const [open, setOpen] = useState(false);

  if (!template) {
    return (
      <div className="rounded-lg border bg-muted/20 px-3 py-2 text-[11px] text-muted-foreground italic">
        <ClipboardList className="inline h-3 w-3 mr-1.5 -mt-0.5" />
        Application Form preview unavailable.
      </div>
    );
  }

  const sections = Array.isArray(template.sections) ? template.sections : [];

  return (
    <div className="rounded-lg border bg-muted/20">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 px-3 py-2.5 text-left"
      >
        {open ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
        <ClipboardList className="h-3.5 w-3.5 text-primary" />
        <span className="text-xs font-semibold">Application Form</span>
        <span className="text-[10px] text-muted-foreground">· sent with these questions</span>
      </button>

      {open && (
        <div className="px-3 pb-3 space-y-3">
          <p className="text-[10px] text-muted-foreground leading-snug">
            Read-only standard form. The candidate fills this alongside the questions; fields flow downstream
            to the modules tagged below.
          </p>
          {sections.map((sec) => (
            <div key={sec.key} className="space-y-1.5">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{sec.label}</div>
              <div className="grid gap-1.5">
                {(Array.isArray(sec.fields) ? sec.fields : []).map((f) => (
                  <div key={f.key} className="rounded-md border bg-background px-2.5 py-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-medium">{f.label}</span>
                      {f.required && <span className="text-rose-500 text-xs">*</span>}
                      <Badge variant="secondary" className="text-[9px]">{f.type}</Badge>
                    </div>
                    {Array.isArray(f.options) && f.options.length > 0 && (
                      <div className="mt-1 text-[10px] text-muted-foreground">
                        Options: {f.options.join(' · ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────── Application Form — submitted (or awaiting) values (Response Inbox) ─────────── */
function SubmittedApplicationForm({ schema, values, awaiting }) {
  if (!schema) return null;
  const fields = flattenFields(schema);
  if (fields.length === 0) return null;
  const v = values && typeof values === 'object' ? values : {};

  const display = (f) => {
    const raw = v[f.key];
    if (Array.isArray(raw)) return raw.length ? raw.join(', ') : '—';
    return raw != null && String(raw).trim() !== '' ? String(raw) : '—';
  };

  return (
    <div className="rounded-lg border bg-background p-3 space-y-2">
      <div className="flex items-center gap-1.5">
        <ClipboardList className="h-3.5 w-3.5 text-primary" />
        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          {awaiting ? 'Application form · awaiting candidate input' : 'Submitted application form'}
        </span>
      </div>
      <div className="grid gap-1.5 sm:grid-cols-2">
        {fields.map((f) => (
          <div key={f.key} className="rounded-md bg-muted/30 border px-2.5 py-1.5">
            <div className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">{f.label}</div>
            <div className="text-xs">{display(f)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* Read-only ordered list of a sent question set (topic + text). */
function SentQuestionList({ questions }) {
  const qs = Array.isArray(questions) ? questions : [];
  if (qs.length === 0) {
    return <div className="text-[11px] text-muted-foreground italic">No questions on record.</div>;
  }
  return (
    <div className="space-y-2">
      {qs.map((q, i) => (
        <div key={i} className="rounded-lg border bg-background p-3 text-xs leading-relaxed">
          <span className="font-semibold">{i + 1}. {q.topic || 'Untitled'}</span>
          <span className="text-muted-foreground"> — {q.text}</span>
        </div>
      ))}
    </div>
  );
}
