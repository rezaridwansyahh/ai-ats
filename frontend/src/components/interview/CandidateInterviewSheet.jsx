import { useState, useEffect, useCallback } from 'react';
import {
  Loader2, AlertTriangle, Check, CalendarCheck, Star, ChevronRight,
  Plus, Trash2, Pencil, Clock, X, CheckCircle2, XCircle, RefreshCw,
  ThumbsUp, ThumbsDown, MessageSquare,
} from 'lucide-react';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { getInitials } from '@/lib/batteries';

import {
  getInterview,
  getPrep,
  getSchedules,
  createSchedule,
  confirmSchedule,
  unconfirmSchedule,
  deleteSchedule,
  recordOutcome,
  clearOutcome,
  getScorecard,
  saveScorecard,
  recordDecision,
  undoDecision,
} from '@/api/interview.api';

// ─── Constants ─────────────────────────────────────────────────────────────────

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
  done:        { label: 'Done',        color: 'bg-emerald-100 text-emerald-700' },
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

const VERDICT_OPTIONS = [
  {
    value:       'advanced',
    label:       'Advance',
    description: 'Candidate proceeds to the next step',
    icon:        Check,
    color:       'border-emerald-300 bg-emerald-50/60 text-emerald-700',
    activeColor: 'border-emerald-500 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-300',
  },
  {
    value:       'hold',
    label:       'Hold',
    description: 'Keep for further review',
    icon:        Clock,
    color:       'border-amber-300 bg-amber-50/60 text-amber-700',
    activeColor: 'border-amber-500 bg-amber-50 text-amber-700 ring-2 ring-amber-300',
  },
  {
    value:       'rejected',
    label:       'Reject',
    description: 'Candidate does not proceed',
    icon:        X,
    color:       'border-rose-300 bg-rose-50/60 text-rose-700',
    activeColor: 'border-rose-500 bg-rose-50 text-rose-700 ring-2 ring-rose-300',
  },
];

// ─── Helpers ───────────────────────────────────────────────────────────────────

function fmt(d) {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); }
  catch { return '—'; }
}

function fmtTime(d) {
  if (!d) return '';
  try { return new Date(d).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }); }
  catch { return ''; }
}

function scoreBg(score) {
  if (!score) return 'bg-muted/30 text-muted-foreground border-border';
  if (score >= 6) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (score >= 4) return 'bg-amber-50 text-amber-700 border-amber-200';
  return 'bg-rose-50 text-rose-700 border-rose-200';
}

const MAX_SESSIONS = 3;

// ─── Main component ────────────────────────────────────────────────────────────

