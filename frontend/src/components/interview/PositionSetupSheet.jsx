import { useState, useEffect, useCallback } from 'react';
import {
  Loader2, AlertTriangle, Check, Copy, Link, Lock,
  Wand2, ClipboardList, Users, Settings2, RefreshCw,
} from 'lucide-react';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

import {
  getPrep,
  generateQuestions,
  getInterviewsByJobSubStage,
  generatePackLink,
} from '@/api/interview.api';

// Sub-stage helper (mirrors workboard)
function toSubStage(status) {
  if (['ongoing', 'scheduled'].includes(status)) return 'schedule';
  if (['interviewed', 'no_show', 'reschedule'].includes(status)) return 'result';
  if (status === 'done') return 'decide';
  return 'schedule';
}

const SUB_STAGE_COLORS = {
  schedule: 'bg-violet-100 text-violet-700',
  result:   'bg-amber-100 text-amber-700',
  decide:   'bg-emerald-100 text-emerald-700',
};

const STATUS_META = {
  ongoing:     { label: 'Ongoing',     color: 'bg-blue-100 text-blue-700'       },
  scheduled:   { label: 'Scheduled',   color: 'bg-violet-100 text-violet-700'   },
  interviewed: { label: 'Interviewed', color: 'bg-emerald-100 text-emerald-700' },
  no_show:     { label: 'No Show',     color: 'bg-rose-100 text-rose-700'       },
  reschedule:  { label: 'Reschedule',  color: 'bg-amber-100 text-amber-700'     },
  done:        { label: 'Done',        color: 'bg-emerald-100 text-emerald-700' },
};

