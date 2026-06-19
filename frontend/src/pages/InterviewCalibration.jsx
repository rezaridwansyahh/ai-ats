import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Loader2, AlertTriangle, Check, Users,
  ThumbsUp, ThumbsDown, Minus, X, Briefcase, MapPin,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';

import { getCalibration, batchDecide } from '@/api/interview.api';

const RECOMMENDATION_OPTIONS = [
  { value: 'strong_hire',    label: 'Strong Hire',    icon: ThumbsUp,   color: 'border-emerald-400 text-emerald-700 bg-emerald-50'  },
  { value: 'hire',           label: 'Hire',           icon: ThumbsUp,   color: 'border-emerald-300 text-emerald-600 bg-emerald-50/50' },
  { value: 'no_hire',        label: 'No Hire',        icon: ThumbsDown, color: 'border-rose-300 text-rose-600 bg-rose-50/50'         },
  { value: 'strong_no_hire', label: 'Strong No Hire', icon: ThumbsDown, color: 'border-rose-400 text-rose-700 bg-rose-50'            },
];

function scoreColor(score) {
  if (!score) return 'text-muted-foreground';
  if (score >= 6) return 'text-emerald-700';
  if (score >= 4) return 'text-amber-700';
  return 'text-rose-700';
}

function scoreBg(score) {
  if (!score) return 'bg-muted/20';
  if (score >= 6) return 'bg-emerald-50';
  if (score >= 4) return 'bg-amber-50';
  return 'bg-rose-50';
}

