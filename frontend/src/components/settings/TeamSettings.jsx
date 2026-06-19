import { useState } from 'react';
import { UserPlus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';

// ── Static data — swap for API data when backend is ready ──

const TEAM_MEMBERS = [
  {
    id: 1, name: 'Sarah Chen', initials: 'SC', role: 'TA Lead', access: 'Admin',
    cities: ['Jakarta', 'Bandung', 'Surabaya'], status: 'Active',
  },
  {
    id: 2, name: 'Maya Hartono', initials: 'MH', role: 'Recruiter', access: 'Recruiter',
    cities: ['Jakarta'], status: 'Active',
  },
  {
    id: 3, name: 'Budi Prasetyo', initials: 'BP', role: 'Recruiter', access: 'Recruiter',
    cities: ['Surabaya'], status: 'Active',
  },
  {
    id: 4, name: 'Ahmad Sutanto', initials: 'AS', role: 'Hiring Manager', access: 'Hiring Manager',
    cities: ['Jakarta'], status: 'Active',
  },
  {
    id: 5, name: 'Rini Wahyuni', initials: 'RW', role: 'Interviewer', access: 'Interviewer',
    cities: ['Bandung'], status: 'Active',
  },
  {
    id: 6, name: 'Nadia Ayu', initials: 'NA', role: 'Recruiter', access: 'Recruiter',
    cities: ['Jakarta'], status: 'Invited',
  },
];

const ROLE_SUMMARIES = [
  { id: 'admin', name: 'Admin', desc: 'Full access · billing · integrations · compliance' },
  { id: 'ta-lead', name: 'TA Lead', desc: 'All jobs · reports · team management (read)' },
  { id: 'recruiter', name: 'Recruiter', desc: 'Assigned jobs only · candidate write · invites' },
  { id: 'hiring-manager', name: 'Hiring Manager', desc: 'Assigned jobs · scorecards · reject/advance' },
  { id: 'interviewer', name: 'Interviewer', desc: 'Scorecards only for assigned interviews' },
];

const ROLE_OPTIONS = ['TA Lead', 'Recruiter', 'Hiring Manager', 'Interviewer', 'Admin'];

const STATUS_STYLES = {
  Active: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  Invited: 'bg-amber-50 text-amber-600 border-amber-200',
  Suspended: 'bg-gray-50 text-gray-500 border-gray-200',
};

// ── Avatar ──

function Avatar({ initials }) {
  return (
    <div className="h-8 w-8 rounded-full bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center flex-shrink-0">
      {initials}
    </div>
  );
}

// ── Invite member dialog ──

function InviteMemberDialog({ open, onOpenChange, onInvite }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Recruiter');

  const handleSubmit = () => {
    if (!email.trim()) return;
    onInvite({ email, role });
    setEmail('');
    setRole('Recruiter');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite member</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@acme.co.id"
              className="w-full h-9 rounded-md border px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full h-9 rounded-md border px-3 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {ROLE_OPTIONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!email.trim()}>Send invite</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Manage member dialog ──

function ManageMemberDialog({ member, open, onOpenChange, onUpdateRole, onRemove }) {
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
              value={member.role}
              onChange={(e) => onUpdateRole(member.id, e.target.value)}
              className="w-full h-9 rounded-md border px-3 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {ROLE_OPTIONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <p className="text-xs text-muted-foreground">
            Cities: {member.cities.join(', ')}
          </p>
        </div>
        <DialogFooter className="sm:justify-between">
          <Button
            variant="ghost"
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={() => { onRemove(member.id); onOpenChange(false); }}
          >
            Remove from workspace
          </Button>
          <Button onClick={() => onOpenChange(false)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Team section ──

export default function TeamSettings() {
  const [members, setMembers] = useState(TEAM_MEMBERS);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [manageMember, setManageMember] = useState(null);

  const totalCount = members.length;
  const pendingCount = members.filter((m) => m.status === 'Invited').length;

  const handleInvite = ({ email, role }) => {
    const initials = email.slice(0, 2).toUpperCase();
    setMembers((prev) => [
      ...prev,
      {
        id: Date.now(),
        name: email.split('@')[0],
        initials,
        role,
        access: role,
        cities: [],
        status: 'Invited',
      },
    ]);
  };

  const handleUpdateRole = (id, newRole) => {
    setMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, role: newRole, access: newRole } : m))
    );
    setManageMember((prev) => (prev ? { ...prev, role: newRole, access: newRole } : prev));
  };

  const handleRemove = (id) => {
    setMembers((prev) => prev.filter((m) => m.id !== id));
  };

  return (
    <div className="space-y-4">
      {/* Team members table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Team members</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              {totalCount} total{pendingCount > 0 && ` · ${pendingCount} pending invite${pendingCount > 1 ? 's' : ''}`}
            </p>
          </div>
          <Button size="sm" onClick={() => setInviteOpen(true)} className="bg-teal-700 hover:bg-teal-800">
            <UserPlus className="h-3.5 w-3.5 mr-1.5" />
            Invite member
          </Button>
        </CardHeader>

        <CardContent className="p-0">
          <div className="grid grid-cols-[1.4fr_1fr_1fr_1.2fr_0.9fr_0.7fr] gap-3 px-4 py-2 bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
            <span>Name</span>
            <span>Role</span>
            <span>Access</span>
            <span>Cities</span>
            <span>Status</span>
            <span />
          </div>

          {members.map((m) => (
            <div
              key={m.id}
              className="grid grid-cols-[1.4fr_1fr_1fr_1.2fr_0.9fr_0.7fr] gap-3 px-4 py-3 items-center border-b last:border-b-0 text-sm"
            >
              <div className="flex items-center gap-2.5">
                <Avatar initials={m.initials} />
                <span className="font-medium">{m.name}</span>
              </div>
              <span className="text-muted-foreground">{m.role}</span>
              <div>
                <Badge variant="outline" className="text-xs font-normal">
                  {m.access}
                </Badge>
              </div>
              <span className="text-muted-foreground truncate">
                {m.cities.length > 0 ? m.cities.join(', ') : '—'}
              </span>
              <div>
                <Badge
                  variant="outline"
                  className={`text-[10px] px-1.5 py-0 ${STATUS_STYLES[m.status] ?? STATUS_STYLES.Active}`}
                >
                  {m.status}
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
          ))}
        </CardContent>
      </Card>

      {/* Roles & permissions summary */}
      <Card>
        <CardHeader>
          <CardTitle>Roles & permissions</CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Who can do what. Fine-grained per-job overrides available.
          </p>
        </CardHeader>
        <CardContent className="pt-0 divide-y">
          {ROLE_SUMMARIES.map((r) => (
            <div key={r.id} className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-semibold">{r.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{r.desc}</p>
              </div>
              <Button variant="link" size="sm" className="h-auto p-0 text-sm">
                Edit
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <InviteMemberDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        onInvite={handleInvite}
      />
      <ManageMemberDialog
        member={manageMember}
        open={!!manageMember}
        onOpenChange={(open) => !open && setManageMember(null)}
        onUpdateRole={handleUpdateRole}
        onRemove={handleRemove}
      />
    </div>
  );
}