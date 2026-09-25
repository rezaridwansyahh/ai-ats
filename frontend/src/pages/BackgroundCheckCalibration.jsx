import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Loader2, AlertTriangle, Check, Users, X,
  Briefcase, ThumbsUp, ThumbsDown, ShieldAlert, ChevronRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';

import { getJobById } from '@/api/job.api';
import { getBgChecksByJob, getLaneCounts, saveVerdict } from '@/api/background-check.api';
import { hasPermission } from '@/utils/permissions';

// Only 'pass' and 'fail' are decidable inline here — 'pass_with_concerns'
// requires a structured gap/context/mitigation note (see VerdictSection in
// BackgroundCheck-Candidate.jsx), which doesn't fit a one-click batch action.
// Those candidates are routed to their detail page instead.
const VERDICT_META = {
  pass:               { label: 'Pass',               color: 'border-emerald-300 text-emerald-700 bg-emerald-50' },
  pass_with_concerns: { label: 'Pass with concerns',  color: 'border-amber-300 text-amber-700 bg-amber-50'       },
  fail:               { label: 'Fail',                color: 'border-rose-300 text-rose-700 bg-rose-50'          },
};

function laneSummary(counts) {
  if (!counts) return null;
  const pass = (counts.pass || 0) + (counts.pass_with_concerns || 0);
  const fail = counts.fail || 0;
  const open = (counts.pending || 0) + (counts.in_progress || 0) + (counts.stalled || 0);
  const total = pass + fail + open;
  return { pass, fail, open, total };
}

