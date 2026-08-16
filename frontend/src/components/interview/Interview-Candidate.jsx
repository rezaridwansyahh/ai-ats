import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Loader2, AlertTriangle, Check, ChevronRight,
  Plus, X, Pencil, Briefcase, MapPin, Lock, CalendarCheck,
  ClipboardList, Clock, Users, Trash2, Calendar as CalendarIcon,
  MessageSquare, CheckCircle2, XCircle, RefreshCw, Star,
  ThumbsUp, ThumbsDown, Link,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';

import {
  getPrep, updateQuestions, updateCandidateQuestions,
  getSchedules, createSchedule, updateSchedule,
  confirmSchedule, unconfirmSchedule, deleteSchedule,
  recordOutcome, clearOutcome,
  getPackOutcome,
  getScorecard,
  getInterviewRounds,
  getDecideByJob, decideCandidate, resetDecision, getInterviewByCandidateId,
  reInterview,
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

const STATUS_META = {
  setup:     { label: 'Setup',     color: 'bg-slate-100 text-slate-700'     },
  scheduled: { label: 'Scheduled', color: 'bg-violet-100 text-violet-700'   },
  ongoing:   { label: 'Ongoing',   color: 'bg-blue-100 text-blue-700'       },
  result:    { label: 'Result',    color: 'bg-amber-100 text-amber-700'     },
  cancelled: { label: 'Cancelled', color: 'bg-gray-100 text-gray-600'       },
  done:      { label: 'Done',      color: 'bg-emerald-100 text-emerald-700' },
};

const OUTCOME_OPTIONS = [
  { value: 'interviewed', label: 'Interviewed', icon: CheckCircle2, color: 'text-emerald-600' },
  { value: 'no_show',     label: 'No Show',     icon: XCircle,      color: 'text-rose-600'    },
  { value: 'reschedule',  label: 'Reschedule',  icon: RefreshCw,    color: 'text-amber-600'   },
];

const RECOMMENDATION_OPTIONS = [
  { value: 'strong_hire',    label: 'Strong Hire',    icon: ThumbsUp,   color: 'border-emerald-400 text-emerald-700 bg-emerald-50'    },
  { value: 'hire',           label: 'Hire',           icon: ThumbsUp,   color: 'border-emerald-300 text-emerald-600 bg-emerald-50/50' },
  { value: 'no_hire',        label: 'No Hire',        icon: ThumbsDown, color: 'border-rose-300 text-rose-600 bg-rose-50/50'          },
  { value: 'strong_no_hire', label: 'Strong No Hire', icon: ThumbsDown, color: 'border-rose-400 text-rose-700 bg-rose-50'             },
];

const RECOMMENDATION_COLOR = {
  strong_hire:    'border-emerald-400 text-emerald-700 bg-emerald-50',
  hire:           'border-emerald-300 text-emerald-600 bg-emerald-50/50',
  no_hire:        'border-rose-300 text-rose-600 bg-rose-50/50',
  strong_no_hire: 'border-rose-400 text-rose-700 bg-rose-50',
};

const RECOMMENDATION_LABEL = {
  strong_hire:    'Strong Hire',
  hire:           'Hire',
  no_hire:        'No Hire',
  strong_no_hire: 'Strong No Hire',
};

const REJECT_REASONS = [
  { value: 'skill_gap_core_competency',   label: 'Skill gap in core competency'  },
  { value: 'below_score_band_rubric',     label: 'Below score band on rubric'    },
  { value: 'stronger_candidate_selected', label: 'Stronger candidate selected'   },
  { value: 'communication_culture_fit',   label: 'Communication / culture fit'   },
  { value: 'withdrew_counter_offer',      label: 'Withdrew / counter-offer'      },
  { value: 'other',                       label: 'Other (free text)'             },
];

const SECTIONS = [
  { key: 'schedule', label: 'Schedule', icon: CalendarCheck },
  { key: 'result',   label: 'Result',   icon: Star          },
  { key: 'decide',   label: 'Decide',   icon: Check         },
];

const MAX_SESSIONS = 3;

function fmt(d) {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch { return '—'; }
}

function fmtTime(d) {
  if (!d) return '';
  try {
    return new Date(d).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  } catch { return ''; }
}

const formatLocalDate = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

function scoreColor(score) {
  if (!score) return 'text-muted-foreground';
  if (score >= 6) return 'text-emerald-700';
  if (score >= 4) return 'text-amber-700';
  return 'text-rose-700';
}

function scoreBg(score) {
  if (!score) return 'bg-muted/30 text-muted-foreground border-border';
  if (score >= 6) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (score >= 4) return 'bg-amber-50 text-amber-700 border-amber-200';
  return 'bg-rose-50 text-rose-700 border-rose-200';
}

export default function InterviewCandidatePage() {
  const navigate                 = useNavigate();
  const { candidateId } = useParams();
  const candidateIdNum = candidateId ? Number(candidateId) : null;
  const [interview, setInterview] = useState(null);
  const [interviewId, setInterviewId] = useState(null);

  const [prep, setPrep]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [banner, setBanner]       = useState(null);
  const [activeSection, setActiveSection] = useState('schedule');
  const [reInterviewing, setReInterviewing] = useState(false);

  const load = useCallback(async () => {
    if (!candidateIdNum) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getInterviewByCandidateId(candidateIdNum);
      const data = res.data?.interview || null;
      setInterview(data);
      setInterviewId(data?.interview_id ?? null);
      if (data?.job_id) {
        const prepRes = await getPrep(data.job_id);
        setPrep(prepRes.data?.prep || null);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load interview');
    } finally {
      setLoading(false);
    }
  }, [candidateIdNum]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !interview) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg border border-red-200 bg-red-50 text-sm text-red-600">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error || 'Interview not found'}
        </div>
      </div>
    );
  }

  const {
    candidate_name, candidate_id,
    job_id, job_title, job_location, work_type, seniority_level,
    status, scheduled_at, last_position, address, education_text,
  } = interview;

  const isScheduled  = ['scheduled', 'ongoing', 'result', 'done'].includes(status);
  const hasConducted = ['result', 'done'].includes(status);
  const canReInterview = status === 'result' || status === 'done';
  const round = interview.round || 1;
  // Once "Interview Again" has run at least once, Round 1's Result/Decide
  // history exists forever — never re-lock those tabs just because the new
  // round hasn't caught back up to 'result'/'done' yet.
  const hasRoundHistory = round > 1;

  const canGoStep = (key) => {
    if (key === 'schedule') return true;
    if (key === 'result')   return isScheduled || hasRoundHistory;
    if (key === 'decide')   return hasConducted || hasRoundHistory;
    return true;
  };

  const statusMeta = STATUS_META[status] || { label: status, color: 'bg-muted text-muted-foreground' };
  const initials   = (candidate_name || '?').split(/\s+/).map((s) => s[0]).join('').slice(0, 2).toUpperCase();

  const handleReInterview = async () => {
    if (!interviewId || reInterviewing) return;
    setReInterviewing(true);
    setError(null);
    try {
      await reInterview(interviewId);
      setBanner({ ok: true, text: 'New interview round started.' });
      setActiveSection('schedule');
      await load();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to start a new round');
    } finally {
      setReInterviewing(false);
    }
  };

  return (
    <>
      {/* sticky header */}
      <div className="sticky top-[52px] z-10 bg-background/95 backdrop-blur-sm -mt-5 -mx-5 px-5 pt-5 pb-4 border-b border-border/60">
        <div className="space-y-3">
          <Button variant="ghost" size="sm" className="text-xs -ml-2 w-fit" onClick={() => navigate(`/selection/interview/job/${job_id}`)}>
            <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back to position
          </Button>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="h-11 w-11 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold flex-shrink-0 text-sm">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg font-bold tracking-tight truncate">
                {candidate_name || `Candidate #${candidate_id}`}
              </h1>
              <div className="text-[11px] text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5">
                <span className="inline-flex items-center gap-1"><Briefcase className="h-3 w-3" /> {job_title || `Job #${job_id}`}</span>
                {job_location && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {job_location}</span>}
                {work_type       && <span>· {work_type}</span>}
                {seniority_level && <span>· {seniority_level}</span>}
                {scheduled_at    && <span>· next session {fmt(scheduled_at)}</span>}
              </div>
            </div>
            <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-semibold font-mono bg-muted text-muted-foreground border border-border">
              R{round}
            </span>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold ${statusMeta.color}`}>
              {statusMeta.label}
            </span>
          </div>
        </div>
      </div>

      <div className="px-6 pb-6 pt-4 space-y-5">
        {error && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-lg border border-red-200 bg-red-50 text-sm text-red-600">
            <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
          </div>
        )}
        {banner && (
          <div className={`flex items-center gap-2 px-4 py-3 rounded-lg border text-sm ${
            banner.ok ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'
          }`}>
            <Check className="h-4 w-4 shrink-0" /> {banner.text}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_240px] gap-6">
          <div className="space-y-4 min-w-0">
            {/* section tabs */}
            <div className="flex gap-1 border-b border-border/60 overflow-x-auto">
              {SECTIONS.map(({ key, label, icon: Icon }) => (
                <button
                  key={key} type="button"
                  onClick={() => canGoStep(key) && setActiveSection(key)}
                  className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
                    activeSection === key
                      ? 'border-primary text-primary'
                      : !canGoStep(key)
                      ? 'opacity-40 cursor-default border-transparent text-muted-foreground'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                  {!canGoStep(key) && <Lock className="h-3 w-3 ml-0.5" />}
                </button>
              ))}
            </div>

            {activeSection === 'schedule' && <ScheduleSection key={`schedule-${round}`} interviewId={interviewId} interview={interview} setInterview={setInterview} setBanner={setBanner} setError={setError} />}
            {activeSection === 'result'   && <ResultSection   key={`result-${round}`}   interview={interview} prep={prep} interviewId={interviewId} />}
            {activeSection === 'decide'   && <DecideSection   key={`decide-${round}`}   interviewId={interviewId} interview={interview} setInterview={setInterview} setBanner={setBanner} setError={setError} onReInterview={handleReInterview} reInterviewing={reInterviewing} />}
          </div>

          <aside>
            <div className="sticky top-[184px] space-y-3">
              <CandidateCard last_position={last_position} address={address} education_text={education_text} />
              <StepsNav activeSection={activeSection} onStep={setActiveSection} status={status} interview={interview} />
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}

function PrepSection({ jobId, interviewId, prep, customQuestions: initCustom, setPrep, setBanner, setError, navigate }) {
  const positionQuestions = Array.isArray(prep?.questions) ? prep.questions : [];
  const [customQuestions, setCustomQuestions] = useState(Array.isArray(initCustom) ? initCustom : []);
  const [saving, setSaving]                   = useState(false);
  const [editingIdx, setEditingIdx]           = useState(null);
  const [noPrepWarning, setNoPrepWarning]     = useState(false);

  useEffect(() => {
    setCustomQuestions(Array.isArray(initCustom) ? initCustom : []);
  }, [interviewId]); // reset when candidate changes

  const addCustom = () => {
    setNoPrepWarning(false);
    const next = [...customQuestions, { competency: null, text: '', follow_up: null }];
    setCustomQuestions(next);
    setEditingIdx(next.length - 1);
  };

  const removeQuestion = (idx) => {
    setCustomQuestions((qs) => qs.filter((_, i) => i !== idx));
    setEditingIdx(null);
  };

  const setField = (idx, field, val) =>
    setCustomQuestions((qs) => qs.map((q, i) => (i === idx ? { ...q, [field]: val } : q)));

  const handleSave = async () => {
    if (saving) return;
    setSaving(true); setError(null); setBanner(null);
    try {
      await updateCandidateQuestions(interviewId, customQuestions);
      setBanner({ ok: true, text: 'Custom questions saved for this candidate.' });
      setEditingIdx(null);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Save failed');
    } finally { setSaving(false); }
  };

  const positionCount = positionQuestions.length;
  const customCount   = customQuestions.length;

  return (
    <div className="space-y-4">
      {prep?.rubric_items?.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-primary" /> Scoring Rubric
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5">
              {prep.rubric_items.map((item) => (
                <div key={item.competency_code} className="rounded-md border bg-muted/20 px-2.5 py-2">
                  <div className="flex items-center justify-between gap-1">
                    <Badge variant="outline" className="text-[9px] border-blue-200 text-blue-700 font-mono">{item.competency_code}</Badge>
                    <span className="text-[9px] font-mono text-muted-foreground">×{item.weight}</span>
                  </div>
                  <p className="text-[10px] font-medium mt-0.5 truncate">{item.competency_name}</p>
                  {item.anchor_1 && <p className="text-[9px] text-muted-foreground mt-0.5 truncate">1: {item.anchor_1}</p>}
                </div>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">Edit weights and anchors from the position page → Rubric tab.</p>
          </CardContent>
        </Card>
      )}

      {noPrepWarning && (
        <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg border border-amber-200 bg-amber-50 text-xs text-amber-700">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">No questions generated yet</p>
            <p className="text-[10px] mt-0.5">
              Generate position questions first from the{' '}
              <button type="button" onClick={() => navigate(`/selection/interview/job/${jobId}`)} className="underline font-semibold hover:text-amber-900">
                position page → Questions tab
              </button>, then come back to add custom questions for this candidate.
            </p>
          </div>
          <button type="button" onClick={() => setNoPrepWarning(false)} className="shrink-0"><X className="h-3.5 w-3.5" /></button>
        </div>
      )}

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <CardTitle className="text-sm">
              Interview Questions
              <span className="ml-2 text-[11px] font-normal text-muted-foreground">
                {positionCount} from position{customCount > 0 ? ` · ${customCount} custom` : ''}
              </span>
            </CardTitle>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="text-xs" onClick={addCustom}><Plus className="h-3 w-3 mr-1" /> Add custom</Button>
              <Button size="sm" className="text-xs" onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Check className="h-3.5 w-3.5 mr-1.5" />}Save
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {positionQuestions.length === 0 && customQuestions.length === 0 && (
            <div className="py-10 text-center space-y-2">
              <p className="text-xs text-muted-foreground italic">No questions yet.</p>
              <button type="button" onClick={() => navigate(`/selection/interview/job/${jobId}`)} className="text-xs text-primary underline hover:opacity-80">
                Go to position page → Questions tab to generate
              </button>
            </div>
          )}
          {positionQuestions.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground px-1">Position questions</p>
              {positionQuestions.map((q, i) => (
                <div key={i} className="rounded-lg border bg-muted/10 p-3">
                  <div className="flex items-start gap-2">
                    <span className="text-[10px] font-mono text-muted-foreground mt-0.5 shrink-0">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                        {q.competency && <Badge variant="outline" className="text-[9px] border-blue-200 text-blue-700 bg-blue-50">{q.competency} · {COMPETENCY_NAMES[q.competency]}</Badge>}
                        <Badge variant="outline" className="text-[9px] border-slate-200 text-slate-600">AI</Badge>
                      </div>
                      <p className="text-xs leading-relaxed">{q.text}</p>
                      {q.follow_up && <p className="text-[10px] text-muted-foreground mt-0.5 italic">↳ {q.follow_up}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {customQuestions.length > 0 && (
            <div className="space-y-1.5 mt-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground px-1">Custom for this candidate</p>
              {customQuestions.map((q, i) => (
                <div key={i} className="rounded-lg border border-violet-200 bg-violet-50/30 p-3">
                  {editingIdx === i ? (
                    <div className="space-y-2">
                      <Select value={q.competency || 'none'} onValueChange={(v) => setField(i, 'competency', v === 'none' ? null : v)}>
                        <SelectTrigger className="h-8 text-xs w-48"><SelectValue placeholder="Competency (optional)" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none" className="text-xs">No competency</SelectItem>
                          {COMPETENCY_CODES.map((c) => <SelectItem key={c} value={c} className="text-xs">{c} · {COMPETENCY_NAMES[c]}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Textarea value={q.text} onChange={(e) => setField(i, 'text', e.target.value)} placeholder="Custom question…" rows={2} className="text-xs" />
                      <Input value={q.follow_up || ''} onChange={(e) => setField(i, 'follow_up', e.target.value || null)} placeholder="Follow-up probe (optional)…" className="text-xs h-8" />
                      <div className="flex items-center justify-between">
                        <button type="button" onClick={() => removeQuestion(i)} className="text-[11px] text-rose-600 inline-flex items-center gap-1"><X className="h-3 w-3" /> Remove</button>
                        <Button size="sm" variant="ghost" className="text-xs" onClick={() => setEditingIdx(null)}>Done</Button>
                      </div>
                    </div>
                  ) : (
                    <button type="button" onClick={() => setEditingIdx(i)} className="w-full text-left group cursor-pointer">
                      <div className="flex items-start gap-2">
                        <span className="text-[10px] font-mono text-muted-foreground mt-0.5 shrink-0">{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                            {q.competency && <Badge variant="outline" className="text-[9px] border-violet-300 text-violet-700 bg-violet-50">{q.competency} · {COMPETENCY_NAMES[q.competency]}</Badge>}
                            <Badge variant="outline" className="text-[9px] border-violet-300 text-violet-700">Custom</Badge>
                          </div>
                          <p className="text-xs leading-relaxed">{q.text || <em className="text-muted-foreground">Click to add text</em>}</p>
                          {q.follow_up && <p className="text-[10px] text-muted-foreground mt-0.5 italic">↳ {q.follow_up}</p>}
                        </div>
                        <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5" />
                      </div>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ScheduleSection({ interviewId, interview, setInterview, setBanner, setError }) {
  const [sessions, setSessions]               = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [showForm, setShowForm]               = useState(false);
  const [editingSession, setEditingSession]   = useState(null);
  const [title, setTitle]                     = useState('');
  const [description, setDescription]         = useState('');
  const [selectedDate, setSelectedDate]       = useState(undefined);
  const [timeValue, setTimeValue]             = useState('09:00');
  const [saving, setSaving]                   = useState(false);
  const [confirmNote, setConfirmNote]         = useState('');
  const [confirmingId, setConfirmingId]       = useState(null);
  const [deletingId, setDeletingId]           = useState(null);
  const [recordingId, setRecordingId]         = useState(null);
  const [outcomeNote, setOutcomeNote]         = useState('');

  const loadSessions = useCallback(async () => {
    setLoadingSessions(true);
    try {
      const res = await getSchedules(interviewId);
      setSessions(res.data?.schedules || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load sessions');
    } finally { setLoadingSessions(false); }
  }, [interviewId]);

  useEffect(() => { loadSessions(); }, [loadSessions]);

  const openNewForm  = () => { setEditingSession(null); setTitle(''); setDescription(''); setSelectedDate(undefined); setTimeValue('09:00'); setShowForm(true); };
  const openEditForm = (s) => { setEditingSession(s); setTitle(s.title || ''); setDescription(s.description || ''); setSelectedDate(s.scheduled_at ? new Date(s.scheduled_at) : undefined); setTimeValue(s.scheduled_at ? new Date(s.scheduled_at).toTimeString().slice(0, 5) : '09:00'); setShowForm(true); };
  const buildScheduledAt = () => selectedDate ? new Date(`${formatLocalDate(selectedDate)}T${timeValue}:00`).toISOString() : null;

  const handleSave = async () => {
    if (!title.trim() || !selectedDate || saving) return;
    setSaving(true); setError(null); setBanner(null);
    try {
      const scheduled_at = buildScheduledAt();
      if (editingSession) {
        const res = await updateSchedule(editingSession.id, { title, description, scheduled_at });
        setSessions((prev) => prev.map((s) => s.id === editingSession.id ? res.data.schedule : s));
        setBanner({ ok: true, text: 'Session updated.' });
      } else {
        const res = await createSchedule(interviewId, { title, description, scheduled_at });
        setSessions((prev) => [...prev, res.data.schedule]);
        // syncScheduledAt on the backend sets status → 'scheduled'; mirror that here
        // so the Conduct tab unlocks immediately without a full page reload.
        setInterview((prev) => ({
          ...prev,
          scheduled_at: res.data.schedule.scheduled_at,
          status: 'scheduled',
        }));
        setBanner({ ok: true, text: 'Session created.' });
      }
      setShowForm(false);
    } catch (err) { setError(err.response?.data?.message || err.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleConfirm = async (session) => {
    setConfirmingId(session.id); setError(null);
    try {
      const res = await confirmSchedule(session.id, { confirmation_note: confirmNote || undefined });
      setSessions((prev) => prev.map((s) => s.id === session.id ? res.data.schedule : s));
      setBanner({ ok: true, text: 'Session confirmed.' }); setConfirmNote(''); setConfirmingId(null);
    } catch (err) { setError(err.response?.data?.message || err.message || 'Confirm failed'); setConfirmingId(null); }
  };

  const handleUnconfirm = async (sessionId) => {
    setError(null);
    try {
      const res = await unconfirmSchedule(sessionId);
      setSessions((prev) => prev.map((s) => s.id === sessionId ? res.data.schedule : s));
      setBanner({ ok: true, text: 'Session unconfirmed.' });
    } catch (err) { setError(err.response?.data?.message || err.message || 'Unconfirm failed'); }
  };

  const handleDelete = async (sessionId) => {
    setDeletingId(sessionId); setError(null);
    try {
      await deleteSchedule(sessionId);
      const remaining = sessions.filter((s) => s.id !== sessionId);
      setSessions(remaining);
      // Mirror backend syncScheduledAt: if no sessions left → 'setup', else stays 'scheduled'
      setInterview((prev) => ({
        ...prev,
        status: remaining.length > 0 ? 'scheduled' : 'setup',
        scheduled_at: remaining.length > 0 ? prev.scheduled_at : null,
      }));
      setBanner({ ok: true, text: 'Session removed.' });
    } catch (err) { setError(err.response?.data?.message || err.message || 'Delete failed'); }
    finally { setDeletingId(null); }
  };

  const handleRecordOutcome = async (sessionId, status) => {
    setRecordingId(sessionId); setError(null); setBanner(null);
    try {
      const res = await recordOutcome(sessionId, { status, outcome_note: outcomeNote || undefined });
      setSessions((prev) => prev.map((s) => s.id === sessionId ? res.data.schedule : s));
      // 'reschedule' loops back to Schedule sub-stage; other outcomes move to Result.
      setInterview((prev) => ({ ...prev, status: status === 'reschedule' ? 'scheduled' : 'result' }));
      setBanner({ ok: true, text: `Outcome recorded: ${status.replace('_', ' ')}.` });
      setOutcomeNote('');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to record outcome');
    } finally { setRecordingId(null); }
  };

  const handleClearOutcome = async (sessionId) => {
    setError(null); setBanner(null);
    try {
      const res = await clearOutcome(sessionId);
      setSessions((prev) => prev.map((s) => s.id === sessionId ? res.data.schedule : s));
      // Session remains confirmed after clearing its outcome.
      setInterview((prev) => ({ ...prev, status: 'ongoing' }));
      setBanner({ ok: true, text: 'Outcome cleared.' });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to clear outcome');
    }
  };

  // Mirrors the backend's isScheduleCreationLocked rule: only a fresh round
  // (no sessions yet) or a 'reschedule' outcome permits adding another
  // session. Anything else must go through "Interview Again" (new round).
  const latestSession = sessions[sessions.length - 1];
  const scheduleLocked = !!latestSession && latestSession.status !== 'reschedule';
  const canAdd = sessions.length < MAX_SESSIONS && !scheduleLocked;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">Interview Sessions</h2>
          <p className="text-[11px] text-muted-foreground">{sessions.length} of {MAX_SESSIONS} sessions · invitations are sent outside this system</p>
        </div>
        {canAdd && !showForm && <Button size="sm" className="text-xs" onClick={openNewForm}><Plus className="h-3.5 w-3.5 mr-1.5" /> Add session</Button>}
      </div>

      {scheduleLocked && !showForm && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-amber-200 bg-amber-50 text-xs text-amber-700">
          <MessageSquare className="h-3.5 w-3.5 shrink-0" />
          A session is already active. Resolve its outcome first, or use "Interview Again" to start a new round.
        </div>
      )}

      {showForm && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-3"><CardTitle className="text-sm">{editingSession ? 'Edit Session' : `Session ${sessions.length + 1} of ${MAX_SESSIONS}`}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Title <span className="text-rose-500">*</span></label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. HR Interview, Technical Interview…" className="text-xs h-9" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Description</label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional notes…" rows={2} className="text-xs" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Date <span className="text-rose-500">*</span></label>
                <Popover>
                  <PopoverTrigger asChild>
                    <div role="button" tabIndex={0} className="flex items-center gap-2 h-9 px-3 rounded-md border border-input bg-background text-xs cursor-pointer hover:bg-muted/30 transition-colors">
                      <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className={selectedDate ? 'font-medium' : 'text-muted-foreground'}>{selectedDate ? formatLocalDate(selectedDate) : 'Pick date'}</span>
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))} />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Time <span className="text-rose-500">*</span></label>
                <Input type="time" value={timeValue} onChange={(e) => setTimeValue(e.target.value)} className="text-xs h-9" />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-1 border-t">
              <Button size="sm" variant="ghost" className="text-xs" onClick={() => setShowForm(false)} disabled={saving}>Cancel</Button>
              <Button size="sm" className="text-xs" onClick={handleSave} disabled={!title.trim() || !selectedDate || saving}>
                {saving ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Check className="h-3.5 w-3.5 mr-1.5" />}
                {editingSession ? 'Update' : 'Create session'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loadingSessions ? (
        <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : sessions.length === 0 && !showForm ? (
        <Card><CardContent className="py-12 text-center text-xs text-muted-foreground italic">No sessions yet. Add up to {MAX_SESSIONS} interview sessions.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {sessions.map((session, idx) => (
            <SessionCard
              key={session.id}
              session={session}
              sessionNumber={idx + 1}
              confirmNote={confirmNote}
              setConfirmNote={setConfirmNote}
              outcomeNote={outcomeNote}
              setOutcomeNote={setOutcomeNote}
              confirmingId={confirmingId}
              recordingId={recordingId}
              deletingId={deletingId}
              onEdit={() => openEditForm(session)}
              onConfirm={() => handleConfirm(session)}
              onUnconfirm={() => handleUnconfirm(session.id)}
              onDelete={() => handleDelete(session.id)}
              onRecordOutcome={(status) => handleRecordOutcome(session.id, status)}
              onClearOutcome={() => handleClearOutcome(session.id)}
            />
          ))}
        </div>
      )}

      {sessions.length >= MAX_SESSIONS && !showForm && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-600">
          <MessageSquare className="h-3.5 w-3.5 shrink-0" /> Maximum {MAX_SESSIONS} sessions reached.
        </div>
      )}
    </div>
  );
}

// ─── SessionCard ─────────────────────────────────────────────────────────────

function SessionCard({
  session, sessionNumber,
  confirmNote, setConfirmNote,
  outcomeNote, setOutcomeNote,
  confirmingId, recordingId, deletingId,
  onEdit, onConfirm, onUnconfirm, onDelete,
  onRecordOutcome, onClearOutcome,
}) {
  const [showConfirmInput, setShowConfirmInput] = useState(false);
  const [showOutcomePanel, setShowOutcomePanel] = useState(false);

  const isConfirmed  = session.confirmed;
  const isConfirming = confirmingId === session.id;
  const isRecording  = recordingId  === session.id;
  const isDeleting   = deletingId   === session.id;
  const hasOutcome   = !!session.status && session.status !== 'ongoing';
  const outcomeMeta  = hasOutcome ? OUTCOME_OPTIONS.find((o) => o.value === session.status) : null;

  const cardBorder = hasOutcome && session.status === 'interviewed' ? 'border-emerald-200 bg-emerald-50/20'
    : hasOutcome && session.status === 'no_show'    ? 'border-rose-200 bg-rose-50/20'
    : hasOutcome && session.status === 'reschedule' ? 'border-amber-200 bg-amber-50/20'
    : isConfirmed ? 'border-emerald-200 bg-emerald-50/20' : '';

  return (
    <Card className={`transition-colors ${cardBorder}`}>
      <CardContent className="p-4 space-y-3">
        {/* ── Header row ── */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className={`h-7 w-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${
              hasOutcome && session.status === 'interviewed' ? 'bg-emerald-500 text-white'
              : hasOutcome ? 'bg-amber-400 text-white'
              : isConfirmed ? 'bg-emerald-500 text-white'
              : 'bg-muted text-muted-foreground'
            }`}>
              {hasOutcome || isConfirmed ? <Check className="h-3.5 w-3.5" /> : sessionNumber}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold truncate">{session.title}</p>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="text-[10px] text-muted-foreground inline-flex items-center gap-1">
                  <CalendarIcon className="h-3 w-3" />{fmt(session.scheduled_at)} · {fmtTime(session.scheduled_at)}
                </span>
                {hasOutcome && outcomeMeta ? (
                  <Badge variant="outline" className={`text-[9px] ${
                    session.status === 'interviewed' ? 'border-emerald-300 text-emerald-700 bg-emerald-50'
                    : session.status === 'no_show'   ? 'border-rose-300 text-rose-700 bg-rose-50'
                    : 'border-amber-300 text-amber-700 bg-amber-50'
                  }`}>{outcomeMeta.label}</Badge>
                ) : isConfirmed ? (
                  <Badge variant="outline" className="text-[9px] border-emerald-300 text-emerald-700 bg-emerald-50">Confirmed</Badge>
                ) : (
                  <Badge variant="outline" className="text-[9px] border-amber-300 text-amber-700 bg-amber-50">Pending confirmation</Badge>
                )}
              </div>
              {session.description && <p className="text-[10px] text-muted-foreground mt-1">{session.description}</p>}
              {isConfirmed && session.confirmation_note && (
                <p className="text-[10px] text-emerald-700 mt-1 italic">"{session.confirmation_note}"</p>
              )}
              {hasOutcome && session.outcome_note && (
                <p className="text-[10px] text-muted-foreground mt-1 italic">Note: {session.outcome_note}</p>
              )}
            </div>
          </div>

          {/* ── Action buttons ── */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Edit — only when unconfirmed + no outcome */}
            {!isConfirmed && !hasOutcome && (
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onEdit} title="Edit">
                <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            )}

            {/* Confirmed state: show "Record outcome" or "Clear outcome" */}
            {isConfirmed && !hasOutcome && (
              <Button
                size="sm"
                className="h-7 text-xs bg-primary hover:bg-primary/90"
                onClick={() => setShowOutcomePanel((v) => !v)}
              >
                <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Record outcome
              </Button>
            )}
            {hasOutcome && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                onClick={() => setShowOutcomePanel((v) => !v)}
              >
                <Pencil className="h-3 w-3 mr-1" /> {showOutcomePanel ? 'Cancel' : 'Edit outcome'}
              </Button>
            )}

            {/* Unconfirm — only when confirmed + no outcome */}
            {isConfirmed && !hasOutcome && (
              <Button size="sm" variant="outline" className="h-7 text-xs text-amber-700 border-amber-300 hover:bg-amber-50" onClick={onUnconfirm}>
                Unconfirm
              </Button>
            )}

            {/* Confirm — when not yet confirmed */}
            {!isConfirmed && !hasOutcome && (
              <Button size="sm" className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700" onClick={() => setShowConfirmInput(!showConfirmInput)}>
                Confirm
              </Button>
            )}

            {/* Delete — only when unconfirmed + no outcome */}
            {!isConfirmed && !hasOutcome && (
              <Button size="icon" variant="ghost" className="h-7 w-7 text-rose-500 hover:text-rose-600 hover:bg-rose-50" onClick={onDelete} disabled={isDeleting} title="Delete">
                {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
              </Button>
            )}
          </div>
        </div>

        {/* ── Confirm input panel ── */}
        {showConfirmInput && !isConfirmed && (
          <div className="flex items-center gap-2 pt-2 border-t">
            <Input
              value={confirmNote}
              onChange={(e) => setConfirmNote(e.target.value)}
              placeholder="How was it confirmed? (e.g. via WhatsApp)…"
              className="text-xs h-8 flex-1"
            />
            <Button size="sm" className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700" onClick={() => { onConfirm(); setShowConfirmInput(false); }} disabled={isConfirming}>
              {isConfirming ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5 mr-1" />} Done
            </Button>
            <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setShowConfirmInput(false)}>Cancel</Button>
          </div>
        )}

        {/* ── Outcome recording panel (shown when confirmed or editing existing outcome) ── */}
        {showOutcomePanel && (
          <div className="pt-3 border-t space-y-3">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">What was the outcome?</p>
            <div className="flex flex-wrap gap-2">
              {OUTCOME_OPTIONS.map(({ value, label, icon: Icon, color }) => (
                <button
                  key={value}
                  type="button"
                  disabled={isRecording}
                  onClick={() => { onRecordOutcome(value); setShowOutcomePanel(false); }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors hover:opacity-80 ${
                    hasOutcome && session.status === value
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background border-border text-foreground hover:bg-muted/40'
                  } ${isRecording ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isRecording ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Icon className={`h-3.5 w-3.5 ${color}`} />}
                  {label}
                </button>
              ))}
            </div>
            <Input
              value={outcomeNote}
              onChange={(e) => setOutcomeNote(e.target.value)}
              placeholder="Optional note about this outcome…"
              className="text-xs h-8"
            />
            {hasOutcome && (
              <button
                type="button"
                onClick={() => { onClearOutcome(); setShowOutcomePanel(false); }}
                className="text-[11px] text-rose-600 hover:underline inline-flex items-center gap-1"
              >
                <X className="h-3 w-3" /> Clear outcome
              </button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ConductSection({ interviewId, interview, setInterview, setBanner, setError, prep }) {
  const [sessions, setSessions]               = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [recordingId, setRecordingId]         = useState(null);
  const [outcomeNote, setOutcomeNote]         = useState('');
  const [expandedId, setExpandedId]           = useState(null);
  const [showNotesDialog, setShowNotesDialog] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [detailedNotes, setDetailedNotes]     = useState('');
  const [savingNotes, setSavingNotes]         = useState(false);

  const loadSessions = useCallback(async () => {
    setLoadingSessions(true);
    try {
      const res = await getSchedules(interviewId);
      setSessions((res.data?.schedules || []).filter((s) => s.confirmed));
    } catch (err) { setError(err.response?.data?.message || err.message || 'Failed to load sessions'); }
    finally { setLoadingSessions(false); }
  }, [interviewId]);

  useEffect(() => { loadSessions(); }, [loadSessions]);

  const handleRecord = async (sessionId, status) => {
    if (status === 'interviewed') { setCurrentSessionId(sessionId); setShowNotesDialog(true); setExpandedId(null); return; }
    setRecordingId(sessionId); setError(null); setBanner(null);
    try {
      const res = await recordOutcome(sessionId, { status, outcome_note: outcomeNote || undefined });
      setSessions((prev) => prev.map((s) => s.id === sessionId ? res.data.schedule : s));
      setInterview((prev) => ({ ...prev, status: status === 'reschedule' ? 'scheduled' : 'result' }));
      setBanner({ ok: true, text: `Outcome recorded: ${status.replace('_', ' ')}.` });
      setOutcomeNote(''); setExpandedId(null);
    } catch (err) { setError(err.response?.data?.message || err.message || 'Failed to record outcome'); }
    finally { setRecordingId(null); }
  };

  const handleSaveInterviewNotes = async () => {
    if (!currentSessionId) return;
    setSavingNotes(true); setError(null); setBanner(null);
    try {
      const res = await recordOutcome(currentSessionId, { status: 'interviewed', outcome_note: detailedNotes || undefined });
      setSessions((prev) => prev.map((s) => s.id === currentSessionId ? res.data.schedule : s));
      setInterview((prev) => ({ ...prev, status: 'result' }));
      setBanner({ ok: true, text: 'Interview completed and notes saved.' });
      setShowNotesDialog(false); setCurrentSessionId(null); setDetailedNotes('');
    } catch (err) { setError(err.response?.data?.message || err.message || 'Failed to save notes'); }
    finally { setSavingNotes(false); }
  };


  if (loadingSessions) return <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;

  if (sessions.length === 0) return (
    <Card>
      <CardContent className="py-14 text-center space-y-2">
        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center mx-auto"><Users className="h-5 w-5 text-muted-foreground" /></div>
        <p className="text-sm font-semibold">No confirmed sessions yet</p>
        <p className="text-xs text-muted-foreground max-w-xs mx-auto">Confirm at least one session in the Schedule tab first.</p>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-sm font-semibold">Conduct</h2>
        <p className="text-[11px] text-muted-foreground">Record what happened at each confirmed session. Offline only.</p>
      </div>

      <div className="space-y-3">
        {sessions.map((session, idx) => {
          const hasOutcome  = !!session.status && session.status !== 'ongoing';
          const outcomeMeta = hasOutcome ? OUTCOME_OPTIONS.find((o) => o.value === session.status) : null;
          const isExpanded  = expandedId === session.id;
          const isRecording = recordingId === session.id;
          return (
            <Card key={session.id} className={`transition-colors ${session.status === 'interviewed' ? 'border-emerald-200 bg-emerald-50/20' : session.status === 'no_show' ? 'border-rose-200 bg-rose-50/20' : session.status === 'reschedule' ? 'border-amber-200 bg-amber-50/20' : ''}`}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className={`h-7 w-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${session.status === 'interviewed' ? 'bg-emerald-500 text-white' : session.status === 'no_show' ? 'bg-rose-400 text-white' : session.status === 'reschedule' ? 'bg-amber-400 text-white' : 'bg-muted text-muted-foreground'}`}>
                      {hasOutcome ? <Check className="h-3.5 w-3.5" /> : idx + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate">{session.title}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-[10px] text-muted-foreground inline-flex items-center gap-1"><CalendarIcon className="h-3 w-3" />{fmt(session.scheduled_at)} · {fmtTime(session.scheduled_at)}</span>
                        {hasOutcome && outcomeMeta ? (
                          <Badge variant="outline" className={`text-[9px] ${session.status === 'interviewed' ? 'border-emerald-300 text-emerald-700 bg-emerald-50' : session.status === 'no_show' ? 'border-rose-300 text-rose-700 bg-rose-50' : 'border-amber-300 text-amber-700 bg-amber-50'}`}>{outcomeMeta.label}</Badge>
                        ) : <Badge variant="outline" className="text-[9px] border-slate-300 text-slate-600">Awaiting outcome</Badge>}
                      </div>
                      {hasOutcome && session.outcome_note && <p className="text-[10px] text-muted-foreground mt-1 italic">"{session.outcome_note}"</p>}
                      {hasOutcome && session.outcome_at && <p className="text-[10px] text-muted-foreground mt-0.5">Recorded {fmt(session.outcome_at)}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button size="sm" variant={hasOutcome ? 'outline' : 'default'} className="h-7 text-xs" onClick={() => setExpandedId(isExpanded ? null : session.id)}>
                      <Pencil className="h-3 w-3 mr-1" />{hasOutcome ? 'Edit' : 'Record outcome'}
                    </Button>
                  </div>
                </div>
                {isExpanded && (
                  <div className="pt-3 border-t space-y-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">What happened in this session?</p>
                    <div className="grid grid-cols-3 gap-2">
                      {OUTCOME_OPTIONS.map((opt) => {
                        const Icon = opt.icon;
                        return (
                          <button key={opt.value} type="button" onClick={() => handleRecord(session.id, opt.value)} disabled={isRecording} className={`flex flex-col items-center gap-1.5 px-3 py-3 rounded-lg border text-xs font-semibold transition-colors hover:bg-muted/40 ${opt.color}`}>
                            {isRecording ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className={`h-4 w-4 ${opt.color}`} />}
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-muted-foreground">Note (optional)</label>
                      <div className="flex gap-2">
                        <Input value={outcomeNote} onChange={(e) => setOutcomeNote(e.target.value)} placeholder="e.g. Candidate arrived on time, ran 45 mins…" className="text-xs h-8 flex-1" />
                        <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => { setExpandedId(null); setOutcomeNote(''); }}>Cancel</Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="border-dashed">
        <CardContent className="p-4 flex items-center gap-3">
          <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center shrink-0"><ClipboardList className="h-4 w-4 text-muted-foreground" /></div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground">Interview Pack</p>
            <p className="text-[10px] text-muted-foreground">Pack link status and scorecard returns will appear here once the batch module is live.</p>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showNotesDialog} onOpenChange={setShowNotesDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-emerald-600" /> Interview Completed</DialogTitle>
            <DialogDescription>Optionally capture notes from the session before marking it as interviewed.</DialogDescription>
          </DialogHeader>
          {prep?.questions?.length > 0 && (
            <Card className="bg-muted/30 border-muted">
              <CardHeader className="pb-2"><CardTitle className="text-xs flex items-center gap-1.5"><ClipboardList className="h-3.5 w-3.5" /> Questions Reference</CardTitle></CardHeader>
              <CardContent className="space-y-1.5">
                {prep.questions.slice(0, 4).map((q, i) => (
                  <p key={i} className="text-xs text-muted-foreground">{i + 1}. {q.text}</p>
                ))}
                {prep.questions.length > 4 && <p className="text-[10px] text-muted-foreground italic">+ {prep.questions.length - 4} more in Prep tab</p>}
              </CardContent>
            </Card>
          )}
          <Textarea value={detailedNotes} onChange={(e) => setDetailedNotes(e.target.value)} placeholder="Interview notes (optional)…" rows={8} className="text-xs" />
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowNotesDialog(false); setDetailedNotes(''); setCurrentSessionId(null); }} disabled={savingNotes}>Cancel</Button>
            <Button onClick={handleSaveInterviewNotes} disabled={savingNotes} className="bg-emerald-600 hover:bg-emerald-700">
              {savingNotes ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</> : <><Check className="h-4 w-4 mr-2" />Save & Mark Interviewed</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EvaluateSection({ interviewId, interview, setInterview, prep, setBanner, setError }) {
  const [scorecard, setScorecard]           = useState(null);
  const [loading, setLoading]               = useState(true);
  const [saving, setSaving]                 = useState(false);
  const [scores, setScores]                 = useState({});
  const [comments, setComments]             = useState({});
  const [recommendation, setRecommendation] = useState('');
  const [strengths, setStrengths]           = useState('');
  const [concerns, setConcerns]             = useState('');
  const [showComments, setShowComments]     = useState({});
  const [isEditing, setIsEditing]           = useState(false);

  const rubricItems = Array.isArray(prep?.rubric_items) && prep.rubric_items.length > 0
    ? prep.rubric_items
    : COMPETENCY_CODES.map((c) => ({ competency_code: c, competency_name: COMPETENCY_NAMES[c], weight: 1 }));

  useEffect(() => {
    if (!interviewId) return;
    (async () => {
      setLoading(true);
      try {
        const res = await getScorecard(interviewId);
        const sc  = res.data?.scorecard;
        if (sc) {
          setScorecard(sc);
          const loadedComments = sc.competency_comments || {};
          setScores(sc.competency_scores || {});
          setComments(loadedComments);
          setRecommendation(sc.recommendation     || '');
          setStrengths(sc.standout_strengths      || '');
          setConcerns(sc.concerns                 || '');
          const initialShowComments = {};
          Object.keys(loadedComments).forEach((code) => {
            if (loadedComments[code]) initialShowComments[code] = true;
          });
          setShowComments(initialShowComments);
        }
      } catch { /* no scorecard yet */ }
      finally { setLoading(false); }
    })();
  }, [interviewId]);

  const computeWeightedTotal = () => {
    let sum = 0; let totalWeight = 0;
    for (const item of rubricItems) {
      const s = Number(scores[item.competency_code]);
      const w = Number(item.weight) || 1;
      if (Number.isFinite(s) && s >= 1 && s <= 7) { sum += s * w; totalWeight += w; }
    }
    return totalWeight > 0 ? Math.round((sum / totalWeight) * 100) / 100 : null;
  };

  const filledCount   = rubricItems.filter((i) => Number(scores[i.competency_code]) >= 1).length;
  const allFilled     = filledCount === rubricItems.length;
  const weightedTotal = computeWeightedTotal();
  const reviewFlag    = Object.values(scores).some((s) => Number(s) <= 2);

  const handleSave = async (isDraft) => {
    if (!allFilled && !isDraft) { setError('Please score all competencies before submitting.'); return; }
    setSaving(true); setError(null); setBanner(null);
    try {
      const res = await saveScorecard(interviewId, {
        competency_scores:   scores,
        competency_comments: comments,
        recommendation:      recommendation || null,
        standout_strengths:  strengths      || null,
        concerns:            concerns       || null,
        is_draft:            isDraft,
      });
      setScorecard(res.data?.scorecard);
      setBanner({ ok: true, text: isDraft ? 'Scorecard autosaved.' : isEditing ? 'Scorecard updated.' : 'Scorecard submitted.' });
      if (!isDraft) setInterview((prev) => ({ ...prev, status: 'done' }));
      setIsEditing(false);
    } catch (err) { setError(err.response?.data?.message || err.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this scorecard? This cannot be undone.')) return;
    try {
      await deleteScorecard(interviewId);
      setScorecard(null); setScores({}); setComments({}); setRecommendation(''); setStrengths(''); setConcerns(''); setShowComments({}); setIsEditing(false);
      setBanner({ ok: true, text: 'Scorecard deleted.' });
    } catch (err) { setError(err.response?.data?.message || err.message || 'Delete failed'); }
  };

  const handleCancelEdit = () => {
    if (scorecard) {
      const restoredComments = scorecard.competency_comments || {};
      setScores(scorecard.competency_scores || {});
      setComments(restoredComments);
      setRecommendation(scorecard.recommendation || '');
      setStrengths(scorecard.standout_strengths || '');
      setConcerns(scorecard.concerns || '');
      const restoredShowComments = {};
      Object.keys(restoredComments).forEach((code) => {
        if (restoredComments[code]) restoredShowComments[code] = true;
      });
      setShowComments(restoredShowComments);
    }
    setError(null);
    setIsEditing(false);
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;

  const isSubmitted = scorecard && !scorecard.is_draft;

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-sm font-semibold">Evaluate</h2>
          <p className="text-[11px] text-muted-foreground">Score each competency 1–7 using the rubric anchors. Weighted total is computed automatically.</p>
        </div>
        <div className="flex items-center gap-2">
          {scorecard && (
            <Badge variant="outline" className={`text-[9px] ${isEditing ? 'border-violet-300 text-violet-700 bg-violet-50' : isSubmitted ? 'border-emerald-300 text-emerald-700 bg-emerald-50' : 'border-amber-300 text-amber-700 bg-amber-50'}`}>
              {isEditing ? 'Editing' : isSubmitted ? 'Submitted' : 'Draft'}
            </Badge>
          )}
          {scorecard && isSubmitted && !isEditing && (
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setIsEditing(true)}>
              <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
            </Button>
          )}
          {scorecard && !isSubmitted && (
            <Button size="sm" variant="ghost" className="h-7 text-xs text-rose-500 hover:text-rose-600" onClick={handleDelete}>
              <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
            </Button>
          )}
        </div>
      </div>

      {isEditing && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg border border-violet-200 bg-violet-50 text-xs text-violet-700">
          <Pencil className="h-4 w-4 shrink-0" />
          Editing a submitted scorecard — changes won't be saved until you click "Save changes".
        </div>
      )}

      {weightedTotal !== null && (
        <Card className={`${reviewFlag ? 'border-amber-200 bg-amber-50/30' : 'border-emerald-200 bg-emerald-50/30'}`}>
          <CardContent className="p-4 flex items-center gap-4 flex-wrap">
            <div className="text-center">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Weighted Total</p>
              <p className={`text-2xl font-bold font-mono ${scoreColor(weightedTotal)}`}>{weightedTotal}<span className="text-sm text-muted-foreground font-normal">/7</span></p>
            </div>
            <div className="flex-1 min-w-0 space-y-1">
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className={`h-full rounded-full transition-all ${weightedTotal >= 5 ? 'bg-emerald-500' : weightedTotal >= 3.5 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${(weightedTotal / 7) * 100}%` }} />
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] text-muted-foreground">{filledCount}/{rubricItems.length} competencies scored</span>
                {reviewFlag && <Badge variant="outline" className="text-[9px] border-amber-300 text-amber-700 bg-amber-50">⚠ Review flag — score ≤2 on at least one competency</Badge>}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Star className="h-4 w-4 text-primary" /> Competency Scores
            <span className="text-[10px] font-normal text-muted-foreground ml-1">· score each 1 (poor) → 7 (excellent)</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {rubricItems.map((item) => {
            const score       = scores[item.competency_code];
            const comment     = comments[item.competency_code] || '';
            const isLow       = Number(score) <= 2 && Number(score) >= 1;
            const showComment = !!showComments[item.competency_code];
            return (
              <div key={item.competency_code} className={`rounded-lg border p-3 space-y-3 ${isLow ? 'border-amber-200 bg-amber-50/20' : ''}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Badge variant="outline" className="text-[9px] border-blue-200 text-blue-700 font-mono">{item.competency_code}</Badge>
                      <span className="text-xs font-semibold">{item.competency_name}</span>
                      <span className="text-[9px] font-mono text-muted-foreground">×{item.weight}</span>
                      {isLow && <Badge variant="outline" className="text-[9px] border-amber-300 text-amber-700 bg-amber-50">Low score — review</Badge>}
                    </div>
                    {(item.anchor_1 || item.anchor_7) && (
                      <div className="flex items-center gap-4 mt-1">
                        {item.anchor_1 && <span className="text-[9px] text-muted-foreground">1: {item.anchor_1.slice(0, 50)}{item.anchor_1.length > 50 ? '…' : ''}</span>}
                        {item.anchor_7 && <span className="text-[9px] text-muted-foreground">7: {item.anchor_7.slice(0, 50)}{item.anchor_7.length > 50 ? '…' : ''}</span>}
                      </div>
                    )}
                  </div>
                  {score && (
                    <span className={`inline-flex items-center justify-center h-7 w-7 rounded-full text-xs font-bold border shrink-0 ${scoreBg(Number(score))}`}>
                      {score}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                    <button
                      key={n} type="button"
                      disabled={isSubmitted && !isEditing}
                      onClick={() => setScores((prev) => ({ ...prev, [item.competency_code]: n }))}
                      className={`h-8 w-8 rounded-md border text-xs font-semibold transition-colors ${
                        Number(score) === n
                          ? n <= 2 ? 'bg-rose-500 text-white border-rose-500'
                          : n <= 4 ? 'bg-amber-500 text-white border-amber-500'
                          : 'bg-emerald-500 text-white border-emerald-500'
                          : 'bg-muted/30 text-muted-foreground hover:bg-muted/60 border-border'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setShowComments((prev) => ({ ...prev, [item.competency_code]: !prev[item.competency_code] }))}
                    className="ml-auto text-[10px] text-muted-foreground hover:text-foreground underline"
                  >
                    {showComment ? 'Hide comment' : 'Add comment'}
                  </button>
                </div>
                {showComment && (
                  <Textarea
                    value={comment}
                    onChange={(e) => setComments((prev) => ({ ...prev, [item.competency_code]: e.target.value }))}
                    placeholder={`Comment on ${item.competency_name}…`}
                    rows={2}
                    className="text-xs"
                    disabled={isSubmitted && !isEditing}
                  />
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm">Overall Assessment</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Recommendation</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {RECOMMENDATION_OPTIONS.map((opt) => {
                const Icon   = opt.icon;
                const active = recommendation === opt.value;
                return (
                  <button
                    key={opt.value} type="button"
                    disabled={isSubmitted && !isEditing}
                    onClick={() => setRecommendation(active ? '' : opt.value)}
                    className={`flex flex-col items-center gap-1 px-3 py-2.5 rounded-lg border text-xs font-semibold transition-colors ${
                      active ? opt.color + ' ring-2 ring-offset-1 ring-current' : 'border-border text-muted-foreground hover:bg-muted/40'
                    }`}
                  >
                    <Icon className="h-4 w-4" /> {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Standout Strengths</label>
            <Textarea value={strengths} onChange={(e) => setStrengths(e.target.value)} placeholder="What stood out positively about this candidate?" rows={2} className="text-xs" disabled={isSubmitted && !isEditing} />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Concerns</label>
            <Textarea value={concerns} onChange={(e) => setConcerns(e.target.value)} placeholder="Any concerns or red flags?" rows={2} className="text-xs" disabled={isSubmitted && !isEditing} />
          </div>
        </CardContent>
      </Card>

      {(!isSubmitted || isEditing) && (
        <div className="flex items-center justify-between gap-3 pt-1 border-t">
          <p className="text-[10px] text-muted-foreground">
            {allFilled ? 'All competencies scored — ready to submit.' : `${rubricItems.length - filledCount} competencie${rubricItems.length - filledCount === 1 ? '' : 's'} still need a score.`}
          </p>
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button size="sm" variant="ghost" className="text-xs" onClick={handleCancelEdit} disabled={saving}>Cancel</Button>
                <Button size="sm" className="text-xs" onClick={() => handleSave(false)} disabled={saving || !allFilled}>
                  {saving ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Check className="h-3.5 w-3.5 mr-1.5" />} Save changes
                </Button>
              </>
            ) : (
              <>
                <Button size="sm" variant="outline" className="text-xs" onClick={() => handleSave(true)} disabled={saving}>
                  {saving ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : null} Save draft
                </Button>
                <Button size="sm" className="text-xs" onClick={() => handleSave(false)} disabled={saving || !allFilled}>
                  {saving ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Check className="h-3.5 w-3.5 mr-1.5" />} Submit scorecard
                </Button>
              </>
            )}
          </div>
        </div>
      )}

      {isSubmitted && !isEditing && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg border border-emerald-200 bg-emerald-50 text-xs text-emerald-700">
          <Check className="h-4 w-4 shrink-0" />
          Scorecard submitted {fmt(scorecard.submitted_at)} — read only. Go to Decide to advance or reject this candidate.
        </div>
      )}
    </div>
  );
}

const VERDICT_OPTIONS = [
  {
    value:       'advanced',
    label:       'Advance to Next Stage',
    description: 'Candidate proceeds to the next step',
    icon:        Check,
    color:       'border-emerald-300 bg-emerald-50/60 text-emerald-700',
    activeColor: 'border-emerald-500 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-300',
    iconColor:   'text-emerald-600',
  },
  {
    value:       'reinterview',
    label:       'Interview Again',
    description: 'Start a new round — this round\'s history is kept',
    icon:        RefreshCw,
    color:       'border-violet-300 bg-violet-50/60 text-violet-700',
    activeColor: 'border-violet-500 bg-violet-50 text-violet-700 ring-2 ring-violet-300',
    iconColor:   'text-violet-500',
  },
  {
    value:       'rejected',
    label:       'Reject',
    description: 'Candidate does not proceed',
    icon:        X,
    color:       'border-rose-300 bg-rose-50/60 text-rose-700',
    activeColor: 'border-rose-500 bg-rose-50 text-rose-700 ring-2 ring-rose-300',
    iconColor:   'text-rose-600',
  },
];

// Pack-link outcomes use a different verdict scale (advance/hold/reject) than
// direct in-app scorecards (strong_hire..strong_no_hire) — keep them separate.
const PACK_RECOMMENDATION_LABEL = { advance: 'Advance', hold: 'Hold', reject: 'Reject' };
const PACK_RECOMMENDATION_COLOR = {
  advance: 'border-emerald-300 text-emerald-700 bg-emerald-50',
  hold:    'border-amber-300 text-amber-700 bg-amber-50',
  reject:  'border-rose-300 text-rose-700 bg-rose-50',
};

function DecideSection({ interviewId, interview, setInterview, setBanner, setError, onReInterview, reInterviewing }) {
  const [scorecard, setScorecard]   = useState(null);
  const [packOutcome, setPackOutcome] = useState(null);
  const [loading, setLoading]       = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // round history — "1 card dropdown" per round, same pattern as Result tab
  const [rounds, setRounds]                 = useState([]);
  const [selectedRoundNum, setSelectedRoundNum] = useState(null);

  // verdict selector: null | 'advanced' | 'reinterview' | 'rejected'
  const [selectedVerdict, setSelectedVerdict] = useState(null);

  // advance modal
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);

  // interview-again confirm modal
  const [showReinterviewModal, setShowReinterviewModal] = useState(false);

  // reject modal steps: null | 'reason' | 'confirm'
  const [rejectStep, setRejectStep]     = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectNote, setRejectNote]     = useState('');

  const decision       = interview?.decision;
  const alreadyDecided = decision && decision !== 'pending';

  useEffect(() => {
    if (!interviewId) return;
    (async () => {
      setLoading(true);
      try {
        const [scRes, packRes] = await Promise.allSettled([
          getScorecard(interviewId),
          getPackOutcome(interviewId),
        ]);
        setScorecard(scRes.status === 'fulfilled' ? (scRes.value.data?.scorecard || null) : null);
        setPackOutcome(packRes.status === 'fulfilled' ? (packRes.value.data?.outcome || null) : null);
      } catch { setScorecard(null); setPackOutcome(null); }
      finally { setLoading(false); }
    })();
  }, [interviewId]);

  useEffect(() => {
    if (!interviewId) return;
    getInterviewRounds(interviewId)
      .then((res) => {
        const list = res.data?.rounds || [];
        setRounds(list);
        setSelectedRoundNum(list.length > 0 ? list[list.length - 1].round_number : null);
      })
      .catch(() => setRounds([]));
  }, [interviewId, interview?.round]);

  const latestRoundNumber = rounds.length > 0 ? rounds[rounds.length - 1].round_number : 1;
  const isViewingCurrent  = selectedRoundNum == null || selectedRoundNum === latestRoundNumber;
  const pastRoundOutcome  = !isViewingCurrent
    ? (rounds.find((r) => r.round_number === selectedRoundNum)?.outcome || null)
    : null;

  // Two independent scoring paths can produce a "submitted scorecard":
  //  - direct in-app Evaluate tab  → interview_scorecard (is_draft=false)
  //  - pack-link portal submission → interview_pack_outcome (no draft concept)
  // Prefer the direct scorecard when both exist; fall back to the pack
  // outcome so Decide never stays locked after a portal submission.
  const hasDirectScorecard = scorecard && !scorecard.is_draft;
  const usingPackOutcome   = !hasDirectScorecard && !!packOutcome;
  const isSubmitted        = hasDirectScorecard || usingPackOutcome;

  // ── weighted total: Postgres NUMERIC comes back as string, cast it ──
  const rawTotal      = hasDirectScorecard ? scorecard?.weighted_total : packOutcome?.weighted_total;
  const weightedTotal = rawTotal !== null && rawTotal !== undefined ? Number(rawTotal) : null;
  const recommendation   = hasDirectScorecard ? (scorecard?.recommendation ?? null) : null;
  const packRecommendation = usingPackOutcome ? (packOutcome?.recommendation ?? null) : null;
  const reviewFlag       = hasDirectScorecard ? (scorecard?.review_flag ?? false) : false;
  const competencyScores = hasDirectScorecard ? (scorecard?.competency_scores || {}) : {};
  const packScores       = usingPackOutcome ? (packOutcome?.scores || {}) : {};
  const strengthsText    = hasDirectScorecard ? scorecard?.standout_strengths : packOutcome?.strengths;
  const concernsText     = hasDirectScorecard ? scorecard?.concerns : packOutcome?.concerns;

  const wtColor = weightedTotal === null ? 'text-muted-foreground'
    : weightedTotal >= 5 ? 'text-emerald-700'
    : weightedTotal >= 3.5 ? 'text-amber-700'
    : 'text-rose-700';

  const wtBarColor = weightedTotal === null ? 'bg-muted'
    : weightedTotal >= 5 ? 'bg-emerald-500'
    : weightedTotal >= 3.5 ? 'bg-amber-500'
    : 'bg-rose-500';

  // ── Handlers ──
  const handleSubmitVerdict = () => {
    if (!selectedVerdict) return;
    if (selectedVerdict === 'advanced')    { setShowAdvanceModal(true);      return; }
    if (selectedVerdict === 'reinterview') { setShowReinterviewModal(true);  return; }
    if (selectedVerdict === 'rejected')    { setRejectStep('reason');        return; }
  };

  const handleAdvance = async () => {
    setSubmitting(true); setError(null); setBanner(null);
    try {
      await decideCandidate(interviewId, { decision: 'advanced' });
      setInterview((prev) => ({ ...prev, decision: 'advanced', status: 'done' }));
      setBanner({ ok: true, text: 'Candidate advanced.' });
      setShowAdvanceModal(false);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to advance candidate');
    } finally { setSubmitting(false); }
  };

  // "Interview Again" — starts a fresh round instead of recording a
  // decision. Delegates the actual API call + tab switch to the parent
  // (same handler the page header used to expose).
  const handleConfirmReInterview = async () => {
    // onReInterview switches activeSection to 'schedule' inside itself,
    // which unmounts this component — touch local state first.
    setShowReinterviewModal(false);
    setSelectedVerdict(null);
    await onReInterview?.();
  };

  const handleReject = async () => {
    setSubmitting(true); setError(null); setBanner(null);
    try {
      await decideCandidate(interviewId, {
        decision:      'rejected',
        reject_reason: rejectReason,
        reject_note:   rejectNote || null,
      });
      setInterview((prev) => ({ ...prev, decision: 'rejected', status: 'done' }));
      setBanner({ ok: true, text: 'Candidate rejected.' });
      setRejectStep(null);
      setRejectReason('');
      setRejectNote('');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to reject candidate');
    } finally { setSubmitting(false); }
  };

  const closeRejectModal = () => { setRejectStep(null);  setRejectReason(''); setRejectNote(''); };

  const handleResetDecision = async () => {
    setSubmitting(true); setError(null); setBanner(null);
    try {
      await resetDecision(interview.job_id, interviewId);
      setInterview((prev) => ({ ...prev, decision: 'pending', reject_reason: null, reject_note: null }));
      setSelectedVerdict(null);
      setBanner({ ok: true, text: 'Decision cleared — you can now resubmit.' });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to reset decision');
    } finally { setSubmitting(false); }
  };

  const buildRejectAuditString = () => {
    const reasonLabel = REJECT_REASONS.find((r) => r.value === rejectReason)?.label || rejectReason;
    return `${new Date().toISOString()} · ${interview?.candidate_name || 'Candidate'} · REJECT · reason="${reasonLabel}"${rejectNote ? ` · note="${rejectNote}"` : ''}`;
  };

  // ── Decided state label ──
  const decidedMeta = {
    advanced: { label: 'This candidate has been advanced.',        color: 'border-emerald-200 bg-emerald-50 text-emerald-700', icon: Check  },
    hold:     { label: 'This candidate is on hold.',               color: 'border-amber-200 bg-amber-50 text-amber-700',       icon: Clock  },
    rejected: { label: 'This candidate has been rejected.',        color: 'border-rose-200 bg-rose-50 text-rose-700',         icon: X      },
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const roundPicker = rounds.length > 0 && (
    <Select value={String(selectedRoundNum)} onValueChange={(v) => setSelectedRoundNum(Number(v))}>
      <SelectTrigger className="h-8 text-xs w-36">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {rounds.map((r) => (
          <SelectItem key={r.round_number} value={String(r.round_number)} className="text-xs">
            Round {r.round_number}{r.round_number === latestRoundNumber ? ' (current)' : ''}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  // Read-only summary for a past round — decisions only ever apply to the
  // live/current round, so no verdict UI here.
  if (!isViewingCurrent) {
    const pastWeightedTotal = pastRoundOutcome?.weighted_total != null ? Number(pastRoundOutcome.weighted_total) : null;
    const pastRecLabel = pastRoundOutcome?.source === 'pack' ? PACK_RECOMMENDATION_LABEL[pastRoundOutcome.recommendation] : null;
    const pastRecColor = pastRoundOutcome?.source === 'pack' ? PACK_RECOMMENDATION_COLOR[pastRoundOutcome.recommendation] : null;
    return (
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-sm font-semibold">Decide</h2>
            <p className="text-[11px] text-muted-foreground">Read-only summary for a past round.</p>
          </div>
          {roundPicker}
        </div>

        <div className="flex items-center gap-2 px-4 py-3 rounded-lg border border-violet-200 bg-violet-50 text-xs text-violet-700">
          <RefreshCw className="h-4 w-4 shrink-0" />
          This round moved on via Interview Again — no decision was recorded for it.
        </div>

        {pastRoundOutcome ? (
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">Scorecard Summary — Round {selectedRoundNum}</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3 flex-wrap">
                <p className="text-2xl font-bold font-mono">
                  {pastWeightedTotal !== null ? pastWeightedTotal : '—'}
                  <span className="text-sm text-muted-foreground font-normal">/7</span>
                </p>
                {pastRecLabel && (
                  <Badge variant="outline" className={`text-[9px] ${pastRecColor || ''}`}>Interviewer: {pastRecLabel}</Badge>
                )}
              </div>
              {(pastRoundOutcome.strengths || pastRoundOutcome.concerns) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t">
                  {pastRoundOutcome.strengths && (
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">Strengths</p>
                      <p className="text-xs">{pastRoundOutcome.strengths}</p>
                    </div>
                  )}
                  {pastRoundOutcome.concerns && (
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">Concerns</p>
                      <p className="text-xs">{pastRoundOutcome.concerns}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-10 text-center text-xs text-muted-foreground italic">
              No scores were recorded for this round.
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-sm font-semibold">Decide</h2>
          <p className="text-[11px] text-muted-foreground">
            Review this candidate's scorecard summary and make a decision.
          </p>
        </div>
        {roundPicker}
      </div>

      {/* already decided banner — stays visible with undo */}
      {alreadyDecided && (() => {
        const meta = decidedMeta[decision];
        const Icon = meta?.icon || Check;
        return (
          <div className={`flex items-center gap-2 px-4 py-3 rounded-lg border text-xs font-semibold ${meta?.color || ''}`}>
            <Icon className="h-4 w-4 shrink-0" />
            <span className="flex-1">
              {meta?.label}
              {decision === 'rejected' && interview?.reject_reason && (
                <span className="font-normal ml-1">· {REJECT_REASONS.find((r) => r.value === interview.reject_reason)?.label}</span>
              )}
            </span>
            {decision === 'hold' && (
              <Button
                size="sm"
                variant="ghost"
                className="h-6 text-[10px] px-2 opacity-70 hover:opacity-100"
                onClick={handleResetDecision}
                disabled={submitting}
              >
                {submitting ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Undo'}
              </Button>
            )}
          </div>
        );
      })()}

      {/* scorecard not submitted warning */}
      {!isSubmitted && !alreadyDecided && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg border border-amber-200 bg-amber-50 text-xs text-amber-700">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          No submitted scorecard yet — complete it from the Evaluate tab, or wait for the interviewer's pack link submission.
        </div>
      )}

      {/* scorecard summary — from either the direct Evaluate scorecard or a submitted pack outcome */}
      {(hasDirectScorecard || usingPackOutcome) ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Star className="h-4 w-4 text-primary" /> Scorecard Summary
              {isSubmitted
                ? <Badge variant="outline" className="ml-auto text-[9px] border-emerald-300 text-emerald-700 bg-emerald-50">
                    {usingPackOutcome ? 'Submitted via pack link' : 'Submitted'}
                  </Badge>
                : <Badge variant="outline" className="ml-auto text-[9px] border-amber-300 text-amber-700 bg-amber-50">Draft</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* total + bar + recommendation */}
            <div className="flex items-center gap-4 flex-wrap">
              <div className="text-center min-w-[72px]">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Weighted Total</p>
                <p className={`text-3xl font-bold font-mono ${wtColor}`}>
                  {weightedTotal !== null ? weightedTotal : '—'}
                  <span className="text-sm text-muted-foreground font-normal">/7</span>
                </p>
              </div>
              <div className="flex-1 min-w-[140px]">
                <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${wtBarColor}`}
                    style={{ width: `${weightedTotal !== null ? (weightedTotal / 7) * 100 : 0}%` }}
                  />
                </div>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  {reviewFlag && (
                    <Badge variant="outline" className="text-[9px] border-amber-300 text-amber-700 bg-amber-50">⚠ Review flag</Badge>
                  )}
                  {recommendation && (
                    <Badge variant="outline" className={`text-[9px] ${RECOMMENDATION_COLOR[recommendation] || 'border-border text-muted-foreground'}`}>
                      {RECOMMENDATION_LABEL[recommendation] || recommendation}
                    </Badge>
                  )}
                  {packRecommendation && (
                    <Badge variant="outline" className={`text-[9px] ${PACK_RECOMMENDATION_COLOR[packRecommendation] || 'border-border text-muted-foreground'}`}>
                      Interviewer: {PACK_RECOMMENDATION_LABEL[packRecommendation] || packRecommendation}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* per-competency grid — HRD codes for direct scorecards */}
            {hasDirectScorecard && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5">
                {Object.entries(competencyScores).map(([code, score]) => (
                  <div key={code} className={`rounded-md border px-2.5 py-2 flex items-center justify-between gap-2 ${scoreBg(Number(score))}`}>
                    <div className="min-w-0">
                      <Badge variant="outline" className="text-[9px] border-blue-200 text-blue-700 font-mono">{code}</Badge>
                      <p className="text-[10px] truncate mt-0.5">{COMPETENCY_NAMES[code] || code}</p>
                    </div>
                    <span className={`text-sm font-bold font-mono shrink-0 ${scoreColor(Number(score))}`}>{score}</span>
                  </div>
                ))}
              </div>
            )}

            {/* per-criterion grid — free-text rubric labels for pack outcomes */}
            {usingPackOutcome && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5">
                {Object.entries(packScores).map(([label, score]) => (
                  <div key={label} className={`rounded-md border px-2.5 py-2 flex items-center justify-between gap-2 ${scoreBg(Number(score))}`}>
                    <p className="text-[10px] truncate mt-0.5 min-w-0">{label}</p>
                    <span className={`text-sm font-bold font-mono shrink-0 ${scoreColor(Number(score))}`}>{score}</span>
                  </div>
                ))}
              </div>
            )}

            {/* strengths & concerns */}
            {(strengthsText || concernsText) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t">
                {strengthsText && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">Strengths</p>
                    <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-2.5 py-2">
                      {strengthsText}
                    </p>
                  </div>
                )}
                {concernsText && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">Concerns</p>
                    <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-md px-2.5 py-2">
                      {concernsText}
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12 text-center space-y-2">
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center mx-auto">
              <Star className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-semibold">No scorecard yet</p>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto">
              Complete the Evaluate tab, or wait for the interviewer's pack link submission.
            </p>
          </CardContent>
        </Card>
      )}

      {/* verdict selector — hidden once advance/rejected is final */}
      {isSubmitted && (!alreadyDecided || decision === 'hold') && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Make Decision</p>
            <p className="text-xs text-muted-foreground">Select Verdict</p>
            <div className="space-y-2">
              {VERDICT_OPTIONS.map((opt) => {
                const Icon     = opt.icon;
                const isActive = selectedVerdict === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setSelectedVerdict(isActive ? null : opt.value)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border text-left transition-all ${
                      isActive ? opt.activeColor : `${opt.color} hover:brightness-95`
                    }`}
                  >
                    <Icon className={`h-4 w-4 shrink-0 ${isActive ? opt.iconColor : opt.iconColor}`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold">{opt.label}</p>
                      <p className="text-[10px] opacity-80">{opt.description}</p>
                    </div>
                    {isActive && <Check className="h-3.5 w-3.5 shrink-0 opacity-70" />}
                  </button>
                );
              })}
            </div>
            <div className="pt-1 border-t flex justify-end">
              <Button
                size="sm"
                className="text-xs"
                disabled={!selectedVerdict}
                onClick={handleSubmitVerdict}
              >
                <Check className="h-3.5 w-3.5 mr-1.5" /> Submit Decision
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Advance confirmation modal ── */}
      <Dialog open={showAdvanceModal} onOpenChange={setShowAdvanceModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Check className="h-5 w-5 text-emerald-600" /> Advance Candidate
            </DialogTitle>
            <DialogDescription>
              You're advancing <span className="font-semibold">{interview?.candidate_name}</span> to the next stage. This action will be logged.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-lg border bg-muted/30 px-4 py-3 space-y-2 text-xs">
            <div className="flex justify-between gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Candidate</span>
              <span className="font-medium">{interview?.candidate_name}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Weighted Total</span>
              <span className={`font-bold font-mono ${wtColor}`}>{weightedTotal !== null ? weightedTotal : '—'}/7</span>
            </div>
            {recommendation && (
              <div className="flex justify-between gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Recommendation</span>
                <Badge variant="outline" className={`text-[9px] ${RECOMMENDATION_COLOR[recommendation]}`}>
                  {RECOMMENDATION_LABEL[recommendation]}
                </Badge>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowAdvanceModal(false)} disabled={submitting}>Cancel</Button>
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={handleAdvance} disabled={submitting}>
              {submitting
                ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Advancing…</>
                : <><Check className="h-3.5 w-3.5 mr-1.5" /> Confirm Advance</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Interview Again confirmation modal ── */}
      <Dialog open={showReinterviewModal} onOpenChange={setShowReinterviewModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-violet-600" /> Interview Again
            </DialogTitle>
            <DialogDescription>
              Starts Round {latestRoundNumber + 1} for <span className="font-semibold">{interview?.candidate_name}</span> — Round {latestRoundNumber}'s schedule and scorecard stay saved and viewable from the round dropdown.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowReinterviewModal(false)} disabled={reInterviewing}>Cancel</Button>
            <Button size="sm" className="bg-violet-600 hover:bg-violet-700" onClick={handleConfirmReInterview} disabled={reInterviewing}>
              {reInterviewing
                ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Starting…</>
                : <><RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Start New Round</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Reject modal step 1: reason ── */}
      <Dialog open={rejectStep === 'reason'} onOpenChange={(open) => { if (!open) closeRejectModal(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Badge variant="outline" className="text-[9px] border-rose-300 text-rose-600">REJECT</Badge>
              INTERVIEW + RECOVERY
            </div>
            <DialogTitle>What's next for this requisition?</DialogTitle>
            <DialogDescription>
              Rejecting <span className="font-semibold">{interview?.candidate_name}</span>. The requisition stays open — rejection keeps the pipeline moving instead of dead-ending.
            </DialogDescription>
          </DialogHeader>

          {/* step indicator */}
          <div className="flex items-center gap-1.5 text-[10px] font-semibold">
            <span className="h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[9px]">1</span>
            <span className="text-primary">Reject reason</span>
            <ChevronRight className="h-3 w-3 text-muted-foreground" />
            <span className="h-5 w-5 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-[9px]">2</span>
            <span className="text-muted-foreground">Confirmation</span>
          </div>

          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Pick the primary reason — required for the audit log and talent-pool segmentation.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {REJECT_REASONS.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRejectReason(r.value)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-xs text-left transition-colors ${
                    rejectReason === r.value
                      ? 'border-primary bg-primary/5 text-primary font-semibold'
                      : 'border-border hover:bg-muted/40 text-foreground'
                  }`}
                >
                  <div className={`h-3.5 w-3.5 rounded-full border-2 shrink-0 flex items-center justify-center ${rejectReason === r.value ? 'border-primary' : 'border-muted-foreground'}`}>
                    {rejectReason === r.value && <div className="h-1.5 w-1.5 rounded-full bg-primary" />}
                  </div>
                  {r.label}
                </button>
              ))}
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-muted-foreground">Optional context for the audit log (visible to recruiters only)…</label>
              <Textarea
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                placeholder="Optional context…"
                rows={2}
                className="text-xs"
              />
            </div>

            <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2.5 space-y-1">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-700">What happens to the candidate</p>
              <p className="text-[10px] text-blue-700">
                A rejection notice is queued for the recruiter to send offline. The candidate is marked as rejected in the system.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={closeRejectModal}>Cancel</Button>
            <Button size="sm" disabled={!rejectReason} onClick={() => setRejectStep('confirm')}>
              Continue <ChevronRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Reject modal step 2: confirmation ── */}
      <Dialog open={rejectStep === 'confirm'} onOpenChange={(open) => { if (!open) closeRejectModal(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Badge variant="outline" className="text-[9px] border-rose-300 text-rose-600">REJECT</Badge>
              INTERVIEW + RECOVERY
            </div>
            <DialogTitle>What's next for this requisition?</DialogTitle>
          </DialogHeader>

          {/* step indicator */}
          <div className="flex items-center gap-1.5 text-[10px] font-semibold">
            <span className="h-5 w-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px]">
              <Check className="h-2.5 w-2.5" />
            </span>
            <span className="text-muted-foreground">Reject reason</span>
            <ChevronRight className="h-3 w-3 text-muted-foreground" />
            <span className="h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[9px]">2</span>
            <span className="text-primary">Confirmation</span>
          </div>

          <p className="text-xs text-muted-foreground">
            Review — confirming commits the audit entry and notifies the recruiter.
          </p>

          <div className="rounded-lg border divide-y text-xs">
            <div className="flex items-center justify-between px-3 py-2.5 gap-3">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Candidate</span>
              <span className="font-medium">{interview?.candidate_name}</span>
            </div>
            <div className="flex items-center justify-between px-3 py-2.5 gap-3">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Reject Reason</span>
              <span className="font-medium">{REJECT_REASONS.find((r) => r.value === rejectReason)?.label}</span>
            </div>
            {rejectNote && (
              <div className="flex items-start justify-between px-3 py-2.5 gap-3">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground shrink-0">Note</span>
                <span className="text-right text-muted-foreground italic">{rejectNote}</span>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Audit log entry</p>
            <div className="rounded-md bg-muted/40 border px-3 py-2 font-mono text-[10px] text-muted-foreground break-all">
              {buildRejectAuditString()}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setRejectStep('reason')} disabled={submitting}>← Back</Button>
            <Button size="sm" variant="destructive" onClick={handleReject} disabled={submitting}>
              {submitting
                ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Committing…</>
                : <><Check className="h-3.5 w-3.5 mr-1.5" /> Commit & notify</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CandidateCard({ last_position, address, education_text }) {
  return (
    <Card>
      <CardContent className="p-3 space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Candidate</p>
        {last_position  && <div className="flex items-start gap-1.5 text-xs"><Briefcase className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" /><span>{last_position}</span></div>}
        {address        && <div className="flex items-start gap-1.5 text-xs"><MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" /><span>{address}</span></div>}
        {education_text && <div className="flex items-start gap-1.5 text-xs"><ClipboardList className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" /><span>{education_text}</span></div>}
        {!last_position && !address && !education_text && <p className="text-[10px] text-muted-foreground italic">No profile data.</p>}
      </CardContent>
    </Card>
  );
}

function StepsNav({ activeSection, onStep, status, interview }) {
  const isScheduled  = ['scheduled', 'ongoing', 'result', 'done'].includes(status);
  const hasConducted = ['result', 'done'].includes(status);
  const hasDecided   = interview?.decision && interview.decision !== 'pending';
  // Same round-history carve-out as the top nav — Round 1's Result/Decide
  // stay reachable after "Interview Again" resets the current round.
  const hasRoundHistory = (interview?.round || 1) > 1;

  const stepState = (key) => {
    if (key === 'schedule') return hasConducted ? 'done'  : isScheduled   ? 'active' : 'active';
    if (key === 'result')   return hasDecided   ? 'done'  : (hasConducted || hasRoundHistory) ? 'active' : isScheduled ? 'active' : 'pending';
    if (key === 'decide')   return hasDecided   ? 'done'  : (hasConducted || hasRoundHistory) ? 'active' : 'pending';
    return 'soon';
  };

  return (
    <Card>
      <CardContent className="p-3 space-y-1">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">Steps</p>
        {SECTIONS.map((s) => {
          const Icon   = s.icon;
          const state  = stepState(s.key);
          const active = s.key === activeSection;
          const soon   = state === 'soon';
          const pending = state === 'pending';
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => (state === 'active' || state === 'done') && onStep(s.key)}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left transition-colors ${
                active   ? 'bg-primary/10 text-primary'
                : (soon || pending) ? 'opacity-40 cursor-default'
                                    : 'hover:bg-muted/50 text-foreground'
              }`}
            >
              <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-semibold shrink-0 ${
                state === 'done' ? 'bg-emerald-500 text-white'
                : active        ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-muted-foreground'
              }`}>
                {state === 'done' ? <Check className="h-3 w-3" /> : <Icon className="h-3 w-3" />}
              </span>
              <span className="flex-1 min-w-0">
                <span className={`block text-xs truncate ${active ? 'font-semibold' : 'font-medium'}`}>{s.label}</span>
                {soon    && <span className="block text-[9px] text-muted-foreground">complete previous step</span>}
                {pending && !soon && <span className="block text-[9px] text-muted-foreground">complete previous step</span>}
                {state === 'done' && s.key === 'decide' && (
                  <span className={`block text-[9px] font-semibold ${
                    interview?.decision === 'advanced' ? 'text-emerald-600'
                    : interview?.decision === 'hold' ? 'text-amber-600'
                    : 'text-rose-600'
                  }`}>
                    {interview?.decision === 'advanced' ? 'Advanced'
                      : interview?.decision === 'hold' ? 'On Hold'
                      : 'Rejected'}
                  </span>
                )}
              </span>
              {!soon && !active && <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />}
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
}

// ── Result Section ────────────────────────────────────────────────────────────

function ResultSection({ interview, prep, interviewId }) {
  const [rounds, setRounds]                 = useState([]); // [{ round_number, round_status, outcome }]
  const [selectedRound, setSelectedRound]   = useState(null);
  const [loading, setLoading]               = useState(true);

  useEffect(() => {
    if (!interviewId) return;
    setLoading(true);
    getInterviewRounds(interviewId)
      .then((res) => {
        const list = res.data?.rounds || [];
        setRounds(list);
        // default to the latest round
        setSelectedRound(list.length > 0 ? list[list.length - 1].round_number : null);
      })
      .catch(() => setRounds([]))
      .finally(() => setLoading(false));
  }, [interviewId]);

  const current = rounds.find((r) => r.round_number === selectedRound);
  const outcome = current?.outcome || null;

  const rubricItems = prep?.rubric_items || [];
  const scores      = outcome?.scores || {};
  const rec         = outcome?.recommendation;
  const recLabel    = PACK_RECOMMENDATION_LABEL[rec];
  const recColor    = PACK_RECOMMENDATION_COLOR[rec];

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const roundPicker = rounds.length > 0 && (
    <Select value={String(selectedRound)} onValueChange={(v) => setSelectedRound(Number(v))}>
      <SelectTrigger className="h-8 text-xs w-36">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {rounds.map((r) => (
          <SelectItem key={r.round_number} value={String(r.round_number)} className="text-xs">
            Round {r.round_number}{r.round_number === rounds[rounds.length - 1].round_number ? ' (current)' : ''}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  // No outcome yet for the selected round — show state based on interview status
  if (!outcome) {
    const status = interview?.status;
    const isInPack = ['scheduled', 'ongoing'].includes(status);
    const isPastRound = selectedRound !== rounds[rounds.length - 1]?.round_number;
    return (
      <div className="space-y-3">
        {roundPicker && <div className="flex justify-end">{roundPicker}</div>}
        <Card>
          <CardContent className="py-14 text-center space-y-2">
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center mx-auto">
              <Clock className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-semibold">
              {isPastRound ? 'No scores were recorded for this round' : isInPack ? 'Waiting for interviewer' : 'No scores yet'}
            </p>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto">
              {isPastRound
                ? 'This round moved on without a pack link submission.'
                : isInPack
                  ? 'The interviewer has been sent a pack link. Scores will appear here once they submit.'
                  : 'Create an interview pack link from the position setup → Interview Link tab and send it to the interviewer.'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {roundPicker && <div className="flex justify-end">{roundPicker}</div>}
      {/* Submitted by banner */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-emerald-200 bg-emerald-50 text-sm text-emerald-700">
        <CheckCircle2 className="h-4 w-4 shrink-0" />
        <div>
          <span className="font-semibold">Scores submitted</span>
          {outcome.interviewer_name && <span> by {outcome.interviewer_name}</span>}
          {outcome.submitted_at && (
            <span className="text-[11px] text-emerald-600 ml-1">
              · {new Date(outcome.submitted_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          )}
          {outcome.pack_title && (
            <span className="text-[11px] text-emerald-600 ml-1">· {outcome.pack_title}</span>
          )}
        </div>
      </div>

      {/* Weighted total */}
      {outcome.weighted_total != null && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg border bg-muted/30">
          <Star className="h-4 w-4 text-primary shrink-0" />
          <span className="text-sm font-semibold">
            Weighted Score: <span className="text-primary">{Number(outcome.weighted_total).toFixed(2)}</span>
            <span className="text-xs font-normal text-muted-foreground"> / 7.00</span>
          </span>
        </div>
      )}

      {/* Competency scores — read-only */}
      {rubricItems.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Competency Scores</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {rubricItems.map((item) => {
              const code    = item.competency_code || item.name || item.label;
              const label   = item.competency_name || item.label || code;
              const score   = scores[code];
              return (
                <div key={code}>
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-xs font-medium">{label}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground">weight {item.weight ?? 1}×</span>
                      {score != null
                        ? <span className="text-xs font-bold text-primary">{score} / 7</span>
                        : <span className="text-[10px] text-muted-foreground italic">not scored</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5, 6, 7].map((v) => (
                      <div
                        key={v}
                        className={`h-7 w-7 rounded-full flex items-center justify-center text-[11px] font-bold border shrink-0 ${
                          score === v
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-muted/40 text-muted-foreground border-border'
                        }`}
                      >
                        {v}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Recommendation */}
      {rec && recLabel && (
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Interviewer Recommendation</CardTitle></CardHeader>
          <CardContent>
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-semibold ${recColor || 'border-border text-muted-foreground'}`}>
              {recLabel}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Strengths & Concerns */}
      {(outcome.strengths || outcome.concerns) && (
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Interviewer Notes</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {outcome.strengths && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">Strengths</p>
                <p className="text-xs leading-relaxed">{outcome.strengths}</p>
              </div>
            )}
            {outcome.concerns && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">Concerns</p>
                <p className="text-xs leading-relaxed">{outcome.concerns}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}