import { useState } from 'react';
import { FileText, Plus, Copy } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';

// ── Static data — swap for API data when backend is ready ──

const TEMPLATES = [
  {
    id: 'bulk-hiring',
    name: 'Bulk hiring · Sales/Ops',
    desc: 'Fast-lane for 10+ reqs with standardized stages',
    sla: '14 days end-to-end',
    uses: 47,
    lastUsed: '3 days ago',
    stages: ['Applied', 'Auto-screen', 'Assessment day', 'Panel interview', 'Offer', 'Onboard'],
  },
  {
    id: 'executive-search',
    name: 'Executive search',
    desc: 'C-level / VP / director roles with heavy HM involvement',
    sla: '45 days end-to-end',
    uses: 8,
    lastUsed: '2 weeks ago',
    stages: ['Applied', 'HM screen', 'Panel interview', 'Reference check', 'Offer', 'Onboard'],
  },
  {
    id: 'intern-graduate',
    name: 'Intern / Graduate program',
    desc: 'Cohort hiring with campus drives',
    sla: '21 days end-to-end',
    uses: 12,
    lastUsed: '1 month ago',
    stages: ['Applied', 'Auto-screen', 'Assessment day', 'Group interview', 'Offer'],
  },
  {
    id: 'freelance-contract',
    name: 'Freelance / Contract',
    desc: 'Short-lived engagements, lightweight',
    sla: '5 days end-to-end',
    uses: 23,
    lastUsed: '1 week ago',
    stages: ['Applied', 'Portfolio review', 'Interview', 'Offer'],
  },
  {
    id: 'regular-fulltime',
    name: 'Regular full-time (default)',
    desc: 'Standard 5-stage pipeline for most IC roles',
    sla: '30 days end-to-end',
    uses: 156,
    lastUsed: 'Today',
    stages: ['Applied', 'Auto-screen', 'Assessment day', 'Panel interview', 'Offer'],
  },
];

const BANNER = {
  title: 'New in v50 · Action 23.',
  body: 'v45 had Bulk / Executive / Intern / Freelance / Regular presets; v49 required manual stage config every time. Templates are now loaded during JobWizard Step 2 (Stages).',
};

// ── Stage configure dialog ──

