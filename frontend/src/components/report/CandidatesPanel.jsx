import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, Loader2 } from 'lucide-react';
import { TablePagination } from '@/components/shared/TablePagination';
import { getInitials } from '@/lib/batteries';

// Right panel: paginated card-style list of candidates for the selected job.
// Visual pattern lifted from the JobManagement "All Jobs" list (JobCreation.jsx) so
// the recruiter app stays consistent across surfaces.
// Data shape from /candidate-pipeline/job/:job_id → master_candidate rows.
export default function CandidatesPanel({ jobTitle, candidates, loading, error, onSelectCandidate }) {
  const [search, setSearch]     = useState('');
  const [page, setPage]         = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return candidates;
    return candidates.filter((c) =>
      (c.candidate_name  || '').toLowerCase().includes(q) ||
      (c.last_position   || '').toLowerCase().includes(q) ||
      (c.candidate_email || '').toLowerCase().includes(q)
    );
  }, [candidates, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated  = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <Card>
      <CardHeader className="pb-3 space-y-3">
        <div>
          <h2 className="text-sm font-bold">{jobTitle}</h2>
          <p className="text-[11px] text-muted-foreground">
            {candidates.length} {candidates.length === 1 ? 'candidate' : 'candidates'}
          </p>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search name, role, or email..."
            className="pl-8 h-8 text-xs"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
      </CardHeader>

      <CardContent>
        {error ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
            {error}
          </div>
        ) : loading ? (
          <div className="text-center py-10 text-xs text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin inline mr-1.5" />Loading candidates…
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-10 text-xs text-muted-foreground">
            {candidates.length === 0 ? 'No candidates yet for this job.' : 'No candidates match.'}
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {paginated.map((c) => {
                const name  = c.candidate_name  || c.name || '—';
                const role  = c.last_position   || '—';
                const email = c.candidate_email || '—';
                return (
                  <div
                    key={c.id}
                    onClick={() => onSelectCandidate?.(c)}
                    className="flex items-center justify-between p-3 border rounded-lg transition-colors hover:bg-muted/30 cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[11px] font-bold shrink-0">
                        {getInitials(name)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold truncate">{name}</div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[10px] text-muted-foreground truncate">{email}</span>
                          <span className="text-[10px] text-muted-foreground truncate">{role}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <TablePagination
              page={page}
              totalPages={totalPages}
              totalItems={filtered.length}
              pageSize={pageSize}
              setPage={setPage}
              setPageSize={setPageSize}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}
