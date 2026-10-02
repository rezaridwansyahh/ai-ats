import { useEffect, useState } from 'react';
import { Loader2, Wand2, FileWarning, FileText, Briefcase, GraduationCap, Clock, MapPin } from 'lucide-react';
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
 * "View" modal for a candidate on the Job Management Candidates table.
 * Mirrors MatchPreviewModal.jsx (AI Matching workboard)'s two-fetch pattern
 * (score + CV preview) in the same two-column layout, but the left column
 * also carries a Parsed CV Detail section — the AI-parsed CV facets
 * (job_position/skills/experience/education) — which needs no extra fetch
 * since `candidate.information` is already on the row passed in.
 */
export default function CandidateDetailModal({ open, onOpenChange, candidate, jobId }) {
  const [matchData, setMatchData] = useState(null);
  const [matchLoading, setMatchLoading] = useState(false);
  const [matchError, setMatchError] = useState(null);

  const [cvUrl, setCvUrl] = useState(null);
  const [cvLoading, setCvLoading] = useState(false);
  const [cvError, setCvError] = useState(null);

  useEffect(() => {
    if (!open || !candidate?.applicant_id) return;
    let cancelled = false;
    let objectUrl = null;

    setMatchData(null);
    setMatchError(null);
    setCvUrl(null);
    setCvError(null);

    setMatchLoading(true);
    getScreeningResult(candidate.applicant_id, jobId)
      .then((res) => { if (!cancelled) setMatchData(res.data?.score || null); })
      .catch((err) => { if (!cancelled) setMatchError(err.response?.data?.message || err.message || 'Failed to load matching data'); })
      .finally(() => { if (!cancelled) setMatchLoading(false); });

    setCvLoading(true);
    downloadCandidateCv(candidate.applicant_id)
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
  }, [open, candidate?.applicant_id, jobId]);

  const matched = Array.isArray(matchData?.matched_skills) ? matchData.matched_skills : [];
  const missing = Array.isArray(matchData?.missing_skills) ? matchData.missing_skills : [];

  const info        = candidate?.information || {};
  const jobPosition  = info.job_position || {};
  const skills       = Array.isArray(info.skills) ? info.skills : [];
  const education    = Array.isArray(info.education) ? info.education : [];
  const experience   = info.experience || {};
  const positions    = Array.isArray(experience.positions) ? experience.positions : [];
  const hasParseData = Object.keys(info).length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="h-4 w-4 text-primary" />
            {candidate?.candidate_name || `Candidate #${candidate?.id}`}
          </DialogTitle>
          <DialogDescription>
            {jobPosition.current || candidate?.last_position || 'Matching data, parsed CV detail & CV preview'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left: match score, then parse data — both in one scrollable column */}
          <div className="min-h-0 overflow-y-auto pr-1 space-y-4">

            {/* ── Match score ── */}
            <div className="space-y-3">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Match Score</div>
              {matchLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : matchError ? (
                <p className="text-xs text-destructive py-2">{matchError}</p>
              ) : !matchData ? (
                <p className="text-xs text-muted-foreground italic py-2">No matching data for this candidate yet.</p>
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

            {/* ── Parsed CV detail — no fetch, already on the row ── */}
            <div className="space-y-3 pt-3 border-t">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Parsed CV Detail</div>

              {!hasParseData ? (
                <p className="text-xs text-muted-foreground italic py-2">No parsed CV data for this candidate.</p>
              ) : (
                <>
                  {(jobPosition.current || jobPosition.duration || jobPosition.location) && (
                    <div className="rounded-lg border p-3 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-xs font-semibold">
                        <Briefcase className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        {jobPosition.current || '—'}
                        {jobPosition.category && <Badge variant="outline" className="text-[9px] ml-1">{jobPosition.category}</Badge>}
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                        {jobPosition.duration && (
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {jobPosition.duration}</span>
                        )}
                        {jobPosition.location && (
                          <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {jobPosition.location}</span>
                        )}
                      </div>
                    </div>
                  )}

                  {skills.length > 0 && (
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">Skills</div>
                      <div className="flex flex-wrap gap-1">
                        {skills.map((s) => (
                          <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {experience.years_total != null && (
                    <p className="text-[11px] text-muted-foreground">
                      <span className="font-semibold text-foreground">{experience.years_total}</span> years total experience
                    </p>
                  )}

                  {positions.length > 0 && (
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">Experience</div>
                      <div className="space-y-1.5">
                        {positions.map((p, idx) => (
                          <div key={idx} className="text-[11px] px-3 py-2 rounded-md bg-muted/30 border">
                            <div className="font-semibold">
                              {p.title}{p.company && <span className="text-muted-foreground font-normal"> · {p.company}</span>}
                            </div>
                            {p.years ? <div className="text-muted-foreground">{p.years} yrs</div> : null}
                            {p.description && <div className="text-muted-foreground italic mt-0.5">{p.description}</div>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {education.length > 0 && (
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1 flex items-center gap-1">
                        <GraduationCap className="h-3 w-3" /> Education
                      </div>
                      <div className="space-y-1.5">
                        {education.map((e, idx) => (
                          <div key={idx} className="text-[11px] px-3 py-2 rounded-md bg-muted/30 border">
                            <div className="font-semibold">
                              {e.degree}{e.school && <span className="text-muted-foreground font-normal"> · {e.school}</span>}
                            </div>
                            {(e.year || e.tier) && (
                              <div className="text-muted-foreground">{[e.year, e.tier].filter(Boolean).join(' · ')}</div>
                            )}
                            {e.description && <div className="text-muted-foreground italic mt-0.5">{e.description}</div>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
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
