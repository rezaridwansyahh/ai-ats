import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Loader2, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { getUsers, createUser, updateUser, deleteUser, getMasterRoles } from '@/api/users.api';

/*
 * Team settings — real roster, backed by master_users / master_roles /
 * mapping_users_roles (same tables UserManagementPage.jsx / RoleManagementPage.jsx
 * already use). Previously this whole file was a hardcoded useState mockup with
 * zero API calls and its own invented role vocabulary (TA Lead, Interviewer, ...)
 * that didn't match any real role in the DB.
 *
 * "Cities" and "Status" (Active/Invited/Suspended) from the old mockup have no
 * backing column on master_users — dropped rather than faked. Email is shown
 * instead, which is real.
 */

function getInitials(name) {
  if (!name) return '?';
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join('');
}

function Avatar({ initials }) {
  return (
    <div className="h-8 w-8 rounded-full bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center flex-shrink-0">
      {initials}
    </div>
  );
}

// ── Invite member dialog ──

function InviteMemberDialog({ open, onOpenChange, roles, onInvite, submitting, error }) {
  const [email, setEmail]       = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [roleId, setRoleId]     = useState('');

  useEffect(() => {
    if (open) {
      setEmail(''); setUsername(''); setPassword('');
      setRoleId(roles[0] ? String(roles[0].id) : '');
    }
  }, [open, roles]);

  const canSubmit = email.trim() && username.trim() && password.trim() && roleId;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onInvite({
      email: email.trim(),
      username: username.trim(),
      password: password.trim(),
      role_ids: [Number(roleId)],
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite member</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          {error && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-red-200 bg-red-50 text-xs text-red-600">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> {error}
            </div>
          )}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.co.id"
              className="w-full h-9 rounded-md border px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Display name"
              className="w-full h-9 rounded-md border px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Temporary password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="They can change this after logging in"
              className="w-full h-9 rounded-md border px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Role</label>
            <select
              value={roleId}
              onChange={(e) => setRoleId(e.target.value)}
              className="w-full h-9 rounded-md border px-3 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {roles.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!canSubmit || submitting}>
            {submitting ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : null}
            Send invite
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Manage member dialog ──

function ManageMemberDialog({ member, roles, open, onOpenChange, onUpdateRole, onRemove, submitting }) {
  const [roleId, setRoleId] = useState('');

  useEffect(() => {
    if (member) setRoleId(member.roleId ? String(member.roleId) : '');
  }, [member]);

  if (!member) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5">
            <Avatar initials={member.initials} />
            {member.name}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Role</label>
            <select
              value={roleId}
              onChange={(e) => setRoleId(e.target.value)}
              className="w-full h-9 rounded-md border px-3 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {roles.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>
          <p className="text-xs text-muted-foreground">Email: {member.email}</p>
        </div>
        <DialogFooter className="sm:justify-between">
          <Button
            variant="ghost"
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
            disabled={submitting}
            onClick={() => onRemove(member.id)}
          >
            Remove from workspace
          </Button>
          <Button
            disabled={submitting || !roleId}
            onClick={() => onUpdateRole(member.id, Number(roleId))}
          >
            {submitting ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : null}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Team section ──

export default function TeamSettings() {
  const navigate = useNavigate();

  const [users, setUsers]     = useState([]);
  const [roles, setRoles]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const [inviteOpen, setInviteOpen]     = useState(false);
  const [manageMember, setManageMember] = useState(null);
  const [submitting, setSubmitting]     = useState(false);
  const [formError, setFormError]       = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [usersRes, rolesRes] = await Promise.all([getUsers(), getMasterRoles()]);
      setUsers(usersRes.data?.users || []);
      setRoles(rolesRes.data?.roles || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load team');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const members = users.map((u) => {
    const primaryRole = u.roles?.[0] || null;
    return {
      id: u.id,
      name: u.username || u.email,
      email: u.email,
      initials: getInitials(u.username || u.email),
      roleName: primaryRole?.name || 'No role assigned',
      roleId: primaryRole?.id || null,
    };
  });

  const totalCount = members.length;

  const handleInvite = async (payload) => {
    setSubmitting(true);
    setFormError(null);
    try {
      await createUser(payload);
      setInviteOpen(false);
      await load();
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || 'Failed to invite member');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateRole = async (userId, roleId) => {
    setSubmitting(true);
    try {
      await updateUser(userId, { role_ids: [roleId] });
      setManageMember(null);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to update role');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (userId) => {
    setSubmitting(true);
    try {
      await deleteUser(userId);
      setManageMember(null);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to remove member');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg border border-red-200 bg-red-50 text-sm text-red-600">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Team members table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Team members</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">{totalCount} total</p>
          </div>
          <Button size="sm" onClick={() => { setFormError(null); setInviteOpen(true); }} className="bg-teal-700 hover:bg-teal-800">
            <UserPlus className="h-3.5 w-3.5 mr-1.5" />
            Invite member
          </Button>
        </CardHeader>

        <CardContent className="p-0">
          <div className="grid grid-cols-[1.4fr_1.4fr_1fr_0.7fr] gap-3 px-4 py-2 bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
            <span>Name</span>
            <span>Email</span>
            <span>Role</span>
            <span />
          </div>

          {members.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">No team members yet.</div>
          ) : (
            members.map((m) => (
              <div
                key={m.id}
                className="grid grid-cols-[1.4fr_1.4fr_1fr_0.7fr] gap-3 px-4 py-3 items-center border-b last:border-b-0 text-sm"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Avatar initials={m.initials} />
                  <span className="font-medium truncate">{m.name}</span>
                </div>
                <span className="text-muted-foreground truncate">{m.email}</span>
                <div>
                  <Badge variant="outline" className="text-xs font-normal">
                    {m.roleName}
                  </Badge>
                </div>
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto p-0 justify-self-end text-sm"
                  onClick={() => setManageMember(m)}
                >
                  Manage
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Roles summary — real roles, links out to the real Role Management page */}
      <Card>
        <CardHeader>
          <CardTitle>Roles</CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Fine-grained module/menu permissions are managed on the Role Management page.
          </p>
        </CardHeader>
        <CardContent className="pt-0 divide-y">
          {roles.map((r) => (
            <div key={r.id} className="flex items-center justify-between py-3">
              <p className="text-sm font-semibold">{r.name}</p>
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
        </CardContent>
      </Card>

      <InviteMemberDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        roles={roles}
        onInvite={handleInvite}
        submitting={submitting}
        error={formError}
      />
      <ManageMemberDialog
        member={manageMember}
        roles={roles}
        open={!!manageMember}
        onOpenChange={(open) => !open && setManageMember(null)}
        onUpdateRole={handleUpdateRole}
        onRemove={handleRemove}
        submitting={submitting}
      />
    </div>
  );
}
