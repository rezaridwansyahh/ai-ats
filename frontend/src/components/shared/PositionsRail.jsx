import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

/**
 * Badge color for a position's status pill (ACTIVE / DRAFT / etc).
 * Exported so callers can reuse the same tone logic elsewhere if needed.
 */
export function statusTone(status) {
  switch ((status || '').toLowerCase()) {
    case 'active':
    case 'open':
    case 'running':
      return 'border-emerald-200 text-emerald-700 bg-emerald-50';
    case 'draft':
      return 'border-amber-200 text-amber-700 bg-amber-50';
    case 'expired':
    case 'failed':
      return 'border-rose-200 text-rose-700 bg-rose-50';
    default:
      return 'border-border text-muted-foreground bg-muted/40';
  }
}

/**
 * PositionsRail
 *
 * The left-hand "Positions · N" card used across the Selection pipeline
 * (AI Screening, Interview, Psychological Ass., Medical Assessment,
 * Background Check). Shows an "All positions" row plus one row per
 * position with a status badge and a count.
 *
 * ─── Expected shape of each item in `positions` ───
 *   {
 *     job_id: string | number,   // unique key
 *     job_title: string,         // display name
 *     status?: string,           // 'active' | 'draft' | 'expired' | ...
 *     total: number,             // count shown on the right (e.g. candidates at this stage)
 *   }
 *
 * Each page's data loader is responsible for mapping its own API response
 * into this shape before passing it in — that's what keeps this component
 * reusable across stages with different backends/fields.
 *
 * @param {Array}   positions      - list of positions, see shape above
 * @param {*}       activeJob      - currently selected position object, or '' for "All positions"
 * @param {Function} onSelectJob   - (position) => void — called when a row is clicked
 * @param {Function} onResetView   - () => void — called when "All positions" is clicked
 * @param {number}  totalCount     - number shown next to "All positions" (e.g. total candidates)
 * @param {boolean} loading        - shows a spinner instead of the list
 * @param {string}  emptyMessage   - shown when positions.length === 0
 * @param {string}  title          - card header label, defaults to "Positions"
 * @param {string}  dataTour       - optional data-tour attribute for onboarding tours
 * @param {string}  className      - optional extra classes on the Card wrapper
 */
export default function PositionsRail({
  positions = [],
  activeJob = '',
  onSelectJob,
  onResetView,
  totalCount = 0,
  loading = false,
  emptyMessage = 'No positions.',
  title = 'Positions',
  dataTour,
  className = '',
}) {
  const isAllActive = activeJob === '';

  return (
    <Card data-tour={dataTour} className={`self-start ${className}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">
          {title} · {positions.length}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 px-2 pb-2">
        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : positions.length === 0 ? (
          <p className="text-xs text-muted-foreground italic px-2 py-3">{emptyMessage}</p>
        ) : (
          <>
            <button
              type="button"
              onClick={onResetView}
              className={[
                'w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-semibold',
                isAllActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted/60 text-foreground',
              ].join(' ')}
            >
              <span>All positions</span>
              <span className="font-mono text-[10px]">{totalCount}</span>
            </button>
            <div className="space-y-0.5 mt-1">
              {positions.map((p) => (
                <button
                  key={p.job_id}
                  type="button"
                  onClick={() => onSelectJob?.(p)}
                  className={[
                    'w-full flex items-center justify-between gap-2 px-3 py-2 rounded-md text-xs',
                    activeJob?.job_id === p.job_id
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted/60 text-foreground',
                  ].join(' ')}
                >
                  <span className="truncate text-left flex items-center gap-1.5 min-w-0">
                    <span className="truncate">{p.job_title}</span>
                    {p.status && (
                      <Badge
                        variant="outline"
                        className={`text-[8px] uppercase tracking-wide shrink-0 ${statusTone(p.status)}`}
                      >
                        {p.status}
                      </Badge>
                    )}
                  </span>
                  <span className="font-mono text-[10px] text-muted-foreground shrink-0">{p.total}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}