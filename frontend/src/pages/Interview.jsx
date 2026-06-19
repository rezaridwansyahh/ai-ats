import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase, FileText, Mail, Sparkles, ArrowRight, Check,
  Calendar, Video, Circle, AlertTriangle, Clock,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';

/* ════════════════════════════════════════════════════════════════
   DUMMY DATA — single source of truth for this page.
   Edit any text/number below to change what renders. Nothing else
   in this file needs to change.

   WHEN THE REAL BACKEND IS READY: replace each section with a real
   fetch (e.g. inside a useEffect keyed on jobId) and keep the same
   shape — the components below just read from this object.
   ════════════════════════════════════════════════════════════════ */

const DUMMY = {
  // Job header
  job: {
    job_id: 'JOB-2148',
    job_title: 'Sales Executive Management Trainee',
    status: 'Active',
    hired: 4,
    total_slots: 10,
    deadline: '15 Mar 2026',
    days_open: 18,
  },

  // The 5-step tracker. `summary` is the one-line status text under each
  // label. Whether a step shows a checkmark, a number, or the dark
  // "active" treatment is computed from which step is selected — see
  // getStepVisualState() below — so you only need to edit the summary text.
  stages: [
    { key: 'prep',     label: 'Prep',     summary: 'Briefing pack' },
    { key: 'schedule', label: 'Schedule', summary: '2 of 3 booked' },
    { key: 'conduct',  label: 'Conduct',  summary: '1 in progress' },
    { key: 'evaluate', label: 'Evaluate', summary: '2 scorecards owed' },
    { key: 'decide',   label: 'Decide',   summary: 'awaits scorecards' },
  ],

  // Which step is selected when the page first loads.
  defaultStage: 'prep',

  // ── Step 1: Prep ──────────────────────────────────────────
  prep: {
    candidates: [
      {
        id: 1,
        name: 'Rina Putri',
        role: 'Sales Exec MT',
        statusLabel: 'Conditional',
        tone: 'warning',
        strengths: ['Customer-facing 4y', 'MT alumni network', 'SQL basics'],
        flags: ['Salary expects upper band'],
        ai_probes: 3,
        needs_probe_review: false,
      },
      {
        id: 2,
        name: 'Bagas Pratama',
        role: 'Backend Eng',
        statusLabel: 'Conditional',
        tone: 'warning',
        strengths: ['Go + Node 6y', 'Distributed systems', 'Mentor 2y'],
        flags: ['Last role 14 mo'],
        ai_probes: 4,
        needs_probe_review: true,
      },
      {
        id: 3,
        name: 'Maya Sari',
        role: 'AI Specialist',
        statusLabel: 'Conditional',
        tone: 'warning',
        strengths: ['ML research 3y', 'Published', 'PhD'],
        flags: ['No production exp'],
        ai_probes: 5,
        needs_probe_review: false,
      },
    ],
  },

  // ── Step 2: Schedule ──────────────────────────────────────
  schedule: {
    loops: [
      {
        id: 1, candidate: 'Rina Putri', loop: 'Loop 1 of 2',
        interviewers: 'Tania W. · Hendra A.', when: 'Today 14:00 WIB',
        statusLabel: '✓ Confirmed', tone: 'success',
      },
      {
        id: 2, candidate: 'Bagas Pratama', loop: 'Loop 2 of 2',
        interviewers: 'Andi T. · Lina S.', when: 'Today 16:30 WIB',
        statusLabel: '✓ Confirmed', tone: 'success',
      },
      {
        id: 3, candidate: 'Maya Sari', loop: 'Loop 1 of 3',
        interviewers: 'Hasan B.', when: 'Tomorrow 10:00',
        statusLabel: '! Pending accept', tone: 'warning',
      },
    ],
  },

  // ── Step 3: Conduct ───────────────────────────────────────
  conduct: {
    interviewId: 'IV-02',
    candidateName: 'Bagas Pratama',
    elapsedMinutes: 38,
    totalMinutes: 60,
    minutesRemaining: 22,
    competencies: [
      { name: 'System Design', description: 'Cache invalidation strategies', covered: true },
      { name: 'Coding fundamentals', description: 'Concurrency w/ channels', covered: true },
      { name: 'Communication', description: 'Clear, structured', covered: true },
      { name: 'Ownership', description: '', covered: false },
      { name: 'Mentorship', description: '', covered: false },
    ],
    notes: [
      'Strong on cache invalidation — mentioned LRU + TTL hybrids',
      'Concurrency: explained channels w/ buffered case clearly',
      'Communication clean, structured',
      'Need to probe: ownership of largest system, mentor specifics',
    ],
  },

  // ── Step 4: Evaluate ──────────────────────────────────────
  // `flagged` (the ! Calibrate row + the calibration banner) is computed
  // automatically whenever scorerA and scorerB disagree by more than 1
  // point — just edit the scores, you don't need to flag anything by hand.
  evaluate: {
    interviewId: 'IV-03',
    candidateName: 'Bagas Pratama',
    scorersIn: 2,
    calibrationNote: 'Likely cause: rubric anchor "scale" interpreted differently. Compare side-by-side.',
    rows: [
      { competency: 'System Design', scorerA: 3, scorerB: 1, max: 4 },
      { competency: 'Coding fundamentals', scorerA: 3, scorerB: 3, max: 4 },
      { competency: 'Communication', scorerA: 4, scorerB: 3, max: 4 },
      { competency: 'Ownership', scorerA: 2, scorerB: 2, max: 4 },
      { competency: 'Mentorship', scorerA: 3, scorerB: 2, max: 4 },
    ],
    recommendedVerdict: 'Conditional',
  },

  // ── Step 5: Decide ────────────────────────────────────────
  decide: {
    candidateName: 'Bagas Pratama',
    panelAverage: 2.6,
    maxScore: 4,
    threshold: 2.5,
    verdict: 'Conditional',
    verdictNote: 'System Design score depends on calibration outcome — advance with a focused data-systems probe in next round.',
    recommendedNext: {
      title: 'Psychological Assessment · Specialist battery',
      subtitle: 'Auto-suggested by role-level rubric',
    },
    finalBadgeLabel: 'Conditional · advance with data probe',
  },
};