export default function InterviewCalibration() {
  const navigate = useNavigate();
  const { jobId } = useParams();

  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [job, setJob]           = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [decisions, setDecisions]   = useState({});  // { interview_id: { verdict, note } }
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError]       = useState(null);
  const [banner, setBanner]     = useState(null);

  useEffect(() => {
    if (!jobId) return;
    (async () => {
      setLoading(true);
      try {
        const res = await getCalibration(jobId);
        setJob(res.data.job);
        setCandidates(res.data.candidates || []);

        // Pre-fill decisions if already decided
        const preloaded = {};
        (res.data.candidates || []).forEach((c) => {
          if (c.verdict) {
            preloaded[c.interview_id] = {
              verdict: c.verdict,
              note: c.decision_note || '',
            };
          }
        });
        setDecisions(preloaded);
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to load calibration data');
      } finally {
        setLoading(false);
      }
    })();
  }, [jobId]);

  const handleVerdictChange = (interview_id, verdict) => {
    setDecisions((prev) => ({
      ...prev,
      [interview_id]: {
        ...prev[interview_id],
        verdict,
      },
    }));
  };

  const handleNoteChange = (interview_id, note) => {
    setDecisions((prev) => ({
      ...prev,
      [interview_id]: {
        ...prev[interview_id],
        note,
      },
    }));
  };

  const handleSubmit = async () => {
    const decisionsArray = Object.entries(decisions)
      .filter(([_, dec]) => dec.verdict) // only submit if verdict is set
      .map(([interview_id, dec]) => ({
        interview_id: Number(interview_id),
        verdict: dec.verdict,
        decision_note: dec.note || null,
      }));

    if (decisionsArray.length === 0) {
      setError('No decisions to submit. Please select at least one verdict.');
      return;
    }

    setSaving(true);
    setError(null);
    setBanner(null);

    try {
      await batchDecide(jobId, decisionsArray);
      setBanner({ ok: true, text: `${decisionsArray.length} decision(s) recorded successfully.` });
      setShowConfirm(false);

      // Reload data
      const res = await getCalibration(jobId);
      setCandidates(res.data.candidates || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to submit decisions');
    } finally {
      setSaving(false);
    }
  };

  const handleSelectAllAdvance = () => {
    const newDecisions = {};
    candidates
      .filter((c) => c.overall_score && c.overall_score >= 5 && !c.is_draft) // only candidates with score >= 5 and submitted scorecard
      .forEach((c) => {
        newDecisions[c.interview_id] = {
          verdict: 'advance',
          note: decisions[c.interview_id]?.note || '',
        };
      });
    setDecisions((prev) => ({ ...prev, ...newDecisions }));
  };

  const handleClearAll = () => {
    setDecisions({});
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const undecidedCount = candidates.filter((c) => !c.verdict && c.overall_score && !c.is_draft).length;
  const decidedCount   = candidates.filter((c) => c.verdict).length;
  const avgScore = candidates.filter((c) => c.overall_score).reduce((acc, c) => acc + Number(c.overall_score), 0) / candidates.filter((c) => c.overall_score).length || 0;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/selection/interview')}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <div className="flex-1">
          <h1 className="text-lg font-semibold">Interview Calibration</h1>
          <p className="text-xs text-muted-foreground">
            {job?.job_title || 'Job'} · Compare scorecards and make batch decisions
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

      {/* Banner */}
      {banner && (
        <div className={`p-3 rounded-lg border text-xs ${banner.ok ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-rose-50 border-rose-200 text-rose-700'}`}>
          {banner.text}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg border border-rose-200 bg-rose-50 text-xs text-rose-700">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Summary Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Overview</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-4 gap-4">
          <div className="space-y-1">
            <p className="text-[10px] text-muted-foreground">Total Candidates</p>
            <p className="text-xl font-bold">{candidates.length}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] text-muted-foreground">Average Score</p>
            <p className={`text-xl font-bold ${scoreColor(avgScore.toFixed(2))}`}>{avgScore.toFixed(2)}/7</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] text-muted-foreground">Decided</p>
            <p className="text-xl font-bold text-emerald-700">{decidedCount}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] text-muted-foreground">Pending</p>
            <p className="text-xl font-bold text-amber-700">{undecidedCount}</p>
          </div>
        </CardContent>
      </Card>

      {/* Batch Actions */}
      <Card>
        <CardContent className="p-4 flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">Quick Actions</p>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handleSelectAllAdvance} className="h-7 text-xs">
              <Check className="h-3.5 w-3.5 mr-1" /> Select All with Score ≥ 5
            </Button>
            <Button size="sm" variant="ghost" onClick={handleClearAll} className="h-7 text-xs text-rose-600 hover:text-rose-700">
              <X className="h-3.5 w-3.5 mr-1" /> Clear All
            </Button>
            <Button
              size="sm"
              onClick={() => setShowConfirm(true)}
              disabled={Object.keys(decisions).filter((k) => decisions[k].verdict).length === 0 || saving}
              className="h-7 text-xs"
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Users className="h-3.5 w-3.5 mr-1" />}
              Submit {Object.keys(decisions).filter((k) => decisions[k].verdict).length} Decision(s)
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Candidates Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b bg-muted/20">
                  <th className="text-left p-3 font-semibold">Candidate</th>
                  <th className="text-center p-3 font-semibold">Score</th>
                  <th className="text-center p-3 font-semibold">Recommendation</th>
                  <th className="text-left p-3 font-semibold">Strengths</th>
                  <th className="text-center p-3 font-semibold w-[200px]">Verdict</th>
                  <th className="text-left p-3 font-semibold w-[250px]">Notes</th>
                </tr>
              </thead>
              <tbody>
                {candidates.map((c) => {
                  const hasScorecard = c.overall_score && !c.is_draft;
                  const decided = !!c.verdict;
                  const currentDecision = decisions[c.interview_id] || {};

                  return (
                    <tr key={c.interview_id} className={`border-b hover:bg-muted/10 ${decided ? 'bg-emerald-50/30' : ''}`}>
                      {/* Candidate */}
                      <td className="p-3">
                        <div>
                          <p className="font-semibold">{c.candidate_name}</p>
                          {c.last_position && (
                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
                              <Briefcase className="h-3 w-3" />
                              {c.last_position}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Score */}
                      <td className="p-3 text-center">
                        {hasScorecard ? (
                          <Badge variant="outline" className={`${scoreBg(c.overall_score)} ${scoreColor(c.overall_score)} border-none text-xs font-bold`}>
                            {c.overall_score}/7
                          </Badge>
                        ) : (
                          <span className="text-[10px] text-muted-foreground">No scorecard</span>
                        )}
                      </td>

                      {/* Recommendation */}
                      <td className="p-3 text-center">
                        {c.recommendation ? (
                          <Badge variant="outline" className={`text-[9px] ${RECOMMENDATION_OPTIONS.find((r) => r.value === c.recommendation)?.color || ''}`}>
                            {RECOMMENDATION_OPTIONS.find((r) => r.value === c.recommendation)?.label || c.recommendation}
                          </Badge>
                        ) : (
                          <span className="text-[10px] text-muted-foreground">—</span>
                        )}
                      </td>

                      {/* Strengths */}
                      <td className="p-3 max-w-xs">
                        {c.standout_strengths ? (
                          <p className="text-[10px] text-muted-foreground truncate">{c.standout_strengths}</p>
                        ) : (
                          <span className="text-[10px] text-muted-foreground">—</span>
                        )}
                      </td>

                      {/* Verdict */}
                      <td className="p-3">
                        {decided ? (
                          <Badge variant="outline" className={`text-[9px] ${c.verdict === 'advance' ? 'border-emerald-300 text-emerald-700 bg-emerald-50' : c.verdict === 'hold' ? 'border-amber-300 text-amber-700 bg-amber-50' : 'border-rose-300 text-rose-700 bg-rose-50'}`}>
                            {c.verdict.toUpperCase()}
                          </Badge>
                        ) : hasScorecard ? (
                          <Select
                            value={currentDecision.verdict || ''}
                            onValueChange={(v) => handleVerdictChange(c.interview_id, v)}
                          >
                            <SelectTrigger className="h-7 text-[10px]">
                              <SelectValue placeholder="Select..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="advance" className="text-xs">
                                <span className="text-emerald-600">✓ Advance</span>
                              </SelectItem>
                              <SelectItem value="hold" className="text-xs">
                                <span className="text-amber-600">○ Hold</span>
                              </SelectItem>
                              <SelectItem value="reject" className="text-xs">
                                <span className="text-rose-600">✗ Reject</span>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className="text-[10px] text-muted-foreground">N/A</span>
                        )}
                      </td>

                      {/* Notes */}
                      <td className="p-3">
                        {decided ? (
                          c.decision_note ? (
                            <p className="text-[10px] text-muted-foreground">{c.decision_note}</p>
                          ) : (
                            <span className="text-[10px] text-muted-foreground">—</span>
                          )
                        ) : hasScorecard ? (
                          <Textarea
                            value={currentDecision.note || ''}
                            onChange={(e) => handleNoteChange(c.interview_id, e.target.value)}
                            placeholder="Note (optional)..."
                            className="text-[10px] min-h-[50px] resize-none"
                          />
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {candidates.length === 0 && (
            <div className="py-12 text-center text-xs text-muted-foreground">
              No candidates found for this position.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Batch Decisions</DialogTitle>
            <DialogDescription>
              You are about to submit <strong>{Object.keys(decisions).filter((k) => decisions[k].verdict).length} decision(s)</strong>.
              This action will record verdicts for the selected candidates.
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
