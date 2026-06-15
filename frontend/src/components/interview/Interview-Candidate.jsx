import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Loader2, AlertTriangle, Check, ChevronRight,
  Plus, X, Pencil, Briefcase, MapPin, Lock, CalendarCheck,
  ClipboardList, Clock, Users, Trash2, Calendar as CalendarIcon,
  MessageSquare, CheckCircle2, XCircle, RefreshCw,
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
  getInterview,
  getPrep,
  updateQuestions,
  getSchedules,
  createSchedule,
  updateSchedule,
  confirmSchedule,
  unconfirmSchedule,
  deleteSchedule,
  recordOutcome,
  clearOutcome,
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
  ongoing:     { label: 'Ongoing',     color: 'bg-blue-100 text-blue-700'       },
  scheduled:   { label: 'Scheduled',   color: 'bg-violet-100 text-violet-700'   },
  interviewed: { label: 'Interviewed', color: 'bg-emerald-100 text-emerald-700' },
  no_show:     { label: 'No Show',     color: 'bg-rose-100 text-rose-700'       },
  reschedule:  { label: 'Reschedule',  color: 'bg-amber-100 text-amber-700'     },
  cancelled:   { label: 'Cancelled',   color: 'bg-gray-100 text-gray-600'       },
  done:        { label: 'Done',        color: 'bg-emerald-100 text-emerald-700' },
};

const OUTCOME_OPTIONS = [
  { value: 'interviewed', label: 'Interviewed', icon: CheckCircle2, color: 'text-emerald-600' },
  { value: 'no_show',     label: 'No Show',     icon: XCircle,      color: 'text-rose-600'    },
  { value: 'reschedule',  label: 'Reschedule',  icon: RefreshCw,    color: 'text-amber-600'   },
];

const SECTIONS = [
  { key: 'prep',     label: 'Prep',     icon: ClipboardList },
  { key: 'schedule', label: 'Schedule', icon: CalendarCheck },
  { key: 'conduct',  label: 'Conduct',  icon: Users         },
  { key: 'evaluate', label: 'Evaluate', icon: Clock         },
  { key: 'decide',   label: 'Decide',   icon: Check         },
];

const MAX_SESSIONS = 3;

