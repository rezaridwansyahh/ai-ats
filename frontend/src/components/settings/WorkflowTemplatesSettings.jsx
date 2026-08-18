import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

import { getStageCategories } from '@/api/stage-category.api';
import {
  getTemplateStages, getTemplateStageById, createTemplateStage, deleteTemplateStage,
  addTemplateStageStage, updateTemplateStageStage, deleteTemplateStageStage,
} from '@/api/template-stage.api';

/*
 * Workflow Templates settings — this is the real master_template_stage
 * system (job_stage rows with master_id set instead of job_id). These are
 * the same templates JobStages.jsx (Job Wizard → Pipeline & AI step) lets
 * a recruiter pick from via the Template dropdown, via
 * getTemplateStages()/getTemplateStageById().
 *
 * This tab exists to CREATE and maintain those templates — not to
 * "duplicate" or "use in job" (that selection already happens for real in
 * the Job Wizard, no shortcut needed here).
 */
export default function WorkflowTemplatesSettings() {
  const [templates, setTemplates] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [newTemplateOpen, setNewTemplateOpen] = useState(false);
  const [addStageOpen, setAddStageOpen] = useState(false);
  const [configuring, setConfiguring] = useState(null); // stage row being edited
  const [deleteTemplateOpen, setDeleteTemplateOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getTemplateStages();
      const list = data.data || [];
      setTemplates(list);
      setSelectedId((prev) => prev ?? list[0]?.id ?? null);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDetail = useCallback(async (id) => {
    if (!id) { setDetail(null); return; }
    setLoadingDetail(true);
    try {
      const { data } = await getTemplateStageById(id);
      setDetail(data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to load template detail');
      setDetail(null);
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
    getStageCategories().then((res) => setCategories(res.data.data || [])).catch(() => {});
  }, [fetchTemplates]);

  useEffect(() => { fetchDetail(selectedId); }, [selectedId, fetchDetail]);

  const handleCreateTemplate = async ({ name }) => {
    setSaving(true);
    try {
      const { data } = await createTemplateStage({ name });
      toast.success('Template created');
      setNewTemplateOpen(false);
      await fetchTemplates();
      setSelectedId(data.data.id);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to create template');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTemplate = async () => {
    if (!selectedId) return;
    setSaving(true);
    try {
      await deleteTemplateStage(selectedId);
      toast.success('Template deleted');
      setDeleteTemplateOpen(false);
      setSelectedId(null);
      await fetchTemplates();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to delete template');
    } finally {
      setSaving(false);
    }
  };

  const handleAddStage = async ({ name, stage_type_id }) => {
    setSaving(true);
    try {
      await addTemplateStageStage(selectedId, { name, stage_type_id });
      toast.success('Stage added');
      setAddStageOpen(false);
      await fetchDetail(selectedId);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to add stage');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveStage = async ({ name, stage_type_id }) => {
    setSaving(true);
    try {
      await updateTemplateStageStage(configuring.id, { name, stage_type_id });
      toast.success('Stage updated');
      setConfiguring(null);
      await fetchDetail(selectedId);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to update stage');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveStage = async (stageId) => {
    try {
      await deleteTemplateStageStage(stageId);
      toast.success('Stage removed');
      await fetchDetail(selectedId);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to remove stage');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight font-serif">Workflow Templates</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Pre-configured stage sequences recruiters pick from in Step 2 (Stages) of the Job Wizard.
          </p>
        </div>
        <Button size="sm" onClick={() => setNewTemplateOpen(true)} className="bg-teal-700 hover:bg-teal-800">
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          New template
        </Button>
      </div>

      <div className="grid grid-cols-[320px_1fr] gap-4">
        {/* Template list */}
        <Card className="py-0 gap-0 overflow-hidden">
          <CardHeader className="border-b py-3">
            <CardTitle className="text-base">Templates</CardTitle>
            <p className="text-xs text-muted-foreground">{templates.length} available</p>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : templates.length === 0 ? (
              <p className="text-xs text-muted-foreground px-4 py-6 text-center">
                No templates yet. Create one to get started.
              </p>
            ) : (
              templates.map((t) => {
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
                  </button>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Selected template detail */}
        {selectedId && (
          <Card className="py-0 gap-0">
            <CardHeader className="border-b py-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base">{detail?.name || '—'}</CardTitle>
              <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => setDeleteTemplateOpen(true)}>
                <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                Delete template
              </Button>
            </CardHeader>

            <CardContent className="pt-4 pb-2">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Stage sequence
                </p>
                <Button variant="outline" size="sm" onClick={() => setAddStageOpen(true)}>
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  Add stage
                </Button>
              </div>

              {loadingDetail ? (
                <div className="space-y-2 pb-3">
                  {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                </div>
              ) : !detail?.stages?.length ? (
                <p className="text-xs text-muted-foreground py-6 text-center">
                  No stages yet. Add the first one.
                </p>
              ) : (
                <div className="space-y-0">
                  {detail.stages.map((stage, i) => (
                    <div key={stage.id} className="flex items-center gap-3 py-2.5 border-b last:border-b-0">
                      <div className="h-6 w-6 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold flex items-center justify-center flex-shrink-0">
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium">{stage.name}</span>
                        <p className="text-xs text-muted-foreground">{stage.category}</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => setConfiguring(stage)}>
                        Configure
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleRemoveStage(stage.id)}
                        title="Remove stage"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>

            <div className="px-4 py-3 bg-muted/30 text-xs text-muted-foreground border-t">
              Loaded in: Job Wizard · Step 2 · Stages. Recruiter picks a template, then customizes
              any stage.
            </div>
          </Card>
        )}
      </div>

      {newTemplateOpen && (
        <NewTemplateDialog
          open={newTemplateOpen}
          onOpenChange={setNewTemplateOpen}
          onCreate={handleCreateTemplate}
          loading={saving}
        />
      )}

      {addStageOpen && (
        <StageDialog
          open={addStageOpen}
          onOpenChange={setAddStageOpen}
          categories={categories}
          onSave={handleAddStage}
          loading={saving}
          title="Add stage"
        />
      )}

      {configuring && (
        <StageDialog
          open={!!configuring}
          onOpenChange={(open) => !open && setConfiguring(null)}
          stage={configuring}
          categories={categories}
          onSave={handleSaveStage}
          loading={saving}
          title={`Configure "${configuring.name}"`}
        />
      )}

      <Dialog open={deleteTemplateOpen} onOpenChange={setDeleteTemplateOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              Delete template?
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This removes "{detail?.name}" and all its stages. Jobs already using this template
            keep their own copy of the stages and are not affected.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTemplateOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteTemplate} disabled={saving}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── New template dialog ──

function NewTemplateDialog({ open, onOpenChange, onCreate, loading }) {
  const [name, setName] = useState('');

  const handleSubmit = () => {
    if (!name.trim()) return;
    onCreate({ name: name.trim() });
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
          <p className="text-xs text-muted-foreground">
            Starts empty — add stages from the detail panel once created.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!name.trim() || loading}>
            {loading ? 'Creating…' : 'Create template'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Add / Configure stage dialog ──

function StageDialog({ open, onOpenChange, stage, categories, onSave, loading, title }) {
  const [name, setName] = useState(stage?.name || '');
  const [categoryId, setCategoryId] = useState(stage?.stage_type_id ? String(stage.stage_type_id) : '');

  const handleSave = () => {
    if (!name.trim() || !categoryId) return;
    onSave({ name: name.trim(), stage_type_id: Number(categoryId) });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Stage name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-9 rounded-md border px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Category</label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger className="h-9 text-sm w-full">
                <SelectValue placeholder="Select a category..." />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={!name.trim() || !categoryId || loading}>
            {loading ? 'Saving…' : 'Save stage'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