export default function PositionSetupSheet({ open, onOpenChange, position, onUpdated }) {
  const [prep, setPrep]                     = useState(null);
  const [loadingPrep, setLoadingPrep]       = useState(false);
  const [tab, setTab]                       = useState('setup');
  const [generatingLink, setGeneratingLink] = useState(false);
  const [packLink, setPackLink]             = useState(null);
  const [linkCopied, setLinkCopied]         = useState(false);
  const [candidates, setCandidates]         = useState([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [generatingQuestions, setGeneratingQuestions] = useState(false);
  const [error, setError]                   = useState(null);
  const [banner, setBanner]                 = useState(null);

  const jobId = position?.job_id;

  const loadData = useCallback(async () => {
    if (!jobId) return;
    setLoadingPrep(true);
    setLoadingCandidates(true);
    setError(null);
    setBanner(null);

    try {
      const prepRes = await getPrep(jobId);
      const p = prepRes.data?.prep || null;
      setPrep(p);
      if (p?.pack_token) {
        setPackLink(`${window.location.origin}/portal/interview/${p.pack_token}`);
      } else {
        setPackLink(null);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load prep');
    } finally {
      setLoadingPrep(false);
    }

    try {
      const res = await getInterviewsByJobSubStage(jobId);
      setCandidates(res.data?.interviews || []);
    } catch {
      setCandidates([]);
    } finally {
      setLoadingCandidates(false);
    }
  }, [jobId]);

  useEffect(() => {
    if (open && jobId) {
      setTab('setup');
      loadData();
    }
  }, [open, jobId, loadData]);

  const handleGenerateQuestions = async () => {
    if (!jobId || generatingQuestions) return;
    setGeneratingQuestions(true);
    setError(null);
    setBanner(null);
    try {
      await generateQuestions(jobId, { num_questions: 10 });
      // Reload prep to get newly generated questions
      const prepRes = await getPrep(jobId);
      setPrep(prepRes.data?.prep || null);
      setBanner({ ok: true, text: 'Questions generated successfully.' });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to generate questions');
    } finally {
      setGeneratingQuestions(false);
    }
  };

  const handleGenerateLink = async () => {
    if (!jobId || generatingLink) return;
    setGeneratingLink(true);
    setError(null);
    setBanner(null);
    try {
      const res = await generatePackLink(jobId);
      const token = res.data?.pack_token || res.data?.token;
      if (token) {
        const url = `${window.location.origin}/portal/interview/${token}`;
        setPackLink(url);
        setBanner({ ok: true, text: 'Interview pack link generated.' });
        if (onUpdated) onUpdated();
      } else if (res.data?.pack_link || res.data?.link) {
        setPackLink(res.data.pack_link || res.data.link);
        setBanner({ ok: true, text: 'Interview pack link generated.' });
        if (onUpdated) onUpdated();
      } else {
        // Reload prep to check if token was set
        const prepRes = await getPrep(jobId);
        const p = prepRes.data?.prep || null;
        setPrep(p);
        if (p?.pack_token) {
          const url = `${window.location.origin}/portal/interview/${p.pack_token}`;
          setPackLink(url);
          setBanner({ ok: true, text: 'Interview pack link generated.' });
          if (onUpdated) onUpdated();
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to generate link');
    } finally {
      setGeneratingLink(false);
    }
  };

  const handleCopyLink = () => {
    if (!packLink) return;
    navigator.clipboard.writeText(packLink).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    });
  };

  // Whether prep is ready enough to generate a link (needs rubric + questions)
  const prepReady = !!(prep?.rubric_items?.length && prep?.questions?.length);

  // Group candidates by sub_stage for the Candidates tab
  const candidateGroups = {
    schedule: candidates.filter((c) => toSubStage(c.status) === 'schedule'),
    result:   candidates.filter((c) => toSubStage(c.status) === 'result'),
    decide:   candidates.filter((c) => toSubStage(c.status) === 'decide'),
  };

  const TABS = [
    { key: 'setup',      label: 'Setup',      icon: Settings2 },
    { key: 'candidates', label: 'Candidates', icon: Users      },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full max-w-2xl flex flex-col p-0 gap-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border shrink-0">
          <SheetTitle className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-primary shrink-0" />
            {position?.job_title || 'Position Setup'}
          </SheetTitle>
          <SheetDescription>
            Configure rubric, questions, and interview pack link for this position.
          </SheetDescription>
        </SheetHeader>

        {/* Tab strip */}
        <div className="flex border-b border-border px-6 shrink-0">
          {TABS.map((tabDef) => {
            const TabIcon = tabDef.icon;
            return (
              <button
                key={tabDef.key}
                type="button"
                onClick={() => setTab(tabDef.key)}
                className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
                  tab === tabDef.key
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <TabIcon className="h-3.5 w-3.5" />
                {tabDef.label}
                {tabDef.key === 'candidates' && candidates.length > 0 && (
                  <span className="ml-1 bg-muted text-muted-foreground text-[9px] font-mono px-1.5 py-0.5 rounded-full">
                    {candidates.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-lg border border-red-200 bg-red-50 text-sm text-red-600">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {error}
              <button type="button" className="ml-auto text-xs underline" onClick={() => setError(null)}>Dismiss</button>
            </div>
          )}
          {banner && (
            <div className={`flex items-center gap-2 px-4 py-3 rounded-lg border text-sm ${
              banner.ok
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-amber-200 bg-amber-50 text-amber-700'
            }`}>
              <Check className="h-4 w-4 shrink-0" />
              {banner.text}
              <button type="button" className="ml-auto text-xs underline" onClick={() => setBanner(null)}>Dismiss</button>
            </div>
          )}

          {/* ─── SETUP TAB ─────────────────────────────────────────────────── */}
          {tab === 'setup' && (
            <>
              {loadingPrep ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  {/* Rubric card */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <ClipboardList className="h-4 w-4 text-primary" />
                        Rubric
                        {prep?.rubric_items?.length > 0 && (
                          <Badge variant="outline" className="text-[9px] border-emerald-200 text-emerald-700 bg-emerald-50 ml-1">
                            {prep.rubric_items.length} competencies
                          </Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      {!prep?.rubric_items?.length ? (
                        <div className="py-6 text-center space-y-2">
                          <p className="text-xs text-muted-foreground italic">No rubric configured.</p>
                          <p className="text-[11px] text-muted-foreground">
                            Use the job rubric editor (Position page → Rubric tab) to set up competencies and weight anchors.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {prep.rubric_items.map((item) => (
                            <div
                              key={item.competency_code}
                              className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg border bg-muted/20"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <Badge
                                  variant="outline"
                                  className="text-[9px] border-blue-200 text-blue-700 font-mono shrink-0"
                                >
                                  {item.competency_code}
                                </Badge>
                                <span className="text-xs font-medium truncate">
                                  {item.competency_name}
                                </span>
                              </div>
                              <span className="text-[9px] font-mono text-muted-foreground shrink-0">
                                ×{item.weight || 1}
                              </span>
                            </div>
                          ))}
                          <p className="text-[10px] text-muted-foreground mt-2 pt-2 border-t border-border">
                            Edit weights and anchors from the position page → Rubric tab.
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Questions card */}
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Wand2 className="h-4 w-4 text-primary" />
                          Interview Questions
                          {prep?.questions?.length > 0 && (
                            <Badge variant="outline" className="text-[9px] border-emerald-200 text-emerald-700 bg-emerald-50 ml-1">
                              {prep.questions.length} questions
                            </Badge>
                          )}
                        </CardTitle>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs"
                          onClick={handleGenerateQuestions}
                          disabled={generatingQuestions}
                        >
                          {generatingQuestions
                            ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                            : <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                          }
                          {prep?.questions?.length ? 'Regenerate' : 'Generate Questions'}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      {!prep?.questions?.length ? (
                        <div className="py-6 text-center">
                          <p className="text-xs text-muted-foreground italic">
                            No questions yet. Click "Generate Questions" to create AI-powered interview questions.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {prep.questions.map((q, i) => (
                            <div
                              key={i}
                              className="rounded-lg border bg-muted/10 p-3"
                            >
                              <div className="flex items-start gap-2">
                                <span className="text-[10px] font-mono text-muted-foreground mt-0.5 shrink-0 w-4">
                                  {i + 1}
                                </span>
                                <div className="flex-1 min-w-0">
                                  {q.competency && (
                                    <Badge
                                      variant="outline"
                                      className="text-[9px] border-blue-200 text-blue-700 bg-blue-50 mb-1"
                                    >
                                      {q.competency}
                                    </Badge>
                                  )}
                                  <p className="text-xs leading-relaxed">{q.text}</p>
                                  {q.follow_up && (
                                    <p className="text-[10px] text-muted-foreground mt-0.5 italic">
                                      ↳ {q.follow_up}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Interview Pack Link card */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Link className="h-4 w-4 text-primary" />
                        Interview Pack Link
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-4">
                      {packLink ? (
                        <>
                          {/* Link display */}
                          <div className="flex items-center gap-2">
                            <Input
                              readOnly
                              value={packLink}
                              className="text-xs font-mono h-9 flex-1 bg-muted/30"
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-9 shrink-0"
                              onClick={handleCopyLink}
                            >
                              {linkCopied
                                ? <Check className="h-3.5 w-3.5 text-emerald-600" />
                                : <Copy className="h-3.5 w-3.5" />
                              }
                            </Button>
                          </div>
                          <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-emerald-200 bg-emerald-50 text-xs text-emerald-700">
                            <Check className="h-3.5 w-3.5 shrink-0" />
                            Link generated — send to your interviewer
                          </div>
                          <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-muted/20 text-xs text-muted-foreground">
                            <Lock className="h-3.5 w-3.5 shrink-0" />
                            Link generated once only — cannot be regenerated
                          </div>
                        </>
                      ) : (
                        <>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            Generate a secure link for your interviewer. Once generated, all candidates currently in the interview stage will be included. Share this link with the interviewer before the session.
                          </p>
                          {!prepReady && (
                            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-amber-200 bg-amber-50 text-xs text-amber-700">
                              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                              Set up rubric and generate questions first before creating a pack link.
                            </div>
                          )}
                          <Button
                            size="sm"
                            onClick={handleGenerateLink}
                            disabled={generatingLink || !prepReady}
                            className="text-xs"
                          >
                            {generatingLink
                              ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                              : <Link className="h-3.5 w-3.5 mr-1.5" />
                            }
                            Generate Link
                          </Button>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </>
              )}
            </>
          )}

          {/* ─── CANDIDATES TAB ────────────────────────────────────────────── */}
          {tab === 'candidates' && (
            <>
              {loadingCandidates ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : candidates.length === 0 ? (
                <div className="text-center py-12 text-xs text-muted-foreground italic">
                  No candidates in interview for this position yet.
                </div>
              ) : (
                <div className="space-y-5">
                  {[
                    { key: 'schedule', label: 'Schedule' },
                    { key: 'result',   label: 'Result'   },
                    { key: 'decide',   label: 'Decide'   },
                  ].map(({ key, label }) => {
                    const group = candidateGroups[key];
                    if (!group.length) return null;
                    return (
                      <div key={key}>
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${SUB_STAGE_COLORS[key]}`}>
                            {label}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-mono">{group.length}</span>
                        </div>
                        <div className="space-y-1.5">
                          {group.map((c) => {
                            const name       = c.candidate_name || `#${c.candidate_id}`;
                            const statusMeta = STATUS_META[c.status] || { label: c.status, color: 'bg-muted text-muted-foreground' };
                            return (
                              <div
                                key={`${c.interview_id}-${c.candidate_id}`}
                                className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg border bg-muted/10"
                              >
                                <div className="min-w-0">
                                  <p className="text-xs font-semibold truncate">{name}</p>
                                  {c.last_position && (
                                    <p className="text-[10px] text-muted-foreground truncate">{c.last_position}</p>
                                  )}
                                </div>
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0 ${statusMeta.color}`}>
                                  {statusMeta.label}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
