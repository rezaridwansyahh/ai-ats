import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Loader2, AlertTriangle, ArrowLeft, ArrowRight, Scale, Check,
  ChevronUp, ChevronDown,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';

import { getCalibration, advanceBulk } from '@/api/screening.api';
import { getJobById } from '@/api/job.api';

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

// Tiny recommendation pill derived from overall_score band.
function recommendation(score) {
  if (score == null) return { label: 'Awaiting score', tone: 'bg-muted text-muted-foreground border-border' };
  if (score >= 90) return { label: 'Strong advance', tone: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  if (score >= 80) return { label: 'Advance',         tone: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  if (score >= 60) return { label: 'Hold · borderline', tone: 'bg-amber-50 text-amber-700 border-amber-200' };
  return                  { label: 'Reject · below threshold', tone: 'bg-rose-50 text-rose-700 border-rose-200' };
}

export default function AIScreeningCalibrationPage() {
  const { jobId } = useParams();
  const navigate = useNavigate();

  const [job, setJob] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selected, setSelected] = useState(new Set());
  const [sortKey, setSortKey] = useState('overall_score');
  const [sortDir, setSortDir] = useState('desc');

  const [reason, setReason] = useState('');
  const [advancing, setAdvancing] = useState(false);
  const [resultBanner, setResultBanner] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [jobRes, calRes] = await Promise.all([
        getJobById(jobId),
        getCalibration(jobId),
      ]);
      setJob(jobRes.data?.job || jobRes.data);
      setRows(calRes.data?.rows || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load calibration');
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [jobId]);

  const sortedRows = useMemo(() => {
    const list = [...rows];
    list.sort((a, b) => {
      const av = a[sortKey] ?? -1;
      const bv = b[sortKey] ?? -1;
      const diff = av === bv ? a.screening_id - b.screening_id : (av < bv ? -1 : 1);
      return sortDir === 'desc' ? -diff : diff;
    });
    return list;
  }, [rows, sortKey, sortDir]);

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
      const res = await advanceBulk(jobId, [...selected], { decision_reason: reason || undefined });
      const { advanced = [], skipped = [], errors = [], interview_ids = [] } = res.data || {};
      setResultBanner({
        ok: errors.length === 0,
        text: `${advanced.length} advanced · ${skipped.length} skipped · ${errors.length} errors · ${interview_ids.length} interview rows created`,
      });
      setSelected(new Set());
      setReason('');
      await load();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Advance-bulk failed');
    } finally {
      setAdvancing(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-5 p-6">
      {/* Back + header */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate(`/selection/ai-screening/job/${jobId}`)}>
          <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back to position
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Scale className="h-5 w-5 text-primary" />
          Calibrate · <span className="font-normal text-muted-foreground">{job?.job_title || `Job #${jobId}`}</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {rows.length} candidate{rows.length === 1 ? '' : 's'} ready · select top performers to advance to Interview.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg border border-red-200 bg-red-50 text-sm text-red-600">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
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

      {/* Cohort table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Ready cohort</CardTitle>
        </CardHeader>
        <CardContent className="px-0 py-0">
          {rows.length === 0 ? (
            <p className="py-10 text-center text-xs text-muted-foreground italic">
              No candidates in the ready cohort. Score candidates from the position page first.
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
                  <TableHead className="text-[10px] font-bold uppercase text-right pr-4">Summary</TableHead>
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
                      <TableCell className="text-xs text-muted-foreground pr-4 truncate max-w-[260px]" title={r.score_summary || ''}>
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

      {/* Action bar (sticky at bottom of page) */}
      {rows.length > 0 && (
        <Card>
          <CardContent className="py-4 space-y-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">{selected.size} selected</span>
                {' '}· {rows.length} ready · candidates without a decision
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
