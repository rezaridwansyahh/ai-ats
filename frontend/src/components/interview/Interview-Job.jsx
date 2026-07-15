import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Loader2, AlertTriangle, Wand2, RotateCw,
  Lock, Unlock, Plus, X, Pencil, Check, ChevronRight,
  CalendarCheck, Users, ClipboardList,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';

import { getJobById } from '@/api/job.api';
import {
  getInterviewsByJob,
  getPrep,
  generateQuestions,
  updateQuestions,
  updateRubric,
  generateAnchors,
} from '@/api/interview.api';

const COMPETENCY_CODES = ['HRD-01', 'HRD-02', 'HRD-03', 'HRD-04', 'HRD-05', 'HRD-06'];
const COMPETENCY_NAMES = {
  'HRD-01': 'Leadership',
  'HRD-02': 'Planning & Organizing',
  'HRD-03': 'Problem Solving & Decision Making',
  'HRD-04': 'Value for Best Quality',
  'HRD-05': 'Creativity',
  'HRD-06': 'Teamwork',
};

const DEFAULT_RUBRIC_ITEMS = COMPETENCY_CODES.map((code) => ({
  competency_code: code,
  competency_name: COMPETENCY_NAMES[code],
  weight: 1.0,
  anchor_1: '',
  anchor_7: '',
}));

const STATUS_META = {
  ongoing:   { label: 'Ongoing',   color: 'bg-blue-100 text-blue-700'       },
  scheduled: { label: 'Scheduled', color: 'bg-violet-100 text-violet-700'   },
  done:      { label: 'Done',      color: 'bg-emerald-100 text-emerald-700' },
};

const SECTIONS = [
  { key: 'candidates', label: 'Candidates',  icon: Users },
  { key: 'rubric',     label: 'Rubric',      icon: CalendarCheck },
  { key: 'questions',  label: 'Questions',   icon: ClipboardList },
];

const NUM_Q_OPTIONS = [3, 5, 6, 8, 10, 12, 15];
const LANG_OPTIONS  = [
  { value: 'id',    label: 'Bahasa Indonesia' },
  { value: 'en',    label: 'English'          },
  { value: 'id-en', label: 'Mixed (ID + EN)'  },
];

function statusTone(status) {
  switch ((status || '').toLowerCase()) {
    case 'active':  return 'border-emerald-200 text-emerald-700 bg-emerald-50';
    case 'draft':   return 'border-amber-200 text-amber-700 bg-amber-50';
    case 'expired': return 'border-rose-200 text-rose-700 bg-rose-50';
    default:        return 'border-border text-muted-foreground bg-muted/40';
  }
}

function formatTimeSince(date) {
  const sec = Math.floor((Date.now() - date.getTime()) / 1000);
  if (sec < 10)  return 'just now';
  if (sec < 60)  return `${sec}s ago`;
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  return `${Math.floor(sec / 3600)}h ago`;
}

