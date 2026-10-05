import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { pickCodec, renderReportView } from './report-view-picker';

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

  return renderReportView(battery, {
    profile,
    results: result.results.by_subtest,
    state,
    updateState: noop,
    saveNow: noop,
  });
}
