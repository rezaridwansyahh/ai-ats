import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Briefcase, MapPin, Loader2, X, Check, Sparkles, Users,
} from 'lucide-react';
import {
  Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

import { searchScreening, scoreBulkForJob } from '@/api/screening.api.js';
import { addApplicantToJob } from '@/api/candidate.api.js';

const STATUS_COLORS = {
  Draft: 'bg-orange-50 text-orange-600 border-orange-200',
  Active: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  Running: 'bg-blue-50 text-blue-600 border-blue-200',
  Expired: 'bg-gray-50 text-gray-500 border-gray-200',
  Failed: 'bg-red-50 text-red-500 border-red-200',
  Blocked: 'bg-gray-50 text-gray-500 border-gray-200',
};

const PAGE_SIZE = 10;
const POSITION_OPTIONS = ['Frontend', 'Backend', 'Full Stack', 'Mobile', 'Data', 'DevOps', 'Product Design', 'Product Management', 'QA', 'Recruiting'];
const TIER_OPTIONS = [
  { value: 'top', label: 'Top tier' },
  { value: 'mid', label: 'Mid tier' },
  { value: 'other', label: 'Other' },
];

function scoreColor(score) {
  if (score == null) return 'bg-gray-100 text-gray-500';
  if (score >= 80) return 'bg-emerald-100 text-emerald-700';
  if (score >= 60) return 'bg-amber-100 text-amber-700';
  return 'bg-rose-100 text-rose-700';
}

export default function ListCandidateStep({ selectedJob }) {
  const [mode, setMode] = useState('pool');
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [adding, setAdding] = useState({});

  const [searchName, setSearchName] = useState('');
  const [position, setPosition] = useState('all');
  const [skillInput, setSkillInput] = useState('');
  const [skills, setSkills] = useState([]);
  const [skillsMode, setSkillsMode] = useState('all');
  const [minYears, setMinYears] = useState(0);
  const [educationTier, setEducationTier] = useState('all');
  const [scoreRange, setScoreRange] = useState([0, 100]);
  const [page, setPage] = useState(1);

  const filteredRows = useMemo(() => {
    if (!searchName.trim()) return rows;
    const q = searchName.trim().toLowerCase();
    return rows.filter((r) => (r.name || '').toLowerCase().includes(q));
  }, [rows, searchName]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const fetchRows = useCallback(async () => {
    if (!selectedJob?.id) return;
    setLoading(true);
    try {
      const params = {
        mode,
        job_id: selectedJob.id,
        page,
        limit: PAGE_SIZE,
      };
      if (position !== 'all') params.position = position;
      if (skills.length) {
        params.skills = skills;
        params.skills_mode = skillsMode;
      }
      if (minYears > 0) params.min_years = minYears;
      if (educationTier !== 'all') params.education_tier = educationTier;
      if (mode === 'pipeline' && scoreRange[0] > 0) params.min_score = scoreRange[0];

      const res = await searchScreening(params);
      setRows(res.data.rows || []);
      setTotal(res.data.total || 0);
    } catch {
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [selectedJob?.id, mode, page, position, skills, skillsMode, minYears, educationTier, scoreRange]);

  useEffect(() => { fetchRows(); }, [fetchRows]);
  useEffect(() => { setPage(1); }, [mode, position, skills, skillsMode, minYears, educationTier, scoreRange]);

  const addSkill = () => {
    const v = skillInput.trim();
    if (!v) return;
    if (!skills.some((s) => s.toLowerCase() === v.toLowerCase())) {
      setSkills([...skills, v]);
    }
    setSkillInput('');
  };

  const removeSkill = (v) => setSkills(skills.filter((s) => s !== v));

  const handleAddToCandidate = async (applicantId) => {
    if (!selectedJob?.id) return;
    setAdding((s) => ({ ...s, [applicantId]: true }));
    try {
      await addApplicantToJob(applicantId, selectedJob.id);
      await fetchRows();
    } catch {
      // no-op
    } finally {
      setAdding((s) => ({ ...s, [applicantId]: false }));
    }
  };

  const handleBulkRescore = async () => {
    if (!selectedJob?.id) return;
    setBulkLoading(true);
    try {
      await scoreBulkForJob(selectedJob.id);
      await fetchRows();
    } catch {
      // no-op
    } finally {
      setBulkLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Job banner */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="py-4 px-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Briefcase className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold">{selectedJob?.job_title}</h3>
                  <Badge variant="outline" className={`text-[10px] px-2 py-0 ${STATUS_COLORS[selectedJob?.status] || ''}`}>
                    {selectedJob?.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                  {selectedJob?.job_location && (
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{selectedJob.job_location}</span>
                  )}
                  {selectedJob?.work_type && <span>{selectedJob.work_type}</span>}
                  {selectedJob?.work_option && <span>{selectedJob.work_option}</span>}
                </div>
              </div>
            </div>
            <span className="text-[10px] font-bold text-muted-foreground tracking-widest">STEP 4</span>
          </div>
        </CardContent>
      </Card>

      {/* Mode tabs */}
      <Card>
        <CardContent className="py-3 px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={mode === 'pool' ? 'default' : 'outline'}
              onClick={() => setMode('pool')}
              className="text-xs"
            >
              <Users className="h-3.5 w-3.5 mr-1" /> Applicant Pool
            </Button>
            <Button
              size="sm"
              variant={mode === 'pipeline' ? 'default' : 'outline'}
              onClick={() => setMode('pipeline')}
              className="text-xs"
            >
              <Sparkles className="h-3.5 w-3.5 mr-1" /> Candidate Pipeline
            </Button>
          </div>
          {mode === 'pipeline' && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleBulkRescore}
              disabled={bulkLoading}
              className="text-xs"
            >
              {bulkLoading ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 mr-1" />}
              Re-run AI Screening
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="py-4 px-4 space-y-3">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <label className="text-[11px] text-muted-foreground">Position</label>
              <Select value={position} onValueChange={setPosition}>
                <SelectTrigger className="w-[160px] text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All positions</SelectItem>
                  {POSITION_OPTIONS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1 flex-1 min-w-[260px]">
              <label className="text-[11px] text-muted-foreground">
                Skills ({skillsMode === 'all' ? 'must have all' : 'any of'})
              </label>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Type a skill and press Enter"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }}
                  className="text-xs"
                />
                <Select value={skillsMode} onValueChange={setSkillsMode}>
                  <SelectTrigger className="w-[100px] text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">AND</SelectItem>
                    <SelectItem value="any">OR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {skills.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {skills.map((s) => (
                    <Badge key={s} variant="secondary" className="text-[10px] gap-1 pr-1">
                      {s}
                      <button onClick={() => removeSkill(s)} className="hover:bg-muted rounded">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-muted-foreground">Min experience (yrs)</label>
              <Input
                type="number" min={0} max={30}
                value={minYears}
                onChange={(e) => setMinYears(Number(e.target.value) || 0)}
                className="w-[100px] text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-muted-foreground">Education tier</label>
              <Select value={educationTier} onValueChange={setEducationTier}>
                <SelectTrigger className="w-[140px] text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any</SelectItem>
                  {TIER_OPTIONS.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {mode === 'pipeline' && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] text-muted-foreground">Overall score range</label>
                <span className="text-[11px] font-medium">{scoreRange[0]} – {scoreRange[1]}</span>
              </div>
              <Slider
                value={scoreRange}
                onValueChange={setScoreRange}
                min={0}
                max={100}
                step={1}
                className="max-w-md"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">
              {mode === 'pool' ? 'All Applicants' : 'Candidates in Pipeline'}
            </CardTitle>
            <Input
              placeholder="Search by name..."
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              className="max-w-[240px] text-xs"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table className="table-fixed w-full">
            <TableCaption className="text-[10px]">
              {loading ? 'Loading...' : `${total} result${total === 1 ? '' : 's'}`}
            </TableCaption>
            <TableHeader className="bg-gray-100">
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Skills</TableHead>
                <TableHead className="w-[80px] text-center">Years</TableHead>
                <TableHead>Education</TableHead>
                {mode === 'pipeline' && <TableHead className="w-[90px] text-center">Score</TableHead>}
                <TableHead className="w-[140px] text-center">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRows.map((r) => {
                const info = r.information || {};
                const positionCategory = info.job_position?.category || '—';
                const skillTags = Array.isArray(info.skills) ? info.skills.slice(0, 4) : [];
                const moreSkills = (Array.isArray(info.skills) ? info.skills.length : 0) - skillTags.length;
                const years = info.experience?.years_total ?? '—';
                const eduTop = Array.isArray(info.education) && info.education[0] ? info.education[0] : null;

                return (
                  <TableRow key={r.applicant_id}>
                    <TableCell className="font-medium text-xs">{r.name}</TableCell>
                    <TableCell className="text-xs">
                      <div>{info.job_position?.current || r.last_position || '—'}</div>
                      <div className="text-[10px] text-muted-foreground">{positionCategory}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {skillTags.length === 0 && <span className="text-[10px] text-muted-foreground">No facets yet</span>}
                        {skillTags.map((s) => (
                          <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>
                        ))}
                        {moreSkills > 0 && <span className="text-[10px] text-muted-foreground">+{moreSkills}</span>}
                      </div>
                    </TableCell>
                    <TableCell className="text-center text-xs">{years}</TableCell>
                    <TableCell className="text-xs">
                      {eduTop ? (
                        <div>
                          <div>{eduTop.school}</div>
                          <div className="text-[10px] text-muted-foreground">
                            {eduTop.degree}{eduTop.tier && eduTop.tier !== 'other' ? ` · ${eduTop.tier}` : ''}
                          </div>
                        </div>
                      ) : (r.education_text || '—')}
                    </TableCell>
                    {mode === 'pipeline' && (
                      <TableCell className="text-center">
                        {r.overall_score != null ? (
                          <Badge className={`text-xs font-semibold ${scoreColor(r.overall_score)}`}>
                            {r.overall_score}
                          </Badge>
                        ) : (
                          <span className="text-[10px] text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    )}
                    <TableCell className="text-center">
                      {mode === 'pool' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          onClick={() => handleAddToCandidate(r.applicant_id)}
                          disabled={!!adding[r.applicant_id]}
                        >
                          {adding[r.applicant_id] ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Check className="h-3 w-3 mr-1" />Add</>}
                        </Button>
                      ) : (
                        <Button variant="ghost" size="sm" className="text-xs">View</Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {!loading && filteredRows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={mode === 'pipeline' ? 7 : 6} className="text-center text-xs text-muted-foreground py-6">
                    No results — try widening the filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
            <TableFooter />
          </Table>

          <div className="flex flex-col items-center gap-2 pt-3 border-t mt-3">
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" className="h-7 text-xs" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <span className="text-[11px] px-2">Page {page} of {totalPages}</span>
              <Button variant="outline" size="sm" className="h-7 text-xs" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
            </div>
            <span className="text-[10px] text-muted-foreground">
              {total > 0
                ? `Showing ${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, total)} of ${total}`
                : 'No results'}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
