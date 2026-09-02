import { useEffect, useState } from 'react';
import { Loader2, Wand2, FileWarning, FileText } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { getScreeningResult } from '@/api/screening.api';
import { downloadCandidateCv } from '@/api/candidate.api';

function ScoreTile({ label, score, bold }) {
  return (
    <div className="rounded-lg border bg-muted/20 p-2.5 text-center">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`mt-1 font-mono ${bold ? 'text-xl font-bold' : 'text-base font-semibold'}`}>
        {score ?? '—'}
      </div>
    </div>
  );
}

/*
 * "View" modal for a scored candidate on the job-level AI Matching ranking table.
 * Left half: matching data (fetched via getScreeningResult — the same
 * candidate_job_score row AIScreeningCandidate.jsx's Match panel reads from).
 * Right half: CV PDF preview (fetched via downloadCandidateCv, same blob-to-object-URL
 * pattern as CandidatesDialog.jsx / ReportCandidateDetail.jsx).
 */
export default function MatchPreviewModal({ open, onOpenChange, row, jobId }) {
  const [matchData, setMatchData] = useState(null);
  const [matchLoading, setMatchLoading] = useState(false);
  const [matchError, setMatchError] = useState(null);

  const [cvUrl, setCvUrl] = useState(null);
  const [cvLoading, setCvLoading] = useState(false);
  const [cvError, setCvError] = useState(null);

  useEffect(() => {
    if (!open || !row?.applicant_id) return;
    let cancelled = false;
    let objectUrl = null;

    setMatchData(null);
    setMatchError(null);
    setCvUrl(null);
    setCvError(null);

    setMatchLoading(true);
    getScreeningResult(row.applicant_id, jobId)
      .then((res) => { if (!cancelled) setMatchData(res.data?.score || null); })
      .catch((err) => { if (!cancelled) setMatchError(err.response?.data?.message || err.message || 'Failed to load matching data'); })
      .finally(() => { if (!cancelled) setMatchLoading(false); });

    setCvLoading(true);
    downloadCandidateCv(row.applicant_id)
      .then((res) => {
        if (cancelled) return;
        objectUrl = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
        setCvUrl(objectUrl);
      })
      .catch((err) => { if (!cancelled) setCvError(err.response?.status === 404 ? 'No CV available for this candidate.' : (err.response?.data?.message || err.message || 'Failed to load CV')); })
      .finally(() => { if (!cancelled) setCvLoading(false); });

    return () => {
      cancelled = true;
      if (objectUrl) window.URL.revokeObjectURL(objectUrl);
    };
  }, [open, row?.applicant_id, jobId]);

  const matched = Array.isArray(matchData?.matched_skills) ? matchData.matched_skills : [];
  const missing = Array.isArray(matchData?.missing_skills) ? matchData.missing_skills : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="h-4 w-4 text-primary" />
            {row?.applicant_name || `Candidate #${row?.applicant_id}`}
          </DialogTitle>
          <DialogDescription>{row?.last_position || 'Matching data & CV preview'}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left: matching data */}
          <div className="min-h-0 overflow-y-auto pr-1 space-y-3">
            {matchLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : matchError ? (
              <p className="text-xs text-destructive py-4">{matchError}</p>
            ) : !matchData ? (
              <p className="text-xs text-muted-foreground italic py-4">No matching data for this candidate yet.</p>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <ScoreTile label="Overall" score={matchData.overall_score} bold />
                  <ScoreTile label="Skills" score={matchData.skills_score} />
                  <ScoreTile label="Experience" score={matchData.experience_score} />
                  <ScoreTile label="Education" score={matchData.education_score} />
                </div>

                {(matchData.skills_reason || matchData.experience_reason || matchData.education_reason) && (
                  <div className="space-y-1.5">
                    {matchData.skills_reason && (
                      <div className="text-[11px] px-3 py-2 rounded-md bg-muted/30 border">
                        <span className="font-semibold uppercase tracking-wide text-muted-foreground text-[10px]">Skills — </span>
                        <span className="text-muted-foreground italic">{matchData.skills_reason}</span>
                      </div>
                    )}
                    {matchData.experience_reason && (
                      <div className="text-[11px] px-3 py-2 rounded-md bg-muted/30 border">
                        <span className="font-semibold uppercase tracking-wide text-muted-foreground text-[10px]">Experience — </span>
                        <span className="text-muted-foreground italic">{matchData.experience_reason}</span>
                      </div>
                    )}
                    {matchData.education_reason && (
                      <div className="text-[11px] px-3 py-2 rounded-md bg-muted/30 border">
                        <span className="font-semibold uppercase tracking-wide text-muted-foreground text-[10px]">Education — </span>
                        <span className="text-muted-foreground italic">{matchData.education_reason}</span>
                      </div>
                    )}
                  </div>
                )}

                {matchData.summary && (
                  <div className="text-[11px] text-muted-foreground italic px-3 py-2 rounded-md bg-muted/30 border">
                    {matchData.summary}
                  </div>
                )}

                {(matched.length > 0 || missing.length > 0) && (
                  <div className="space-y-2 pt-1">
                    {matched.length > 0 && (
                      <div>
                        <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">Matched skills</div>
                        <div className="flex flex-wrap gap-1">
                          {matched.map((s) => (
                            <Badge key={`m-${s}`} className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">{s}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {missing.length > 0 && (
                      <div>
                        <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">Missing skills</div>
                        <div className="flex flex-wrap gap-1">
                          {missing.map((s) => (
                            <Badge key={`x-${s}`} variant="outline" className="text-[10px] bg-rose-50 text-rose-700 border-rose-200">{s}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Right: CV preview */}
          <div className="min-h-0 rounded-lg border bg-muted/10 overflow-hidden flex items-center justify-center">
            {cvLoading ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : cvError ? (
              <div className="flex flex-col items-center gap-2 text-xs text-muted-foreground p-6 text-center">
                <FileWarning className="h-5 w-5" />
                {cvError}
              </div>
            ) : cvUrl ? (
              <iframe title="CV preview" src={cvUrl} className="w-full h-full" />
            ) : (
              <div className="flex flex-col items-center gap-2 text-xs text-muted-foreground p-6 text-center">
                <FileText className="h-5 w-5" />
                No CV to preview.
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
