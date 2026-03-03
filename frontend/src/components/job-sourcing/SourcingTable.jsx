import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Button }   from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Eye, Download } from 'lucide-react';

const STATUS_COLORS = {
  Draft:       'bg-gray-100 text-gray-700',
  Submitted:   'bg-blue-100 text-blue-700',
  Running:     'bg-green-100 text-green-700',
  Active:      'bg-green-100 text-green-700',
  Expired:     'bg-red-100 text-red-700',
  Kedaluwarsa: 'bg-red-100 text-red-700',
};

const COLUMNS = ['#', 'Status', 'Seek ID', 'Job Title', 'Candidates', 'Created Date', 'Created By', 'Actions'];

export function SourcingTable({ postings, loading, onView }) {
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
          <TableHead>Status</TableHead>
          <TableHead>Seek ID</TableHead>
          <TableHead>Job Title</TableHead>
          <TableHead className="text-center">Candidates</TableHead>
          <TableHead>Created Date</TableHead>
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
                  title="Import CV (coming soon)"
                  disabled
                >
                  <Download className="h-3.5 w-3.5" />
                  Import CV
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
