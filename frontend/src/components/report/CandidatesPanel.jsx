import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, Loader2 } from 'lucide-react';
import CandidateRow from './CandidateRow';

export default function CandidatesPanel({ jobTitle, candidates, loading, error, onSelectCandidate }) {
  const [search, setSearch] = useState('');

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return candidates;
    return candidates.filter((c) =>
      (c.candidate_name || '').toLowerCase().includes(q) ||
      (c.last_position  || '').toLowerCase().includes(q)
    );
  }, [candidates, search]);

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
            placeholder="Search candidate or role..."
            className="pl-8 h-8 text-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-2">
        {error ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
            {error}
          </div>
        ) : loading ? (
          <div className="text-center py-10 text-xs text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin inline mr-1.5" />Loading candidates…
          </div>
        ) : visible.length === 0 ? (
          <div className="text-center py-10 text-xs text-muted-foreground">
            {candidates.length === 0 ? 'No candidates yet for this job.' : 'No candidates match.'}
          </div>
        ) : (
          visible.map((c) => (
            <CandidateRow
              key={c.id}
              candidate={c}
              onClick={() => onSelectCandidate?.(c)}
            />
          ))
        )}
      </CardContent>
    </Card>
  );
}
