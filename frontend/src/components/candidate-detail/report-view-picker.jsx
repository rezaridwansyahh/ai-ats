// Split out of ScoreDecideTab.jsx: Fast Refresh requires a file to export
// ONLY components, and this one needs to export two plain functions
// (pickCodec, renderReportView) for reuse by AssessmentReportReadOnly.jsx.
import ReportViewA from '@/components/assessment-a/report/ReportView';
import ReportViewB from '@/components/assessment-b/report/ReportView';
import ReportViewC from '@/components/assessment-c/report/ReportView';
import ReportViewD from '@/components/assessment-d/report/ReportView';
import ReportViewInsights from '@/components/assessment-insights/report/ReportView';
import ReportViewTKI from '@/components/assessment-tki/report/ReportView';
import {
  unpackAssessorState as unpackGeneric,
  packAssessorState   as packGeneric,
} from '@/components/assessment/assessor-state';
import {
  unpackAssessorState as unpackInsights,
  packAssessorState   as packInsights,
} from '@/components/assessment-insights/report/assessor-state';
import {
  unpackAssessorState as unpackTKI,
  packAssessorState   as packTKI,
} from '@/components/assessment-tki/report/assessor-state';

// Per-assessment annotation shapes (notes/ratings/meta differ across Insights, TKI, A-D).
// Pick the codec by assessment_id at render time.
const INSIGHTS_ASSESSMENT_ID = 5;
const TKI_ASSESSMENT_ID      = 6;
export function pickCodec(result) {
  switch (result?.assessment_id) {
    case INSIGHTS_ASSESSMENT_ID: return { unpack: unpackInsights, pack: packInsights };
    case TKI_ASSESSMENT_ID:      return { unpack: unpackTKI,      pack: packTKI      };
    default:                     return { unpack: unpackGeneric,  pack: packGeneric  };
  }
}

export function renderReportView(battery, props) {
  switch (battery) {
    case 'A': return <ReportViewA {...props} />;
    case 'C': return <ReportViewC {...props} />;
    case 'D': return <ReportViewD {...props} />;
    case 'B':
    default:  return <ReportViewB {...props} />;
  }
}
