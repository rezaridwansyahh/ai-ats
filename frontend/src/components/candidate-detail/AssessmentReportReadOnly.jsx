import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { pickCodec, renderReportView } from './report-view-picker';
import { downloadQaPdf } from '@/api/assessment-battery-result.api';

// No-op — this view never writes back. Passed in place of ScoreDecideTab's
// real updateState/saveNow so the exact same ReportView components render,
// but typing into a narrative/notes field has no effect and nothing ever
// reaches updateAssessmentReport(). Editing stays exclusive to the Psych
// Assessment page's own Score & Decide tab.
const noop = () => {};

/*
 * Read-only "detailed info" for the Assessment stage of CandidateProfile.jsx's
 * stage timeline — same ReportView (scores, charts, assessor narratives) the
 * Psych Assessment page's Score & Decide tab shows, minus the editing/autosave
 * machinery that tab wraps around it (debounced PUT, AI regeneration polling,
 * final-recommendation controls). Those are specific to actively assessing a
 * candidate, not to viewing their result from a profile page.
 */
export default function AssessmentReportReadOnly({ loading, candidate, battery, result }) {
  const [downloadingQa, setDownloadingQa] = useState(false);

  const handleDownloadQaPdf = async () => {
    if (!result?.id) return;
    setDownloadingQa(true);
    try {
      const res = await downloadQaPdf(result.id);
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `assessment-qa-${candidate?.candidate_name || result.id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      let message = 'Failed to generate Q&A PDF';
      const errBlob = err?.response?.data;
      if (errBlob instanceof Blob) {
        try {
          const parsed = JSON.parse(await errBlob.text());
          if (parsed?.message) message = parsed.message;
        } catch { /* keep default message */ }
      } else if (err?.message) {
        message = err.message;
      }
      toast.error(message);
    } finally {
      setDownloadingQa(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-10 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading assessment…
        </CardContent>
      </Card>
    );
  }

  const hasResults = !!result?.results?.by_subtest;
  if (!hasResults) {
    return (
      <Card>
        <CardContent className="py-10 text-center space-y-1">
          <p className="text-sm font-semibold">No assessment yet</p>
          <p className="text-xs text-muted-foreground">
            {battery
              ? 'This candidate hasn’t completed their assessment battery yet.'
              : 'This job has no assessment battery assigned.'}
          </p>
        </CardContent>
      </Card>
    );
  }

  const { unpack } = pickCodec(result);
  const state = unpack(result);

  const profile = {
    name:       result.participant_name      ?? candidate?.candidate_name ?? '—',
    position:   result.participant_position  ?? candidate?.last_position  ?? '—',
    department: result.participant_department ?? '—',
    education:  result.participant_education  ?? candidate?.education     ?? '—',
    email:      result.participant_email     ?? candidate?.candidate_email ?? '—',
    date_birth: result.participant_date_birth ?? null,
    date:       result.assessment_date ?? null,
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          className="text-xs"
          onClick={handleDownloadQaPdf}
          disabled={downloadingQa}
        >
          {downloadingQa
            ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Generating…</>
            : <><FileText className="h-3.5 w-3.5 mr-1.5" /> Download Q&A PDF</>}
        </Button>
      </div>
      {renderReportView(battery, {
        profile,
        results: result.results.by_subtest,
        state,
        updateState: noop,
        saveNow: noop,
      })}
    </div>
  );
}
