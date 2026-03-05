import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Button }   from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Eye, Download, Loader2 } from 'lucide-react';

const STATUS_COLORS = {
  Draft:       'bg-[var(--warning-bg)] text-[#A16207]',
  Submitted:   'bg-[var(--info-bg)] text-[#1E40AF]',
  Running:     'bg-[var(--success-bg)] text-[#16A34A]',
  Active:      'bg-[var(--success-bg)] text-[#16A34A]',
  Expired:     'bg-[var(--error-bg)] text-[#9A3412]',
};

const COLUMNS = ['#', 'Status', 'Seek ID', 'Job Title', 'Candidates', 'Created Date', 'Created By', 'Actions'];

export function SourcingTable({ postings, loading, onView, onImportCv, extractingId, toggle, SortIcon }) {
  if (loading) {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            {COLUMNS.map((col, i) => (
              <TableHead key={i}>{col}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
              {COLUMNS.map((_, j) => (
                <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }

  if (postings.length === 0) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
        No job ads found. Try syncing your Seek account.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12">#</TableHead>
          <TableHead>
            {toggle ? (
              <button className="inline-flex items-center gap-1 hover:text-foreground" onClick={() => toggle('status')}>
                Status {SortIcon && <SortIcon field="status" />}
              </button>
            ) : 'Status'}
          </TableHead>
          <TableHead>Seek ID</TableHead>
          <TableHead>
            {toggle ? (
              <button className="inline-flex items-center gap-1 hover:text-foreground" onClick={() => toggle('job_title')}>
                Job Title {SortIcon && <SortIcon field="job_title" />}
              </button>
            ) : 'Job Title'}
          </TableHead>
          <TableHead className="text-center">
            {toggle ? (
              <button className="inline-flex items-center gap-1 hover:text-foreground" onClick={() => toggle('candidate_count')}>
                Candidates {SortIcon && <SortIcon field="candidate_count" />}
              </button>
            ) : 'Candidates'}
          </TableHead>
          <TableHead>
            {toggle ? (
              <button className="inline-flex items-center gap-1 hover:text-foreground" onClick={() => toggle('created_date_seek')}>
                Created Date {SortIcon && <SortIcon field="created_date_seek" />}
              </button>
            ) : 'Created Date'}
          </TableHead>
          <TableHead>Created By</TableHead>
          <TableHead className="text-center">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {postings.map((posting, i) => (
          <TableRow key={posting.id}>
            <TableCell className="text-muted-foreground">{i + 1}</TableCell>
            <TableCell>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[posting.status] ?? 'bg-muted text-muted-foreground'}`}>
                {posting.status}
              </span>
            </TableCell>
            <TableCell className="text-muted-foreground text-sm font-mono">
              {posting.seek_id || '—'}
            </TableCell>
            <TableCell>
              <button
                className="font-medium text-primary hover:underline cursor-pointer text-left"
                onClick={() => onView(posting)}
              >
                {posting.job_title}
              </button>
            </TableCell>
            <TableCell className="text-center">
              <span className="font-semibold">{posting.candidate_count ?? 0}</span>
            </TableCell>
            <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
              {posting.created_date_seek || '—'}
            </TableCell>
            <TableCell className="text-muted-foreground text-sm">
              {posting.created_by || '—'}
            </TableCell>
            <TableCell className="text-center">
              <div className="flex items-center justify-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onView(posting)}
                  title="View details"
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs gap-1"
                  title="Extract candidates"
                  onClick={() => onImportCv(posting)}
                  disabled={!posting.candidate_count || extractingId != null}
                >
                  {extractingId === posting.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Download className="h-3.5 w-3.5" />
                  )}
                  {extractingId === posting.id ? 'Extracting…' : 'Import CV'}
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
