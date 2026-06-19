import { useState } from 'react';
import { FileText, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select';

// ── Static data — swap for API data when backend is ready ──

const ROLES = ['Recruiter', 'Hiring Manager', 'Psikolog', 'Finance', 'HR Ops', 'Admin'];

const ACCESS_LEVELS = ['—', 'View', 'Edit', 'Review', 'Approve', 'Own only'];

const SURFACES = [
  { id: 'job-edit', label: 'Job (create/edit)', access: { Recruiter: 'Edit', 'Hiring Manager': 'Review', Psikolog: '—', Finance: 'View', 'HR Ops': 'View', Admin: 'Edit' } },
  { id: 'candidate-profile', label: 'Candidate full profile', access: { Recruiter: 'Edit', 'Hiring Manager': 'View', Psikolog: 'View', Finance: 'View', 'HR Ops': 'Edit', Admin: 'Edit' } },
  { id: 'candidate-salary', label: 'Candidate salary expect.', access: { Recruiter: 'View', 'Hiring Manager': '—', Psikolog: '—', Finance: 'Edit', 'HR Ops': 'View', Admin: 'Edit' } },
  { id: 'candidate-dei', label: 'Candidate DEI fields', access: { Recruiter: '—', 'Hiring Manager': '—', Psikolog: '—', Finance: '—', 'HR Ops': 'View', Admin: 'Edit' } },
  { id: 'ai-screening', label: 'AI Screening scores', access: { Recruiter: 'Edit', 'Hiring Manager': 'View', Psikolog: '—', Finance: '—', 'HR Ops': 'View', Admin: 'Edit' } },
  { id: 'interview-scorecards', label: 'Interview scorecards', access: { Recruiter: 'View', 'Hiring Manager': 'Edit', Psikolog: 'View', Finance: '—', 'HR Ops': 'View', Admin: 'Edit' } },
  { id: 'assessment-batteries', label: 'Assessment batteries', access: { Recruiter: 'View', 'Hiring Manager': 'View', Psikolog: 'Edit', Finance: '—', 'HR Ops': '—', Admin: 'Edit' } },
  { id: 'assessment-reports', label: 'Assessment scored reports', access: { Recruiter: 'View', 'Hiring Manager': 'View', Psikolog: 'Edit', Finance: '—', 'HR Ops': '—', Admin: 'Edit' } },
  { id: 'offer-draft', label: 'Offer draft', access: { Recruiter: 'Edit', 'Hiring Manager': 'Approve', Psikolog: '—', Finance: 'Review', 'HR Ops': 'Edit', Admin: 'Edit' } },
  { id: 'offer-signoff', label: 'Offer final sign-off', access: { Recruiter: '—', 'Hiring Manager': 'Approve', Psikolog: '—', Finance: 'Approve', 'HR Ops': '—', Admin: 'Edit' } },
  { id: 'background-check', label: 'Background check results', access: { Recruiter: 'View', 'Hiring Manager': '—', Psikolog: '—', Finance: '—', 'HR Ops': 'Edit', Admin: 'Edit' } },
  { id: 'compliance-export', label: 'Compliance audit export', access: { Recruiter: '—', 'Hiring Manager': '—', Psikolog: '—', Finance: '—', 'HR Ops': 'Edit', Admin: 'Edit' } },
  { id: 'reports-recruiter-perf', label: 'Reports · Recruiter perf', access: { Recruiter: 'Own only', 'Hiring Manager': '—', Psikolog: '—', Finance: '—', 'HR Ops': 'View', Admin: 'Edit' } },
  { id: 'settings-integrations', label: 'Settings · Integrations', access: { Recruiter: '—', 'Hiring Manager': '—', Psikolog: '—', Finance: '—', 'HR Ops': 'View', Admin: 'Edit' } },
  { id: 'settings-rbac', label: 'Settings · RBAC matrix', access: { Recruiter: '—', 'Hiring Manager': '—', Psikolog: '—', Finance: '—', 'HR Ops': '—', Admin: 'Edit' } },
];

const BANNER = {
  title: 'New in v50 · Action 11.',
  body: 'Retrofitting RBAC in Sprint 14 costs 4× what this one-page matrix costs now. Ships with the HM surface so Offer approval gates have a real role behind them.',
};

const FOOTNOTE = {
  title: 'Salary visibility caveat:',
  body: 'Current-expected compensation collected in Remuneration (Action 18) is hidden from Hiring Managers and Psikolog by default. Finance gets edit; HR Ops gets view. Override per-req with a signed justification (audit-logged).',
};

const CELL_STYLES = {
  Edit: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  View: 'bg-gray-50 text-gray-600 border-gray-200',
  Review: 'bg-gray-50 text-gray-600 border-gray-200',
  Approve: 'bg-amber-50 text-amber-700 border-amber-200',
  'Own only': 'bg-gray-50 text-gray-600 border-gray-200',
  '—': 'text-muted-foreground/40 border-transparent bg-transparent',
};

// ── Editable matrix cell ──

function MatrixCell({ value, onChange }) {
  if (value === '—') {
    return (
      <button
        type="button"
        onClick={() => onChange('View')}
        className="text-xs text-muted-foreground/40 hover:text-muted-foreground transition-colors"
      >
        —
      </button>
    );
  }

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        className={`h-6 w-fit gap-1 px-2 text-[11px] border rounded-full ${CELL_STYLES[value] ?? CELL_STYLES.View}`}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {ACCESS_LEVELS.map((lvl) => (
          <SelectItem key={lvl} value={lvl} className="text-xs">{lvl}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// ── New role dialog ──

function NewRoleDialog({ open, onOpenChange, onCreate }) {
  const [name, setName] = useState('');

  const handleSubmit = () => {
    if (!name.trim()) return;
    onCreate(name.trim());
    setName('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>New role</DialogTitle>
        </DialogHeader>
        <div className="space-y-1.5 py-2">
          <label className="text-xs font-medium text-muted-foreground">Role name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Compliance Reviewer"
            className="w-full h-9 rounded-md border px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <p className="text-xs text-muted-foreground pt-1">
            New roles default to no access on every surface — grant access from the matrix below.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!name.trim()}>Create role</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Roles & Permissions section ──

export default function RolesPermissionsSettings() {
  const [roles, setRoles] = useState(ROLES);
  const [surfaces, setSurfaces] = useState(SURFACES);
  const [newRoleOpen, setNewRoleOpen] = useState(false);

  const updateCell = (surfaceId, role, value) => {
    setSurfaces((prev) =>
      prev.map((s) =>
        s.id === surfaceId ? { ...s, access: { ...s.access, [role]: value } } : s
      )
    );
  };

  const handleCreateRole = (name) => {
    if (roles.includes(name)) return;
    setRoles((prev) => [...prev, name]);
    setSurfaces((prev) =>
      prev.map((s) => ({ ...s, access: { ...s.access, [name]: '—' } }))
    );
  };

  const handleExportMatrix = () => {
    const header = ['Surface', ...roles].join(',');
    const rows = surfaces.map((s) => [s.label, ...roles.map((r) => s.access[r] ?? '—')].join(','));
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'roles-permissions-matrix.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight font-serif">Roles & Permissions</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Six role surfaces · fifteen sensitive surfaces. Salary visibility, DEI fields, and
            the audit-export pack are the contentious ones — tuned here.
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Button variant="outline" size="sm" onClick={handleExportMatrix}>
            <FileText className="h-3.5 w-3.5 mr-1.5" />
            Export matrix
          </Button>
          <Button size="sm" onClick={() => setNewRoleOpen(true)} className="bg-teal-700 hover:bg-teal-800">
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            New role
          </Button>
        </div>
      </div>

      {/* Callout banner */}
      <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 px-4 py-3 text-sm text-emerald-900">
        <span className="font-semibold">{BANNER.title}</span>{' '}
        <span className="text-emerald-800">{BANNER.body}</span>
      </div>

      {/* Access matrix */}
      <Card>
        <CardHeader>
          <CardTitle>Access matrix</CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">Role × surface × action</p>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <div
            className="grid gap-3 px-4 py-2 bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground min-w-[860px]"
            style={{ gridTemplateColumns: `1.6fr repeat(${roles.length}, 1fr)` }}
          >
            <span>Surface / Action</span>
            {roles.map((r) => (
              <span key={r} className="text-center">{r}</span>
            ))}
          </div>

          {surfaces.map((s) => (
            <div
              key={s.id}
              className="grid gap-3 px-4 py-2.5 items-center border-b last:border-b-0 text-sm min-w-[860px]"
              style={{ gridTemplateColumns: `1.6fr repeat(${roles.length}, 1fr)` }}
            >
              <span className="font-medium">{s.label}</span>
              {roles.map((r) => (
                <div key={r} className="flex justify-center">
                  <MatrixCell
                    value={s.access[r] ?? '—'}
                    onChange={(v) => updateCell(s.id, r, v)}
                  />
                </div>
              ))}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Footnote */}
      <div className="rounded-lg border bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
        <span className="font-semibold text-foreground">{FOOTNOTE.title}</span> {FOOTNOTE.body}
      </div>

      <NewRoleDialog
        open={newRoleOpen}
        onOpenChange={setNewRoleOpen}
        onCreate={handleCreateRole}
      />
    </div>
  );
}