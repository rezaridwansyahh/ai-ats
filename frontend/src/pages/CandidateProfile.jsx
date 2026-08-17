import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Loader2, AlertTriangle, Mail, Download,
  Check, GraduationCap, Briefcase, Clock, Send, CalendarDays,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/common';

import {
  getCandidateById,
  getProgress,
  downloadCandidateCv,
  sendCandidateEmail,
} from '@/api/candidate.api';

function getInitials(name) {
  if (typeof name !== 'string' || !name.trim()) return '?';
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export default function CandidateProfile() {
  const navigate = useNavigate();
  const { id } = useParams();
  const candidateId = Number(id);

  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);

  const [progress, setProgress]         = useState([]);
  const [progressLoading, setProgressLoading] = useState(true);

  const [downloading, setDownloading]   = useState(false);
  const [downloadError, setDownloadError] = useState(null); // null | 'not_found' | 'error'

  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody]       = useState('');
  const [emailStatus, setEmailStatus]   = useState('idle'); // idle | sending | sent | error

  /* ── Fetch candidate ── */
  const fetchCandidate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getCandidateById(candidateId);
      setCandidate(res.data?.pipeline ?? null);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load candidate');
      setCandidate(null);
    } finally {
      setLoading(false);
    }
  };

  /* ── Fetch stage progress/timeline ── */
  const fetchProgress = async () => {
    setProgressLoading(true);
    try {
      const res = await getProgress(candidateId);
      const raw = res.data?.progress ?? res.data?.stages ?? res.data?.data ?? [];
      setProgress(Array.isArray(raw) ? raw : []);
    } catch {
      setProgress([]);
    } finally {
      setProgressLoading(false);
    }
  };

  useEffect(() => { fetchCandidate(); }, [candidateId]);
  useEffect(() => { fetchProgress(); }, [candidateId]);

  /* ── CV download ── */
  const handleDownloadCv = async () => {
    if (!candidate?.applicant_id) return;
    setDownloading(true);
    setDownloadError(null);
    try {
      const res = await downloadCandidateCv(candidate.applicant_id);
      const blobUrl = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `${candidate?.candidate_name ?? 'candidate'}-cv.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      setDownloadError(err.response?.status === 404 ? 'not_found' : 'error');
    } finally {
      setDownloading(false);
    }
  };

  /* ── Email ── */
  const handleSendEmail = async () => {
    if (!emailSubject.trim() || !emailBody.trim()) return;
    setEmailStatus('sending');
    try {
      await sendCandidateEmail(candidateId, { subject: emailSubject, body: emailBody });
      setEmailStatus('sent');
      setEmailSubject('');
      setEmailBody('');
      setTimeout(() => setEmailStatus('idle'), 2500);
    } catch {
      setEmailStatus('error');
    }
  };

  /* ── Loading / error states ── */
  if (loading) {
    return (
      <div className="p-6 flex items-center gap-2 text-xs text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading candidate…
      </div>
    );
  }

  if (error || !candidate) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg border border-red-200 bg-red-50 text-sm text-red-600">
          <AlertTriangle className="h-4 w-4" />
          {error || 'Candidate not found.'}
        </div>
      </div>
    );
  }

  // Field lookups are defensive/multi-fallback since the exact nested shape
  // of `information` beyond job_position/experience/skills hasn't been
  // confirmed against a live payload — adjust the chains below once you
  // check the real response for phone/source/applied-date/notes.
  const view = {
    name:       candidate.candidate_name ?? '—',
    role:       candidate.information?.job_position?.current ?? candidate.last_position ?? '—',
    email:      candidate.candidate_email ?? '—',
    education:  candidate.education ?? '—',
    experience: candidate.information?.experience?.years_total
      ? `${candidate.information.experience.years_total} years`
      : '—',
    applied:    candidate.date ? new Date(candidate.date).toLocaleDateString() : '—',
    skills:     candidate.information?.skills ?? [],
    positions:  candidate.information?.experience?.positions ?? [],
    stageName:  candidate.latest_stage_name ?? null,
    jobId:      candidate.job_id ?? null,
    applicantId: candidate.applicant_id ?? null,
    hasAttachment: candidate.attachment != null,
  };

  // getProgress appears to return the job's full fixed stage list (not a
  // growing history), so "last item = current" was wrong — it always
  // pointed at the final stage regardless of where the candidate actually
  // is. Match against latest_stage_name instead, which we've confirmed is
  // correct (it's what the header badge and pipeline table both use).
  const currentIdx = progress.findIndex((step) => {
    const label = step.stage_name ?? step.label ?? step.name;
    return label === view.stageName;
  });

  return (
    <>
      <div className="sticky top-[52px] z-10 bg-background/95 backdrop-blur-sm -mt-5 -mx-5 px-5 pt-5 pb-4 border-b border-border/60">
        <Button variant="ghost" size="sm" className="text-xs -ml-2 w-fit" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back
        </Button>

        <div className="flex items-center gap-3 mt-2 flex-wrap">
          <div className="h-11 w-11 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0 text-sm">
            {getInitials(view.name)}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-bold tracking-tight truncate">{view.name}</h1>
            <div className="text-[11px] text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5">
              <span>{view.role}</span>
              {view.email !== '—' && <span>· {view.email}</span>}
            </div>
          </div>
          {view.stageName && <StatusBadge label={view.stageName} variant="muted" dot />}
        </div>
      </div>

      <div className="px-6 pb-6 pt-4 max-w-[1400px]">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] gap-6">

          {/* Main column */}
          <div className="min-w-0 space-y-4">

            {/* Profile card */}
            <Card>
              <CardContent className="p-4 space-y-4">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Profile
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <InfoRow icon={Briefcase} label="Role" value={view.role} />
                  <InfoRow icon={Clock} label="Experience" value={view.experience} />
                  <InfoRow icon={GraduationCap} label="Education" value={view.education} />
                  <InfoRow icon={Mail} label="Email" value={view.email} />
                  <InfoRow icon={CalendarDays} label="Applied" value={view.applied} />
                </div>

                {view.skills.length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
                      Skills
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {view.skills.map((skill) => (
                        <span
                          key={skill}
                          className="text-[11px] px-2.5 py-1 rounded-full bg-muted text-muted-foreground font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Stage stepper — horizontal, mirrors the S-A-I-P-V-O-N ribbon
                used elsewhere in the app */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Stage Timeline
                </p>
                {progressLoading ? (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground py-4">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading timeline…
                  </div>
                ) : progress.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-4">No stage history yet.</p>
                ) : (
                  <div className="flex items-start overflow-x-auto pb-1">
                    {progress.map((step, i) => {
                      const label = step.stage_name ?? step.label ?? step.name ?? `Stage ${i + 1}`;
                      const date  = step.date ?? step.created_at ?? step.updated_at ?? null;
                      const isCurrent = i === currentIdx;
                      const isPast    = i < currentIdx;
                      return (
                        <div key={step.id ?? i} className="flex items-start flex-1 min-w-[110px]">
                          <div className="flex flex-col items-center flex-1">
                            <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold shrink-0 ${
                              isCurrent
                                ? 'bg-primary text-primary-foreground'
                                : isPast
                                  ? 'bg-emerald-500 text-white'
                                  : 'bg-muted text-muted-foreground'
                            }`}>
                              {isPast ? <Check className="h-3 w-3" /> : i + 1}
                            </span>
                            <span className={`mt-1.5 text-[11px] text-center leading-tight ${isCurrent ? 'font-semibold' : 'font-medium text-muted-foreground'}`}>
                              {label}
                            </span>
                            {date && (
                              <span className="text-[9px] text-muted-foreground mt-0.5">{date}</span>
                            )}
                          </div>
                          {i < progress.length - 1 && (
                            <div className={`h-[2px] flex-1 mt-3 ${isPast ? 'bg-emerald-400' : 'bg-border'}`} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Work history */}
            {view.positions.length > 0 && (
              <Card>
                <CardContent className="p-4 space-y-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Work History
                  </p>
                  <ul className="space-y-3">
                    {view.positions.map((pos, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-muted-foreground shrink-0 mt-0.5">
                          <Briefcase className="h-3 w-3" />
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold">{pos.title}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {pos.company}{pos.years ? ` · ${pos.years} yr${pos.years === 1 ? '' : 's'}` : ''}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <aside>
            <div className="sticky top-[184px] space-y-3">

              <Card>
                <CardContent className="p-3 space-y-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Resume
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full text-xs"
                    onClick={handleDownloadCv}
                    disabled={downloading || downloadError === 'not_found' || !view.hasAttachment || !view.applicantId}
                  >
                    {downloading ? (
                      <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Downloading…</>
                    ) : (
                      <><Download className="h-3.5 w-3.5 mr-1.5" /> Download CV</>
                    )}
                  </Button>
                  {/* Genuinely no CV on file, per the candidate's own record */}
                  {!view.hasAttachment && !downloadError && (
                    <p className="text-[10px] text-muted-foreground">No CV has been uploaded for this candidate.</p>
                  )}
                  {/* applicant_id missing would mean the backend response is
                      somehow older than Fix A — shouldn't happen post-fix,
                      but guarded rather than silently calling with undefined. */}
                  {view.hasAttachment && !view.applicantId && (
                    <p className="text-[10px] text-amber-600 leading-snug">
                      Missing applicant reference — refresh the page or check the backend response.
                    </p>
                  )}
                  {downloadError === 'not_found' && view.applicantId && (
                    <p className="text-[10px] text-rose-600">File not found — try again or re-upload in Talent Pool.</p>
                  )}
                  {downloadError === 'error' && (
                    <p className="text-[10px] text-rose-600">Failed to download — try again.</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-3 space-y-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Email Candidate
                  </p>
                  <input
                    type="text"
                    placeholder="Subject"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    className="w-full px-2.5 py-1.5 border rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <textarea
                    placeholder="Message"
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    rows={4}
                    className="w-full px-2.5 py-1.5 border rounded-md text-xs resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <Button
                    size="sm"
                    className="w-full text-xs"
                    onClick={handleSendEmail}
                    disabled={emailStatus === 'sending' || !emailSubject.trim() || !emailBody.trim()}
                  >
                    {emailStatus === 'sending' ? (
                      <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Sending…</>
                    ) : (
                      <><Send className="h-3.5 w-3.5 mr-1.5" /> Send</>
                    )}
                  </Button>
                  {emailStatus === 'sent' && (
                    <p className="text-[10px] text-emerald-600 flex items-center gap-1">
                      <Check className="h-3 w-3" /> Email sent
                    </p>
                  )}
                  {emailStatus === 'error' && (
                    <p className="text-[10px] text-rose-600">Failed to send — try again.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
      <div className="min-w-0">
        <div className="text-[10px] text-muted-foreground">{label}</div>
        <div className="text-xs font-medium truncate">{value}</div>
      </div>
    </div>
  );
}