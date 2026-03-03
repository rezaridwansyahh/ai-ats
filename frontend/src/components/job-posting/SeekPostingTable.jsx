import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Button }   from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Pencil, Trash2, Eye, Users } from 'lucide-react';

const STATUS_COLORS = {
  Draft:     'bg-gray-100 text-gray-700',
  Submitted: 'bg-blue-100 text-blue-700',
  Running:   'bg-green-100 text-green-700',
  Expired:   'bg-red-100 text-red-700',
};

function formatPay(posting) {
  if (!posting.pay_min && !posting.pay_max) return '—';
  const currency = posting.currency || '';
  const min = posting.pay_min != null ? Number(posting.pay_min).toLocaleString() : '—';
  const max = posting.pay_max != null ? Number(posting.pay_max).toLocaleString() : '—';
  const type = posting.pay_type ? ` / ${posting.pay_type}` : '';
  return `${currency} ${min} – ${max}${type}`;
}

const COLUMNS = ['#', 'Job Title', 'Location', 'Work Type', 'Pay Range', 'Status', ''];

export function SeekPostingTable({ postings, loading, onView, onEdit, onDelete, onViewCandidates, canEdit, canDelete }) {
  if (loading) {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            {COLUMNS.map((col, i) => (
              <TableHead key={i} className={i === 0 ? 'w-12' : i === COLUMNS.length - 1 ? 'w-16' : ''}>
                {col}
              </TableHead>
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
        No seek postings found.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12">#</TableHead>
          <TableHead>Job Title</TableHead>
          <TableHead>Location</TableHead>
          <TableHead>Work Type</TableHead>
          <TableHead>Pay Range</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="w-24" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {postings.map((posting, i) => (
          <TableRow key={posting.id}>
            <TableCell className="text-muted-foreground">{i + 1}</TableCell>
            <TableCell className="font-medium">{posting.job_title}</TableCell>
            <TableCell className="text-muted-foreground">{posting.job_location || '—'}</TableCell>
            <TableCell className="text-muted-foreground">{posting.work_type || '—'}</TableCell>
            <TableCell className="text-muted-foreground text-sm">{formatPay(posting)}</TableCell>
            <TableCell>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[posting.status] ?? 'bg-muted text-muted-foreground'}`}>
                {posting.status}
              </span>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                title="View candidates"
                onClick={() => onViewCandidates(posting)}
              >
                <Users className="h-4 w-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onView(posting)}>
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </DropdownMenuItem>
                  {canEdit && posting.status !== 'Expired' && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onEdit(posting)}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                    </>
                  )}
                  {canDelete && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => onDelete(posting)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
