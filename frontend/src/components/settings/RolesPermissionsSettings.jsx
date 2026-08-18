import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, AlertTriangle, ShieldCheck, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getRoles } from '@/api/roles.api';

/*
 * Roles & Permissions settings — real roles, backed by master_roles (same
 * table RoleManagementPage.jsx already uses). Previously this was a
 * hardcoded 15-surface × 6-role access matrix (Recruiter/Psikolog/Finance/
 * HR Ops/...) with zero API calls and a role vocabulary that matched
 * nothing in the DB — deleted rather than rebuilt, since fine-grained
 * module/menu/functionality permission editing already exists and works
 * on /settings/role-management (RoleFormDialog + setRolePermissions).
 *
 * This tab now just lists the real roles and links each one straight into
 * that page rather than re-implementing the same CRUD in a second shape.
 */
export default function RolesPermissionsSettings() {
  const navigate = useNavigate();

  const [roles, setRoles]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    (async () => {
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
    })();
  }, []);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold tracking-tight">Roles & Permissions</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Every role in the workspace. Add roles and edit their module/menu permissions on the Role Management page.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg border border-red-200 bg-red-50 text-sm text-red-600">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm">All roles</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">{roles.length} role{roles.length !== 1 ? 's' : ''}</p>
          </div>
          <Button size="sm" onClick={() => navigate('/settings/role-management')} className="bg-teal-700 hover:bg-teal-800">
            Manage roles <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {roles.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">No roles yet.</div>
          ) : (
            <div className="divide-y">
              {roles.map((r) => (
                <div key={r.id} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
                    <p className="text-sm font-semibold">{r.name}</p>
                  </div>
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-sm"
                    onClick={() => navigate('/settings/role-management')}
                  >
                    Edit permissions
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
