import { Card, CardContent } from '@/components/ui/card';
import ReportViewA from '@/components/assessment-a/report/ReportView';
import ReportViewB from '@/components/assessment-b/report/ReportView';
import ReportViewC from '@/components/assessment-c/report/ReportView';
import ReportViewD from '@/components/assessment-d/report/ReportView';

// Tab 3: wraps the existing battery ReportView for completed candidates.
// For not-yet-completed candidates, renders an empty-state card prompting back to Setup/Take.
export default function ScoreDecideTab({ candidate, battery, hasResults, onJumpToTab }) {
  if (!hasResults) {
    return (
      <Card>
        <CardContent className="py-14 text-center space-y-2">
          <h3 className="text-sm font-bold">Belum diasesmen</h3>
          <p className="text-xs text-muted-foreground">
            {battery
              ? 'Tunggu kandidat menyelesaikan seluruh subtes, lalu laporan akan muncul di sini.'
              : 'Pilih battery di tab Setup terlebih dahulu.'}
          </p>
          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => onJumpToTab?.('setup')}
              className="text-[11px] font-semibold text-primary hover:underline"
            >
              ← Kembali ke Setup
            </button>
            {battery && (
              <>
                <span className="text-muted-foreground/40">·</span>
                <button
                  type="button"
                  onClick={() => onJumpToTab?.('take')}
                  className="text-[11px] font-semibold text-primary hover:underline"
                >
                  Cek status Take →
                </button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  const profile = {
    name:       candidate.name,
    position:   candidate.role,
    email:      candidate.email ?? '—',
    department: candidate.department ?? '—',
    education:  candidate.education ?? '—',
  };
  const props = { profile, results: {}, state: {}, updateState: () => {} };

  switch (battery) {
    case 'A': return <ReportViewA {...props} />;
    case 'C': return <ReportViewC {...props} />;
    case 'D': return <ReportViewD {...props} />;
    case 'B':
    default:  return <ReportViewB {...props} />;
  }
}
