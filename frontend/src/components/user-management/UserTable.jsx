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
          <TableRow>
            <TableHead className="w-12">#</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Username</TableHead>
            <TableHead>Roles</TableHead>
            <TableHead className="w-16" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: PAGE_SIZE }).map((_, i) => (
            <TableRow key={i}>
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
      <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
        No users found.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12">#</TableHead>
          <TableHead>
            <button
              className="inline-flex items-center gap-1 hover:text-foreground"
              onClick={() => toggle('email')}
            >
              Email <SortIcon field="email" />
            </button>
          </TableHead>
          <TableHead>
            <button
              className="inline-flex items-center gap-1 hover:text-foreground"
              onClick={() => toggle('username')}
            >
              Username <SortIcon field="username" />
            </button>
          </TableHead>
          <TableHead>Roles</TableHead>
          <TableHead className="w-16" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {paginated.map((user, i) => (
          <TableRow key={user.id}>
            <TableCell className="text-muted-foreground">
              {startIndex + i + 1}
            </TableCell>
            <TableCell className="font-medium">{user.email}</TableCell>
            <TableCell>{user.username}</TableCell>
            <TableCell>
              <div className="flex flex-wrap gap-1">
                {(user.roles || []).map((role) => (
                  <Badge key={role.id} variant="secondary">
                    {role.name}
                  </Badge>
                ))}
                {(!user.roles || user.roles.length === 0) && (
                  <span className="text-muted-foreground text-xs">No roles</span>
                )}
              </div>
            </TableCell>
            <TableCell>
              {(canEdit || canDelete) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {canEdit && (
                      <DropdownMenuItem onClick={() => onEdit(user)}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                    )}
                    {canEdit && canDelete && <DropdownMenuSeparator />}
                    {canDelete && (
                      <DropdownMenuItem variant="destructive" onClick={() => onDelete(user)}>
                        <Trash2 className="h-4 w-4 mr-2" />
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