export default function InterviewJobPage() {
  const navigate        = useNavigate();
  const { jobId: jobIdParam } = useParams();
  const jobId = jobIdParam ? Number(jobIdParam) : null;

  const [job, setJob]               = useState(null);
  const [interviews, setInterviews] = useState([]);
  const [prep, setPrep]             = useState(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [banner, setBanner]         = useState(null);

  const [activeSection, setActiveSection] = useState('candidates');

  const rubricReady = !!prep?.rubric_items?.length &&
    prep.rubric_items.every((it) => it.anchor_1?.trim() && it.anchor_7?.trim());

  const load = useCallback(async () => {
    if (!jobId) return;
    setLoading(true);
    setError(null);
    try {
      const [jobRes, interviewsRes, prepRes] = await Promise.all([
        getJobById(jobId),
        getInterviewsByJob(jobId),
        getPrep(jobId),
      ]);
      setJob(jobRes.data?.job || jobRes.data || null);
      setInterviews(Array.isArray(interviewsRes.data?.interviews) ? interviewsRes.data.interviews : []);
      setPrep(prepRes.data?.prep || null);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => { load(); }, [load]);

  // Auto-navigate to the right starting tab based on setup state
  useEffect(() => {
    if (loading) return;
    if (!prep) setActiveSection('rubric');
    else if (!prep.questions?.length) setActiveSection('questions');
  }, [loading, prep]);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-5 p-6">
      {/* back */}
      <Button variant="ghost" size="sm" className="text-xs -ml-2" onClick={() => navigate('/selection/interview')}>
        <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back to workboard
      </Button>

      {/* header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight">{job?.job_title || `Job #${jobId}`}</h1>
            {job?.status && (
              <Badge variant="outline" className={`text-[9px] uppercase tracking-wide ${statusTone(job.status)}`}>
                {job.status}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {interviews.length} candidate{interviews.length === 1 ? '' : 's'} in interview
            {job?.job_location ? ` · ${job.job_location}` : ''}
            {job?.work_type    ? ` · ${job.work_type}`    : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="default"
            size="sm"
            className="text-xs"
            onClick={() => navigate(`/selection/interview/calibration/${jobId}`)}
          >
            <Users className="h-3.5 w-3.5 mr-1.5" /> Calibration
          </Button>
          <Button variant="outline" size="sm" className="text-xs" onClick={load}>
            <RotateCw className="h-3.5 w-3.5 mr-1.5" /> Refresh
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg border border-red-200 bg-red-50 text-sm text-red-600">
          <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {banner && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-lg border text-sm ${
          banner.ok
            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
            : 'border-amber-200 bg-amber-50 text-amber-700'
        }`}>
          <Check className="h-4 w-4 shrink-0" /> {banner.text}
        </div>
      )}

      {/* section tabs */}
      <div className="flex gap-1 border-b border-border/60">
        {SECTIONS.map(({ key, label, icon: Icon }) => {
          const blocked = key === 'questions' && !rubricReady;
          return (
            <button
              key={key}
              type="button"
              onClick={() => !blocked && setActiveSection(key)}
              className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
                blocked
                  ? 'border-transparent text-muted-foreground/40 cursor-not-allowed'
                  : activeSection === key
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="h-3.5 w-3.5" /> {label}
              {blocked && <Lock className="h-3 w-3 ml-0.5" />}
            </button>
          );
        })}
      </div>

      {/* section content */}
      {activeSection === 'candidates' && (
        <CandidatesSection
          interviews={interviews}
          navigate={navigate}
        />
      )}
      {activeSection === 'questions' && (
        <QuestionsSection
          jobId={jobId}
          job={job}
          prep={prep}
          setPrep={setPrep}
          setBanner={setBanner}
          setError={setError}
          hasSubmittedScorecards={interviews.some((i) => i.status === 'done')}
          rubricReady={rubricReady}
        />
      )}
      {activeSection === 'rubric' && (
        <RubricSection
          jobId={jobId}
          prep={prep}
          setPrep={setPrep}
          setBanner={setBanner}
          setError={setError}
          hasSubmittedScorecards={interviews.some((i) => i.status === 'done')}
        />
      )}
    </div>
  );
}

function CandidatesSection({ interviews, navigate }) {
  if (interviews.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-xs text-muted-foreground italic">
          No candidates in interview yet. Advance candidates from AI Screening.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="text-[10px] font-bold uppercase pl-4">Candidate</TableHead>
              <TableHead className="text-[10px] font-bold uppercase">Last position</TableHead>
              <TableHead className="text-[10px] font-bold uppercase">Scheduled</TableHead>
              <TableHead className="text-[10px] font-bold uppercase">Status</TableHead>
              <TableHead className="pr-4" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {interviews.map((i) => {
              const meta = STATUS_META[i.status] || { label: i.status, color: 'bg-muted text-muted-foreground' };
              return (
                <TableRow
                  key={i.interview_id}
                  className="cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => navigate(`/selection/interview/candidate/${i.interview_id}`)}
                >
                  <TableCell className="text-xs pl-4">
                    <div className="font-medium">{i.candidate_name || `#${i.candidate_id}`}</div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{i.last_position || '—'}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {i.scheduled_at ? new Date(i.scheduled_at).toLocaleDateString() : '—'}
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${meta.color}`}>
                      {meta.label}
                    </span>
                  </TableCell>
                  <TableCell className="pr-4 text-right">
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground inline" />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function QuestionsSection({ jobId, job, prep, setPrep, setBanner, setError, hasSubmittedScorecards }) {
  const [numQuestions, setNumQuestions] = useState('8');
  const [language, setLanguage]         = useState('id');
  const [generating, setGenerating]     = useState(false);
  const [saving, setSaving]             = useState(false);
  const [editingIdx, setEditingIdx]     = useState(null);

  // local editable copy of questions
  const [questions, setQuestions] = useState([]);

  // sync from prep whenever it changes
  useEffect(() => {
    setQuestions(Array.isArray(prep?.questions) ? prep.questions : []);
  }, [prep]);

  const isLocked = hasSubmittedScorecards;

  const handleGenerate = async () => {
    if (generating) return;
    if (hasSubmittedScorecards) {
      setError('Scorecards have been submitted — questions cannot be changed to preserve scoring integrity.');
      return;
    }
    if (isLocked) {
      setError('Rubric is locked — unlock it from the Rubric tab before regenerating.');
      return;
    }
    setGenerating(true);
    setError(null);
    setBanner(null);
    try {
      const res = await generateQuestions(jobId, {
        num_questions: Number(numQuestions),
        language,
      });
      const newPrep = res.data?.prep;
      setPrep(newPrep);
      setQuestions(Array.isArray(newPrep?.questions) ? newPrep.questions : []);
      setBanner({ ok: true, text: `${newPrep?.questions?.length || 0} questions generated.` });
      setEditingIdx(null);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (saving || isLocked) return;
    setSaving(true);
    setError(null);
    setBanner(null);
    try {
      const res = await updateQuestions(jobId, questions);
      setPrep((p) => ({ ...p, questions: res.data?.prep?.questions || questions }));
      setBanner({ ok: true, text: 'Questions saved.' });
      setEditingIdx(null);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const setField = (idx, field, val) =>
    setQuestions((qs) => qs.map((q, i) => (i === idx ? { ...q, [field]: val } : q)));

  const addCustom = () => {
    const next = [...questions, { id: null, competency: null, source: 'open', text: '', follow_up: null }];
    setQuestions(next);
    setEditingIdx(next.length - 1);
  };

  const removeQuestion = (idx) => {
    setQuestions((qs) => qs.filter((_, i) => i !== idx));
    setEditingIdx(null);
  };

  return (
    <div className="space-y-4">
      {/* generate controls */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Wand2 className="h-4 w-4 text-primary" /> Generate Questions
            {isLocked && (
              <Badge variant="outline" className="ml-auto text-[10px] border-amber-300 text-amber-700 bg-amber-50">
                <Lock className="h-3 w-3 mr-1" /> Locked
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {hasSubmittedScorecards && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-red-200 bg-red-50 text-xs text-red-700">
              <Lock className="h-3.5 w-3.5 shrink-0" />
              Scorecards have been submitted — questions are permanently locked to preserve scoring integrity.
            </div>
          )}
          {!hasSubmittedScorecards && isLocked && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-amber-200 bg-amber-50 text-xs text-amber-700">
              <Lock className="h-3.5 w-3.5 shrink-0" />
              Rubric is locked. Unlock from the Rubric tab to regenerate or edit questions.
            </div>
          )}
          {!isLocked && !hasSubmittedScorecards && !!prep?.rubric_items?.length && !questions.length && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-teal-200 bg-teal-50 text-xs text-teal-700">
              <Check className="h-3.5 w-3.5 shrink-0" />
              Rubric ready ({prep.rubric_items.length} competencies). Generate questions — the rubric will be used as AI context.
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                # Questions
              </label>
              <Select value={numQuestions} onValueChange={setNumQuestions} disabled={isLocked}>
                <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {NUM_Q_OPTIONS.map((n) => (
                    <SelectItem key={n} value={String(n)} className="text-xs">
                      {n}{n === 8 ? ' (recommended)' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Language
              </label>
              <Select value={language} onValueChange={setLanguage} disabled={isLocked}>
                <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LANG_OPTIONS.map((l) => (
                    <SelectItem key={l.value} value={l.value} className="text-xs">{l.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                className="w-full text-xs"
                onClick={handleGenerate}
                disabled={generating || isLocked}
              >
                {generating
                  ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Generating…</>
                  : <><Wand2 className="h-3.5 w-3.5 mr-1.5" /> {questions.length ? 'Regenerate' : 'Generate'}</>}
              </Button>
            </div>
          </div>

          {/* job context hint */}
          {job && (
            <div className="text-[10px] text-muted-foreground px-3 py-2 rounded-md bg-muted/30 border">
              Generating for <span className="font-semibold">{job.job_title}</span>
              {job.seniority_level ? ` · ${job.seniority_level}` : ''}
              {job.required_skills?.length
                ? ` · required: ${job.required_skills.slice(0, 4).join(', ')}${job.required_skills.length > 4 ? '…' : ''}`
                : ''}
            </div>
          )}
        </CardContent>
      </Card>

      {/* question list */}
      {questions.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <CardTitle className="text-sm">
                Questions
                <span className="ml-2 text-[11px] font-normal text-muted-foreground">
                  {questions.length} total · click to edit
                </span>
              </CardTitle>
              <div className="flex gap-2">
                {!isLocked && (
                  <Button size="sm" variant="outline" className="text-xs" onClick={addCustom}>
                    <Plus className="h-3 w-3 mr-1" /> Add custom
                  </Button>
                )}
                {!isLocked && (
                  <Button size="sm" className="text-xs" onClick={handleSave} disabled={saving}>
                    {saving ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Check className="h-3.5 w-3.5 mr-1.5" />}
                    Save
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {questions.map((q, i) => (
              <div key={i} className="rounded-lg border bg-muted/10 p-3 transition-colors">
                {editingIdx === i && !isLocked ? (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Select
                        value={q.competency || 'none'}
                        onValueChange={(v) => setField(i, 'competency', v === 'none' ? null : v)}
                      >
                        <SelectTrigger className="h-8 text-xs w-44">
                          <SelectValue placeholder="Competency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none" className="text-xs">No competency</SelectItem>
                          {COMPETENCY_CODES.map((c) => (
                            <SelectItem key={c} value={c} className="text-xs">
                              {c} · {COMPETENCY_NAMES[c]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Badge
                        variant="outline"
                        className={`text-[9px] ${q.source === 'open' ? 'border-violet-300 text-violet-700' : 'border-blue-300 text-blue-700'}`}
                      >
                        {q.source === 'open' ? 'Custom' : 'AI'}
                      </Badge>
                    </div>
                    <Textarea
                      value={q.text}
                      onChange={(e) => setField(i, 'text', e.target.value)}
                      placeholder="Interview question…"
                      rows={2}
                      className="text-xs"
                    />
                    <Input
                      value={q.follow_up || ''}
                      onChange={(e) => setField(i, 'follow_up', e.target.value || null)}
                      placeholder="Follow-up probe (optional)…"
                      className="text-xs h-8"
                    />
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => removeQuestion(i)}
                        className="text-[11px] text-rose-600 inline-flex items-center gap-1"
                      >
                        <X className="h-3 w-3" /> Remove
                      </button>
                      <Button size="sm" variant="ghost" className="text-xs" onClick={() => setEditingIdx(null)}>
                        Done
                      </Button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      if (isLocked) return;
                      setEditingIdx((prev) => (prev === i ? null : i));
                    }}
                    className={`w-full text-left group ${isLocked ? 'cursor-default' : 'cursor-pointer'}`}
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-[10px] font-mono text-muted-foreground mt-0.5 shrink-0">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                          {q.competency && (
                            <Badge variant="outline" className="text-[9px] border-blue-200 text-blue-700 bg-blue-50">
                              {q.competency} · {COMPETENCY_NAMES[q.competency]}
                            </Badge>
                          )}
                          <Badge
                            variant="outline"
                            className={`text-[9px] ${q.source === 'open' ? 'border-violet-200 text-violet-700' : 'border-slate-200 text-slate-600'}`}
                          >
                            {q.source === 'open' ? 'Custom' : 'AI'}
                          </Badge>
                        </div>
                        <p className="text-xs leading-relaxed">{q.text || <em className="text-muted-foreground">No text</em>}</p>
                        {q.follow_up && (
                          <p className="text-[10px] text-muted-foreground mt-0.5 italic">↳ {q.follow_up}</p>
                        )}
                      </div>
                      {!isLocked && (
                        <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5" />
                      )}
                    </div>
                  </button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function RubricSection({ jobId, prep, setPrep, setBanner, setError, hasSubmittedScorecards }) {
  const [items, setItems]         = useState(DEFAULT_RUBRIC_ITEMS);
  const [saving, setSaving]       = useState(false);
  const [generating, setGenerating] = useState(false);
  const [editingIdx, setEditingIdx] = useState(null);
  const [lastSaved, setLastSaved]   = useState(null);
  const [autoSaving, setAutoSaving] = useState(false);
  const isInitialLoad = useRef(true);

  const isLocked = hasSubmittedScorecards;

  // Reset initial load flag when prep syncs
  useEffect(() => {
    if (Array.isArray(prep?.rubric_items) && prep.rubric_items.length > 0) {
      setItems(prep.rubric_items);
    } else {
      setItems(DEFAULT_RUBRIC_ITEMS);
    }
    isInitialLoad.current = true;
  }, [prep]);
  
  // Autosave debounce — only fires after user edits, only when all anchors filled
  useEffect(() => {
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      return;
    }
    if (isLocked) return;
    const allReady = items.every((it) => it.anchor_1?.trim() && it.anchor_7?.trim());
    if (!allReady) return;

    const t = setTimeout(async () => {
      setAutoSaving(true);
      try {
        const res = await updateRubric(jobId, items);
        setPrep((p) => ({ ...p, rubric_items: res.data?.prep?.rubric_items || items }));
        setLastSaved(new Date());
      } catch { /* silent */ } finally {
        setAutoSaving(false);
      }
    }, 2000);

    return () => clearTimeout(t);
  }, [items]);

  const setField = (idx, field, val) =>
    setItems((its) => its.map((it, i) => (i === idx ? { ...it, [field]: val } : it)));

  const handleSave = async () => {
    if (saving || isLocked) return;
    // Validate anchors
    const missing = items.filter((it) => !it.anchor_1?.trim() || !it.anchor_7?.trim());
    if (missing.length > 0) {
      setError(`Fill in both anchors for: ${missing.map((m) => m.competency_name).join(', ')}`);
      return;
    }
    setSaving(true);
    setError(null);
    setBanner(null);
    try {
      const res = await updateRubric(jobId, items);
      setPrep((p) => ({ ...p, rubric_items: res.data?.prep?.rubric_items || items }));
      setBanner({ ok: true, text: 'Rubric saved.' });
      setEditingIdx(null);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateAnchors = async () => {
    if (generating || isLocked) return;
    setGenerating(true);
    setError(null);
    setBanner(null);
    try {
      const res = await generateAnchors(jobId);
      const newPrep = res.data?.prep;
      setPrep(newPrep);
      setItems(Array.isArray(newPrep?.rubric_items) ? newPrep.rubric_items : items);
      setBanner({ ok: true, text: 'Anchors generated — review and save.' });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Generation failed');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      {hasSubmittedScorecards && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-red-200 bg-red-50 text-xs text-red-700">
          <Lock className="h-3.5 w-3.5 shrink-0" />
          Scorecards have been submitted — rubric cannot be changed to preserve scoring integrity.
        </div>
      )}

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <CardTitle className="text-sm">
              Competency Framework
              <span className="ml-2 text-[11px] font-normal text-muted-foreground">
                FRM.PTAP.HRD.01-06 · scored 1–7 by interviewer
              </span>
            </CardTitle>
            <div className="flex items-center gap-3">
              {autoSaving && (
                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" /> Saving…
                </span>
              )}
              {!autoSaving && lastSaved && (
                <span className="text-[10px] text-muted-foreground">
                  Saved {formatTimeSince(lastSaved)}
                </span>
              )}
              {!isLocked && (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="text-xs" onClick={handleGenerateAnchors} disabled={generating}>
                    {generating
                      ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Generating…</>
                      : <><Wand2 className="h-3.5 w-3.5 mr-1.5" /> Generate AI Anchors</>}
                  </Button>
                  <Button size="sm" className="text-xs" onClick={handleSave} disabled={saving}>
                    {saving
                      ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Saving…</>
                      : <><Check className="h-3.5 w-3.5 mr-1.5" /> Save Rubric</>}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {items.map((item, i) => {
            const missingAnchor = !item.anchor_1?.trim() || !item.anchor_7?.trim();
            return (
              <div key={item.competency_code} className="rounded-lg border bg-muted/10 overflow-hidden">
                <div
                  onClick={() => !isLocked && setEditingIdx((prev) => (prev === i ? null : i))}
                  className={`flex items-center gap-2 min-w-0 p-3 ${!isLocked ? 'cursor-pointer hover:bg-muted/20 transition-colors' : ''}`}
                >
                  <Badge variant="outline" className="text-[9px] border-blue-200 text-blue-700 bg-blue-50 font-mono shrink-0">
                    {item.competency_code}
                  </Badge>
                  <span className="text-xs font-semibold truncate">{item.competency_name}</span>
                  {!isLocked && editingIdx !== i && (
                    <span className="text-[10px] text-muted-foreground italic">· click to edit</span>
                  )}
                  {missingAnchor && (
                    <span className="ml-auto text-[10px] text-amber-600 font-medium shrink-0">anchors required</span>
                  )}
                </div>

                <div className={`grid transition-all duration-200 ease-in-out ${editingIdx === i ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                  <div className="overflow-hidden">
                    <div className="space-y-2 px-3 pb-3 border-t border-border/60">
                      <div className="space-y-0.5 pt-2">
                        <label className="text-[9px] text-muted-foreground font-medium">
                          Weight · <span className="text-foreground font-semibold">{item.weight}×</span>
                        </label>
                        <input
                          type="range"
                          min={0.5} max={3} step={0.5}
                          value={item.weight}
                          onChange={(e) => setField(i, 'weight', Number(e.target.value))}
                          className="w-full accent-primary"
                        />
                        <div className="flex justify-between text-[9px] text-muted-foreground px-0.5">
                          <span>0.5×</span><span>1×</span><span>1.5×</span><span>2×</span><span>2.5×</span><span>3×</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[9px] text-muted-foreground font-medium">Score 1 — Poor</label>
                          <Textarea
                            value={item.anchor_1 || ''}
                            onChange={(e) => setField(i, 'anchor_1', e.target.value)}
                            placeholder="Describe lowest performance…"
                            rows={2}
                            className="text-xs resize-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] text-muted-foreground font-medium">Score 7 — Excellent</label>
                          <Textarea
                            value={item.anchor_7 || ''}
                            onChange={(e) => setField(i, 'anchor_7', e.target.value)}
                            placeholder="Describe highest performance…"
                            rows={2}
                            className="text-xs resize-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}