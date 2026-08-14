import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  Loader2, AlertTriangle, CheckCircle2, ChevronDown, ChevronUp,
  Clock, User, Briefcase, Calendar, Send, Lock,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import { getPackByToken, saveOutcome, submitPack } from '@/api/interview-pack.api';

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(d) {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return '—'; }
}

function fmtDateTime(d) {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleString('en-AU', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return '—'; }
}

function calcWeightedTotal(competencies = [], scores = {}) {
  if (!competencies.length) return null;
  let totalWeight = 0;
  let weightedSum = 0;
  for (const comp of competencies) {
    const key = comp.key || comp.id || comp.name;
    const score = scores[key];
    const weight = comp.weight ?? 1;
    if (score != null) {
      weightedSum += Number(score) * Number(weight);
      totalWeight += Number(weight);
    }
  }
  if (totalWeight === 0) return null;
  return (weightedSum / totalWeight).toFixed(2);
}

function isCandidateComplete(competencies = [], outcome = {}) {
  const allScored = competencies.every((comp) => {
    const key = comp.key || comp.id || comp.name;
    return outcome.scores?.[key] != null;
  });
  return allScored && !!outcome.recommendation;
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function Logo() {
  return (
    <div className="text-center">
      <div className="text-base font-bold tracking-widest text-primary">MYRALIX</div>
      <div className="text-[10px] tracking-wider uppercase text-muted-foreground">Interview Pack Portal</div>
    </div>
  );
}

function Collapsible({ title, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-3 text-sm font-semibold text-foreground hover:bg-muted/20 transition-colors rounded-t-lg"
      >
        {title}
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>
      {open && <CardContent className="pt-0 px-5 pb-5">{children}</CardContent>}
    </Card>
  );
}

function ScoreButton({ value, selected, disabled, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`h-8 w-8 rounded-full text-xs font-bold border transition-colors shrink-0 ${
        selected
          ? 'bg-primary text-primary-foreground border-primary'
          : disabled
            ? 'bg-muted text-muted-foreground border-border opacity-50 cursor-not-allowed'
            : 'bg-muted text-foreground border-border hover:bg-muted/80 cursor-pointer'
      }`}
    >
      {value}
    </button>
  );
}

