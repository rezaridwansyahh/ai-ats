import { useMemo, useState, useEffect, useCallback } from 'react';
import { RefreshCw, Users, Shield, XCircle, Plus } from 'lucide-react';
import { Button }      from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { getUsers, getMasterRoles, createUser, updateUser, deleteUser } from '@/api/users.api';
import { hasPermission } from '@/utils/permissions';

import { UserFilters }      from '@/components/user-management/UserFilters';
import { useSort }          from '@/hooks/useSort';
import { StatCard }         from '@/components/cards/StatCard';
import { UserTable }        from '@/components/user-management/UserTable';
import { UserPagination }   from '@/components/user-management/UserPagination';
import { UserFormDialog }   from '@/components/user-management/UserFormDialog';
import { DeleteUserDialog } from '@/components/user-management/DeleteUserDialog';

const PAGE_SIZE = 10;

function getRoles(user) {
  if (!user?.roles || !Array.isArray(user.roles)) return [];
  return user.roles.map((r) => r.name);
}

export default function UserManagementPage() {
  const canCreate = hasPermission('Settings', 'User Management', 'create');
  const canEdit   = hasPermission('Settings', 'User Management', 'update');
  const canDelete = hasPermission('Settings', 'User Management', 'delete');

  // ── Data fetching ──
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await getUsers();
      setUsers(data.users || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // ── Master roles (for dropdown) ──
  const [masterRoles, setMasterRoles] = useState([]);

  const fetchRoles = useCallback(async () => {
    try {
      const { data } = await getMasterRoles();
      setMasterRoles(data.roles || []);
    } catch (err) {
      console.error('Failed to load roles:', err);
    }
  }, []);

  useEffect(() => { fetchRoles(); }, [fetchRoles]);

  const roleOptions = [...new Set(
    users.flatMap((u) => (u.roles || []).map((r) => r.name))
  )];

  // ── Sorting ──
  const { toggle, apply, SortIcon } = useSort();

  // ── Filters & pagination state ──
  const [search,     setSearch]     = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [page,       setPage]       = useState(1);

  useEffect(() => { setPage(1); }, [search, roleFilter]);

  const filtered = useMemo(() =>
    users.filter((u) => {
      const haystack    = `${u.email ?? ''} ${u.name ?? ''}`.toLowerCase();
      const matchSearch = !search || haystack.includes(search.toLowerCase());
      const matchRole   = roleFilter === 'all' || getRoles(u).includes(roleFilter);
      return matchSearch && matchRole;
    }),
  [users, search, roleFilter]);

  const sorted = useMemo(() => apply(filtered), [filtered, apply]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const paginated  = sorted.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  // ── CRUD dialogs ──
  const [formOpen, setFormOpen]         = useState(false);
  const [deleteOpen, setDeleteOpen]     = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [submitting, setSubmitting]     = useState(false);

  const openCreate = () => {
    setSelectedUser(null);
    setFormOpen(true);
  };

  const openEdit = (user) => {
    setSelectedUser(user);
    setFormOpen(true);
  };

  const openDelete = (user) => {
    setSelectedUser(user);
    setDeleteOpen(true);
  };

  const handleCreateOrUpdate = async (payload, userId) => {
    setSubmitting(true);
    try {
      if (userId) {
        await updateUser(userId, payload);
      } else {
        await createUser(payload);
      }
      await fetchUsers();
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (userId) => {
    setSubmitting(true);
    try {
      await deleteUser(userId);
      await fetchUsers();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-5 animate-fade-in-up">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">User Management</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage system users and roles.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchUsers} disabled={loading}>
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {canCreate && (
            <Button size="sm" onClick={openCreate}>
              <Plus className="h-3.5 w-3.5" />
              Add User
            </Button>
          )}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 stagger-children">
        <StatCard
          icon={<Users  className="h-5 w-5 text-blue-500"   />}
          label="Total Users"
          value={users.length}
          loading={loading}
        />
        <StatCard
          icon={<Shield className="h-5 w-5 text-violet-500" />}
          label="Roles"
          value={roleOptions.length}
          loading={loading}
        />
      </div>

      {/* Table card */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">All Users</CardTitle>
          <CardDescription className="text-xs mt-0">
            {loading ? 'Loading…' : `${filtered.length} of ${users.length} user${users.length !== 1 ? 's' : ''}`}
          </CardDescription>

          <UserFilters
            search={search}         setSearch={setSearch}
            roleFilter={roleFilter} setRoleFilter={setRoleFilter}
            roleOptions={roleOptions}
          />
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          {error ? (
            <div className="flex flex-col items-center gap-2 py-16 text-red-500">
              <XCircle className="h-8 w-8" />
              <p className="text-sm font-medium">{error}</p>
              <Button variant="outline" size="sm" onClick={fetchUsers}>Try again</Button>
            </div>
          ) : (
            <>
              <UserTable
                paginated={paginated}
                loading={loading}
                currentPage={safePage}
                toggle={toggle}
                SortIcon={SortIcon}
                onEdit={openEdit}
                onDelete={openDelete}
                canEdit={canEdit}
                canDelete={canDelete}
              />

              <UserPagination
                page={safePage}
                totalPages={totalPages}
                totalItems={sorted.length}
                pageSize={PAGE_SIZE}
                setPage={setPage}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* CRUD Dialogs */}
      <UserFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        user={selectedUser}
        roles={masterRoles}
        onSubmit={handleCreateOrUpdate}
        loading={submitting}
      />

      {selectedUser && (
        <DeleteUserDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          user={selectedUser}
          onConfirm={handleDelete}
          loading={submitting}
        />
      )}
    </div>
  );
}
