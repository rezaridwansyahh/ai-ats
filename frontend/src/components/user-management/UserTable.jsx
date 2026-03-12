import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table';
import { Badge }    from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button }   from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';

const PAGE_SIZE = 10;

export function UserTable({ paginated, loading, currentPage, toggle, SortIcon, onEdit, onDelete, canEdit, canDelete }) {
  const startIndex = (currentPage - 1) * PAGE_SIZE;

  if (loading) {
    return (
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40 border-border/60">
            <TableHead className="w-10 text-[11px] font-bold uppercase tracking-wide">#</TableHead>
            <TableHead className="text-[11px] font-bold uppercase tracking-wide">Email</TableHead>
            <TableHead className="text-[11px] font-bold uppercase tracking-wide">Username</TableHead>
            <TableHead className="text-[11px] font-bold uppercase tracking-wide">Roles</TableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: PAGE_SIZE }).map((_, i) => (
            <TableRow key={i} className="border-border/40">
              <TableCell><Skeleton className="h-4 w-6" /></TableCell>
              <TableCell><Skeleton className="h-4 w-40" /></TableCell>
              <TableCell><Skeleton className="h-4 w-24" /></TableCell>
              <TableCell><Skeleton className="h-4 w-20" /></TableCell>
              <TableCell><Skeleton className="h-4 w-8" /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }

  if (paginated.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-14 text-muted-foreground">
        <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-3 ring-1 ring-border">
          <span className="text-lg font-bold">0</span>
        </div>
        <p className="text-sm font-semibold text-foreground/70">No users found</p>
        <p className="text-xs text-muted-foreground mt-1">Try adjusting your search or filters</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-muted/40 hover:bg-muted/40 border-border/60">
          <TableHead className="w-10 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">#</TableHead>
          <TableHead className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
            <button
              className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
              onClick={() => toggle('email')}
            >
              Email <SortIcon field="email" />
            </button>
          </TableHead>
          <TableHead className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
            <button
              className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
              onClick={() => toggle('username')}
            >
              Username <SortIcon field="username" />
            </button>
          </TableHead>
          <TableHead className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Roles</TableHead>
          <TableHead className="w-12" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {paginated.map((user, i) => (
          <TableRow
            key={user.id}
            className="border-border/40 hover:bg-primary/[0.03] transition-colors duration-150 group"
          >
            <TableCell className="text-muted-foreground text-xs font-mono">
              {startIndex + i + 1}
            </TableCell>
            <TableCell className="font-medium text-sm">{user.email}</TableCell>
            <TableCell className="text-muted-foreground text-sm">{user.username}</TableCell>
            <TableCell>
              <div className="flex flex-wrap gap-1">
                {(user.roles || []).map((role) => (
                  <Badge
                    key={role.id}
                    variant="secondary"
                    className="text-[11px] font-semibold bg-primary/8 text-primary border-0 rounded-full px-2"
                  >
                    {role.name}
                  </Badge>
                ))}
                {(!user.roles || user.roles.length === 0) && (
                  <span className="text-muted-foreground text-xs italic">No roles</span>
                )}
              </div>
            </TableCell>
            <TableCell>
              {(canEdit || canDelete) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-36 shadow-md">
                    {canEdit && (
                      <DropdownMenuItem
                        onClick={() => onEdit(user)}
                        className="cursor-pointer text-sm h-8"
                      >
                        <Pencil className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                        Edit
                      </DropdownMenuItem>
                    )}
                    {canEdit && canDelete && <DropdownMenuSeparator />}
                    {canDelete && (
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => onDelete(user)}
                        className="cursor-pointer text-sm h-8 text-red-600 focus:text-red-600 focus:bg-red-50"
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
