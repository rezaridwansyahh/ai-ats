import { useState, useEffect, useRef } from 'react';
import {
  Plus, X, Lock, ArrowUp, ArrowDown, Check,
  Briefcase, MapPin, AlertTriangle, Zap, Clock, Mail, Save,
} from 'lucide-react';
import { getJobPipeline, saveJobPipeline } from '@/api/pipeline.api';
import { getStageCategories } from '@/api/stage-category.api';
import { getTemplateStages, getTemplateStageById } from '@/api/template-stage.api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table';

// ── Constants ────────────────────────────────────────────────────────
const STAGE_COLORS = [
  'text-primary',
  'text-amber-500',
  'text-purple-500',
  'text-blue-500',
  'text-yellow-600',
  'text-pink-500',
  'text-cyan-500',
  'text-orange-500',
];

const STATUS_COLORS = {
  Draft: 'bg-orange-50 text-orange-600 border-orange-200',
  Active: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  Running: 'bg-blue-50 text-blue-600 border-blue-200',
  Expired: 'bg-gray-50 text-gray-500 border-gray-200',
  Failed: 'bg-red-50 text-red-500 border-red-200',
  Blocked: 'bg-gray-50 text-gray-500 border-gray-200',
};

// ── Component ────────────────────────────────────────────────────────
export default function JobStagesStep({ selectedJob, onPipelineChange }) {
  const nextIdRef = useRef(1);
  const [stages, setStages] = useState([]);
  const [loadingStages, setLoadingStages] = useState(false);
  const [savingStages, setSavingStages] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);

  // Template / Custom state
  const [isCustom, setIsCustom] = useState(false);
  const [categories, setCategories] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  // ── Load categories & templates on mount ──
  useEffect(() => {
    getStageCategories()
      .then(res => setCategories(res.data.data))
      .catch(() => {});

    setLoadingTemplates(true);
    getTemplateStages()
      .then(res => setTemplates(res.data.data))
      .catch(() => {})
      .finally(() => setLoadingTemplates(false));
  }, []);

  // ── Load pipeline from API when job changes ──
  useEffect(() => {
    if (!selectedJob?.id) return;

    let cancelled = false;
    setLoadingStages(true);
    setSaveMessage(null);

    getJobPipeline(selectedJob.id)
      .then((pipelineRes) => {
        if (cancelled) return;
        const data = pipelineRes.data.data;
        const mapStage = (s) => ({
          id: s.id,
          stage_type_id: s.stage_type_id,
          category: s.category,
          name: s.name,
        });

        if (data.template_stage_id) {
          setIsCustom(false);
          setSelectedTemplateId(data.template_stage_id);
          setStages(data.stages.map(mapStage));
          nextIdRef.current = data.stages.length > 0
            ? Math.max(...data.stages.map(s => s.id)) + 1
            : 1;
        } else if (data.stages && data.stages.length > 0) {
          setIsCustom(true);
          setSelectedTemplateId(null);
          setStages(data.stages.map(mapStage));
          nextIdRef.current = Math.max(...data.stages.map(s => s.id)) + 1;
        } else {
          setIsCustom(false);
          setSelectedTemplateId(null);
          setStages([]);
          nextIdRef.current = 1;
        }

        // Notify parent: server-confirmed stage presence, NOT local edits.
        onPipelineChange?.({
          hasStages: Array.isArray(data.stages) && data.stages.length > 0,
        });
      })
      .catch(() => {
        if (!cancelled) {
          setIsCustom(false);
          setSelectedTemplateId(null);
          setStages([]);
          nextIdRef.current = 1;
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingStages(false);
      });

    return () => { cancelled = true; };
  }, [selectedJob?.id]);

  // ── Template selection handler ──
  const handleTemplateSelect = async (templateId) => {
    const id = Number(templateId);
    setSelectedTemplateId(id);
    try {
      const [templateRes] = await Promise.all([
        getTemplateStageById(id),
      ]);
      const data = templateRes.data.data;


      setStages(data.stages.map(s => ({
        id: s.id,
        stage_type_id: s.stage_type_id,
        category: s.category,
        name: s.name,
      })));
      nextIdRef.current = data.stages.length > 0
        ? Math.max(...data.stages.map(s => s.id)) + 1
        : 1;
    } catch {
      setStages([]);
    }
  };

  // ── Custom toggle handler ──
  const handleCustomToggle = (checked) => {
    setIsCustom(checked);
    if (!checked && selectedTemplateId) {
      // Switching back to template mode — reload template
      handleTemplateSelect(selectedTemplateId);
    }
  };

  // ── Save stages to API ──
  const handleSave = async () => {
    if (!selectedJob?.id) return;
    setSavingStages(true);
    setSaveMessage(null);

    try {
      let pipelineRes;
      if (isCustom) {
        const payload = stages.map(s => ({
          stage_type_id: s.stage_type_id,
          name: s.name,
        }));
        pipelineRes = await saveJobPipeline(selectedJob.id, { stages: payload, templateId: null });
      } else {
        pipelineRes = await saveJobPipeline(selectedJob.id, { stages: null, templateId: selectedTemplateId });
      }

      // Sync frontend state with DB-assigned stage IDs
      const savedStages = pipelineRes.data.data.stages;
      setStages(prev => prev.map((s, idx) => ({
        ...s,
        id: savedStages[idx]?.id ?? s.id,
      })));

      // Notify parent: stages are now committed to the backend.
      onPipelineChange?.({
        hasStages: Array.isArray(savedStages) && savedStages.length > 0,
      });

      setSaveMessage({ type: 'success', text: 'Pipeline saved successfully' });
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save pipeline';
      setSaveMessage({ type: 'error', text: msg });
    } finally {
      setSavingStages(false);
    }
  };

  // ── Stage handlers ──
  const updateStage = (id, field, value) => {
    setStages(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const addStage = () => {
    const defaultCategoryId = categories[0]?.id || 1;
    setStages(prev => [...prev, {
      id: nextIdRef.current++,
      stage_type_id: defaultCategoryId,
      category: categories[0]?.name || '',
      name: '',
    }]);
  };

  const removeStage = (id) => {
    setStages(prev => prev.filter(s => s.id !== id));
  };

  const moveStage = (idx, dir) => {
    const target = idx + dir;
    if (target < 0 || target >= stages.length) return;
    const updated = [...stages];
    [updated[idx], updated[target]] = [updated[target], updated[idx]];
    setStages(updated);
  };

  // ── No job selected guard ──
  if (!selectedJob) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertTriangle className="h-10 w-10 text-amber-400 mb-3" />
        <h3 className="text-lg font-bold mb-1">No Job Selected</h3>
        <p className="text-sm text-muted-foreground">Go back to Job Creation and select a job first.</p>
      </div>
    );
  }

  const canSave = isCustom
    ? stages.length > 0 && stages.every(s => s.name?.trim())
    : selectedTemplateId !== null;

  console.log(selectedJob);
  return (
    <div className="space-y-5">

      {/* ── Section A: Selected Job Banner ── */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="py-4 px-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Briefcase className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold">{selectedJob.job_title}</h3>
                  <Badge variant="outline" className={`text-[10px] px-2 py-0 ${STATUS_COLORS[selectedJob.status] || ''}`}>
                    {selectedJob.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                  {selectedJob.job_location && (
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{selectedJob.job_location}</span>
                  )}
                  {selectedJob.work_type && <span>{selectedJob.work_type}</span>}
                  {selectedJob.work_option && <span>{selectedJob.work_option}</span>}
                </div>
              </div>
            </div>
            <span className="text-[10px] font-bold text-muted-foreground tracking-widest">STEP 2</span>
          </div>
        </CardContent>
      </Card>

      {/* ── Section B: Pipeline Configuration ── */}
      <Card className="pt-0 gap-0">
        <CardHeader className="py-3 px-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-[13px] font-bold">Recruitment Pipeline</CardTitle>
              <p className="text-[10px] text-muted-foreground mt-0.5">Configure recruitment pipeline stages. Use a template or create a custom pipeline.</p>
            </div>
            <Button
              size="sm"
              className="text-xs gap-1.5"
              onClick={handleSave}
              disabled={savingStages || loadingStages || !canSave}
            >
              <Save className="h-3.5 w-3.5" />
              {savingStages ? 'Saving...' : 'Save Stages'}
            </Button>
          </div>

          {/* Template / Custom Controls */}
          <div className="flex items-center gap-4 flex-wrap">
            {/* Template dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground">Template:</span>
              <Select
                value={selectedTemplateId ? String(selectedTemplateId) : ''}
                onValueChange={handleTemplateSelect}
                disabled={isCustom || loadingTemplates}
              >
                <SelectTrigger className="h-9 text-xs w-[220px]">
                  <SelectValue placeholder="Select a template..." />
                </SelectTrigger>
                <SelectContent>
                  {templates.map(tpl => (
                    <SelectItem key={tpl.id} value={String(tpl.id)} className="text-xs">
                      {tpl.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Custom toggle */}
            <div className="flex items-center gap-2">
              <Checkbox
                id="custom-pipeline"
                checked={isCustom}
                onCheckedChange={handleCustomToggle}
              />
              <label htmlFor="custom-pipeline" className="text-xs font-semibold cursor-pointer">
                Custom Pipeline
              </label>
            </div>
          </div>

          {saveMessage && (
            <div className={`text-xs px-3 py-2 rounded-lg ${
              saveMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-600'
                : 'bg-red-50 text-red-500'
            }`}>
              {saveMessage.type === 'success' ? <Check className="h-3.5 w-3.5 inline mr-1" /> : <AlertTriangle className="h-3.5 w-3.5 inline mr-1" />}
              {saveMessage.text}
            </div>
          )}
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40 border-border/60">
                <TableHead className="w-20 text-center text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                  Stage
                </TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                  Category
                </TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                  Stage Name
                </TableHead>
                {isCustom && (
                  <TableHead className="w-28 text-center text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                    Actions
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {stages.map((stage, idx) => (
                <TableRow key={stage.id} className="border-border/40 hover:bg-primary/[0.03]">
                  <TableCell className="text-center">
                    <span className={`text-[10px] font-bold tracking-wide ${STAGE_COLORS[idx % STAGE_COLORS.length]}`}>
                      Stage {idx + 1}
                    </span>
                  </TableCell>
                  <TableCell>
                    {isCustom ? (
                      <Select
                        value={String(stage.stage_type_id)}
                        onValueChange={v => {
                          const cat = categories.find(c => c.id === Number(v));
                          updateStage(stage.id, 'stage_type_id', Number(v));
                          if (cat) updateStage(stage.id, 'category', cat.name);
                        }}
                      >
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map(cat => (
                            <SelectItem key={cat.id} value={String(cat.id)} className="text-xs">{cat.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="text-xs font-semibold text-muted-foreground">{stage.category}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {isCustom ? (
                      <Input
                        value={stage.name}
                        onChange={e => updateStage(stage.id, 'name', e.target.value)}
                        placeholder="Stage name"
                        className="h-9 text-xs"
                      />
                    ) : (
                      <span className="text-xs">{stage.name}</span>
                    )}
                  </TableCell>
                  {isCustom && (
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => moveStage(idx, -1)}
                          disabled={idx === 0}
                          title="Move up"
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => moveStage(idx, 1)}
                          disabled={idx === stages.length - 1}
                          title="Move down"
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 hover:text-destructive"
                          onClick={() => removeStage(stage.id)}
                          title="Remove"
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}

              {/* Add Stage (custom mode only) */}
              {isCustom && (
                <TableRow className="hover:bg-primary/5 cursor-pointer border-border/40" onClick={addStage}>
                  <TableCell colSpan={4} className="text-center py-3">
                    <span className="text-xs font-semibold text-primary">
                      <Plus className="h-3.5 w-3.5 inline mr-1" />
                      Add Stage
                    </span>
                  </TableCell>
                </TableRow>
              )}

              {/* Final Stage (locked) */}
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableCell className="text-center">
                  <span className="text-[10px] font-bold tracking-wide text-emerald-600">Final</span>
                </TableCell>
                <TableCell>
                  <span className="text-xs font-semibold text-muted-foreground">Final</span>
                </TableCell>
                <TableCell>
                  <span className="text-xs text-muted-foreground">Final</span>
                </TableCell>
                {isCustom && (
                  <TableCell className="text-center">
                    <Lock className="h-3.5 w-3.5 text-muted-foreground inline" />
                  </TableCell>
                )}
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>


    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────────────

function AutoRow({ title, desc, checked, onChange, icon }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {icon}
        <div>
          <p className="text-xs font-bold">{title}</p>
          <p className="text-[10px] text-muted-foreground">{desc}</p>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function ThresholdSlider({ value, onChange, color }) {
  const isRed = color === 'red';
  const cls = isRed
    ? '[&_[data-slot=slider-range]]:bg-red-500 [&_[data-slot=slider-thumb]]:border-red-500'
    : '[&_[data-slot=slider-range]]:bg-emerald-500 [&_[data-slot=slider-thumb]]:border-emerald-500';
  return (
    <div className="flex items-center gap-3 px-3 py-2 bg-muted/50 rounded-lg ml-0">
      <span className="text-[9px] font-semibold text-muted-foreground min-w-[55px]">Threshold:</span>
      <div className="flex-1">
        <Slider
          value={[value]}
          onValueChange={v => onChange(v[0])}
          min={0}
          max={100}
          step={1}
          className={cls}
        />
      </div>
      <span className={`text-xs font-bold min-w-[24px] text-right ${isRed ? 'text-red-500' : 'text-emerald-600'}`}>
        {value}
      </span>
    </div>
  );
}