function fmt(d) {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
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

export default function InterviewCandidatePage() {
  const navigate                 = useNavigate();
  const { interviewId: idParam } = useParams();
  const interviewId              = idParam ? Number(idParam) : null;

  const [interview, setInterview] = useState(null);
  const [prep, setPrep]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [banner, setBanner]       = useState(null);

  const [activeSection, setActiveSection] = useState('prep');

  const load = useCallback(async () => {
    if (!interviewId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getInterview(interviewId);
      const row = res.data?.interview;
      setInterview(row);
      if (row?.job_id) {
        const prepRes = await getPrep(row.job_id);
        setPrep(prepRes.data?.prep || null);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load interview');
    } finally {
      setLoading(false);
    }
  }, [interviewId]);

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
    status, scheduled_at,
    last_position, address, education_text,
  } = interview;

  const statusMeta = STATUS_META[status] || { label: status, color: 'bg-muted text-muted-foreground' };
  const initials   = (candidate_name || '?').split(/\s+/).map((s) => s[0]).join('').slice(0, 2).toUpperCase();

  return (
    <>
      {/* sticky header */}
      <div className="sticky top-[52px] z-10 bg-background/95 backdrop-blur-sm -mt-5 -mx-5 px-5 pt-5 pb-4 border-b border-border/60">
        <div className="space-y-3">
          <Button
            variant="ghost" size="sm" className="text-xs -ml-2 w-fit"
            onClick={() => navigate(`/selection/interview/job/${job_id}`)}
          >
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
                <span className="inline-flex items-center gap-1">
                  <Briefcase className="h-3 w-3" /> {job_title || `Job #${job_id}`}
                </span>
                {job_location && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {job_location}
                  </span>
                )}
                {work_type       && <span>· {work_type}</span>}
                {seniority_level && <span>· {seniority_level}</span>}
                {scheduled_at    && <span>· next session {fmt(scheduled_at)}</span>}
              </div>
            </div>
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
            banner.ok
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-amber-200 bg-amber-50 text-amber-700'
          }`}>
            <Check className="h-4 w-4 shrink-0" /> {banner.text}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_240px] gap-6">

          {/* main column */}
          <div className="space-y-4 min-w-0">

            {/* section tabs */}
            <div className="flex gap-1 border-b border-border/60 overflow-x-auto">
              {SECTIONS.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveSection(key)}
                  className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
                    activeSection === key
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" /> {label}
                </button>
              ))}
            </div>

            {activeSection === 'prep' && (
              <PrepSection
                jobId={job_id}
                prep={prep}
                setPrep={setPrep}
                setBanner={setBanner}
                setError={setError}
                navigate={navigate}
              />
            )}

            {activeSection === 'schedule' && (
              <ScheduleSection
                interviewId={interviewId}
                interview={interview}
                setInterview={setInterview}
                setBanner={setBanner}
                setError={setError}
              />
            )}

            {activeSection === 'conduct' && (
              <ConductSection
                interviewId={interviewId}
                interview={interview}
                setInterview={setInterview}
                setBanner={setBanner}
                setError={setError}
              />
            )}

            {(activeSection === 'evaluate' || activeSection === 'decide') && (
              <ComingSoonSection label={SECTIONS.find((s) => s.key === activeSection)?.label} />
            )}
          </div>

          {/* sidebar */}
          <aside>
            <div className="sticky top-[184px] space-y-3">
              <CandidateCard
                last_position={last_position}
                address={address}
                education_text={education_text}
              />
              <StepsNav
                activeSection={activeSection}
                onStep={setActiveSection}
                status={status}
              />
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}

function PrepSection({ jobId, prep, setPrep, setBanner, setError, navigate }) {
  const [questions, setQuestions]     = useState([]);
  const [saving, setSaving]           = useState(false);
  const [editingIdx, setEditingIdx]   = useState(null);
  const [noPrepWarning, setNoPrepWarning] = useState(false);

  const isLocked = !!prep?.rubric_locked;

  useEffect(() => {
    setQuestions(Array.isArray(prep?.questions) ? prep.questions : []);
    // reset warning when prep loads
    if (prep) setNoPrepWarning(false);
  }, [prep]);

  const addCustom = () => {
    // block if no prep exists — questions must be generated from position page first
    if (!prep) {
      setNoPrepWarning(true);
      return;
    }
    setNoPrepWarning(false);
    const next = [
      ...questions,
      { id: null, competency: null, source: 'open', text: '', follow_up: null, custom_candidate: true },
    ];
    setQuestions(next);
    setEditingIdx(next.length - 1);
  };

  const removeQuestion = (idx) => {
    if (!questions[idx]?.custom_candidate) return;
    setQuestions((qs) => qs.filter((_, i) => i !== idx));
    setEditingIdx(null);
  };

  const setField = (idx, field, val) =>
    setQuestions((qs) => qs.map((q, i) => (i === idx ? { ...q, [field]: val } : q)));

  const handleSave = async () => {
    if (saving || questions.length === 0) return;
    setSaving(true);
    setError(null);
    setBanner(null);
    try {
      await updateQuestions(jobId, questions);
      setBanner({ ok: true, text: 'Questions saved for this candidate.' });
      setEditingIdx(null);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const positionCount = questions.filter((q) => !q.custom_candidate).length;
  const customCount   = questions.filter((q) => q.custom_candidate).length;

  return (
    <div className="space-y-4">

      {/* rubric overview */}
      {prep?.rubric_items?.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-primary" /> Scoring Rubric
              {isLocked
                ? <Badge variant="outline" className="ml-auto text-[9px] border-amber-300 text-amber-700 bg-amber-50"><Lock className="h-3 w-3 mr-1" />Locked</Badge>
                : <Badge variant="outline" className="ml-auto text-[9px] border-slate-300 text-slate-600">Unlocked</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5">
              {prep.rubric_items.map((item) => (
                <div key={item.competency_code} className="rounded-md border bg-muted/20 px-2.5 py-2">
                  <div className="flex items-center justify-between gap-1">
                    <Badge variant="outline" className="text-[9px] border-blue-200 text-blue-700 font-mono">
                      {item.competency_code}
                    </Badge>
                    <span className="text-[9px] font-mono text-muted-foreground">×{item.weight}</span>
                  </div>
                  <p className="text-[10px] font-medium mt-0.5 truncate">{item.competency_name}</p>
                  {item.anchor_1 && (
                    <p className="text-[9px] text-muted-foreground mt-0.5 truncate">1: {item.anchor_1}</p>
                  )}
                </div>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">
              Edit weights and anchors from the position page → Rubric tab.
            </p>
          </CardContent>
        </Card>
      )}

      {/* no-prep warning — shown when recruiter tries to add custom without generating first */}
      {noPrepWarning && (
        <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg border border-amber-200 bg-amber-50 text-xs text-amber-700">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">No questions generated yet</p>
            <p className="text-[10px] mt-0.5">
              Generate position questions first from the{' '}
              <button
                type="button"
                onClick={() => navigate(`/selection/interview/job/${jobId}`)}
                className="underline font-semibold hover:text-amber-900"
              >
                position page → Questions tab
              </button>
              , then come back to add custom questions for this candidate.
            </p>
          </div>
          <button type="button" onClick={() => setNoPrepWarning(false)} className="shrink-0">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* questions card */}
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
              <Button size="sm" variant="outline" className="text-xs" onClick={addCustom}>
                <Plus className="h-3 w-3 mr-1" /> Add custom
              </Button>
              {/* disabled when no questions to save */}
              <Button
                size="sm" className="text-xs"
                onClick={handleSave}
                disabled={saving || questions.length === 0}
              >
                {saving ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Check className="h-3.5 w-3.5 mr-1.5" />}
                Save
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {questions.length === 0 && (
            <div className="py-10 text-center space-y-2">
              <p className="text-xs text-muted-foreground italic">
                No questions yet.
              </p>
              <button
                type="button"
                onClick={() => navigate(`/selection/interview/job/${jobId}`)}
                className="text-xs text-primary underline hover:opacity-80"
              >
                Go to position page → Questions tab to generate
              </button>
            </div>
          )}

          {/* position questions — read only */}
          {questions.filter((q) => !q.custom_candidate).length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground px-1">
                Position questions
              </p>
              {questions.map((q, i) => q.custom_candidate ? null : (
                <div key={i} className="rounded-lg border bg-muted/10 p-3">
                  <div className="flex items-start gap-2">
                    <span className="text-[10px] font-mono text-muted-foreground mt-0.5 shrink-0">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                        {q.competency && (
                          <Badge variant="outline" className="text-[9px] border-blue-200 text-blue-700 bg-blue-50">
                            {q.competency} · {COMPETENCY_NAMES[q.competency]}
                          </Badge>
                        )}
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

          {/* custom questions — editable */}
          {questions.filter((q) => q.custom_candidate).length > 0 && (
            <div className="space-y-1.5 mt-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground px-1">
                Custom for this candidate
              </p>
              {questions.map((q, i) => !q.custom_candidate ? null : (
                <div key={i} className="rounded-lg border border-violet-200 bg-violet-50/30 p-3">
                  {editingIdx === i ? (
                    <div className="space-y-2">
                      <Select
                        value={q.competency || 'none'}
                        onValueChange={(v) => setField(i, 'competency', v === 'none' ? null : v)}
                      >
                        <SelectTrigger className="h-8 text-xs w-48">
                          <SelectValue placeholder="Competency (optional)" />
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
                      <Textarea
                        value={q.text}
                        onChange={(e) => setField(i, 'text', e.target.value)}
                        placeholder="Custom question for this candidate…"
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
                      onClick={() => setEditingIdx(i)}
                      className="w-full text-left group cursor-pointer"
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-[10px] font-mono text-muted-foreground mt-0.5 shrink-0">{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                            {q.competency && (
                              <Badge variant="outline" className="text-[9px] border-violet-300 text-violet-700 bg-violet-50">
                                {q.competency} · {COMPETENCY_NAMES[q.competency]}
                              </Badge>
                            )}
                            <Badge variant="outline" className="text-[9px] border-violet-300 text-violet-700">Custom</Badge>
                          </div>
                          <p className="text-xs leading-relaxed">
                            {q.text || <em className="text-muted-foreground">Click to add question text</em>}
                          </p>
                          {q.follow_up && (
                            <p className="text-[10px] text-muted-foreground mt-0.5 italic">↳ {q.follow_up}</p>
                          )}
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

  const [title, setTitle]             = useState('');
  const [description, setDescription] = useState('');
  const [selectedDate, setSelectedDate] = useState(undefined);
  const [timeValue, setTimeValue]     = useState('09:00');
  const [saving, setSaving]           = useState(false);
  const [confirmNote, setConfirmNote] = useState('');
  const [confirmingId, setConfirmingId] = useState(null);
  const [deletingId, setDeletingId]   = useState(null);

  const loadSessions = useCallback(async () => {
    setLoadingSessions(true);
    try {
      const res = await getSchedules(interviewId);
      setSessions(res.data?.schedules || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load sessions');
    } finally {
      setLoadingSessions(false);
    }
  }, [interviewId]);

  useEffect(() => { loadSessions(); }, [loadSessions]);

  const openNewForm = () => {
    setEditingSession(null);
    setTitle('');
    setDescription('');
    setSelectedDate(undefined);
    setTimeValue('09:00');
    setShowForm(true);
  };

  const openEditForm = (session) => {
    setEditingSession(session);
    setTitle(session.title || '');
    setDescription(session.description || '');
    setSelectedDate(session.scheduled_at ? new Date(session.scheduled_at) : undefined);
    setTimeValue(session.scheduled_at
      ? new Date(session.scheduled_at).toTimeString().slice(0, 5)
      : '09:00');
    setShowForm(true);
  };

  const buildScheduledAt = () => {
    if (!selectedDate) return null;
    return new Date(`${formatLocalDate(selectedDate)}T${timeValue}:00`).toISOString();
  };

  const handleSave = async () => {
    if (!title.trim() || !selectedDate || saving) return;
    setSaving(true);
    setError(null);
    setBanner(null);
    try {
      const scheduled_at = buildScheduledAt();
      if (editingSession) {
        const res = await updateSchedule(editingSession.id, { title, description, scheduled_at });
        setSessions((prev) => prev.map((s) => s.id === editingSession.id ? res.data.schedule : s));
        setBanner({ ok: true, text: 'Session updated.' });
      } else {
        const res = await createSchedule(interviewId, { title, description, scheduled_at });
        setSessions((prev) => [...prev, res.data.schedule]);
        setInterview((prev) => ({ ...prev, scheduled_at: res.data.schedule.scheduled_at }));
        setBanner({ ok: true, text: 'Session created.' });
      }
      setShowForm(false);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirm = async (session) => {
    setConfirmingId(session.id);
    setError(null);
    try {
      const res = await confirmSchedule(session.id, { confirmation_note: confirmNote || undefined });
      setSessions((prev) => prev.map((s) => s.id === session.id ? res.data.schedule : s));
      setBanner({ ok: true, text: 'Session confirmed.' });
      setConfirmNote('');
      setConfirmingId(null);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Confirm failed');
      setConfirmingId(null);
    }
  };

  const handleUnconfirm = async (sessionId) => {
    setError(null);
    try {
      const res = await unconfirmSchedule(sessionId);
      setSessions((prev) => prev.map((s) => s.id === sessionId ? res.data.schedule : s));
      setBanner({ ok: true, text: 'Session unconfirmed.' });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Unconfirm failed');
    }
  };

  const handleDelete = async (sessionId) => {
    setDeletingId(sessionId);
    setError(null);
    try {
      await deleteSchedule(sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      setBanner({ ok: true, text: 'Session removed.' });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Delete failed');
    } finally {
      setDeletingId(null);
    }
  };

  const canAdd = sessions.length < MAX_SESSIONS;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">Interview Sessions</h2>
          <p className="text-[11px] text-muted-foreground">
            {sessions.length} of {MAX_SESSIONS} sessions · invitations are sent outside this system
          </p>
        </div>
        {canAdd && !showForm && (
          <Button size="sm" className="text-xs" onClick={openNewForm}>
            <Plus className="h-3.5 w-3.5 mr-1.5" /> Add session
          </Button>
        )}
      </div>

      {showForm && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">
              {editingSession ? 'Edit Session' : `Session ${sessions.length + 1} of ${MAX_SESSIONS}`}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Title <span className="text-rose-500">*</span>
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. HR Interview, Technical Interview, Final Interview…"
                className="text-xs h-9"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Description</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional notes about this session…"
                rows={2}
                className="text-xs"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Date <span className="text-rose-500">*</span>
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <div
                      role="button" tabIndex={0}
                      className="flex items-center gap-2 h-9 px-3 rounded-md border border-input bg-background text-xs cursor-pointer hover:bg-muted/30 transition-colors"
                    >
                      <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className={selectedDate ? 'font-medium' : 'text-muted-foreground'}>
                        {selectedDate ? formatLocalDate(selectedDate) : 'Pick date'}
                      </span>
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Time <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="time"
                  value={timeValue}
                  onChange={(e) => setTimeValue(e.target.value)}
                  className="text-xs h-9"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-1 border-t">
              <Button size="sm" variant="ghost" className="text-xs" onClick={() => setShowForm(false)} disabled={saving}>
                Cancel
              </Button>
              <Button
                size="sm" className="text-xs"
                onClick={handleSave}
                disabled={!title.trim() || !selectedDate || saving}
              >
                {saving ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Check className="h-3.5 w-3.5 mr-1.5" />}
                {editingSession ? 'Update' : 'Create session'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loadingSessions ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : sessions.length === 0 && !showForm ? (
        <Card>
          <CardContent className="py-12 text-center text-xs text-muted-foreground italic">
            No sessions yet. Add up to {MAX_SESSIONS} interview sessions for this candidate.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sessions.map((session, idx) => (
            <SessionCard
              key={session.id}
              session={session}
              sessionNumber={idx + 1}
              confirmNote={confirmNote}
              setConfirmNote={setConfirmNote}
              confirmingId={confirmingId}
              deletingId={deletingId}
              onEdit={() => openEditForm(session)}
              onConfirm={() => handleConfirm(session)}
              onUnconfirm={() => handleUnconfirm(session.id)}
              onDelete={() => handleDelete(session.id)}
            />
          ))}
        </div>
      )}

      {sessions.length >= MAX_SESSIONS && !showForm && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-600">
          <MessageSquare className="h-3.5 w-3.5 shrink-0" />
          Maximum {MAX_SESSIONS} sessions reached for this candidate.
        </div>
      )}
    </div>
  );
}

function SessionCard({
  session, sessionNumber,
  confirmNote, setConfirmNote,
  confirmingId, deletingId,
  onEdit, onConfirm, onUnconfirm, onDelete,
}) {
  const [showConfirmInput, setShowConfirmInput] = useState(false);
  const isConfirmed  = session.confirmed;
  const isConfirming = confirmingId === session.id;
  const isDeleting   = deletingId === session.id;
  const hasOutcome   = !!session.status && session.status !== 'ongoing';
  const outcomeMeta  = hasOutcome ? OUTCOME_OPTIONS.find((o) => o.value === session.status) : null;

  return (
    <Card className={`transition-colors ${
      hasOutcome && session.status === 'interviewed' ? 'border-emerald-200 bg-emerald-50/20'
      : hasOutcome && session.status === 'no_show'   ? 'border-rose-200 bg-rose-50/20'
      : hasOutcome && session.status === 'reschedule'? 'border-amber-200 bg-amber-50/20'
      : isConfirmed ? 'border-emerald-200 bg-emerald-50/20'
      : ''
    }`}>
      <CardContent className="p-4 space-y-3">
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
                  <CalendarIcon className="h-3 w-3" />
                  {fmt(session.scheduled_at)} · {fmtTime(session.scheduled_at)}
                </span>
                {hasOutcome && outcomeMeta ? (
                  <Badge variant="outline" className={`text-[9px] ${
                    session.status === 'interviewed' ? 'border-emerald-300 text-emerald-700 bg-emerald-50'
                    : session.status === 'no_show'   ? 'border-rose-300 text-rose-700 bg-rose-50'
                    : 'border-amber-300 text-amber-700 bg-amber-50'
                  }`}>
                    {outcomeMeta.label}
                  </Badge>
                ) : isConfirmed ? (
                  <Badge variant="outline" className="text-[9px] border-emerald-300 text-emerald-700 bg-emerald-50">Confirmed</Badge>
                ) : (
                  <Badge variant="outline" className="text-[9px] border-amber-300 text-amber-700 bg-amber-50">Pending confirmation</Badge>
                )}
              </div>
              {session.description && (
                <p className="text-[10px] text-muted-foreground mt-1">{session.description}</p>
              )}
              {isConfirmed && session.confirmation_note && (
                <p className="text-[10px] text-emerald-700 mt-1 italic">"{session.confirmation_note}"</p>
              )}
              {hasOutcome && session.outcome_note && (
                <p className="text-[10px] text-muted-foreground mt-1 italic">Note: {session.outcome_note}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {!isConfirmed && !hasOutcome && (
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onEdit} title="Edit">
                <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            )}
            {isConfirmed ? (
              !hasOutcome && (
                <Button
                  size="sm" variant="outline"
                  className="h-7 text-xs text-amber-700 border-amber-300 hover:bg-amber-50"
                  onClick={onUnconfirm}
                >
                  Unconfirm
                </Button>
              )
            ) : (
              <Button
                size="sm" className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700"
                onClick={() => setShowConfirmInput(!showConfirmInput)}
              >
                Confirm
              </Button>
            )}
            {!isConfirmed && !hasOutcome && (
              <Button
                size="icon" variant="ghost"
                className="h-7 w-7 text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                onClick={onDelete}
                disabled={isDeleting}
                title="Delete"
              >
                {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
              </Button>
            )}
          </div>
        </div>

        {showConfirmInput && !isConfirmed && (
          <div className="flex items-center gap-2 pt-2 border-t">
            <Input
              value={confirmNote}
              onChange={(e) => setConfirmNote(e.target.value)}
              placeholder="How was it confirmed? (e.g. via WhatsApp)…"
              className="text-xs h-8 flex-1"
            />
            <Button
              size="sm" className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700"
              onClick={() => { onConfirm(); setShowConfirmInput(false); }}
              disabled={isConfirming}
            >
              {isConfirming ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5 mr-1" />}
              Done
            </Button>
            <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setShowConfirmInput(false)}>
              Cancel
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ConductSection({ interviewId, interview, setInterview, setBanner, setError }) {
  const [sessions, setSessions]               = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [recordingId, setRecordingId]         = useState(null);
  const [clearingId, setClearingId]           = useState(null);
  const [outcomeNote, setOutcomeNote]         = useState('');
  const [expandedId, setExpandedId]           = useState(null);

  const loadSessions = useCallback(async () => {
    setLoadingSessions(true);
    try {
      const res = await getSchedules(interviewId);
      const all = res.data?.schedules || [];
      setSessions(all.filter((s) => s.confirmed));
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load sessions');
    } finally {
      setLoadingSessions(false);
    }
  }, [interviewId]);

  useEffect(() => { loadSessions(); }, [loadSessions]);

  const handleRecord = async (sessionId, status) => {
    setRecordingId(sessionId);
    setError(null);
    setBanner(null);
    try {
      const res = await recordOutcome(sessionId, { status, outcome_note: outcomeNote || undefined });
      setSessions((prev) => prev.map((s) => s.id === sessionId ? res.data.schedule : s));
      setInterview((prev) => ({ ...prev, status }));
      setBanner({ ok: true, text: `Outcome recorded: ${status.replace('_', ' ')}.` });
      setOutcomeNote('');
      setExpandedId(null);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to record outcome');
    } finally {
      setRecordingId(null);
    }
  };

  const handleClear = async (sessionId) => {
    setClearingId(sessionId);
    setError(null);
    setBanner(null);
    try {
      const res = await clearOutcome(sessionId);
      setSessions((prev) => prev.map((s) => s.id === sessionId ? res.data.schedule : s));
      setInterview((prev) => ({ ...prev, status: 'scheduled' }));
      setBanner({ ok: true, text: 'Outcome cleared.' });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to clear outcome');
    } finally {
      setClearingId(null);
    }
  };

  if (loadingSessions) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <Card>
        <CardContent className="py-14 text-center space-y-2">
          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center mx-auto">
            <Users className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-semibold text-foreground">No confirmed sessions yet</p>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto">
            Confirm at least one session in the Schedule tab before recording a conduct outcome.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-sm font-semibold">Conduct</h2>
        <p className="text-[11px] text-muted-foreground">
          Record what happened at each confirmed session. Offline only — pack scoring is handled by the batch module.
        </p>
      </div>

      <div className="space-y-3">
        {sessions.map((session, idx) => {
          const hasOutcome  = !!session.status && session.status !== 'ongoing';
          const outcomeMeta = hasOutcome ? OUTCOME_OPTIONS.find((o) => o.value === session.status) : null;
          const isExpanded  = expandedId === session.id;
          const isRecording = recordingId === session.id;
          const isClearing  = clearingId === session.id;

          return (
            <Card key={session.id} className={`transition-colors ${
              session.status === 'interviewed' ? 'border-emerald-200 bg-emerald-50/20'
              : session.status === 'no_show'   ? 'border-rose-200 bg-rose-50/20'
              : session.status === 'reschedule'? 'border-amber-200 bg-amber-50/20'
              : ''
            }`}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className={`h-7 w-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${
                      session.status === 'interviewed' ? 'bg-emerald-500 text-white'
                      : session.status === 'no_show'   ? 'bg-rose-400 text-white'
                      : session.status === 'reschedule'? 'bg-amber-400 text-white'
                      : 'bg-muted text-muted-foreground'
                    }`}>
                      {hasOutcome ? <Check className="h-3.5 w-3.5" /> : idx + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate">{session.title}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-[10px] text-muted-foreground inline-flex items-center gap-1">
                          <CalendarIcon className="h-3 w-3" />
                          {fmt(session.scheduled_at)} · {fmtTime(session.scheduled_at)}
                        </span>
                        {hasOutcome && outcomeMeta ? (
                          <Badge variant="outline" className={`text-[9px] ${
                            session.status === 'interviewed' ? 'border-emerald-300 text-emerald-700 bg-emerald-50'
                            : session.status === 'no_show'   ? 'border-rose-300 text-rose-700 bg-rose-50'
                            : 'border-amber-300 text-amber-700 bg-amber-50'
                          }`}>
                            {outcomeMeta.label}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[9px] border-slate-300 text-slate-600">
                            Awaiting outcome
                          </Badge>
                        )}
                      </div>
                      {hasOutcome && session.outcome_note && (
                        <p className="text-[10px] text-muted-foreground mt-1 italic">"{session.outcome_note}"</p>
                      )}
                      {hasOutcome && session.outcome_at && (
                        <p className="text-[10px] text-muted-foreground mt-0.5">Recorded {fmt(session.outcome_at)}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {hasOutcome ? (
                      <Button
                        size="sm" variant="outline"
                        className="h-7 text-xs text-muted-foreground"
                        onClick={() => handleClear(session.id)}
                        disabled={isClearing}
                      >
                        {isClearing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Clear'}
                      </Button>
                    ) : (
                      <Button
                        size="sm" className="h-7 text-xs"
                        onClick={() => setExpandedId(isExpanded ? null : session.id)}
                      >
                        Record outcome
                      </Button>
                    )}
                  </div>
                </div>

                {isExpanded && !hasOutcome && (
                  <div className="pt-3 border-t space-y-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      What happened in this session?
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {OUTCOME_OPTIONS.map((opt) => {
                        const Icon = opt.icon;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => handleRecord(session.id, opt.value)}
                            disabled={isRecording}
                            className={`flex flex-col items-center gap-1.5 px-3 py-3 rounded-lg border text-xs font-semibold transition-colors hover:bg-muted/40 ${opt.color}`}
                          >
                            {isRecording
                              ? <Loader2 className="h-4 w-4 animate-spin" />
                              : <Icon className={`h-4 w-4 ${opt.color}`} />}
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-muted-foreground">Note (optional)</label>
                      <div className="flex gap-2">
                        <Input
                          value={outcomeNote}
                          onChange={(e) => setOutcomeNote(e.target.value)}
                          placeholder="e.g. Candidate arrived on time, ran 45 mins…"
                          className="text-xs h-8 flex-1"
                        />
                        <Button
                          size="sm" variant="ghost" className="h-8 text-xs"
                          onClick={() => { setExpandedId(null); setOutcomeNote(''); }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* pack status placeholder */}
      <Card className="border-dashed">
        <CardContent className="p-4 flex items-center gap-3">
          <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center shrink-0">
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground">Interview Pack</p>
            <p className="text-[10px] text-muted-foreground">
              Pack link status and scorecard returns will appear here once the batch module is live.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ComingSoonSection({ label }) {
  return (
    <Card>
      <CardContent className="py-16 text-center space-y-2">
        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center mx-auto">
          <Clock className="h-5 w-5 text-muted-foreground" />
        </div>
        <p className="text-sm font-semibold text-foreground">{label} — coming soon</p>
        <p className="text-xs text-muted-foreground max-w-xs mx-auto">
          {label === 'Evaluate' && 'Scorecard review and competency breakdown will appear here once the pack is returned.'}
          {label === 'Decide'   && 'Advance, hold, or reject this candidate after reviewing the scorecard.'}
        </p>
      </CardContent>
    </Card>
  );
}

function CandidateCard({ last_position, address, education_text }) {
  return (
    <Card>
      <CardContent className="p-3 space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Candidate</p>
        {last_position && (
          <div className="flex items-start gap-1.5 text-xs">
            <Briefcase className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
            <span>{last_position}</span>
          </div>
        )}
        {address && (
          <div className="flex items-start gap-1.5 text-xs">
            <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
            <span>{address}</span>
          </div>
        )}
        {education_text && (
          <div className="flex items-start gap-1.5 text-xs">
            <ClipboardList className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
            <span>{education_text}</span>
          </div>
        )}
        {!last_position && !address && !education_text && (
          <p className="text-[10px] text-muted-foreground italic">No profile data.</p>
        )}
      </CardContent>
    </Card>
  );
}

function StepsNav({ activeSection, onStep, status }) {
  const isScheduled  = ['scheduled', 'interviewed', 'no_show', 'reschedule', 'done'].includes(status);
  const hasConducted = ['interviewed', 'no_show', 'reschedule', 'done'].includes(status);
  const isDone       = status === 'done';

  const stepState = (key) => {
    if (key === 'prep')     return isScheduled ? 'done' : 'active';
    if (key === 'schedule') return hasConducted ? 'done' : isScheduled ? 'active' : 'pending';
    if (key === 'conduct')  return isDone ? 'done' : hasConducted ? 'active' : 'pending';
    return 'soon';
  };

  return (
    <Card>
      <CardContent className="p-3 space-y-1">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">Steps</p>
        {SECTIONS.map((s) => {
          const Icon    = s.icon;
          const state   = stepState(s.key);
          const active  = s.key === activeSection;
          const soon    = state === 'soon';
          const pending = state === 'pending';
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => !soon && onStep(s.key)}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left transition-colors ${
                active   ? 'bg-primary/10 text-primary'
                : soon   ? 'opacity-40 cursor-default'
                : pending? 'opacity-60 hover:bg-muted/50 text-muted-foreground'
                :          'hover:bg-muted/50 text-foreground'
              }`}
            >
              <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-semibold shrink-0 ${
                state === 'done'  ? 'bg-emerald-500 text-white'
                : active          ? 'bg-primary text-primary-foreground'
                : soon || pending ? 'bg-muted text-muted-foreground'
                :                   'border border-border text-muted-foreground'
              }`}>
                {state === 'done' ? <Check className="h-3 w-3" /> : <Icon className="h-3 w-3" />}
              </span>
              <span className="flex-1 min-w-0">
                <span className={`block text-xs truncate ${active ? 'font-semibold' : 'font-medium'}`}>{s.label}</span>
                {soon    && <span className="block text-[9px] text-muted-foreground">coming soon</span>}
                {pending && !soon && <span className="block text-[9px] text-muted-foreground">complete previous step</span>}
              </span>
              {!soon && !active && <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />}
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
}