import { Briefcase, GraduationCap, MapPin, Plus, Search, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import FacetInput from './FacetInput';

function scoreBg(score) {
  if (score == null) return 'bg-gray-100 text-gray-500 border-gray-200';
  if (score >= 80) return 'bg-emerald-100 text-emerald-700 border-emerald-200';
  if (score >= 60) return 'bg-amber-100 text-amber-700 border-amber-200';
  return 'bg-rose-100 text-rose-700 border-rose-200';
}

function formatDate(d) {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString(); } catch { return '—'; }
}

/*
 * Presentational only — receives the already-filtered + paginated `rows`
 * from TalentPoolPage. All filter state and pagination math live there;
 * this component just renders the toolbar form and table for the current page.
 */
export default function TalentPoolTable({
  rows,
  total,
  loading,
  error,
  hasActiveFilters,
  positionDraft,
  educationDraft,
  onPositionDraftChange,
  onEducationDraftChange,
  onSearchSubmit,
  onAddClick,
  page,
  pageSize,
  totalPages,
  paginationPages,
  onPageChange,
}) {
  return (
    <Card>
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <CardTitle className="text-sm shrink-0">
            Results
            {!loading && (
              <span className="ml-2 text-[11px] font-normal text-muted-foreground">
                {total} {total === 1 ? 'result' : 'results'}
              </span>
            )}
          </CardTitle>

          <form onSubmit={onSearchSubmit} className="flex items-end gap-2 flex-wrap">
            <FacetInput
              icon={<Briefcase className="h-3 w-3" />}
              placeholder="Position"
              value={positionDraft}
              onChange={onPositionDraftChange}
            />
            <FacetInput
              icon={<GraduationCap className="h-3 w-3" />}
              placeholder="Education"
              value={educationDraft}
              onChange={onEducationDraftChange}
            />
            <Button type="submit" size="sm" className="h-8 text-xs">
              <Search className="h-3 w-3 mr-1" /> Search
            </Button>
          </form>
        </div>
      </CardHeader>

      <CardContent className="p-0">

        {error && (
          <div className="flex items-center gap-2 mx-4 mt-4 px-4 py-3 rounded-lg border border-red-200 bg-red-50 text-sm text-red-600">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="overflow-x-auto">
          <Table className="table-fixed w-full">
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="w-[20%] text-[10px] font-bold uppercase pl-6">Name</TableHead>
                <TableHead className="w-[18%] text-[10px] font-bold uppercase">Last Position</TableHead>
                <TableHead className="w-[22%] text-[10px] font-bold uppercase">Skills</TableHead>
                <TableHead className="w-[14%] text-[10px] font-bold uppercase">Location</TableHead>
                <TableHead className="w-[10%] text-[10px] font-bold uppercase text-center">Score</TableHead>
                <TableHead className="w-[8%] text-[10px] font-bold uppercase">Applied</TableHead>
                <TableHead className="w-[8%] text-[10px] font-bold uppercase text-right pr-6">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-xs text-muted-foreground">
                    Loading applicants...
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-xs text-muted-foreground">
                    {hasActiveFilters ? 'No applicants match your filters.' : 'No applicants found.'}
                  </TableCell>
                </TableRow>
              ) : rows.map(r => {
                const info        = r.information || {};
                const skillTags   = Array.isArray(info.skills) ? info.skills.slice(0, 4) : [];
                const moreSkills  = (Array.isArray(info.skills) ? info.skills.length : 0) - skillTags.length;
                const positionLabel  = info.job_position?.current || r.last_position || '—';
                const categoryLabel  = info.job_position?.category;

                return (
                  <TableRow key={r.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="text-xs pl-6">
                      <div className="font-semibold">{r.name}</div>
                    </TableCell>

                    <TableCell className="text-xs">
                      <div className="truncate font-medium">{positionLabel}</div>
                      {categoryLabel && (
                        <div className="text-[10px] text-muted-foreground truncate">{categoryLabel}</div>
                      )}
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {skillTags.length === 0 ? (
                          <span className="text-[10px] text-muted-foreground">—</span>
                        ) : (
                          <>
                            {skillTags.map(s => (
                              <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>
                            ))}
                            {moreSkills > 0 && (
                              <span className="text-[10px] text-muted-foreground self-center">+{moreSkills}</span>
                            )}
                          </>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="text-xs">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                        <span className="truncate">{r.address || '—'}</span>
                      </div>
                    </TableCell>

                    <TableCell className="text-center">
                      <Badge className={`text-[10px] font-mono font-semibold ${scoreBg(r.latest_score)}`}>
                        {r.latest_score ?? '—'}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(r.date)}
                    </TableCell>

                    <TableCell className="text-right pr-6">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-[11px] h-7 px-2.5"
                        onClick={() => onAddClick(r)}
                      >
                        <Plus className="h-3 w-3 mr-1" /> Add
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {totalPages > 1 && (
          <div className="flex flex-col items-center gap-2 py-4 border-t">
            <div className="flex items-center gap-1">
              <Button
                variant="outline" size="sm" className="h-7 text-xs"
                disabled={page <= 1}
                onClick={() => onPageChange(page - 1)}
              >
                Previous
              </Button>
              {paginationPages.map((p, idx) =>
                p === '...' ? (
                  <span key={`dots-${idx}`} className="text-xs text-muted-foreground px-1">...</span>
                ) : (
                  <Button
                    key={p}
                    variant={page === p ? 'default' : 'outline'}
                    size="sm"
                    className="h-7 w-7 text-xs p-0"
                    onClick={() => onPageChange(p)}
                  >
                    {p}
                  </Button>
                )
              )}
              <Button
                variant="outline" size="sm" className="h-7 text-xs"
                disabled={page >= totalPages}
                onClick={() => onPageChange(page + 1)}
              >
                Next
              </Button>
            </div>
            <span className="text-[10px] text-muted-foreground">
              Showing {total === 0 ? 0 : (page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
            </span>
          </div>
        )}

      </CardContent>
    </Card>
  );
}