function RecommendationButton({ value, label, selected, disabled, onClick }) {
  const styles = {
    advance: {
      base: 'border-emerald-200 text-emerald-700',
      selected: 'bg-emerald-600 text-white border-emerald-600 ring-2 ring-emerald-300',
      hover: 'bg-emerald-50 hover:bg-emerald-100',
    },
    hold: {
      base: 'border-amber-200 text-amber-700',
      selected: 'bg-amber-500 text-white border-amber-500 ring-2 ring-amber-300',
      hover: 'bg-amber-50 hover:bg-amber-100',
    },
    reject: {
      base: 'border-red-200 text-red-600',
      selected: 'bg-red-500 text-white border-red-500 ring-2 ring-red-300',
      hover: 'bg-red-50 hover:bg-red-100',
    },
  };
  const s = styles[value];
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex-1 py-2 px-3 rounded-lg border text-xs font-semibold transition-all ${
        disabled
          ? 'opacity-50 cursor-not-allowed bg-muted text-muted-foreground border-border'
          : selected
            ? s.selected
            : `${s.base} ${s.hover} cursor-pointer`
      }`}
    >
      {label}
    </button>
  );
}

function SaveIndicator({ savingId, savedId, candidateId }) {
  if (savingId === candidateId) {
    return (
      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
        <Loader2 className="h-3 w-3 animate-spin" /> Saving…
      </span>
    );
  }
  if (savedId === candidateId) {
    return (
      <span className="text-[10px] text-emerald-600 flex items-center gap-1">
        <CheckCircle2 className="h-3 w-3" /> Saved
      </span>
    );
  }
  return null;
}

function QuestionReadOnly({ questions = [] }) {
  if (!questions.length) return null;
  return(
     <Card>
      <div className="px-5 py-3 border-b border-border flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Interview questions
        </p>
        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
          <Lock className="h-3 w-3" /> Locked
        </span>
      </div>
      <CardContent className="p-5 space-y-2">
        {questions.map((q, i) => (
          <div key={q.id || i} className="rounded-lg border border-border bg-muted/10 p-3">
            <div className="flex items-start gap-2">
              <span className="text-[10px] font-mono text-muted-foreground mt-0.5 shrink-0">{i + 1}</span>
              <div className="min-w-0">
                {q.competency && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full border border-blue-200 bg-blue-50 text-blue-700 text-[9px] font-semibold mb-1">
                    {q.competency}
                  </span>
                )}
                <p className="text-xs leading-relaxed text-foreground">{q.text}</p>
                {q.follow_up && (
                  <p className="text-[10px] text-muted-foreground mt-0.5 italic">↳ {q.follow_up}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ── Main Portal Page ────────────────────────────────────────────────────────────

export default function InterviewPackPortal() {
  const { token } = useParams();

  const [pack, setPack] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [errorCode, setErrorCode] = useState(null);

  // outcomes keyed by pack_candidate_id
  const [outcomes, setOutcomes] = useState({});
  const [activeIndex, setActiveIndex] = useState(0);

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [confirmSubmit, setConfirmSubmit] = useState(false);

  const [savingId, setSavingId] = useState(null);
  const [savedId, setSavedId] = useState(null);

  // Debounce timers per candidate
  const debounceTimers = useRef({});

  // Load pack
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await getPackByToken(token);
        if (cancelled) return;
        const p = res.data?.pack || res.data;
        setPack(p);
        console.log('pack payload: ', p);
        // Populate outcomes from existing data
        const initial = {};
        for (const c of p?.candidates || []) {
          const pcId = c.pack_candidate_id;
          initial[pcId] = {
            scores: c.outcome?.scores || {},
            recommendation: c.outcome?.recommendation || null,
            strengths: c.outcome?.strengths || '',
            concerns: c.outcome?.concerns || '',
          };
        }
        setOutcomes(initial);
        if (p?.status === 'submitted') setSubmitted(true);
      } catch (err) {
        if (cancelled) return;
        const status = err.response?.status;
        setErrorCode(status);
        setError(
          status === 404
            ? 'Pack not found. Please check your link.'
            : status === 410
              ? 'This interview pack has already been submitted.'
              : err.response?.data?.message || err.message || 'Failed to load pack.'
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [token]);

  // Autosave with debounce
  const triggerAutosave = useCallback((packCandidateId, outcomeData) => {
    if (debounceTimers.current[packCandidateId]) {
      clearTimeout(debounceTimers.current[packCandidateId]);
    }
    debounceTimers.current[packCandidateId] = setTimeout(async () => {
      setSavingId(packCandidateId);
      try {
        await saveOutcome(token, packCandidateId, outcomeData);
        setSavedId(packCandidateId);
        setTimeout(() => setSavedId((prev) => prev === packCandidateId ? null : prev), 2500);
      } catch {
        // Silently fail autosave — user will see stale "Saving…" or nothing
      } finally {
        setSavingId((prev) => prev === packCandidateId ? null : prev);
      }
    }, 800);
  }, [token]);

  function updateOutcome(packCandidateId, field, value) {
    if (submitted) return;
    setOutcomes((prev) => {
      const updated = {
        ...prev,
        [packCandidateId]: {
          ...(prev[packCandidateId] || {}),
          [field]: value,
        },
      };
      triggerAutosave(packCandidateId, updated[packCandidateId]);
      return updated;
    });
  }

  function updateScore(packCandidateId, competencyKey, score) {
    if (submitted) return;
    setOutcomes((prev) => {
      const existing = prev[packCandidateId] || {};
      const updated = {
        ...prev,
        [packCandidateId]: {
          ...existing,
          scores: {
            ...(existing.scores || {}),
            [competencyKey]: score,
          },
        },
      };
      triggerAutosave(packCandidateId, updated[packCandidateId]);
      return updated;
    });
  }

  async function handleSubmit() {
    setSubmitting(true);
    setSubmitError('');
    try {
      await submitPack(token);
      setSubmitted(true);
      setConfirmSubmit(false);
    } catch (err) {
      setSubmitError(err.response?.data?.message || err.message || 'Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  // ── Render states ─────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Loading interview pack…</p>
        </div>
      </div>
    );
  }

  if (error && !pack) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-4">
          <Logo />
          <Card>
            <CardContent className="p-6 text-center space-y-3">
              {errorCode === 404
                ? <AlertTriangle className="h-8 w-8 text-rose-500 mx-auto" />
                : <Lock className="h-8 w-8 text-amber-500 mx-auto" />}
              <p className="text-sm font-semibold text-foreground">
                {errorCode === 404 ? 'Pack not found' : 'Pack unavailable'}
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">{error}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const candidates = pack?.candidates || [];
  const competencies = pack?.rubric_snapshot?.competencies || [];
  const activeCandidate = candidates[activeIndex];
  const activePcId = activeCandidate?.pack_candidate_id;
  const activeOutcome = outcomes[activePcId] || { scores: {}, recommendation: null, strengths: '', concerns: '' };

  const evaluatedCount = candidates.filter((c) => {
    const pcId = c.pack_candidate_id;
    return isCandidateComplete(competencies, outcomes[pcId] || {});
  }).length;

  const weightedTotal = calcWeightedTotal(competencies, activeOutcome.scores);

  const isReadOnly = submitted;

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        {/* Logo */}
        <Logo />

        {/* Submitted banner */}
        {submitted && pack?.submitted_at && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-emerald-200 bg-emerald-50 text-sm text-emerald-700">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            This pack was submitted on {fmtDateTime(pack.submitted_at)}. All scores are now read-only.
          </div>
        )}

        {/* Header card */}
        <Card>
          <CardContent className="p-5 space-y-3">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <p className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground mb-1">
                  {pack?.company_name || 'Interview Pack'}
                </p>
                <h1 className="text-lg font-bold text-foreground leading-tight">
                  {pack?.job_title || '—'}
                  {pack?.title && pack.title !== pack.job_title && (
                    <span className="text-muted-foreground font-normal"> — {pack.title}</span>
                  )}
                </h1>
              </div>
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-xs font-semibold capitalize ${
                submitted || pack?.status === 'submitted'
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                  : 'bg-blue-50 text-blue-600 border-blue-200'
              }`}>
                {submitted || pack?.status === 'submitted' ? 'Submitted' : 'Open'}
              </span>
            </div>

            <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-muted-foreground">
              {pack?.batch_code && (
                <span className="flex items-center gap-1.5">
                  <Briefcase className="h-3.5 w-3.5" />
                  Batch {pack.batch_code}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" />
                {candidates.length} candidate{candidates.length !== 1 ? 's' : ''}
              </span>
              <span className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" />
                Interviewer: {pack?.interviewer_name || '—'}
              </span>
              {(pack?.window_start || pack?.window_end) && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  {fmtDate(pack.window_start)} – {fmtDate(pack.window_end)}
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* About this pack */}
        <Collapsible title="About this pack" defaultOpen={!submitted}>
          <div className="text-xs text-muted-foreground space-y-2 leading-relaxed">
            <p>Welcome to your interview scorecard portal. Here's how to use it:</p>
            <ol className="list-decimal list-inside space-y-1 pl-1">
              <li>Select a candidate from the list on the left (or below on mobile).</li>
              <li>Score each competency on a scale of 1 (low) to 7 (high).</li>
              <li>Choose your recommendation: Advance, Hold, or Reject.</li>
              <li>Optionally note candidate strengths and concerns.</li>
              <li>Scores autosave as you work — no manual save needed.</li>
              <li>When finished with all candidates, click <strong>Submit to Myralix</strong>.</li>
            </ol>
            <p className="text-amber-700">Once submitted, scores are locked and cannot be changed.</p>
          </div>
        </Collapsible>

        {/* Job description */}
        {(pack?.job_desc || pack?.required_skills?.length > 0) && (
          <Collapsible title="Job Description" defaultOpen={false}>
            <div className="space-y-3">
              <p className="text-sm font-semibold text-foreground">{pack.job_title}</p>
              {pack.job_desc && (
                <JobDescSection desc={pack.job_desc} />
              )}
              {pack.required_skills?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {pack.required_skills.map((skill, i) => (
                    <span key={i} className="inline-flex items-center px-2.5 py-0.5 rounded-full border border-border bg-muted text-xs text-muted-foreground">
                      {typeof skill === 'string' ? skill : skill.name || skill}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </Collapsible>
        )}

        {/* Candidates + Scorecard */}
        <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-4">
          {/* Candidate list */}
          <Card className="self-start">
            <div className="px-4 py-3 border-b border-border">
              <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                Candidates · {candidates.length}
              </p>
            </div>
            <div className="p-2 space-y-0.5">
              {candidates.map((c, i) => {
                const pcId = c.pack_candidate_id;
                const done = isCandidateComplete(competencies, outcomes[pcId] || {});
                const isActive = i === activeIndex;
                return (
                  <button
                    key={pcId}
                    type="button"
                    onClick={() => setActiveIndex(i)}
                    className={`w-full flex items-start gap-2.5 px-3 py-2.5 rounded-md text-left transition-colors ${
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-foreground hover:bg-muted/40'
                    }`}
                  >
                    <div className={`mt-0.5 h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      done ? 'bg-emerald-500 border-emerald-500' : 'border-muted-foreground'
                    }`}>
                      {done && <CheckCircle2 className="h-2.5 w-2.5 text-white" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate">{c.applicant_name || `Candidate ${i + 1}`}</p>
                      {c.last_position && (
                        <p className="text-[10px] text-muted-foreground truncate">{c.last_position}</p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Scorecard */}
          {activeCandidate ? (
            <div className="space-y-4">
              {/* Candidate header */}
              <Card>
                <CardContent className="p-4 flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <p className="font-semibold text-foreground">
                      {activeCandidate.applicant_name || `Candidate ${activeIndex + 1}`}
                    </p>
                    {activeCandidate.last_position && (
                      <p className="text-xs text-muted-foreground">{activeCandidate.last_position}</p>
                    )}
                  </div>
                  <SaveIndicator savingId={savingId} savedId={savedId} candidateId={activePcId} />
                </CardContent>
              </Card>

              {/* Competency scores */}
              {competencies.length === 0 ? (
                <Card>
                  <CardContent className="p-4 text-xs text-muted-foreground italic">
                    No rubric competencies defined for this job.
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <div className="px-5 py-3 border-b border-border flex items-center justify-between">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Scorecard</p>
                    {weightedTotal && (
                      <div className="text-xs font-mono font-bold text-primary">
                        Weighted total: {weightedTotal}
                      </div>
                    )}
                  </div>
                  <CardContent className="p-5 space-y-5">
                    {competencies.map((comp) => {
                      const key = comp.key || comp.id || comp.name;
                      const currentScore = activeOutcome.scores?.[key];
                      return (
                        <div key={key} className="space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium text-foreground">{comp.name || key}</p>
                            {comp.weight != null && (
                              <span className="text-[10px] text-muted-foreground border border-border rounded px-1.5 py-0.5">
                                weight {comp.weight}
                              </span>
                            )}
                          </div>
                          {comp.description && (
                            <p className="text-xs text-muted-foreground">{comp.description}</p>
                          )}
                          <div className="flex items-center gap-1.5">
                            {[1, 2, 3, 4, 5, 6, 7].map((v) => (
                              <ScoreButton
                                key={v}
                                value={v}
                                selected={currentScore === v}
                                disabled={isReadOnly}
                                onClick={() => updateScore(activePcId, key, v)}
                              />
                            ))}
                            {currentScore && !isReadOnly && (
                              <button
                                type="button"
                                onClick={() => updateScore(activePcId, key, null)}
                                className="text-[10px] text-muted-foreground hover:text-foreground ml-1 underline"
                              >
                                clear
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              )}

              {/* Interview questions — locked, view only */}
              <QuestionReadOnly 
                questions={pack?.questions_snapshot || pack?.rubric_snapshot?.questions || []}
              />

              {/* Decision */}
              <Card>
                <div className="px-5 py-3 border-b border-border">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Decision</p>
                </div>
                <CardContent className="p-5 space-y-4">
                  <div className="flex gap-2">
                    {[
                      { value: 'advance', label: 'Advance' },
                      { value: 'hold', label: 'Hold' },
                      { value: 'reject', label: 'Reject' },
                    ].map(({ value, label }) => (
                      <RecommendationButton
                        key={value}
                        value={value}
                        label={label}
                        selected={activeOutcome.recommendation === value}
                        disabled={isReadOnly}
                        onClick={() => updateOutcome(activePcId, 'recommendation',
                          activeOutcome.recommendation === value ? null : value
                        )}
                      />
                    ))}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">Strengths</label>
                    <textarea
                      rows={3}
                      disabled={isReadOnly}
                      placeholder="Key strengths observed during the interview…"
                      className="w-full text-xs rounded-md border border-border bg-background px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60 disabled:cursor-not-allowed"
                      value={activeOutcome.strengths || ''}
                      onChange={(e) => updateOutcome(activePcId, 'strengths', e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">Concerns</label>
                    <textarea
                      rows={3}
                      disabled={isReadOnly}
                      placeholder="Any concerns or red flags observed…"
                      className="w-full text-xs rounded-md border border-border bg-background px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60 disabled:cursor-not-allowed"
                      value={activeOutcome.concerns || ''}
                      onChange={(e) => updateOutcome(activePcId, 'concerns', e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Navigation buttons */}
              <div className="flex justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={activeIndex === 0}
                  onClick={() => setActiveIndex((i) => i - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={activeIndex === candidates.length - 1}
                  onClick={() => setActiveIndex((i) => i + 1)}
                >
                  Next candidate
                </Button>
              </div>
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center text-xs text-muted-foreground">
                No candidates in this pack.
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Sticky bottom bar */}
      {!submitted && (
        <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-background/95 backdrop-blur-sm px-4 py-3">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-4 flex-wrap">
            <div className="text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">{evaluatedCount}</span> of{' '}
              <span className="font-semibold text-foreground">{candidates.length}</span> candidates evaluated
              {evaluatedCount < candidates.length && (
                <span className="text-amber-600 ml-2">({candidates.length - evaluatedCount} remaining)</span>
              )}
            </div>

            {!confirmSubmit ? (
              <Button
                onClick={() => setConfirmSubmit(true)}
                className="flex items-center gap-2"
              >
                <Send className="h-3.5 w-3.5" />
                Submit to Myralix
              </Button>
            ) : (
              <div className="flex items-center gap-3 flex-wrap">
                {evaluatedCount < candidates.length && (
                  <span className="text-xs text-amber-600 flex items-center gap-1">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                    {candidates.length - evaluatedCount} candidate{candidates.length - evaluatedCount !== 1 ? 's' : ''} not fully scored.
                  </span>
                )}
                {submitError && (
                  <span className="text-xs text-red-600">{submitError}</span>
                )}
                <Button variant="outline" size="sm" onClick={() => setConfirmSubmit(false)} disabled={submitting}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSubmit} disabled={submitting}>
                  {submitting
                    ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Submitting…</>
                    : 'Confirm Submit'}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Job description with "show more" ─────────────────────────────────────────

function JobDescSection({ desc }) {
  const [expanded, setExpanded] = useState(false);
  const TRUNCATE = 300;
  const short = desc.length > TRUNCATE;
  return (
    <div className="text-xs text-muted-foreground leading-relaxed">
      <p>{expanded || !short ? desc : `${desc.slice(0, TRUNCATE)}…`}</p>
      {short && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="text-primary underline mt-1"
        >
          {expanded ? 'Show less' : 'Show more'}
        </button>
      )}
    </div>
  );
}
