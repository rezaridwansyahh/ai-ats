import { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, ShieldCheck, Eye, XCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { PageHeader } from '@/components/common';
import { getAllRolesAcrossCompanies, getRolePermissions } from '@/api/roles.api';

const FUNC_COLORS = {
  read:   'bg-blue-100 text-blue-700',
  create: 'bg-green-100 text-green-700',
  update: 'bg-yellow-100 text-yellow-700',
  delete: 'bg-red-100 text-red-700',
};

export default function AdminRoles() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');

  const [viewing, setViewing] = useState(null); // role being viewed, or null

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await getAllRolesAcrossCompanies();
      setRoles(data.roles || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load roles');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRoles(); }, [fetchRoles]);

  const filtered = useMemo(() => {
    if (!query.trim()) return roles;
    const q = query.toLowerCase();
    return roles.filter((r) => r.name.toLowerCase().includes(q) || r.company_name.toLowerCase().includes(q));
  }, [roles, query]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Roles"
        subtitle="Read-only cross-tenant audit. Each company manages its own roles via its own Settings → Role Management."
      />

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by role or company…"
          className="pl-8"
        />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">All roles across every company</CardTitle>
          <CardDescription className="text-xs">
            {loading ? 'Loading…' : `${filtered.length} role${filtered.length === 1 ? '' : 's'}`}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          {error ? (
            <div className="flex flex-col items-center gap-2 py-16 text-destructive">
              <XCircle className="h-8 w-8" />
              <p className="text-sm font-medium">{error}</p>
              <Button variant="outline" size="sm" onClick={fetchRoles}>Try again</Button>
            </div>
          ) : loading ? (
            <div className="px-4 py-6 text-sm text-muted-foreground text-center">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="px-4 py-6 text-sm text-muted-foreground text-center">No roles match your search.</div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((role) => (
                <div key={role.id} className="flex items-center justify-between px-4 py-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{role.name}</span>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">{role.company_name}</Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {role.user_count} user{role.user_count === 1 ? '' : 's'} assigned
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setViewing(role)}>
                    <Eye className="h-3.5 w-3.5" />
                    View permissions
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <RolePermissionsViewDialog role={viewing} open={!!viewing} onOpenChange={(v) => !v && setViewing(null)} />
    </div>
  );
}

function RolePermissionsViewDialog({ role, open, onOpenChange }) {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !role) return;
    setLoading(true);
    getRolePermissions(role.id)
      .then(({ data }) => setModules(data.modules || []))
      .catch(() => setModules([]))
      .finally(() => setLoading(false));
  }, [open, role]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            {role?.name}
          </DialogTitle>
          <DialogDescription>
            {role?.company_name} · read-only view
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <p className="text-sm text-muted-foreground py-4">Loading…</p>
        ) : modules.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">No permissions granted.</p>
        ) : (
          <div className="space-y-3">
            {modules.map((mod) => (
              <div key={mod.id}>
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1.5">{mod.name}</p>
                {mod.menus.map((menu) => (
                  <div key={menu.id} className="flex items-center justify-between py-1.5 border-b border-border/60 last:border-0">
                    <span className="text-sm">{menu.name}</span>
                    <div className="flex gap-1">
                      {menu.permissions.map((p) => (
                        <span key={p.id} className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${FUNC_COLORS[p.functionality] || 'bg-muted text-muted-foreground'}`}>
                          {p.functionality}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
