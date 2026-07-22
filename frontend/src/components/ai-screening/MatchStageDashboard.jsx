import { useMemo, useState } from 'react';
import { Wand2, ChevronUp, ChevronDown, Info, Loader2, PlayCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatCard, FIXED_KEYS, FIXED_META } from './shared';
import { scoreCandidatesList } from '@/api/screening.api';

/*
 * Job-level "AI Matching" dashboard.
 *
 * ✅ WIRED (this pass): "Run Matching for all pending" button below calls the
 * real matchBulk(job_id, applicant_ids) endpoint — confirmed complete on the
 * backend (screening.service.js > matchBulk) and signature-matched against
 * screening.api.js. On success, calls onScored() so the parent (AIScreeningPage)
 * reloads parseRows/matchRows/qaRows/cohortRows and this list updates itself.
 *
 * Everything else in this file is unchanged from the previous pass — still
 * read-only pending/scored lists, still no job-wide rubric editing here.
 */
export default function MatchStageDashboard({ jobId, pendingRows = [], scoredRows = [], onOpen, onScored }) {
  const [sortKey, setSortKey] = useState('overall_score');
  const [sortDir, setSortDir] = useState('desc');
  const [running, setRunning] = useState(false);

  const sorted = useMemo(() => {
    const list = [...scoredRows];
    list.sort((a, b) => {
      const av = a[sortKey] ?? -1;
      const bv = b[sortKey] ?? -1;
      if (av === bv) return 0;
      const diff = av < bv ? -1 : 1;
      return sortDir === 'desc' ? -diff : diff;
    });
    return list;
  }, [scoredRows, sortKey, sortDir]);

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    else { setSortKey(key); setSortDir('desc'); }
  };

  const topScore = scoredRows.reduce((m, r) => Math.max(m, r.overall_score ?? 0), 0);
  const avgScore = scoredRows.length
    ? Math.round(scoredRows.reduce((s, r) => s + (r.overall_score ?? 0), 0) / scoredRows.length)
    : 0;

  const handleRunPending = async () => {
    if (!jobId || pendingRows.length === 0 || running) return;
    setRunning(true);
    try {
      const applicant_ids = pendingRows.map((r) => r.applicant_id);
      const res = await scoreCandidatesList(jobId, applicant_ids);
      const { scored = 0, total = 0, errors = [] } = res.data || {};
      if (errors.length > 0) {
        toast.error('Bulk scoring finished with errors', {
          description: `${scored}/${total} scored · ${errors.length} failed. Check console for details.`,
        });
        console.warn('scoreCandidatesList errors:', errors);
      } else {
        toast.success('Bulk scoring complete', {
          description: `${scored} of ${total} candidates scored.`,
        });
      }
      await onScored?.(); // ask AIScreeningPage to reload lane data
    } catch (err) {
      toast.error('Bulk scoring failed', {
        description: err.response?.data?.message || err.message || 'Unknown error',
      });
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-4 p-4">
      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Awaiting Score" value={pendingRows.length} />
        <StatCard label="Scored" value={scoredRows.length} />
        <StatCard label="Top score" value={scoredRows.length ? topScore : '—'} />
        <StatCard label="Avg score" value={scoredRows.length ? avgScore : '—'} />
      </div>

      {/* Rubric criteria reference — unchanged */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">
            Matching criteria
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {FIXED_KEYS.map((key) => {
            const meta = FIXED_META[key];
            const Icon = meta.icon;
            return (
              <Badge key={key} variant="outline" className="text-[10px] gap-1.5 py-1">
                <Icon className="h-3 w-3" /> {meta.label}
              </Badge>
            );
          })}
          <span className="text-[10px] text-muted-foreground italic flex items-center gap-1 ml-1">
            <Info className="h-3 w-3" /> Edit weights per-candidate on their Match tab — job-wide rubric editing isn't wired here.
          </span>
        </CardContent>
      </Card>

      {/* NEW: bulk run action, only shown when there's something pending */}
      {pendingRows.length > 0 && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-3 flex items-center justify-between gap-3 flex-wrap">
            <div className="text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">{pendingRows.length} candidate{pendingRows.length === 1 ? '' : 's'}</span>
              {' '}waiting to be scored against this job's saved rubric.
            </div>
            <Button size="sm" className="text-xs" onClick={handleRunPending} disabled={running}>
              {running
                ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Scoring…</>
                : <><PlayCircle className="h-3.5 w-3.5 mr-1.5" /> Score All Pending Candidates</>}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Ranking table — unchanged */}
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-xs uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
            <Wand2 className="h-3.5 w-3.5 text-primary" /> Ranking — scored candidates
          </CardTitle>
          <span className="text-[10px] text-muted-foreground">{scoredRows.length} candidates</span>
        </CardHeader>
        <CardContent className="p-0">
          {sorted.length === 0 ? (
            <p className="py-8 text-center text-xs text-muted-foreground italic">No candidates scored yet.</p>
          ) : (
            <Table className="w-full">
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="text-[10px] font-bold uppercase pl-4">Candidate</TableHead>
                  <SortHead label="Fit"        col="overall_score"           sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} />
                  <SortHead label="Skills"     col="skills_score"            sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} />
                  <SortHead label="Experience" col="experience_score"        sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} />
                  <SortHead label="Trajectory" col="career_trajectory_score" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} />
                  <SortHead label="Education"  col="education_score"         sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} />
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((r) => (
                  <TableRow
                    key={r.screening_id}
                    className="cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => onOpen(r)}
                  >
                    <TableCell className="text-xs pl-4">
                      <div className="font-medium truncate">{r.applicant_name || `#${r.applicant_id}`}</div>
                      <div className="text-[10px] text-muted-foreground truncate">{r.last_position || '—'}</div>
                    </TableCell>
                    <TableCell className="text-center"><ScoreBadge score={r.overall_score} bold /></TableCell>
                    <TableCell className="text-center"><ScoreBadge score={r.skills_score} /></TableCell>
                    <TableCell className="text-center"><ScoreBadge score={r.experience_score} /></TableCell>
                    <TableCell className="text-center"><ScoreBadge score={r.career_trajectory_score} /></TableCell>
                    <TableCell className="text-center"><ScoreBadge score={r.education_score} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pending list — unchanged, just no longer the only way to trigger matching */}
      {pendingRows.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">
              Awaiting score
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table className="w-full">
              <TableBody>
                {pendingRows.map((r) => (
                  <TableRow key={r.screening_id ?? r.applicant_id} className="cursor-pointer hover:bg-muted/30" onClick={() => onOpen(r)}>
                    <TableCell className="text-xs pl-4">{r.applicant_name || `#${r.applicant_id}`}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{r.last_position || '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function SortHead({ label, col, sortKey, sortDir, onClick }) {
  const active = sortKey === col;
  return (
    <TableHead className="text-[10px] font-bold uppercase text-center cursor-pointer select-none" onClick={() => onClick(col)}>
      <span className="inline-flex items-center gap-1 justify-center">
        {label}
        {active && (sortDir === 'desc' ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />)}
      </span>
    </TableHead>
  );
}

function ScoreBadge({ score, bold }) {
  if (score == null) return <span className="text-xs text-muted-foreground">—</span>;
  const cls = score >= 80 ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
    : score >= 60 ? 'bg-amber-100 text-amber-700 border-amber-200'
    : 'bg-rose-100 text-rose-700 border-rose-200';
  return <Badge className={`text-[10px] font-mono ${bold ? 'font-bold' : ''} ${cls}`}>{score}</Badge>;
}