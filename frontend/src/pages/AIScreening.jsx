import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  Sparkles, Briefcase, Loader2, Plus, X, AlertTriangle, Wand2,
  GraduationCap, Target, TrendingUp, Code2, Info,
  ArrowRight, Check, ChevronUp, ChevronDown,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';

import { getJobs } from '@/api/job.api';
import { getRubric, runMatching, getCalibration, advanceBulk } from '@/api/screening.api';

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

function scoreColor(score) {
  if (score == null) return 'text-muted-foreground';
  if (score >= 80) return 'text-emerald-700';
  if (score >= 60) return 'text-amber-700';
  return 'text-rose-700';
}

function scoreBg(score) {
  if (score == null) return 'bg-gray-100 text-gray-500 border-gray-200';
  if (score >= 80) return 'bg-emerald-100 text-emerald-700 border-emerald-200';
  if (score >= 60) return 'bg-amber-100 text-amber-700 border-amber-200';
  return 'bg-rose-100 text-rose-700 border-rose-200';
}

function recommendation(score) {
  if (score == null) return { label: 'Awaiting score', tone: 'bg-muted text-muted-foreground border-border' };
  if (score >= 90) return { label: 'Strong advance', tone: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  if (score >= 80) return { label: 'Advance',         tone: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  if (score >= 60) return { label: 'Hold · borderline', tone: 'bg-amber-50 text-amber-700 border-amber-200' };
  return                  { label: 'Reject · below threshold', tone: 'bg-rose-50 text-rose-700 border-rose-200' };
}

export default function AIScreeningPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { jobId: jobIdParam } = useParams();
  const [jobs, setJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [selectedJobId, setSelectedJobId] = useState(
    jobIdParam ? Number(jobIdParam) : null
  );
  const selectedJob = useMemo(
    () => jobs.find((j) => j.id === selectedJobId) || null,
    [jobs, selectedJobId]
  );

  const [roleProfile, setRoleProfile] = useState('experienced');
  const [rubric, setRubric] = useState(DEFAULT_RUBRIC);
  const [customDraftDesc, setCustomDraftDesc] = useState('');
  const [customDraftWeight, setCustomDraftWeight] = useState(5);

  const [running, setRunning] = useState(false);
  const [error, setError] = useState(null);

  // Cohort state (merged from former Calibration page)
  const [cohortRows, setCohortRows] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [sortKey, setSortKey] = useState('overall_score');
  const [sortDir, setSortDir] = useState('desc');
  const [reason, setReason] = useState('');
  const [advancing, setAdvancing] = useState(false);
  const [resultBanner, setResultBanner] = useState(null);

  const cohortRef = useRef(null);
  const hashHandled = useRef(false);

  // Load jobs
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setJobsLoading(true);
      try {
        const res = await getJobs();
        const list = res.data.jobs || res.data || [];
        if (!cancelled) setJobs(Array.isArray(list) ? list : []);
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || err.message || 'Failed to load jobs');
      } finally {
        if (!cancelled) setJobsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const loadCohort = useCallback(async () => {
    if (!selectedJobId) {
      setCohortRows([]);
      return;
    }
    try {
      const res = await getCalibration(selectedJobId);
      setCohortRows(Array.isArray(res.data?.rows) ? res.data.rows : []);
    } catch {
      setCohortRows([]);
    }
  }, [selectedJobId]);

  // Load rubric + cohort for selected job
  useEffect(() => {
    if (!selectedJobId) {
      setRubric(DEFAULT_RUBRIC);
      setCohortRows([]);
      setSelected(new Set());
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const [rubricRes, calRes] = await Promise.all([
          getRubric(selectedJobId),
          getCalibration(selectedJobId),
        ]);
        if (cancelled) return;

        if (rubricRes.data?.rubric?.fixed_criteria) {
          setRubric({
            fixed_criteria: { ...DEFAULT_RUBRIC.fixed_criteria, ...rubricRes.data.rubric.fixed_criteria },
            custom_criteria: Array.isArray(rubricRes.data.rubric.custom_criteria) ? rubricRes.data.rubric.custom_criteria : [],
          });
        } else {
          setRubric(DEFAULT_RUBRIC);
        }

        setCohortRows(Array.isArray(calRes.data?.rows) ? calRes.data.rows : []);
        setSelected(new Set());
      } catch {
        if (!cancelled) {
          setRubric(DEFAULT_RUBRIC);
          setCohortRows([]);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [selectedJobId]);

  // Hash-scroll: when arriving via /job/:id#cohort, scroll once after cohort renders
  useEffect(() => {
    if (location.hash !== '#cohort' || hashHandled.current) return;
    if (cohortRows.length === 0) return;
    hashHandled.current = true;
    const t = setTimeout(() => {
      cohortRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
    return () => clearTimeout(t);
  }, [location.hash, cohortRows.length]);

  const total = totalWeight(rubric);
  const totalIs100 = Math.round(total) === 100;

  const setFixedWeight = (key, weight) => {
    setRubric((r) => ({
      ...r,
      fixed_criteria: { ...r.fixed_criteria, [key]: { ...r.fixed_criteria[key], weight } },
    }));
  };

  const addCustom = () => {
    const desc = customDraftDesc.trim();
    if (!desc) return;
    const weight = Math.max(0, Math.min(100, Number(customDraftWeight) || 0));
    setRubric((r) => ({
      ...r,
      custom_criteria: [...(r.custom_criteria || []), { description: desc, weight }],
    }));
    setCustomDraftDesc('');
    setCustomDraftWeight(5);
  };

  const removeCustom = (idx) => {
    setRubric((r) => ({
      ...r,
      custom_criteria: (r.custom_criteria || []).filter((_, i) => i !== idx),
    }));
  };

  const setCustomWeight = (idx, weight) => {
    setRubric((r) => ({
      ...r,
      custom_criteria: (r.custom_criteria || []).map((c, i) =>
        i === idx ? { ...c, weight } : c
      ),
    }));
  };

  const handleRun = useCallback(async () => {
    if (!selectedJobId || !totalIs100 || running) return;
    setRunning(true);
    setError(null);
    setResultBanner(null);
    try {
      const res = await runMatching(selectedJobId, { rubric, role_profile: roleProfile });
      const { scored = 0, total_candidates = 0, errors = [] } = res.data || {};
      await loadCohort();
      setSelected(new Set());
      setResultBanner({
        ok: errors.length === 0,
        text: `Scored ${scored} of ${total_candidates} candidates${errors.length ? ` · ${errors.length} errors` : ''}`,
      });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'AI matching failed');
    } finally {
      setRunning(false);
    }
  }, [selectedJobId, rubric, roleProfile, running, totalIs100, loadCohort]);

  // Cohort sort + selection
  const sortedRows = useMemo(() => {
    const list = [...cohortRows];
    list.sort((a, b) => {
      const av = a[sortKey] ?? -1;
      const bv = b[sortKey] ?? -1;
      const diff = av === bv ? a.screening_id - b.screening_id : (av < bv ? -1 : 1);
      return sortDir === 'desc' ? -diff : diff;
    });
    return list;
  }, [cohortRows, sortKey, sortDir]);

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    else { setSortKey(key); setSortDir('desc'); }
  };

  const allSelected = sortedRows.length > 0 && sortedRows.every((r) => selected.has(r.screening_id));
  const toggleAll = () => {
    setSelected(allSelected ? new Set() : new Set(sortedRows.map((r) => r.screening_id)));
  };

  const toggle = (id) => {
    setSelected((cur) => {
      const next = new Set(cur);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleAdvance = async () => {
    if (selected.size === 0 || advancing) return;
    setAdvancing(true);
    setError(null);
    setResultBanner(null);
    try {
      const res = await advanceBulk(selectedJobId, [...selected], { decision_reason: reason || undefined });
      const { advanced = [], skipped = [], errors = [], interview_ids = [] } = res.data || {};
      setResultBanner({
        ok: errors.length === 0,
        text: `${advanced.length} advanced · ${skipped.length} skipped · ${errors.length} errors · ${interview_ids.length} interview rows created`,
      });
      setSelected(new Set());
      setReason('');
      await loadCohort();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Advance-bulk failed');
    } finally {
      setAdvancing(false);
    }
  };

  const requiredSkills = Array.isArray(selectedJob?.required_skills) ? selectedJob.required_skills : [];
  const preferredSkills = Array.isArray(selectedJob?.preferred_skills) ? selectedJob.preferred_skills : [];

  return (
    <div className="space-y-5 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" /> AI Screening
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Pick a job, set the rubric, score every candidate in its pipeline, then advance the top performers to Interview.
        </p>
      </div>

      {/* Job picker */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">1. Select Job</CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={selectedJobId ? String(selectedJobId) : ''}
            onValueChange={(v) => setSelectedJobId(Number(v))}
            disabled={jobsLoading}
          >
            <SelectTrigger className="w-full max-w-md text-xs">
              <SelectValue placeholder={jobsLoading ? 'Loading jobs...' : 'Choose a job'} />
            </SelectTrigger>
            <SelectContent>
              {jobs.map((j) => (
                <SelectItem key={j.id} value={String(j.id)}>
                  {j.job_title} {j.status ? `· ${j.status}` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedJob && (
            <div className="mt-3 text-xs text-muted-foreground">
              <span className="font-medium">{selectedJob.job_title}</span>
              {selectedJob.job_location && <> · {selectedJob.job_location}</>}
              {selectedJob.work_type && <> · {selectedJob.work_type}</>}
              {selectedJob.seniority_level && <> · {selectedJob.seniority_level}</>}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedJob && (
        <>
          {/* Role profile */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">2. Role Profile</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-3">
              {[
                { value: 'experienced', label: 'Experienced', desc: 'Years, role progression, prior responsibilities matter.' },
                { value: 'fresh_graduate', label: 'Fresh Graduate', desc: 'Lack of senior titles will not penalize. Education weighed higher.' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setRoleProfile(opt.value)}
                  className={`flex-1 text-left px-4 py-3 rounded-lg border transition-colors ${
                    roleProfile === opt.value
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:bg-muted/30'
                  }`}
                >
                  <div className="text-xs font-semibold">{opt.label}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">{opt.desc}</div>
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Required + Preferred Skills (read-only from job) */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">3. Skills (from job)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="text-[11px] font-medium text-muted-foreground uppercase mb-1">Required</div>
                <div className="flex flex-wrap gap-1">
                  {requiredSkills.length === 0 && <span className="text-[10px] text-muted-foreground">None set on this job.</span>}
                  {requiredSkills.map((s) => (
                    <Badge key={s} className="text-[10px] bg-primary/10 text-primary border-primary/20">{s}</Badge>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-[11px] font-medium text-muted-foreground uppercase mb-1">Preferred</div>
                <div className="flex flex-wrap gap-1">
                  {preferredSkills.length === 0 && <span className="text-[10px] text-muted-foreground">None set on this job.</span>}
                  {preferredSkills.map((s) => (
                    <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>
                  ))}
                </div>
              </div>
              <div className="flex items-start gap-1.5 text-[10px] text-muted-foreground">
                <Info className="h-3 w-3 mt-0.5 shrink-0" />
                <span>The Skills criterion below scores candidates against these lists. Edit them on the job itself if needed.</span>
              </div>
            </CardContent>
          </Card>

          {/* Rubric: weights */}
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm">4. Criteria & Weights</CardTitle>
              <div className="flex items-center gap-2">
                <Badge
                  className={`text-[10px] ${totalIs100 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}
                >
                  Total {Math.round(total)}%
                </Badge>
                <span className="text-[10px] text-muted-foreground">must equal 100%</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
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
                    <Slider
                      value={[weight]}
                      onValueChange={(v) => setFixedWeight(key, v[0])}
                      min={0}
                      max={100}
                      step={5}
                    />
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
                      <button
                        onClick={() => removeCustom(i)}
                        className="p-1 hover:bg-rose-50 rounded text-rose-600"
                        type="button"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                    <Slider
                      value={[c.weight]}
                      onValueChange={(v) => setCustomWeight(i, v[0])}
                      min={0}
                      max={50}
                      step={5}
                    />
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
                      type="number"
                      min={0}
                      max={100}
                      value={customDraftWeight}
                      onChange={(e) => setCustomDraftWeight(Number(e.target.value) || 0)}
                      className="text-xs h-9 w-20"
                    />
                  </div>
                  <Button size="sm" variant="outline" className="text-xs" onClick={addCustom} disabled={!customDraftDesc.trim()}>
                    <Plus className="h-3 w-3 mr-1" /> Add
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Run */}
          <div className="flex items-center justify-end gap-2">
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

          {error && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-lg border border-red-200 bg-red-50 text-sm text-red-600">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {resultBanner && (
            <div className={`flex items-center gap-2 px-4 py-3 rounded-lg border text-sm ${
              resultBanner.ok
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-amber-200 bg-amber-50 text-amber-700'
            }`}>
              <Check className="h-4 w-4 shrink-0" />
              {resultBanner.text}
            </div>
          )}

          {/* Ready cohort */}
          <Card ref={cohortRef} id="cohort">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">
                Ready cohort
                <span className="ml-2 text-[11px] font-normal text-muted-foreground">
                  {cohortRows.length} candidate{cohortRows.length === 1 ? '' : 's'} · select top performers to advance to Interview
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0 py-0">
              {running && cohortRows.length === 0 ? (
                <p className="py-10 text-center text-xs text-muted-foreground italic">
                  Scoring candidates with the LLM… this can take 30s+ for many candidates.
                </p>
              ) : cohortRows.length === 0 ? (
                <p className="py-10 text-center text-xs text-muted-foreground italic">
                  No candidates in the ready cohort. Run AI Matching above to score candidates.
                </p>
              ) : (
                <Table className="w-full">
                  <TableHeader className="bg-muted/40">
                    <TableRow>
                      <TableHead className="w-[36px] pl-4">
                        <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
                      </TableHead>
                      <TableHead className="text-[10px] font-bold uppercase">Candidate</TableHead>
                      <SortableHeader label="Fit"        col="overall_score"           sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} className="text-center" />
                      <SortableHeader label="Skills"     col="skills_score"            sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} className="text-center" />
                      <SortableHeader label="Exp"        col="experience_score"        sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} className="text-center" />
                      <SortableHeader label="Trajectory" col="career_trajectory_score" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} className="text-center" />
                      <SortableHeader label="Edu"        col="education_score"         sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} className="text-center" />
                      <TableHead className="text-[10px] font-bold uppercase">Recommendation</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase pr-4">Summary</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedRows.map((r) => {
                      const rec = recommendation(r.overall_score);
                      const isSel = selected.has(r.screening_id);
                      return (
                        <TableRow
                          key={r.screening_id}
                          onClick={() => navigate(`/selection/ai-screening/candidate/${r.screening_id}`)}
                          className={`cursor-pointer hover:bg-muted/30 transition-colors ${
                            isSel ? 'bg-primary/5' : ''
                          }`}
                        >
                          <TableCell className="pl-4" onClick={(e) => e.stopPropagation()}>
                            <Checkbox checked={isSel} onCheckedChange={() => toggle(r.screening_id)} />
                          </TableCell>
                          <TableCell className="text-xs">
                            <div className="font-medium truncate">{r.applicant_name || `#${r.applicant_id}`}</div>
                            <div className="text-[10px] text-muted-foreground truncate">
                              {r.last_position || '—'}
                              {r.rubric_is_stale && (
                                <Badge variant="outline" className="ml-1 text-[9px] border-amber-300 text-amber-700">stale</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className={`text-xs font-mono font-bold ${scoreBg(r.overall_score)}`}>
                              {r.overall_score ?? '—'}
                            </Badge>
                          </TableCell>
                          <TableCell className={`text-center text-xs font-mono ${scoreColor(r.skills_score)}`}>{r.skills_score ?? '—'}</TableCell>
                          <TableCell className={`text-center text-xs font-mono ${scoreColor(r.experience_score)}`}>{r.experience_score ?? '—'}</TableCell>
                          <TableCell className={`text-center text-xs font-mono ${scoreColor(r.career_trajectory_score)}`}>{r.career_trajectory_score ?? '—'}</TableCell>
                          <TableCell className={`text-center text-xs font-mono ${scoreColor(r.education_score)}`}>{r.education_score ?? '—'}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`text-[10px] ${rec.tone}`}>
                              {rec.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground pr-4 align-top whitespace-normal leading-snug">
                            {r.score_summary || '—'}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Advance action bar */}
          {cohortRows.length > 0 && (
            <Card>
              <CardContent className="py-4 space-y-3">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">{selected.size} selected</span>
                    {' '}· {cohortRows.length} ready · candidates without a decision
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      className="text-xs"
                      disabled={selected.size === 0 || advancing}
                      onClick={handleAdvance}
                    >
                      {advancing
                        ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Advancing…</>
                        : <>Advance {selected.size} to Interview <ArrowRight className="h-3.5 w-3.5 ml-1.5" /></>}
                    </Button>
                  </div>
                </div>
                <Textarea
                  placeholder="Optional reason (applies to all advanced candidates)…"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={2}
                  className="text-xs"
                />
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

function SortableHeader({ label, col, sortKey, sortDir, onClick, className }) {
  const active = sortKey === col;
  return (
    <TableHead
      className={`text-[10px] font-bold uppercase cursor-pointer select-none ${className || ''}`}
      onClick={() => onClick(col)}
    >
      <span className="inline-flex items-center gap-1 justify-center">
        {label}
        {active && (sortDir === 'desc' ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />)}
      </span>
    </TableHead>
  );
}
