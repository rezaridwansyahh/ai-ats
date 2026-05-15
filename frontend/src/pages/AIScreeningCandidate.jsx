import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Loader2, AlertTriangle, ArrowLeft, ArrowRight, Check, Sparkles,
  Briefcase, MapPin, GraduationCap, FileText, Wand2, ShieldCheck,
  ThumbsUp, ThumbsDown, Pause, MessageSquare,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';

import { getScreening, setScreeningDecision } from '@/api/screening.api';

/* ─── Engine config (mirrors the spec) ─── */
const ENGINES = [
  { key: 'parse', label: 'Parse',  sub: 'extract CV',  icon: FileText },
  { key: 'match', label: 'Match',  sub: 'score fit',   icon: Wand2 },
  { key: 'qa',    label: 'Q&A',    sub: 'follow-up',   icon: MessageSquare, comingSoon: true },
];

function scoreColor(score) {
  if (score == null) return 'bg-gray-100 text-gray-500 border-gray-200';
  if (score >= 80) return 'bg-emerald-100 text-emerald-700 border-emerald-200';
  if (score >= 60) return 'bg-amber-100 text-amber-700 border-amber-200';
  return 'bg-rose-100 text-rose-700 border-rose-200';
}

function fmt(d) {
  if (!d) return '—';
  try { return new Date(d).toISOString().slice(0, 10); } catch { return '—'; }
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

  useEffect(() => { load(); }, [screeningId]);

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
          overall_score, facets } = data;

  const currentEngineIdx = ENGINES.findIndex((e) => e.key === (engine === 'done' ? 'match' : engine));
  const initials = (candidate_name || '?').split(/\s+/).map((s) => s[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="space-y-5 p-6 max-w-[1100px]">
      {/* Back + decision pill */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate(`/selection/ai-screening/job/${job_id}`)}>
          <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back to position
        </Button>
        {decision && (
          <Badge variant="outline" className={`text-[10px] uppercase tracking-wide ${
            decision === 'advance' ? 'border-emerald-300 text-emerald-700 bg-emerald-50' :
            decision === 'hold'    ? 'border-amber-300 text-amber-700 bg-amber-50' :
                                     'border-rose-300 text-rose-700 bg-rose-50'
          }`}>
            {decision} · {fmt(decided_at)}
          </Badge>
        )}
      </div>

      {/* Header card */}
      <Card>
        <CardContent className="py-4 px-5 flex items-center gap-4 flex-wrap">
          <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold flex-shrink-0">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-bold tracking-tight truncate">{candidate_name || `Applicant #${applicant_id}`}</h1>
            <div className="text-[11px] text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
              <Link to={`/selection/ai-screening/job/${job_id}`} className="hover:text-primary inline-flex items-center gap-1">
                <Briefcase className="h-3 w-3" /> {job_title}
              </Link>
              {job_location && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {job_location}</span>}
              {work_type && <span>· {work_type}</span>}
              {seniority_level && <span>· {seniority_level}</span>}
              {applied_at && <span>· applied {fmt(applied_at)}</span>}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge className={`text-base font-bold ${scoreColor(overall_score)}`}>
              <Sparkles className="h-3.5 w-3.5 mr-1" />
              {overall_score ?? '—'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Stepper — three engine pills */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-center gap-0">
            {ENGINES.map((eng, idx) => {
              const Icon = eng.icon;
              const isDone =
                (engine === 'match' && idx === 0) ||
                (engine === 'done'  && idx <= 1);
              const isOn = eng.key === activeEngine;
              const isLast = idx === ENGINES.length - 1;
              return (
                <div key={eng.key} className="flex items-center">
                  <button
                    type="button"
                    onClick={() => setActiveEngine(eng.key)}
                    className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
                      isOn ? 'bg-primary/10' : 'hover:bg-muted/40'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-mono font-bold ${
                      isDone
                        ? 'bg-emerald-500 text-white'
                        : isOn
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                    }`}>
                      {isDone ? <Check className="h-3.5 w-3.5" /> : (idx + 1)}
                    </div>
                    <span className={`text-[10px] font-semibold uppercase tracking-wide ${
                      isOn ? 'text-primary' : isDone ? 'text-emerald-700' : 'text-muted-foreground'
                    }`}>
                      {eng.label}
                    </span>
                    <span className="text-[9px] text-muted-foreground">{eng.sub}</span>
                  </button>
                  {!isLast && (
                    <div className={`w-12 h-0.5 mx-1 ${idx < currentEngineIdx ? 'bg-emerald-500' : 'bg-border'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Stale rubric warning */}
      {rubric_is_stale && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-amber-200 bg-amber-50 text-xs text-amber-700">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          <span>Rubric has changed since this candidate was scored — score may be stale. Rescore from the position page.</span>
        </div>
      )}

      {/* Engine panel */}
      {activeEngine === 'parse' && <ParsePanel facets={facets} />}
      {activeEngine === 'match' && <MatchPanel data={data} />}
      {activeEngine === 'qa'    && <QAPanel />}

      {/* Decision bar */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            Decision
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {existingReason && (
            <div className="text-[11px] text-muted-foreground italic px-3 py-2 rounded-md bg-muted/30 border">
              "{existingReason}"
            </div>
          )}
          {decisionDraft ? (
            <>
              <Textarea
                placeholder={`Why ${decisionDraft}? (optional)`}
                value={decisionReason}
                onChange={(e) => setDecisionReason(e.target.value)}
                rows={2}
                className="text-xs"
              />
              <div className="flex items-center gap-2 justify-end">
                <Button variant="ghost" size="sm" className="text-xs" onClick={() => { setDecisionDraft(null); setDecisionReason(''); }} disabled={saving}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="text-xs"
                  onClick={() => handleDecide(decisionDraft)}
                  disabled={saving}
                >
                  {saving ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : null}
                  Confirm {decisionDraft}
                </Button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              <Button variant="outline" size="sm" className="text-xs" onClick={() => setDecisionDraft('advance')}>
                <ThumbsUp className="h-3.5 w-3.5 mr-1.5 text-emerald-600" /> Advance
              </Button>
              <Button variant="outline" size="sm" className="text-xs" onClick={() => setDecisionDraft('hold')}>
                <Pause className="h-3.5 w-3.5 mr-1.5 text-amber-600" /> Hold
              </Button>
              <Button variant="outline" size="sm" className="text-xs" onClick={() => setDecisionDraft('reject')}>
                <ThumbsDown className="h-3.5 w-3.5 mr-1.5 text-rose-600" /> Reject
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ─────────── Parse panel ─────────── */
function ParsePanel({ facets }) {
  if (!facets) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" /> Parse
          </CardTitle>
        </CardHeader>
        <CardContent className="py-8 text-center text-xs text-muted-foreground italic">
          CV not parsed yet. Trigger parse from the position page (Match lane shows once parsed).
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

/* ─────────── Match panel ─────────── */
function MatchPanel({ data }) {
  const { score_id, overall_score, skills_score, experience_score, career_trajectory_score, education_score,
          matched_skills, missing_skills, score_summary, role_profile, scored_at,
          required_skills, preferred_skills } = data;

  if (!score_id) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Wand2 className="h-4 w-4 text-primary" /> Match
          </CardTitle>
        </CardHeader>
        <CardContent className="py-8 text-center text-xs text-muted-foreground italic">
          Not scored yet. Run AI Matching from the position page (Match lane).
        </CardContent>
      </Card>
    );
  }

  const matched = Array.isArray(matched_skills) ? matched_skills : [];
  const missing = Array.isArray(missing_skills) ? missing_skills : [];

  return (
    <Card>
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-sm flex items-center gap-2">
          <Wand2 className="h-4 w-4 text-primary" /> Match — fit breakdown
        </CardTitle>
        <span className="text-[10px] text-muted-foreground">
          scored {fmt(scored_at)}{role_profile ? ` · ${role_profile}` : ''}
        </span>
      </CardHeader>
      <CardContent className="space-y-4">
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

        {(Array.isArray(required_skills) && required_skills.length > 0) && (
          <div className="text-[10px] text-muted-foreground">
            <span className="font-semibold uppercase tracking-wide">JD required: </span>
            {required_skills.join(', ')}
            {Array.isArray(preferred_skills) && preferred_skills.length > 0 && (
              <>
                <br />
                <span className="font-semibold uppercase tracking-wide">JD preferred: </span>
                {preferred_skills.join(', ')}
              </>
            )}
          </div>
        )}
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

/* ─────────── QA panel (stub) ─────────── */
function QAPanel() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary" /> Q&A
        </CardTitle>
      </CardHeader>
      <CardContent className="py-8 text-center text-xs text-muted-foreground italic">
        Q&A engine arrives in a future release. Borderline candidates (60–82 fit) will receive 3–5 follow-up questions here.
      </CardContent>
    </Card>
  );
}
