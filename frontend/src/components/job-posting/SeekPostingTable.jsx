import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Button }   from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Pencil, Trash2, Eye, Users, Copy } from 'lucide-react';

const STATUS_COLORS = {
  Draft:     'bg-[var(--warning-bg)] text-[#A16207]',
  Submitted: 'bg-[var(--info-bg)] text-[#1E40AF]',
  Running:   'bg-[var(--success-bg)] text-[#16A34A]',
  Active:    'bg-[var(--success-bg)] text-[#16A34A]',
  Expired:   'bg-[var(--error-bg)] text-[#9A3412]',
};

function formatPay(posting) {
  if (!posting.pay_min && !posting.pay_max) return '\u2014';
  const currency = posting.currency || '';
  const min = posting.pay_min != null ? Number(posting.pay_min).toLocaleString() : '\u2014';
  const max = posting.pay_max != null ? Number(posting.pay_max).toLocaleString() : '\u2014';
  const type = posting.pay_type ? ` / ${posting.pay_type}` : '';
  return `${currency} ${min} \u2013 ${max}${type}`;
}

const COLUMNS = ['#', 'Job Title', 'Location', 'Work Type', 'Pay Range', 'Status', 'Actions'];

export function SeekPostingTable({ postings, loading, onView, onEdit, onDelete, onDuplicate, onViewCandidates, canEdit, canDelete, toggle, SortIcon }) {
  if (loading) {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            {COLUMNS.map((col, i) => (
              <TableHead key={i} className={i === 0 ? 'w-10' : i === COLUMNS.length - 1 ? 'w-24' : ''}>
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
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mb-3">
          <span className="text-lg">0</span>
        </div>
        <p className="text-sm font-medium">No seek postings found</p>
        <p className="text-xs text-muted-foreground/70 mt-0.5">Create a posting to get started</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-10">#</TableHead>
          <TableHead>
            {toggle ? (
              <button className="inline-flex items-center gap-1 hover:text-foreground" onClick={() => toggle('job_title')}>
                Job Title {SortIcon && <SortIcon field="job_title" />}
              </button>
            ) : 'Job Title'}
          </TableHead>
          <TableHead>
            {toggle ? (
              <button className="inline-flex items-center gap-1 hover:text-foreground" onClick={() => toggle('job_location')}>
                Location {SortIcon && <SortIcon field="job_location" />}
              </button>
            ) : 'Location'}
          </TableHead>
          <TableHead>
            {toggle ? (
              <button className="inline-flex items-center gap-1 hover:text-foreground" onClick={() => toggle('work_type')}>
                Work Type {SortIcon && <SortIcon field="work_type" />}
              </button>
            ) : 'Work Type'}
          </TableHead>
          <TableHead>Pay Range</TableHead>
          <TableHead>
            {toggle ? (
              <button className="inline-flex items-center gap-1 hover:text-foreground" onClick={() => toggle('status')}>
                Status {SortIcon && <SortIcon field="status" />}
              </button>
            ) : 'Status'}
          </TableHead>
          <TableHead className="w-24" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {postings.map((posting, i) => (
          <TableRow key={posting.id}>
            <TableCell className="text-muted-foreground text-xs">{i + 1}</TableCell>
            <TableCell className="font-medium">{posting.job_title}</TableCell>
            <TableCell className="text-muted-foreground">{posting.job_location || '\u2014'}</TableCell>
            <TableCell className="text-muted-foreground">{posting.work_type || '\u2014'}</TableCell>
            <TableCell className="text-muted-foreground text-xs">{formatPay(posting)}</TableCell>
            <TableCell>
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[posting.status] ?? 'bg-muted text-muted-foreground'}`}>
                {posting.status}
              </span>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-0.5">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                title="View candidates"
                onClick={() => onViewCandidates(posting)}
              >
                <Users className="h-3.5 w-3.5" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onView(posting)}>
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </DropdownMenuItem>
                  {onDuplicate && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onDuplicate(posting)}>
                        <Copy className="h-4 w-4 mr-2" />
                        Duplicate
                      </DropdownMenuItem>
                    </>
                  )}
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