export default function BackgroundCheckCalibration() {
  const canDecide = hasPermission('Selection', 'Background Check', 'update');
  const navigate = useNavigate();
  const { jobId } = useParams();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [job, setJob]         = useState(null);
  const [candidates, setCandidates] = useState([]); // [{ bg_id, candidate_name, last_position, status, verdict, lanes }]
  const [decisions, setDecisions] = useState({}); // { bg_id: 'pass' | 'fail' }
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError]   = useState(null);
  const [banner, setBanner] = useState(null);

  const load = useCallback(async () => {
    if (!jobId) return;
    setLoading(true);
    setError(null);
    try {
      const [jobRes, bgRes] = await Promise.all([
        getJobById(jobId),
        getBgChecksByJob(jobId),
      ]);
      setJob(jobRes.data?.job || jobRes.data || null);

      const cohort = (bgRes.data?.bg_checks || []).filter(
        (b) => b.status === 'verdict' || b.status === 'done'
      );
      const withLanes = await Promise.all(
        cohort.map(async (b) => {
          try {
            const laneRes = await getLaneCounts(b.bg_id);
            return { ...b, lanes: laneRes.data?.counts || null };
          } catch {
            return { ...b, lanes: null };
          }
        })
      );
      setCandidates(withLanes);
      setDecisions({});
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load calibration data');
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => { load(); }, [load]);

  const handlePick = (bg_id, verdict) => {
    if (!canDecide) return;
    setDecisions((prev) => ({ ...prev, [bg_id]: verdict }));
  };

  const handleClearAll = () => setDecisions({});

  const handleSelectAllClean = () => {
    const next = {};
    candidates
      .filter((c) => !c.verdict && c.lanes && laneSummary(c.lanes)?.fail === 0 && laneSummary(c.lanes)?.open === 0)
      .forEach((c) => { next[c.bg_id] = 'pass'; });
    setDecisions((prev) => ({ ...prev, ...next }));
  };

  const stagedEntries = Object.entries(decisions).filter(([, v]) => v);

  const handleSubmit = async () => {
    if (!canDecide) {
      setError('You do not have permission to record background check verdicts.');
      return;
    }
    if (stagedEntries.length === 0) {
      setError('No decisions to submit. Please select at least one verdict.');
      return;
    }
    setSaving(true);
    setError(null);
    setBanner(null);
    try {
      const results = await Promise.allSettled(
        stagedEntries.map(([bg_id, verdict]) => saveVerdict(Number(bg_id), { verdict, verdict_note: null }))
      );
      const failed = results.filter((r) => r.status === 'rejected').length;
      const ok = results.length - failed;
      setBanner({
        ok: failed === 0,
        text: failed === 0
          ? `${ok} verdict(s) recorded successfully.`
          : `${ok} verdict(s) recorded, ${failed} failed — reload to retry.`,
      });
      setShowConfirm(false);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to submit verdicts');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const decidedCount   = candidates.filter((c) => c.verdict).length;
  const undecidedCount = candidates.length - decidedCount;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate(`/selection/background-check/job/${jobId}`)}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <div className="flex-1">
          <h1 className="text-lg font-semibold">Background Check Calibration</h1>
          <p className="text-xs text-muted-foreground">
            {job?.job_title || 'Job'} · Compare verification lanes and decide verdicts together
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[9px]">
            {candidates.length} Candidates
          </Badge>
          <Badge variant="outline" className="text-[9px] border-emerald-300 text-emerald-700 bg-emerald-50">
            {decidedCount} Decided
          </Badge>
          <Badge variant="outline" className="text-[9px] border-amber-300 text-amber-700 bg-amber-50">
            {undecidedCount} Pending
          </Badge>
        </div>
      </div>

      {banner && (
        <div className={`p-3 rounded-lg border text-xs ${banner.ok ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-rose-50 border-rose-200 text-rose-700'}`}>
          {banner.text}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg border border-rose-200 bg-rose-50 text-xs text-rose-700">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Quick actions */}
      <Card>
        <CardContent className="p-4 flex items-center justify-between gap-3 flex-wrap">
          <p className="text-xs text-muted-foreground">Quick Actions</p>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handleSelectAllClean} className="h-7 text-xs" disabled={!canDecide}>
              <Check className="h-3.5 w-3.5 mr-1" /> Select All Clean (no fails, nothing open)
            </Button>
            <Button size="sm" variant="ghost" onClick={handleClearAll} className="h-7 text-xs text-rose-600 hover:text-rose-700" disabled={!canDecide}>
              <X className="h-3.5 w-3.5 mr-1" /> Clear All
            </Button>
            <Button
              size="sm"
              onClick={() => setShowConfirm(true)}
              disabled={!canDecide || stagedEntries.length === 0 || saving}
              className="h-7 text-xs"
              title={canDecide ? undefined : 'You do not have permission to record background check verdicts.'}
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Users className="h-3.5 w-3.5 mr-1" />}
              Submit {stagedEntries.length} Verdict(s)
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Candidates table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b bg-muted/20">
                  <th className="text-left p-3 font-semibold">Candidate</th>
                  <th className="text-center p-3 font-semibold">Lanes</th>
                  <th className="text-center p-3 font-semibold w-[280px]">Verdict</th>
                </tr>
              </thead>
              <tbody>
                {candidates.map((c) => {
                  const decided = !!c.verdict;
                  const summary = laneSummary(c.lanes);
                  const staged  = decisions[c.bg_id];
                  return (
                    <tr key={c.bg_id} className={`border-b hover:bg-muted/10 ${decided ? 'bg-emerald-50/30' : ''}`}>
                      <td className="p-3">
                        <p className="font-semibold">{c.candidate_name || `#${c.candidate_id}`}</p>
                        {c.last_position && (
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
                            <Briefcase className="h-3 w-3" />
                            {c.last_position}
                          </div>
                        )}
                      </td>

                      <td className="p-3 text-center">
                        {summary ? (
                          <div className="flex items-center justify-center gap-1.5 flex-wrap">
                            <Badge variant="outline" className="text-[9px] border-emerald-300 text-emerald-700 bg-emerald-50">
                              {summary.pass} pass
                            </Badge>
                            {summary.fail > 0 && (
                              <Badge variant="outline" className="text-[9px] border-rose-300 text-rose-700 bg-rose-50">
                                {summary.fail} fail
                              </Badge>
                            )}
                            {summary.open > 0 && (
                              <Badge variant="outline" className="text-[9px] border-slate-300 text-slate-600 bg-slate-50">
                                {summary.open} open
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-[10px] text-muted-foreground">—</span>
                        )}
                      </td>

                      <td className="p-3">
                        {decided ? (
                          <Badge variant="outline" className={`text-[9px] ${VERDICT_META[c.verdict]?.color || ''}`}>
                            {VERDICT_META[c.verdict]?.label || c.verdict}
                          </Badge>
                        ) : (
                          <div className="flex items-center justify-center gap-1.5">
                            <Button
                              size="sm" variant="outline"
                              className={`h-7 text-[10px] px-2 ${staged === 'pass' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : ''}`}
                              disabled={!canDecide}
                              onClick={() => handlePick(c.bg_id, 'pass')}
                            >
                              <ThumbsUp className="h-3 w-3 mr-1" /> Pass
                            </Button>
                            <Button
                              size="sm" variant="outline"
                              className={`h-7 text-[10px] px-2 ${staged === 'fail' ? 'border-rose-500 bg-rose-50 text-rose-700' : ''}`}
                              disabled={!canDecide}
                              onClick={() => handlePick(c.bg_id, 'fail')}
                            >
                              <ThumbsDown className="h-3 w-3 mr-1" /> Fail
                            </Button>
                            <Button
                              size="sm" variant="ghost"
                              className="h-7 text-[10px] px-2 text-amber-700"
                              onClick={() => navigate(`/selection/background-check/candidate/${c.bg_id}`)}
                              title="Pass with concerns requires a written note — open the full record"
                            >
                              <ShieldAlert className="h-3 w-3 mr-1" /> Concerns <ChevronRight className="h-3 w-3 ml-0.5" />
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {candidates.length === 0 && (
            <div className="py-12 text-center text-xs text-muted-foreground">
              No candidates at the Verdict stage for this position yet.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation dialog */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Batch Verdicts</DialogTitle>
            <DialogDescription>
              You are about to submit <strong>{stagedEntries.length} verdict(s)</strong>.
              This action will record final decisions for the selected candidates.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirm(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