/* ════════════════════════════════════════════════════════════════
   Small shared pieces
   ════════════════════════════════════════════════════════════════ */

const TONE_CLASSES = {
  success: 'border-emerald-200 text-emerald-700 bg-emerald-50',
  warning: 'border-amber-200 text-amber-700 bg-amber-50',
  danger: 'border-rose-200 text-rose-700 bg-rose-50',
  neutral: 'border-border text-muted-foreground bg-muted/40',
};

const DOT_CLASSES = {
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-rose-500',
  neutral: 'bg-muted-foreground',
};

/** Small colored pill used for every status label across all 5 steps. */
function StatusPill({ label, tone = 'neutral' }) {
  return (
    <Badge variant="outline" className={`text-[10px] gap-1.5 whitespace-nowrap ${TONE_CLASSES[tone] || TONE_CLASSES.neutral}`}>
      <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${DOT_CLASSES[tone] || DOT_CLASSES.neutral}`} />
      {label}
    </Badge>
  );
}

/**
 * Shared chrome for every step: a cream header (icon/title/subtitle +
 * optional right-side actions), a white content area, and a cream footer
 * (left summary text + right action). Matches the bordered-card look used
 * for every step in the mockups.
 */
function StepCard({ icon: Icon, title, subtitle, headerRight, footerLeft, footerRight, children }) {
  return (
    <div className="border rounded-xl overflow-hidden bg-card">
      <div className="flex items-start justify-between gap-4 flex-wrap px-6 py-5 bg-muted/30 border-b">
        <div className="flex items-start gap-3">
          {Icon && (
            <div className="h-9 w-9 rounded-lg border bg-card flex items-center justify-center flex-shrink-0">
              <Icon className="h-4 w-4 text-muted-foreground" />
            </div>
          )}
          <div>
            <div className="font-serif text-lg font-bold">{title}</div>
            {subtitle && <p className="text-sm text-muted-foreground mt-0.5 max-w-2xl">{subtitle}</p>}
          </div>
        </div>
        {headerRight && (
          <div className="flex items-center gap-4 text-sm font-medium flex-shrink-0">{headerRight}</div>
        )}
      </div>

      <div>{children}</div>

      {(footerLeft || footerRight) && (
        <div className="flex items-center justify-between gap-3 flex-wrap px-6 py-4 bg-muted/30 border-t text-xs">
          <div>{footerLeft}</div>
          <div className="flex items-center gap-2">{footerRight}</div>
        </div>
      )}
    </div>
  );
}

/** A plain "Next: Label →" text link used in most step footers. */
function NextLink({ label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="font-semibold text-foreground flex items-center gap-1 hover:underline"
    >
      Next: {label} <ArrowRight className="h-3.5 w-3.5" />
    </button>
  );
}

/**
 * Works out whether a stepper item should render as done (check), current
 * (dark, active), or upcoming (plain numbered circle). Only Prep and
 * Schedule are eligible for the checkmark — Conduct/Evaluate/Decide are
 * live, per-candidate steps whose progress is conveyed by their summary
 * text instead, so they stay numbered even once you've moved past them.
 */
function getStepVisualState(stage, index, activeIndex) {
  if (index === activeIndex) return 'current';
  if (index < activeIndex && (stage.key === 'prep' || stage.key === 'schedule')) return 'done';
  return 'upcoming';
}

function StageStepper({ stages, activeKey, onSelect }) {
  const activeIndex = stages.findIndex((s) => s.key === activeKey);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-5 border rounded-xl overflow-hidden bg-card">
      {stages.map((stage, i) => {
        const visualState = getStepVisualState(stage, i, activeIndex);
        const isActive = visualState === 'current';
        const isDone = visualState === 'done';

        return (
          <button
            key={stage.key}
            type="button"
            onClick={() => onSelect(stage.key)}
            className={`
              flex items-center gap-3 px-4 py-3.5 text-left transition-colors
              ${i > 0 ? 'border-t sm:border-t-0 sm:border-l border-border/70' : ''}
              ${isActive ? 'bg-foreground text-background' : 'bg-card hover:bg-muted/40'}
            `}
          >
            <span
              className={`
                h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
                ${isActive
                  ? 'bg-amber-400 text-foreground'
                  : isDone
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-muted text-muted-foreground'
                }
              `}
            >
              {isDone ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </span>

            <div className="min-w-0">
              <div className={`text-sm font-semibold truncate ${isActive ? 'text-background' : 'text-foreground'}`}>
                {stage.label}
              </div>
              <div
                className={`
                  text-[11px] truncate
                  ${isActive ? 'text-background/70' : isDone ? 'text-emerald-700' : 'text-muted-foreground'}
                `}
              >
                {stage.summary}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   Step 1 — Prep
   ════════════════════════════════════════════════════════════════ */

function CandidateCard({ candidate, onOpenPack }) {
  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="font-bold text-sm">{candidate.name}</div>
            <div className="text-xs text-muted-foreground">{candidate.role}</div>
          </div>
          <StatusPill label={candidate.statusLabel} tone={candidate.tone} />
        </div>

        <div>
          <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-1">
            Strengths
          </div>
          <ul className="space-y-0.5">
            {candidate.strengths.map((s, idx) => (
              <li key={idx} className="text-xs flex items-start gap-1.5">
                <span className="text-muted-foreground/50 mt-0.5">•</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>

        {candidate.flags?.length > 0 && (
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-1">
              Flags
            </div>
            <ul className="space-y-0.5">
              {candidate.flags.map((f, idx) => (
                <li key={idx} className="text-xs text-amber-700 flex items-start gap-1.5">
                  <span className="text-amber-400 mt-0.5">•</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5" /> {candidate.ai_probes} AI probes
          </span>
          <button
            type="button"
            className="text-xs font-semibold text-primary hover:underline"
            onClick={() => onOpenPack(candidate)}
          >
            Open pack
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

function PrepStep({ onAdvance, nextLabel }) {
  const { candidates } = DUMMY.prep;
  const packsReady = candidates.length;
  const needsReview = candidates.filter((c) => c.needs_probe_review).length;

  const handleOpenPack = (candidate) => {
    // TODO: wire to the real candidate pack route once it exists.
    console.log('Open pack for', candidate.name);
  };

  return (
    <StepCard
      icon={FileText}
      title="Prep · Briefing Pack"
      subtitle="Auto-generated brief with CV summary, strengths, flags, AI-suggested probes, and the rubric. Email to interviewer or print before the loop."
      headerRight={
        <>
          <button type="button" className="hover:underline">Preview pack</button>
          <button type="button" className="hover:underline flex items-center gap-1.5">
            <Mail className="h-3.5 w-3.5" /> Email to interviewer
          </button>
        </>
      }
      footerLeft={
        <span>
          {packsReady} candidate{packsReady === 1 ? '' : 's'} with packs ready
          {needsReview > 0 && ` · ${needsReview} needs probe review`}
        </span>
      }
      footerRight={nextLabel && <NextLink label={nextLabel} onClick={onAdvance} />}
    >
      <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        {candidates.map((c) => (
          <CandidateCard key={c.id} candidate={c} onOpenPack={handleOpenPack} />
        ))}
      </div>
    </StepCard>
  );
}

/* ════════════════════════════════════════════════════════════════
   Step 2 — Schedule
   ════════════════════════════════════════════════════════════════ */

function ScheduleStep({ onAdvance, nextLabel }) {
  const { loops } = DUMMY.schedule;
  const confirmed = loops.filter((l) => l.tone === 'success').length;
  const pending = loops.length - confirmed;

  return (
    <StepCard
      icon={Calendar}
      title="Schedule · Loops & panels"
      subtitle="Confirmed loops, pending invites, and reschedule conflicts in one view."
      footerLeft={
        <span>
          {confirmed} of {loops.length} confirmed
          {pending > 0 && ` · ${pending} awaiting interviewer accept`}
        </span>
      }
      footerRight={nextLabel && <NextLink label={nextLabel} onClick={onAdvance} />}
    >
      <Table>
        <TableHeader className="bg-muted/20">
          <TableRow>
            <TableHead className="text-[10px] font-bold uppercase pl-6">Candidate</TableHead>
            <TableHead className="text-[10px] font-bold uppercase">Loop</TableHead>
            <TableHead className="text-[10px] font-bold uppercase">Interviewer(s)</TableHead>
            <TableHead className="text-[10px] font-bold uppercase">When</TableHead>
            <TableHead className="text-[10px] font-bold uppercase pr-6">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loops.map((loop) => (
            <TableRow key={loop.id}>
              <TableCell className="text-xs font-bold pl-6">{loop.candidate}</TableCell>
              <TableCell className="text-xs text-muted-foreground">{loop.loop}</TableCell>
              <TableCell className="text-xs text-muted-foreground">{loop.interviewers}</TableCell>
              <TableCell className="text-xs text-muted-foreground">{loop.when}</TableCell>
              <TableCell className="pr-6">
                <StatusPill label={loop.statusLabel} tone={loop.tone} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </StepCard>
  );
}

/* ════════════════════════════════════════════════════════════════
   Step 3 — Conduct
   ════════════════════════════════════════════════════════════════ */

function ConductStep({ onAdvance, nextLabel }) {
  const data = DUMMY.conduct;
  const [competencies, setCompetencies] = useState(data.competencies);

  const toggleCompetency = (idx) => {
    setCompetencies((prev) => prev.map((c, i) => (i === idx ? { ...c, covered: !c.covered } : c)));
  };

  const coveredCount = competencies.filter((c) => c.covered).length;
  const remaining = competencies.length - coveredCount;
  const notesText = data.notes.map((n) => `• ${n}`).join('\n');

  return (
    <StepCard
      icon={Video}
      title={`Conduct · Live interview · ${data.candidateName}`}
      subtitle="Live coverage tracker, time remaining, and notes — all in one view. Reminder triggers if untouched competencies remain at the 5-min warning."
      headerRight={
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <Clock className="h-3.5 w-3.5" /> {data.elapsedMinutes}/{data.totalMinutes} min
        </span>
      }
      footerLeft={
        <span className={remaining > 0 ? 'text-amber-700 font-semibold' : 'text-emerald-700 font-semibold'}>
          {coveredCount} of {competencies.length} competencies covered — push for the rest before the 5-min mark
        </span>
      }
      footerRight={nextLabel && <NextLink label="End & write scorecard" onClick={onAdvance} />}
    >
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Coverage tracker */}
        <div className="border rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/20">
            <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
              Coverage tracker · {data.interviewId}
            </span>
            <span className="text-[10px] text-muted-foreground">Tap to mark</span>
          </div>

          {competencies.map((c, idx) => (
            <button
              key={c.name}
              type="button"
              onClick={() => toggleCompetency(idx)}
              className="w-full flex items-start gap-3 px-4 py-3 border-b last:border-b-0 text-left hover:bg-muted/20 transition-colors"
            >
              <span
                className={`
                  mt-0.5 h-5 w-5 rounded flex items-center justify-center flex-shrink-0 border
                  ${c.covered ? 'bg-emerald-700 border-emerald-700 text-white' : 'border-border'}
                `}
              >
                {c.covered && <Check className="h-3 w-3" />}
              </span>
              <div>
                <div className="text-sm font-semibold">{c.name}</div>
                {c.description && <div className="text-xs text-muted-foreground">{c.description}</div>}
              </div>
            </button>
          ))}

          {remaining > 0 && (
            <div className="m-4 flex items-start gap-2 px-3 py-2.5 rounded-lg border border-amber-200 bg-amber-50 text-xs text-amber-800">
              <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
              <span>{remaining} competencies untouched. {data.minutesRemaining} min remaining.</span>
            </div>
          )}
        </div>

        {/* Live notes */}
        <div className="border rounded-lg overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b bg-muted/20">
            <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
              Live notes
            </span>
          </div>
          <Textarea
            defaultValue={notesText}
            className="flex-1 min-h-[220px] border-0 rounded-none resize-none text-xs focus-visible:ring-0"
          />
          <div className="flex items-center gap-4 px-4 py-3 border-t text-sm font-medium">
            <button type="button" className="hover:underline flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" /> Insert AI probe
            </button>
            <button type="button" className="hover:underline flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" /> Time-stamp note
            </button>
          </div>
        </div>

      </div>
    </StepCard>
  );
}

/* ════════════════════════════════════════════════════════════════
   Step 4 — Evaluate
   ════════════════════════════════════════════════════════════════ */

function EvaluateStep({ onAdvance, nextLabel }) {
  const data = DUMMY.evaluate;

  const rows = data.rows.map((r) => {
    const delta = Math.abs(r.scorerA - r.scorerB);
    const flagged = delta > 1;
    return { ...r, delta, flagged };
  });

  const avg = rows.reduce((sum, r) => sum + (r.scorerA + r.scorerB) / 2, 0) / rows.length;
  const flaggedRow = rows.find((r) => r.flagged);

  return (
    <StepCard
      icon={Circle}
      title={`Evaluate · ${data.candidateName} · ${data.scorersIn} scorers in`}
      subtitle="Per-competency scores, side-by-side. Disagreements >1 point trigger a calibration banner."
      headerRight={
        <>
          <button type="button" className="hover:underline">Open transcript</button>
          <button type="button" className="hover:underline">Submit panel</button>
        </>
      }
      footerLeft={
        <span className="px-2 py-1 rounded bg-emerald-50 text-emerald-800 font-semibold">
          Avg {avg.toFixed(1)} / {rows[0]?.max ?? 4} · Recommended verdict: {data.recommendedVerdict}
        </span>
      }
      footerRight={nextLabel && <NextLink label={nextLabel} onClick={onAdvance} />}
    >
      <div>
        {flaggedRow && (
          <div className="m-6 mb-0 flex items-start justify-between gap-4 px-4 py-3 rounded-lg border border-amber-200 bg-amber-50 text-amber-800">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <div className="text-xs">
                <div className="font-bold">Calibration needed · {data.interviewId}</div>
                <div className="mt-0.5">
                  2 scorers disagree on <strong>{flaggedRow.competency}</strong> by more than 1 point
                  {' '}({flaggedRow.scorerA} vs {flaggedRow.scorerB}). {data.calibrationNote}
                </div>
              </div>
            </div>
            <button type="button" className="text-xs font-semibold hover:underline flex-shrink-0">
              Open compare
            </button>
          </div>
        )}

        <Table>
          <TableHeader className="bg-muted/20">
            <TableRow>
              <TableHead className="text-[10px] font-bold uppercase pl-6">Competency</TableHead>
              <TableHead className="text-[10px] font-bold uppercase text-center">Scorer A</TableHead>
              <TableHead className="text-[10px] font-bold uppercase text-center">Scorer B</TableHead>
              <TableHead className="text-[10px] font-bold uppercase text-center">Δ</TableHead>
              <TableHead className="text-[10px] font-bold uppercase pr-6">Verdict</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.competency} className={r.flagged ? 'bg-amber-50/60' : ''}>
                <TableCell className="text-xs font-bold pl-6">{r.competency}</TableCell>
                <TableCell className="text-xs text-center font-mono">{r.scorerA} / {r.max}</TableCell>
                <TableCell className="text-xs text-center font-mono">{r.scorerB} / {r.max}</TableCell>
                <TableCell className={`text-xs text-center font-mono ${r.flagged ? 'font-bold text-amber-700' : 'text-muted-foreground'}`}>
                  {r.delta}
                </TableCell>
                <TableCell className="pr-6">
                  <StatusPill label={r.flagged ? '! Calibrate' : '✓ OK'} tone={r.flagged ? 'warning' : 'success'} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </StepCard>
  );
}

/* ════════════════════════════════════════════════════════════════
   Step 5 — Decide
   ════════════════════════════════════════════════════════════════ */

function DecideStep() {
  const data = DUMMY.decide;

  const handleReject = () => {
    // TODO: wire to the real reject action once it exists.
    console.log('Reject', data.candidateName);
  };
  const handleAdvance = () => {
    // TODO: wire to the real advance-to-Assess action once it exists.
    console.log('Advance to Assess', data.candidateName);
  };

  return (
    <StepCard
      icon={Check}
      title="Decide · Loop verdict"
      subtitle="Roll-up of scorecards, panel verdict, and next-stage recommendation."
      footerLeft={<StatusPill label={data.finalBadgeLabel} tone="warning" />}
      footerRight={
        <>
          <Button variant="outline" size="sm" className="text-xs" onClick={handleReject}>
            Reject
          </Button>
          <Button size="sm" className="text-xs" onClick={handleAdvance}>
            Advance to Assess <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
          </Button>
        </>
      }
    >
      <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border rounded-lg p-4">
          <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-2">
            Panel average
          </div>
          <div className="font-serif text-3xl font-bold">{data.panelAverage} / {data.maxScore}</div>
          <div className="text-xs text-muted-foreground mt-1">Threshold: {data.threshold} to advance</div>
        </div>

        <div className="border rounded-lg p-4">
          <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-2">
            Panel verdict
          </div>
          <StatusPill label={data.verdict} tone="warning" />
          <p className="text-xs text-muted-foreground mt-2">{data.verdictNote}</p>
        </div>

        <div className="border rounded-lg p-4">
          <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-2">
            Recommended next
          </div>
          <div className="text-sm font-bold">{data.recommendedNext.title}</div>
          <div className="text-xs text-muted-foreground mt-1">{data.recommendedNext.subtitle}</div>
        </div>
      </div>
    </StepCard>
  );
}

/* ════════════════════════════════════════════════════════════════
   Page
   ════════════════════════════════════════════════════════════════ */

export default function InterviewPage() {
  const { job, stages, defaultStage } = DUMMY;
  const [activeKey, setActiveKey] = useState(defaultStage);
  const navigate = useNavigate();

  const activeIndex = stages.findIndex((s) => s.key === activeKey);
  const nextStage = stages[activeIndex + 1];
  const goToNext = () => nextStage && setActiveKey(nextStage.key);

  return (
    <div className="space-y-5 p-6">

      {/* Job context card */}
      <Card>
        <CardContent className="flex items-start justify-between gap-4 flex-wrap py-4">
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Job</div>
              <div className="text-sm font-bold">{job.job_id} · {job.job_title}</div>
            </div>
          </div>

          <div className="flex items-center gap-6 text-xs">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Status</div>
              <div className="font-semibold">{job.status}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Hired</div>
              <div className="font-semibold">{job.hired}/{job.total_slots}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Deadline</div>
              <div className="font-semibold">{job.deadline}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Days open</div>
              <div className="font-semibold text-emerald-700">{job.days_open}d</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="text-xs" onClick={() => navigate('/sourcing/job-management')}>Job page</Button>
            <Button variant="outline" size="sm" className="text-xs" onClick={() => navigate('/candidate-pipeline')}>Pipeline</Button>
          </div>
        </CardContent>
      </Card>

      {/* Sub-stage stepper */}
      <StageStepper stages={stages} activeKey={activeKey} onSelect={setActiveKey} />

      {/* Active step content */}
      {activeKey === 'prep' && <PrepStep onAdvance={goToNext} nextLabel={nextStage?.label} />}
      {activeKey === 'schedule' && <ScheduleStep onAdvance={goToNext} nextLabel={nextStage?.label} />}
      {activeKey === 'conduct' && <ConductStep onAdvance={goToNext} nextLabel={nextStage?.label} />}
      {activeKey === 'evaluate' && <EvaluateStep onAdvance={goToNext} nextLabel={nextStage?.label} />}
      {activeKey === 'decide' && <DecideStep />}

    </div>
  );
}