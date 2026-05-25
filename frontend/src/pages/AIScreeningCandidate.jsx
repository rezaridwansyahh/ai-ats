import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Loader2, AlertTriangle, ArrowLeft, ArrowRight, Check,
  Briefcase, MapPin, GraduationCap, FileText, Wand2, ShieldCheck,
  ThumbsUp, ThumbsDown, Pause, MessageSquare,
  Plus, X, Target, TrendingUp, Code2, Info,
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

import { getScreening, setScreeningDecision, getRubric, runMatching } from '@/api/screening.api';
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
          facets } = data;

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
      {activeEngine === 'match' && <MatchPanel data={data} onScored={load} />}
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

/* ─────────── Match panel (rubric config + fit breakdown) ─────────── */
function MatchPanel({ data, onScored }) {
  const { score_id, overall_score, skills_score, experience_score, career_trajectory_score, education_score,
          matched_skills, missing_skills, score_summary, role_profile, scored_at,
          job_id, required_skills, preferred_skills } = data;

  const [roleProfileSel, setRoleProfileSel] = useState(role_profile || 'experienced');
  const [rubric, setRubric] = useState(DEFAULT_RUBRIC);
  const [customDraftDesc, setCustomDraftDesc] = useState('');
  const [customDraftWeight, setCustomDraftWeight] = useState(5);
  const [running, setRunning] = useState(false);
  const [runError, setRunError] = useState(null);

  // Load this job's saved rubric.
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

  const addCustom = () => {
    const desc = customDraftDesc.trim();
    if (!desc) return;
    const weight = Math.max(0, Math.min(100, Number(customDraftWeight) || 0));
    setRubric((rb) => ({ ...rb, custom_criteria: [...(rb.custom_criteria || []), { description: desc, weight }] }));
    setCustomDraftDesc('');
    setCustomDraftWeight(5);
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
                    <button onClick={() => removeCustom(i)} className="p-1 hover:bg-rose-50 rounded text-rose-600" type="button">
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
                    onKeyDown={(e) => { if (e.key === 'Enter' && customDraftDesc.trim()) { e.preventDefault(); addCustom(); } }}
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
                <Button size="sm" variant="outline" className="text-xs" onClick={addCustom} disabled={!customDraftDesc.trim()}>
                  <Plus className="h-3 w-3 mr-1" /> Add
                </Button>
              </div>
            </div>

            {/* Run */}
            <div className="flex items-center justify-end gap-2 pt-1">
              {!totalIs100 && (
                <span className="text-[11px] text-rose-600 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" /> Weights must total 100% (currently {Math.round(total)}%).
                </span>
              )}
              <Button onClick={handleRun} disabled={!totalIs100 || running} className="text-xs">
                {running ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5 mr-1.5" />}
                Run AI Matching
              </Button>
            </div>
            {runError && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-md border border-red-200 bg-red-50 text-xs text-red-600">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> {runError}
              </div>
            )}
          </div>

          {/* Fit breakdown OR not-scored hint */}
          {!score_id ? (
            <p className="border-t pt-4 text-center text-xs text-muted-foreground italic">
              Not scored yet. Configure the rubric above and Run AI Matching.
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

/* ─────────── QA panel (stub) ─────────── */
function QAPanel() {
  return (
    <Card className="overflow-hidden border shadow-sm">
      {/* Header */}
      <CardHeader className="space-y-4 border-b bg-muted/20">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <MessageSquare className="h-4 w-4 text-primary" />
            Follow-up Q&A
            <Badge
              variant="secondary"
              className="rounded-md text-[10px]"
            >
              auto-generated
            </Badge>
          </CardTitle>

          <div className="text-xs text-muted-foreground">
            ~Rp 18 / set · 22 sent · 14 responded · response rate 68%
          </div>
        </div>

        {/* Top Actions */}
        <div className="grid grid-cols-12 gap-3">
          <Button
            variant="outline"
            className="col-span-3 justify-start"
          >
            Response Inbox
            <Badge className="ml-2">24</Badge>
          </Button>

          <Button className="col-span-5">
            <Wand2 className="mr-2 h-4 w-4" />
            Generate
          </Button>

          <Button
            variant="outline"
            className="col-span-4"
          >
            Templates
          </Button>
        </div>
      </CardHeader>

      {/* Body */}
      <CardContent className="space-y-6 pt-6">
        {/* Controls */}
        <div className="space-y-3">
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
            Generate follow-up Q&A · tuned to JD + parsed CV
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {/* Focus */}
            <div className="space-y-2">
              <div className="text-xs font-medium">
                Focus Area
              </div>

              <Select defaultValue="motivation">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="motivation">
                    Motivation + availability
                  </SelectItem>

                  <SelectItem value="technical">
                    Technical depth
                  </SelectItem>

                  <SelectItem value="culture">
                    Culture fit
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Count */}
            <div className="space-y-2">
              <div className="text-xs font-medium">
                # Questions
              </div>

              <Select defaultValue="4">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="3">3</SelectItem>
                  <SelectItem value="4">4</SelectItem>
                  <SelectItem value="5">5</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Language */}
            <div className="space-y-2">
              <div className="text-xs font-medium">
                Language
              </div>

              <Select defaultValue="id-en">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="id-en">
                    Bahasa ID + EN
                  </SelectItem>

                  <SelectItem value="en">
                    English
                  </SelectItem>

                  <SelectItem value="id">
                    Bahasa Indonesia
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Questions */}
        <div className="rounded-xl border bg-muted/10 p-4">
          <div className="mb-4 flex items-center justify-between">
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
              Drafted Questions · click to edit
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
              >
                Regenerate
              </Button>

              <Button
                size="sm"
                variant="outline"
              >
                + Add custom
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            {questions.map((q, index) => (
              <div
                key={index}
                className="rounded-lg border bg-background p-4 transition hover:border-primary/40"
              >
                <div className="text-sm leading-relaxed">
                  <span className="font-semibold">
                    {index + 1}. {q.title}
                  </span>

                  <span className="text-muted-foreground">
                    {' '}
                    — {q.text}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col gap-3 border-t pt-4 md:flex-row md:items-center md:justify-between">
          <div className="text-xs text-muted-foreground">
            Cost ~Rp 18 per candidate · response window 48h
          </div>

          <div className="flex gap-2">
            <Button variant="outline">
              Preview email
            </Button>

            <Button>
              Send to candidate
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
