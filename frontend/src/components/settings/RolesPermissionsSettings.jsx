import { useState, useEffect, useCallback } from 'react';
import { Plus, XCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

import {
  getRoles, createRole, updateRole, deleteRole,
  setRolePermissions, getRolePermissions, getAllPermissions,
} from '@/api/roles.api';
import { hasPermission } from '@/utils/permissions';

import { RoleTable }        from '@/components/role-management/RoleTable';
import { RoleFormDialog }   from '@/components/role-management/RoleFormDialog';
import { DeleteRoleDialog } from '@/components/role-management/DeleteRoleDialog';

/*
 * Roles & Permissions settings — same functionality as RoleManagementPage.jsx
 * (real roles from master_roles, real module/menu/functionality permission
 * editing via RoleFormDialog + setRolePermissions), embedded directly in the
 * Settings shell instead of redirecting out to /settings/role-management.
 *
 * Previously this tab was a hardcoded 15-surface × 6-role access matrix with
 * zero API calls and an invented role vocabulary that matched nothing in
 * the DB — replaced rather than rebuilt against real data, since this exact
 * CRUD already existed and worked on the standalone Role Management page.
 */
export default function RolesPermissionsSettings() {
  const canCreate = hasPermission('Settings', 'Role Management', 'create');
  const canEdit   = hasPermission('Settings', 'Role Management', 'update');
  const canDelete = hasPermission('Settings', 'Role Management', 'delete');

  // ── Data ──────────────────────────────────────────────────────────────────
  const [roles,      setRoles]      = useState([]);
  const [allModules, setAllModules] = useState([]);
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
  const [formOpen,     setFormOpen]     = useState(false);
  const [deleteOpen,   setDeleteOpen]   = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [submitting,   setSubmitting]   = useState(false);

  const openCreate = () => { setSelectedRole(null); setFormOpen(true); };

  const openEdit = async (role) => {
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
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold tracking-tight">Roles & Permissions</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage roles and their module/menu permission sets.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={fetchRoles} disabled={loading}>
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {canCreate && (
            <Button size="sm" onClick={openCreate} className="bg-teal-700 hover:bg-teal-800">
              <Plus className="h-3.5 w-3.5" />
              Add role
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">All roles</CardTitle>
          <CardDescription className="text-xs">
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
