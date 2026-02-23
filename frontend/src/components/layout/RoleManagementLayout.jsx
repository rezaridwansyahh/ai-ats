import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Shield, Plus, XCircle } from 'lucide-react';
import { Button }   from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { StatCard } from '@/components/cards/StatCard';

import {
  getRoles, createRole, updateRole, deleteRole,
  setRolePermissions, getRolePermissions, getAllPermissions,
} from '@/api/roles.api';
import { hasPermission } from '@/utils/permissions';

import { RoleTable }        from '@/components/role-management/RoleTable';
import { RoleFormDialog }   from '@/components/role-management/RoleFormDialog';
import { DeleteRoleDialog } from '@/components/role-management/DeleteRoleDialog';

export function RoleManagementLayout() {
  const canCreate = hasPermission('Users', 'Role Management', 'create');
  const canEdit   = hasPermission('Users', 'Role Management', 'update');
  const canDelete = hasPermission('Users', 'Role Management', 'delete');

  // ── Data ──────────────────────────────────────────────────────────────────
  const [roles,      setRoles]      = useState([]);
  const [allModules, setAllModules] = useState([]); // all permissions grouped
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await getRoles();
      setRoles(data.roles || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load roles');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAllPermissions = useCallback(async () => {
    try {
      const { data } = await getAllPermissions();
      setAllModules(data.modules || []);
    } catch (err) {
      console.error('Failed to load permissions:', err);
    }
  }, []);

  useEffect(() => {
    fetchRoles();
    fetchAllPermissions();
  }, [fetchRoles, fetchAllPermissions]);

  // ── Dialog state ──────────────────────────────────────────────────────────
  const [formOpen,      setFormOpen]      = useState(false);
  const [deleteOpen,    setDeleteOpen]    = useState(false);
  const [selectedRole,  setSelectedRole]  = useState(null);
  const [submitting,    setSubmitting]    = useState(false);

  const openCreate = () => { setSelectedRole(null); setFormOpen(true); };

  const openEdit = async (role) => {
    // Fetch current permissions for this role before opening
    try {
      const { data } = await getRolePermissions(role.id);
      const permIds = (data.modules || [])
        .flatMap(m => m.menus.flatMap(menu => menu.permissions));
      setSelectedRole({ ...role, permissions: permIds });
    } catch {
      setSelectedRole({ ...role, permissions: [] });
    }
    setFormOpen(true);
  };

  const openDelete = (role) => { setSelectedRole(role); setDeleteOpen(true); };

  // ── CRUD handlers ─────────────────────────────────────────────────────────
  const handleCreateOrUpdate = async ({ name, additional, permission_ids }, roleId) => {
    setSubmitting(true);
    try {
      let id = roleId;
      if (id) {
        await updateRole(id, { name, additional });
      } else {
        const { data } = await createRole({ name, additional });
        id = data.newRole.id;
      }
      await setRolePermissions(id, permission_ids);
      await fetchRoles();
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (roleId) => {
    setSubmitting(true);
    try {
      await deleteRole(roleId);
      await fetchRoles();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Role Management</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage roles and their permission sets.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchRoles} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {canCreate && (
            <Button size="sm" onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Add Role
            </Button>
          )}
        </div>
      </div>

      {/* Stat card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard
          icon={<Shield className="h-5 w-5 text-violet-500" />}
          label="Total Roles"
          value={roles.length}
          loading={loading}
        />
      </div>

      {/* Table card */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">All Roles</CardTitle>
          <CardDescription>
            {loading ? 'Loading…' : `${roles.length} role${roles.length !== 1 ? 's' : ''}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="flex flex-col items-center gap-2 py-16 text-destructive">
              <XCircle className="h-8 w-8" />
              <p className="text-sm font-medium">{error}</p>
              <Button variant="outline" size="sm" onClick={fetchRoles}>Try again</Button>
            </div>
          ) : (
            <RoleTable
              roles={roles}
              loading={loading}
              onEdit={openEdit}
              onDelete={openDelete}
              canEdit={canEdit}
              canDelete={canDelete}
            />
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <RoleFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        role={selectedRole}
        allModules={allModules}
        onSubmit={handleCreateOrUpdate}
        loading={submitting}
      />

      {selectedRole && (
        <DeleteRoleDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          role={selectedRole}
          onConfirm={handleDelete}
          loading={submitting}
        />
      )}
    </div>
  );
}