function ConfigureStageDialog({ stage, index, open, onOpenChange, onSave }) {
  const [name, setName] = useState(stage ?? '');

  if (!open) return null;

  const handleSave = () => {
    if (!name.trim()) return;
    onSave(index, name.trim());
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Configure stage {index + 1}</DialogTitle>
        </DialogHeader>
        <div className="space-y-1.5 py-2">
          <label className="text-xs font-medium text-muted-foreground">Stage name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full h-9 rounded-md border px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            autoFocus
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={!name.trim()}>Save stage</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── New template dialog ──

function NewTemplateDialog({ open, onOpenChange, onCreate }) {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');

  const handleSubmit = () => {
    if (!name.trim()) return;
    onCreate({ name: name.trim(), desc: desc.trim() });
    setName('');
    setDesc('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>New template</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Template name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Remote / Contract"
              className="w-full h-9 rounded-md border px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Description</label>
            <input
              type="text"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Short description of when to use this"
              className="w-full h-9 rounded-md border px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Starts with a single "Applied" stage — add more from the detail panel.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!name.trim()}>Create template</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Workflow Templates section ──

export default function WorkflowTemplatesSettings() {
  const [templates, setTemplates] = useState(TEMPLATES);
  const [selectedId, setSelectedId] = useState(TEMPLATES[0].id);
  const [newTemplateOpen, setNewTemplateOpen] = useState(false);
  const [configuring, setConfiguring] = useState(null); // { stageIndex }

  const selected = templates.find((t) => t.id === selectedId);

  const handleDuplicate = () => {
    const copy = {
      ...selected,
      id: `${selected.id}-copy-${Date.now()}`,
      name: `${selected.name} (copy)`,
      uses: 0,
      lastUsed: 'Never',
    };
    setTemplates((prev) => [...prev, copy]);
    setSelectedId(copy.id);
  };

  const handleCreateTemplate = ({ name, desc }) => {
    const newTemplate = {
      id: `template-${Date.now()}`,
      name,
      desc: desc || 'New workflow template',
      sla: '— end-to-end',
      uses: 0,
      lastUsed: 'Never',
      stages: ['Applied'],
    };
    setTemplates((prev) => [...prev, newTemplate]);
    setSelectedId(newTemplate.id);
  };

  const handleSaveStage = (index, newName) => {
    setTemplates((prev) =>
      prev.map((t) =>
        t.id === selectedId
          ? { ...t, stages: t.stages.map((s, i) => (i === index ? newName : s)) }
          : t
      )
    );
  };

  const handleUseInNewJob = () => {
    // Hook up to Job Wizard navigation once available
    console.log('Use in new job:', selectedId);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight font-serif">Workflow Templates</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Pre-configured stage sequences. Pick one during Step 2 of the Job Wizard instead of
            rebuilding stages every time.
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Button variant="outline" size="sm">
            <FileText className="h-3.5 w-3.5 mr-1.5" />
            Import from v45
          </Button>
          <Button size="sm" onClick={() => setNewTemplateOpen(true)} className="bg-teal-700 hover:bg-teal-800">
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            New template
          </Button>
        </div>
      </div>

      {/* Callout banner */}
      <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 px-4 py-3 text-sm text-emerald-900">
        <span className="font-semibold">{BANNER.title}</span>{' '}
        <span className="text-emerald-800">{BANNER.body}</span>
      </div>

      <div className="grid grid-cols-[320px_1fr] gap-4">
        {/* Template list */}
        <Card className="py-0 gap-0 overflow-hidden">
          <CardHeader className="border-b py-3">
            <CardTitle className="text-base">Templates</CardTitle>
            <p className="text-xs text-muted-foreground">{templates.length} available</p>
          </CardHeader>
          <CardContent className="p-0">
            {templates.map((t) => {
              const isActive = t.id === selectedId;
              return (
                <button
                  key={t.id}
                  onClick={() => setSelectedId(t.id)}
                  className={`w-full text-left px-4 py-3 border-b last:border-b-0 transition-colors ${
                    isActive ? 'bg-emerald-50' : 'hover:bg-muted/50'
                  }`}
                >
                  <p className={`text-sm font-semibold ${isActive ? 'text-emerald-700' : 'text-foreground'}`}>
                    {t.name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{t.desc}</p>
                  <p className="text-[11px] text-muted-foreground/70 mt-1">
                    {t.uses} uses · {t.lastUsed}
                  </p>
                </button>
              );
            })}
          </CardContent>
        </Card>

        {/* Selected template detail */}
        {selected && (
          <Card className="py-0 gap-0">
            <CardHeader className="border-b py-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">{selected.name}</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {selected.desc} · SLA {selected.sla}
                </p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Button variant="outline" size="sm" onClick={handleDuplicate}>
                  <Copy className="h-3.5 w-3.5 mr-1.5" />
                  Duplicate
                </Button>
                <Button size="sm" onClick={handleUseInNewJob} className="bg-teal-700 hover:bg-teal-800">
                  Use in new job
                </Button>
              </div>
            </CardHeader>

            <CardContent className="pt-4 pb-2">
              <p className="text-xs uppercase tracking-wide text-muted-foreground mb-3">
                Stage sequence
              </p>

              <div className="space-y-0">
                {selected.stages.map((stage, i) => (
                  <div key={i} className="flex items-center gap-3 py-2.5 border-b last:border-b-0">
                    <div className="h-6 w-6 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold flex items-center justify-center flex-shrink-0">
                      {i + 1}
                    </div>
                    <span className="flex-1 text-sm font-medium">{stage}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setConfiguring({ stageIndex: i })}
                    >
                      Configure
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>

            <div className="px-4 py-3 bg-muted/30 text-xs text-muted-foreground border-t">
              Loaded in: Job Wizard · Step 2 · Stages. Recruiter picks a template, then customizes
              any stage.
            </div>
          </Card>
        )}
      </div>

      <NewTemplateDialog
        open={newTemplateOpen}
        onOpenChange={setNewTemplateOpen}
        onCreate={handleCreateTemplate}
      />

      {configuring && selected && (
        <ConfigureStageDialog
          stage={selected.stages[configuring.stageIndex]}
          index={configuring.stageIndex}
          open={!!configuring}
          onOpenChange={(open) => !open && setConfiguring(null)}
          onSave={handleSaveStage}
        />
      )}
    </div>
  );
}