export default function CandidateInterviewSheet({ open, onOpenChange, interview, onUpdated }) {
  const [fullInterview, setFullInterview] = useState(null);
  const [prep, setPrep]                   = useState(null);
  const [loading, setLoading]             = useState(false);
  const [tab, setTab]                     = useState('schedule');
  const [error, setError]                 = useState(null);
  const [banner, setBanner]               = useState(null);

  const interviewId = interview?.interview_id;
  const jobId       = interview?.job_id;

  const load = useCallback(async () => {
    if (!interviewId || !jobId) return;
    setLoading(true);
    setError(null);
    setBanner(null);
    try {
      const [ivRes, prepRes] = await Promise.all([
        getInterview(interviewId),
        getPrep(jobId),
      ]);
      setFullInterview(ivRes.data?.interview || null);
      setPrep(prepRes.data?.prep || null);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load interview data');
    } finally {
      setLoading(false);
    }
  }, [interviewId, jobId]);

  useEffect(() => {
    if (open && interviewId) {
      setTab('schedule');
      load();
    } else if (!open) {
      setFullInterview(null);
      setPrep(null);
      setError(null);
      setBanner(null);
    }
  }, [open, interviewId, load]);

  const iv = fullInterview || interview || {};
  const name = iv.candidate_name || `#${iv.candidate_id}`;
  const statusMeta = STATUS_META[iv.status] || { label: iv.status, color: 'bg-muted text-muted-foreground' };

  const TABS = [
    { key: 'schedule', label: 'Schedule', icon: CalendarCheck },
    { key: 'result',   label: 'Result',   icon: Star          },
    { key: 'decide',   label: 'Decide',   icon: Check         },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full max-w-xl flex flex-col p-0 gap-0">
        {/* Header */}
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
              {getInitials(name)}
            </div>
            <div className="min-w-0 flex-1">
              <SheetTitle className="truncate">{name}</SheetTitle>
              <SheetDescription className="truncate">
                {iv.last_position || ''}
                {iv.last_position && iv.job_title ? ' · ' : ''}
                {iv.job_title || ''}
              </SheetDescription>
            </div>
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold shrink-0 ${statusMeta.color}`}>
              {statusMeta.label}
            </span>
          </div>
        </SheetHeader>

        {/* Tab strip */}
        <div className="flex border-b border-border px-6 shrink-0">
          {TABS.map((tabDef) => {
            const TabIcon = tabDef.icon;
            return (
              <button
                key={tabDef.key}
                type="button"
                onClick={() => setTab(tabDef.key)}
                className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
                  tab === tabDef.key
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <TabIcon className="h-3.5 w-3.5" />
                {tabDef.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-lg border border-red-200 bg-red-50 text-sm text-red-600">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {error}
              <button type="button" className="ml-auto text-xs underline" onClick={() => setError(null)}>Dismiss</button>
            </div>
          )}
          {banner && (
            <div className={`flex items-center gap-2 px-4 py-3 rounded-lg border text-sm ${
              banner.ok
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-amber-200 bg-amber-50 text-amber-700'
            }`}>
              <Check className="h-4 w-4 shrink-0" />
              {banner.text}
              <button type="button" className="ml-auto text-xs underline" onClick={() => setBanner(null)}>Dismiss</button>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {tab === 'schedule' && (
                <ScheduleTab
                  interviewId={interviewId}
                  setInterview={setFullInterview}
                  setError={setError}
                  setBanner={setBanner}
                />
              )}
              {tab === 'result' && (
                <ResultTab
                  interviewId={interviewId}
                  prep={prep}
                  setInterview={setFullInterview}
                  setError={setError}
                  setBanner={setBanner}
                  onUpdated={onUpdated}
                />
              )}
              {tab === 'decide' && (
                <DecideTab
                  interviewId={interviewId}
                  interview={iv}
                  setInterview={setFullInterview}
                  setError={setError}
                  setBanner={setBanner}
                  onUpdated={onUpdated}
                />
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── Schedule Tab ──────────────────────────────────────────────────────────────

function ScheduleTab({ interviewId, setInterview, setError, setBanner }) {
  const [sessions, setSessions]           = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [showForm, setShowForm]           = useState(false);
  const [title, setTitle]                 = useState('');
  const [dateValue, setDateValue]         = useState('');
  const [timeValue, setTimeValue]         = useState('09:00');
  const [saving, setSaving]               = useState(false);
  const [confirmingId, setConfirmingId]   = useState(null);
  const [deletingId, setDeletingId]       = useState(null);
  const [confirmNote, setConfirmNote]     = useState('');
  const [confirmingForId, setConfirmingForId] = useState(null);

  const loadSessions = useCallback(async () => {
    if (!interviewId) return;
    setLoadingSessions(true);
    try {
      const res = await getSchedules(interviewId);
      setSessions(res.data?.schedules || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load sessions');
    } finally { setLoadingSessions(false); }
  }, [interviewId, setError]);

  useEffect(() => { loadSessions(); }, [loadSessions]);

  const buildScheduledAt = () => {
    if (!dateValue) return null;
    return new Date(`${dateValue}T${timeValue}:00`).toISOString();
  };

  const handleSave = async () => {
    if (!title.trim() || !dateValue || saving) return;
    setSaving(true);
    setError(null);
    setBanner(null);
    try {
      const scheduled_at = buildScheduledAt();
      const res = await createSchedule(interviewId, { title, scheduled_at });
      setSessions((prev) => [...prev, res.data.schedule]);
      setInterview((prev) => ({ ...(prev || {}), scheduled_at: res.data.schedule.scheduled_at, status: 'scheduled' }));
      setBanner({ ok: true, text: 'Session created.' });
      setShowForm(false);
      setTitle('');
      setDateValue('');
      setTimeValue('09:00');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to create session');
    } finally { setSaving(false); }
  };

  const handleConfirm = async (session) => {
    setConfirmingId(session.id);
    setError(null);
    try {
      const res = await confirmSchedule(session.id, { confirmation_note: confirmNote || undefined });
      setSessions((prev) => prev.map((s) => s.id === session.id ? res.data.schedule : s));
      setBanner({ ok: true, text: 'Session confirmed.' });
      setConfirmNote('');
      setConfirmingForId(null);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Confirm failed');
    } finally { setConfirmingId(null); }
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
      const remaining = sessions.filter((s) => s.id !== sessionId);
      setSessions(remaining);
      setInterview((prev) => ({
        ...(prev || {}),
        status: remaining.length > 0 ? 'scheduled' : 'ongoing',
        scheduled_at: remaining.length > 0 ? (prev?.scheduled_at ?? null) : null,
      }));
      setBanner({ ok: true, text: 'Session removed.' });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Delete failed');
    } finally { setDeletingId(null); }
  };

  const handleRecordOutcome = async (sessionId, status) => {
    setError(null);
    try {
      const res = await recordOutcome(sessionId, { status });
      setSessions((prev) => prev.map((s) => s.id === sessionId ? res.data.schedule : s));
      setBanner({ ok: true, text: `Outcome recorded: ${status.replace('_', ' ')}.` });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to record outcome');
    }
  };

  const canAdd = sessions.length < MAX_SESSIONS;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">Interview Sessions</h2>
          <p className="text-[11px] text-muted-foreground">
            {sessions.length} of {MAX_SESSIONS} sessions · invitations sent outside this system
          </p>
        </div>
        {canAdd && !showForm && (
          <Button size="sm" className="text-xs" onClick={() => setShowForm(true)}>
            <Plus className="h-3.5 w-3.5 mr-1.5" /> Add session
          </Button>
        )}
      </div>

      {showForm && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Session {sessions.length + 1} of {MAX_SESSIONS}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Title <span className="text-rose-500">*</span>
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. HR Interview, Technical Interview…"
                className="text-xs h-9"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Date <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="date"
                  value={dateValue}
                  onChange={(e) => setDateValue(e.target.value)}
                  className="text-xs h-9"
                />
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
            <div className="flex items-center justify-end gap-2 pt-1 border-t border-border">
              <Button size="sm" variant="ghost" className="text-xs" onClick={() => setShowForm(false)} disabled={saving}>
                Cancel
              </Button>
              <Button
                size="sm"
                className="text-xs"
                onClick={handleSave}
                disabled={!title.trim() || !dateValue || saving}
              >
                {saving
                  ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  : <Check className="h-3.5 w-3.5 mr-1.5" />
                }
                Create session
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
            No sessions yet. Add up to {MAX_SESSIONS} interview sessions.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sessions.map((session, idx) => {
            const isConfirmed  = !!session.confirmed;
            const hasOutcome   = !!session.status && session.status !== 'ongoing';
            const outcomeMeta  = hasOutcome ? OUTCOME_OPTIONS.find((o) => o.value === session.status) : null;
            const isDeleting   = deletingId === session.id;
            const isConfirming = confirmingId === session.id;
            const showingConfirmFor = confirmingForId === session.id;

            return (
              <Card
                key={session.id}
                className={`transition-colors ${
                  session.status === 'interviewed' ? 'border-emerald-200 bg-emerald-50/20'
                  : session.status === 'no_show'   ? 'border-rose-200 bg-rose-50/20'
                  : session.status === 'reschedule' ? 'border-amber-200 bg-amber-50/20'
                  : isConfirmed ? 'border-emerald-200 bg-emerald-50/10'
                  : ''
                }`}
              >
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className={`h-7 w-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${
                        session.status === 'interviewed' ? 'bg-emerald-500 text-white'
                        : hasOutcome ? 'bg-amber-400 text-white'
                        : isConfirmed ? 'bg-emerald-500 text-white'
                        : 'bg-muted text-muted-foreground'
                      }`}>
                        {hasOutcome || isConfirmed ? <Check className="h-3.5 w-3.5" /> : idx + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold truncate">{session.title}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {fmt(session.scheduled_at)} · {fmtTime(session.scheduled_at)}
                        </p>
                        {hasOutcome && outcomeMeta && (
                          <Badge
                            variant="outline"
                            className={`text-[9px] mt-1 ${
                              session.status === 'interviewed' ? 'border-emerald-300 text-emerald-700 bg-emerald-50'
                              : session.status === 'no_show' ? 'border-rose-300 text-rose-700 bg-rose-50'
                              : 'border-amber-300 text-amber-700 bg-amber-50'
                            }`}
                          >
                            {outcomeMeta.label}
                          </Badge>
                        )}
                        {!hasOutcome && (
                          <Badge variant="outline" className="text-[9px] mt-1 border-muted-foreground/30 text-muted-foreground">
                            {isConfirmed ? 'Confirmed' : 'Awaiting confirmation'}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {isConfirmed && !hasOutcome && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs text-amber-700 border-amber-300 hover:bg-amber-50"
                          onClick={() => handleUnconfirm(session.id)}
                        >
                          Unconfirm
                        </Button>
                      )}
                      {!isConfirmed && !hasOutcome && (
                        <Button
                          size="sm"
                          className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700"
                          onClick={() => setConfirmingForId(showingConfirmFor ? null : session.id)}
                        >
                          Confirm
                        </Button>
                      )}
                      {!isConfirmed && !hasOutcome && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                          onClick={() => handleDelete(session.id)}
                          disabled={isDeleting}
                          title="Delete"
                        >
                          {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Confirm input */}
                  {showingConfirmFor && !isConfirmed && !hasOutcome && (
                    <div className="flex items-center gap-2 pt-2 border-t border-border">
                      <Input
                        value={confirmNote}
                        onChange={(e) => setConfirmNote(e.target.value)}
                        placeholder="How was it confirmed? (e.g. via WhatsApp)…"
                        className="text-xs h-8 flex-1"
                      />
                      <Button
                        size="sm"
                        className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => handleConfirm(session)}
                        disabled={isConfirming}
                      >
                        {isConfirming ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5 mr-1" />} Done
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 text-xs"
                        onClick={() => { setConfirmingForId(null); setConfirmNote(''); }}
                      >
                        Cancel
                      </Button>
                    </div>
                  )}

                  {/* Outcome recording (for confirmed sessions without outcome) */}
                  {isConfirmed && !hasOutcome && (
                    <div className="pt-2 border-t border-border space-y-2">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Record outcome
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        {OUTCOME_OPTIONS.map((opt) => {
                          const Icon = opt.icon;
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => handleRecordOutcome(session.id, opt.value)}
                              className={`flex flex-col items-center gap-1.5 px-2 py-2.5 rounded-lg border text-xs font-semibold transition-colors hover:bg-muted/40 ${opt.color}`}
                            >
                              <Icon className={`h-4 w-4 ${opt.color}`} />
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Clear outcome button */}
                  {hasOutcome && (
                    <div className="pt-2 border-t border-border flex justify-end">
                      <button
                        type="button"
                        className="text-[10px] text-muted-foreground underline hover:text-foreground"
                        onClick={async () => {
                          try {
                            await clearOutcome(session.id);
                            setSessions((prev) => prev.map((s) =>
                              s.id === session.id ? { ...s, status: 'ongoing', outcome_note: null } : s
                            ));
                            setBanner({ ok: true, text: 'Outcome cleared.' });
                          } catch (err) {
                            setError(err.response?.data?.message || err.message || 'Clear failed');
                          }
                        }}
                      >
                        Clear outcome
                      </button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {sessions.length >= MAX_SESSIONS && !showForm && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-muted/20 text-xs text-muted-foreground">
          <MessageSquare className="h-3.5 w-3.5 shrink-0" /> Maximum {MAX_SESSIONS} sessions reached.
        </div>
      )}
    </div>
  );
}

// ─── Result Tab ────────────────────────────────────────────────────────────────

function ResultTab({ interviewId, prep, setInterview, setError, setBanner, onUpdated }) {
  const [scorecard, setScorecard]         = useState(null);
  const [loading, setLoading]             = useState(true);
  const [saving, setSaving]               = useState(false);
  const [scores, setScores]               = useState({});
  const [recommendation, setRecommendation] = useState('');
  const [strengths, setStrengths]         = useState('');
  const [concerns, setConcerns]           = useState('');
  const [isEditing, setIsEditing]         = useState(false);

  const rubricItems = Array.isArray(prep?.rubric_items) && prep.rubric_items.length > 0
    ? prep.rubric_items
    : COMPETENCY_CODES.map((c) => ({ competency_code: c, competency_name: COMPETENCY_NAMES[c], weight: 1 }));

  useEffect(() => {
    if (!interviewId) return;
    setLoading(true);
    (async () => {
      try {
        const res = await getScorecard(interviewId);
        const sc  = res.data?.scorecard;
        if (sc) {
          setScorecard(sc);
          setScores(sc.competency_scores || {});
          setRecommendation(sc.recommendation || '');
          setStrengths(sc.standout_strengths || '');
          setConcerns(sc.concerns || '');
        }
      } catch { /* no scorecard yet */ }
      finally { setLoading(false); }
    })();
  }, [interviewId]);

  const filledCount   = rubricItems.filter((i) => Number(scores[i.competency_code]) >= 1).length;
  const allFilled     = filledCount === rubricItems.length;

  const computeWeightedTotal = () => {
    let sum = 0; let totalWeight = 0;
    for (const item of rubricItems) {
      const s = Number(scores[item.competency_code]);
      const w = Number(item.weight) || 1;
      if (Number.isFinite(s) && s >= 1 && s <= 7) { sum += s * w; totalWeight += w; }
    }
    return totalWeight > 0 ? Math.round((sum / totalWeight) * 100) / 100 : null;
  };

  const weightedTotal = computeWeightedTotal();
  const reviewFlag    = Object.values(scores).some((s) => Number(s) <= 2 && Number(s) >= 1);

  const handleSave = async (isDraft) => {
    if (!allFilled && !isDraft) { setError('Please score all competencies before submitting.'); return; }
    setSaving(true); setError(null); setBanner(null);
    try {
      const res = await saveScorecard(interviewId, {
        competency_scores:  scores,
        recommendation:     recommendation || null,
        standout_strengths: strengths || null,
        concerns:           concerns || null,
        is_draft:           isDraft,
      });
      setScorecard(res.data?.scorecard);
      setBanner({ ok: true, text: isDraft ? 'Scorecard saved as draft.' : 'Scorecard submitted.' });
      if (!isDraft) {
        setInterview((prev) => ({ ...(prev || {}), status: 'done' }));
        if (onUpdated) onUpdated();
      }
      setIsEditing(false);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Save failed');
    } finally { setSaving(false); }
  };

  const handleCancelEdit = () => {
    if (scorecard) {
      setScores(scorecard.competency_scores || {});
      setRecommendation(scorecard.recommendation || '');
      setStrengths(scorecard.standout_strengths || '');
      setConcerns(scorecard.concerns || '');
    }
    setError(null);
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const isSubmitted = scorecard && !scorecard.is_draft;
  const canEdit     = isSubmitted && !isEditing;

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-sm font-semibold">Scorecard</h2>
          <p className="text-[11px] text-muted-foreground">
            Score each competency 1–7. Weighted total is computed automatically.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {scorecard && (
            <Badge
              variant="outline"
              className={`text-[9px] ${
                isEditing ? 'border-violet-300 text-violet-700 bg-violet-50'
                : isSubmitted ? 'border-emerald-300 text-emerald-700 bg-emerald-50'
                : 'border-amber-300 text-amber-700 bg-amber-50'
              }`}
            >
              {isEditing ? 'Editing' : isSubmitted ? 'Submitted' : 'Draft'}
            </Badge>
          )}
          {canEdit && (
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setIsEditing(true)}>
              <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
            </Button>
          )}
        </div>
      </div>

      {/* Weighted total summary */}
      {weightedTotal !== null && (
        <Card className={reviewFlag ? 'border-amber-200 bg-amber-50/30' : 'border-emerald-200 bg-emerald-50/30'}>
          <CardContent className="p-4 flex items-center gap-4 flex-wrap">
            <div className="text-center">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Weighted Total</p>
              <p className={`text-2xl font-bold font-mono ${weightedTotal >= 5 ? 'text-emerald-700' : weightedTotal >= 3.5 ? 'text-amber-700' : 'text-rose-700'}`}>
                {weightedTotal}<span className="text-sm text-muted-foreground font-normal">/7</span>
              </p>
            </div>
            <div className="flex-1 min-w-0 space-y-1">
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${weightedTotal >= 5 ? 'bg-emerald-500' : weightedTotal >= 3.5 ? 'bg-amber-500' : 'bg-rose-500'}`}
                  style={{ width: `${(weightedTotal / 7) * 100}%` }}
                />
              </div>
              <span className="text-[10px] text-muted-foreground">
                {filledCount}/{rubricItems.length} competencies scored
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Competency scoring */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Star className="h-4 w-4 text-primary" />
            Competency Scores
            <span className="text-[10px] font-normal text-muted-foreground ml-1">· 1 (poor) → 7 (excellent)</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {rubricItems.map((item) => {
            const score = scores[item.competency_code];
            const isLow = Number(score) <= 2 && Number(score) >= 1;
            return (
              <div
                key={item.competency_code}
                className={`rounded-lg border p-3 space-y-2 ${isLow ? 'border-amber-200 bg-amber-50/20' : ''}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                    <Badge variant="outline" className="text-[9px] border-blue-200 text-blue-700 font-mono shrink-0">
                      {item.competency_code}
                    </Badge>
                    <span className="text-xs font-semibold truncate">{item.competency_name}</span>
                    <span className="text-[9px] font-mono text-muted-foreground">×{item.weight || 1}</span>
                  </div>
                  {score && (
                    <span className={`inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-bold border shrink-0 ${scoreBg(Number(score))}`}>
                      {score}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 flex-wrap">
                  {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                    <button
                      key={n}
                      type="button"
                      disabled={isSubmitted && !isEditing}
                      onClick={() => setScores((prev) => ({ ...prev, [item.competency_code]: n }))}
                      className={`h-8 w-8 rounded-md border text-xs font-semibold transition-colors ${
                        Number(score) === n
                          ? n <= 2 ? 'bg-rose-500 text-white border-rose-500'
                          : n <= 4 ? 'bg-amber-500 text-white border-amber-500'
                          : 'bg-emerald-500 text-white border-emerald-500'
                          : 'border-border text-muted-foreground hover:border-primary hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Recommendation */}
      {(!isSubmitted || isEditing) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Recommendation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {RECOMMENDATION_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const isSelected = recommendation === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setRecommendation(opt.value)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-xs font-semibold transition-colors ${
                      isSelected
                        ? opt.color + ' ring-2 ring-current/30'
                        : 'border-border text-muted-foreground hover:bg-muted/30'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {isSubmitted && !isEditing && recommendation && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-muted/20 text-xs">
          <span className="text-muted-foreground">Recommendation:</span>
          <span className="font-semibold">{RECOMMENDATION_OPTIONS.find((r) => r.value === recommendation)?.label || recommendation}</span>
        </div>
      )}

      {/* Strengths & Concerns */}
      {(!isSubmitted || isEditing) && (
        <div className="grid grid-cols-1 gap-3">
          <div className="space-y-1.5">
            <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Standout Strengths
            </label>
            <Textarea
              value={strengths}
              onChange={(e) => setStrengths(e.target.value)}
              placeholder="What stood out positively about this candidate?"
              rows={2}
              className="text-xs"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Concerns
            </label>
            <Textarea
              value={concerns}
              onChange={(e) => setConcerns(e.target.value)}
              placeholder="Any concerns or areas to watch?"
              rows={2}
              className="text-xs"
            />
          </div>
        </div>
      )}

      {/* Save/submit buttons */}
      {(!isSubmitted || isEditing) && (
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
          {isEditing && (
            <Button size="sm" variant="ghost" className="text-xs" onClick={handleCancelEdit} disabled={saving}>
              Cancel
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            className="text-xs"
            onClick={() => handleSave(true)}
            disabled={saving}
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : null}
            Save Draft
          </Button>
          <Button
            size="sm"
            className="text-xs"
            onClick={() => handleSave(false)}
            disabled={saving || !allFilled}
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Check className="h-3.5 w-3.5 mr-1.5" />}
            Submit Scorecard
          </Button>
        </div>
      )}

      {isSubmitted && !isEditing && (
        <div className="space-y-2">
          {strengths && (
            <div className="px-3 py-2 rounded-lg border bg-muted/10 text-xs">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">Strengths</p>
              <p>{strengths}</p>
            </div>
          )}
          {concerns && (
            <div className="px-3 py-2 rounded-lg border bg-muted/10 text-xs">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">Concerns</p>
              <p>{concerns}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Decide Tab ────────────────────────────────────────────────────────────────

function DecideTab({ interviewId, interview, setInterview, setError, setBanner, onUpdated }) {
  const [selectedVerdict, setSelectedVerdict] = useState(null);
  const [decisionNote, setDecisionNote]       = useState('');
  const [submitting, setSubmitting]           = useState(false);

  const decision       = interview?.decision;
  const alreadyDecided = decision && decision !== 'pending';

  const userId = (() => {
    try {
      const u = JSON.parse(localStorage.getItem('user') || '{}');
      return u.user_id || u.id || null;
    } catch { return null; }
  })();

  const handleDecide = async () => {
    if (!selectedVerdict || submitting) return;
    setSubmitting(true);
    setError(null);
    setBanner(null);
    try {
      await recordDecision(interviewId, {
        verdict:       selectedVerdict,
        decision_note: decisionNote || undefined,
        decided_by:    userId,
      });
      setInterview((prev) => ({ ...(prev || {}), decision: selectedVerdict }));
      setBanner({ ok: true, text: `Decision recorded: ${selectedVerdict}.` });
      setSelectedVerdict(null);
      setDecisionNote('');
      if (onUpdated) onUpdated();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to record decision');
    } finally { setSubmitting(false); }
  };

  const handleUndo = async () => {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    setBanner(null);
    try {
      await undoDecision(interviewId);
      setInterview((prev) => ({ ...(prev || {}), decision: null }));
      setBanner({ ok: true, text: 'Decision undone.' });
      if (onUpdated) onUpdated();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to undo decision');
    } finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-sm font-semibold">Decision</h2>
        <p className="text-[11px] text-muted-foreground">
          Record the final hiring decision for this candidate.
        </p>
      </div>

      {alreadyDecided ? (
        <Card>
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
                decision === 'advanced' ? 'bg-emerald-100 text-emerald-700'
                : decision === 'hold'   ? 'bg-amber-100 text-amber-700'
                : 'bg-rose-100 text-rose-700'
              }`}>
                {decision === 'advanced' ? <Check className="h-5 w-5" />
                : decision === 'hold'    ? <Clock className="h-5 w-5" />
                : <X className="h-5 w-5" />}
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Decision</p>
                <p className={`text-sm font-bold capitalize ${
                  decision === 'advanced' ? 'text-emerald-700'
                  : decision === 'hold'   ? 'text-amber-700'
                  : 'text-rose-700'
                }`}>
                  {VERDICT_OPTIONS.find((v) => v.value === decision)?.label || decision}
                </p>
              </div>
            </div>
            {interview?.decision_note && (
              <div className="px-3 py-2 rounded-lg border border-border bg-muted/10 text-xs">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">Note</p>
                <p>{interview.decision_note}</p>
              </div>
            )}
            <Button
              size="sm"
              variant="outline"
              className="text-xs text-muted-foreground"
              onClick={handleUndo}
              disabled={submitting}
            >
              {submitting ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : null}
              Undo Decision
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-2">
            {VERDICT_OPTIONS.map((opt) => {
              const Icon     = opt.icon;
              const isActive = selectedVerdict === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setSelectedVerdict(isActive ? null : opt.value)}
                  className={`flex items-start gap-3 px-4 py-3 rounded-lg border text-left transition-colors ${
                    isActive ? opt.activeColor : opt.color
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold">{opt.label}</p>
                    <p className="text-[10px] text-current/70 mt-0.5">{opt.description}</p>
                  </div>
                  {isActive && <Check className="h-4 w-4 ml-auto shrink-0" />}
                </button>
              );
            })}
          </div>

          {selectedVerdict && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Decision Note (optional)
                </label>
                <Textarea
                  value={decisionNote}
                  onChange={(e) => setDecisionNote(e.target.value)}
                  placeholder="Add context or reasoning for this decision…"
                  rows={3}
                  className="text-xs"
                />
              </div>
              <div className="flex items-center justify-end gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs"
                  onClick={() => { setSelectedVerdict(null); setDecisionNote(''); }}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="text-xs"
                  onClick={handleDecide}
                  disabled={submitting}
                >
                  {submitting
                    ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    : <Check className="h-3.5 w-3.5 mr-1.5" />
                  }
                  Confirm Decision
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
