import { useState, useMemo } from 'react';
import {
  Plus, X, Lock, ArrowUp, ArrowDown, Check,
  Briefcase, MapPin, AlertTriangle, Zap, Clock, Mail,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table';

// ── Constants ────────────────────────────────────────────────────────
const STAGE_CATEGORIES = [
  'Job Management',
  'Screening & Matching',
  'Interview',
  'Assessment',
  'Background Check',
  'Offering & Contract',
  'Other',
];

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

const DEFAULT_STAGES = [
  { id: 1, category: 'Screening & Matching', name: 'AI CV Screening', slaDays: 2 },
  { id: 2, category: 'Assessment', name: 'Psikotes Online', slaDays: 3 },
  { id: 3, category: 'Interview', name: 'Interview HR', slaDays: 3 },
  { id: 4, category: 'Interview', name: 'Interview User', slaDays: 3 },
  { id: 5, category: 'Background Check', name: 'MCU / Medical', slaDays: 3 },
];

const STATUS_COLORS = {
  Draft: 'bg-orange-50 text-orange-600 border-orange-200',
  Active: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  Running: 'bg-blue-50 text-blue-600 border-blue-200',
  Expired: 'bg-gray-50 text-gray-500 border-gray-200',
  Failed: 'bg-red-50 text-red-500 border-red-200',
  Blocked: 'bg-gray-50 text-gray-500 border-gray-200',
};

let nextId = 6;

// ── Component ────────────────────────────────────────────────────────
export default function JobStagesStep({ selectedJob }) {
  const [overallDeadline, setOverallDeadline] = useState(14);
  const [stages, setStages] = useState(DEFAULT_STAGES);
  const [automation, setAutomation] = useState({
    aiScreening: true,
    aiFollowUp: true,
    autoSchedule: false,
    autoReject: false,
    autoAdvance: false,
    emailNotify: false,
    rejectThreshold: 50,
    advanceThreshold: 80,
  });

  const totalSla = useMemo(() => stages.reduce((sum, s) => sum + (s.slaDays || 0), 0), [stages]);
  const slaMatch = totalSla === overallDeadline;

  // ── Stage handlers ──
  const updateStage = (id, field, value) => {
    setStages(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const addStage = () => {
    setStages(prev => [...prev, { id: nextId++, category: 'Interview', name: '', slaDays: 2 }]);
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

  // ── Automation handler ──
  const setAuto = (key, value) => {
    setAutomation(prev => ({ ...prev, [key]: value }));
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

      {/* ── AI Automation Quick-Access Banner ── */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-amber-200"
        style={{ background: 'linear-gradient(90deg, #FEF3C7, #FFFBEB)' }}>
        <Zap className="h-5 w-5 text-amber-600 shrink-0" />
        <div className="flex-1">
          <p className="text-xs font-bold text-amber-800">AI & Automation rules are configured below on this page</p>
          <p className="text-[10px] text-amber-700 mt-0.5">
            Set auto-reject/advance thresholds, enable Q&A, and toggle interview scheduling. These settings control candidate flow for this job.
          </p>
        </div>
        <a href="#ai-automation-card"
          onClick={(e) => { e.preventDefault(); document.getElementById('ai-automation-card')?.scrollIntoView({ behavior: 'smooth' }); }}
          className="text-[10px] font-bold text-primary px-3 py-1.5 border border-primary/30 rounded-md bg-primary/5 whitespace-nowrap hover:bg-primary/10 transition-colors cursor-pointer">
          Jump to AI Settings
        </a>
      </div>

      {/* ── Pipeline Configuration Info ── */}
      <div className="flex items-start gap-3 px-4 py-3 rounded-xl border border-primary/15"
        style={{ background: 'linear-gradient(135deg, rgba(10,110,92,0.05), rgba(59,130,246,0.05))' }}>
        <div className="h-9 w-9 rounded-full bg-primary text-white flex items-center justify-center shrink-0 mt-0.5">
          <Zap className="h-4 w-4" />
        </div>
        <div>
          <p className="text-[13px] font-bold text-primary mb-1">This Stage Order Drives the Entire Process</p>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            The sequence you configure here determines the <strong>exact order</strong> candidates flow through the recruitment process.
            Every navigation button, every "Next Stage" action, and every Kanban column across all modules will follow this order.
            You can place stages in any order — the system adapts to your configuration.
          </p>
        </div>
      </div>

      {/* ── Section B: SLA Timers ── */}
      <Card className="pt-0 gap-0">
        <CardHeader className="py-3 px-5 rounded-t-xl border-b-2 border-amber-400"
          style={{ background: 'linear-gradient(90deg, #FEF3C7, #FFFBEB)' }}>
          <div className="flex items-center justify-between">
            <CardTitle className="text-[13px] font-bold text-amber-800 flex items-center gap-2">
              <Clock className="h-4 w-4" /> Per-Stage SLA Timers
            </CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-amber-700">Overall deadline:</span>
              <Input
                type="number"
                min={1}
                value={overallDeadline}
                onChange={e => setOverallDeadline(parseInt(e.target.value) || 0)}
                className="w-14 h-7 text-center text-xs border-amber-300 bg-white"
              />
              <span className="text-[10px] text-amber-700">calendar days</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-4 space-y-3">
          <p className="text-[11px] text-muted-foreground">
            Set a maximum number of days allowed per stage. If a candidate exceeds the SLA, the assigned recruiter is automatically notified and the breach appears in Reports.
          </p>
          <div className="flex flex-col gap-1.5">
            {stages.map(stage => (
              <div key={stage.id} className="grid grid-cols-[1fr_80px_80px] gap-2 items-center px-3 py-2 bg-muted/50 rounded-lg">
                <span className="text-xs font-semibold">{stage.name || '(unnamed)'}</span>
                <Input
                  type="number"
                  min={1}
                  value={stage.slaDays}
                  onChange={e => updateStage(stage.id, 'slaDays', parseInt(e.target.value) || 0)}
                  className="h-7 text-center text-xs"
                />
                <span className="text-[10px] text-muted-foreground">days max</span>
              </div>
            ))}
          </div>
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] font-semibold ${
            slaMatch
              ? 'bg-emerald-50 text-emerald-600'
              : 'bg-amber-50 text-amber-600'
          }`}>
            {slaMatch ? <Check className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
            Total SLA: {totalSla} days {slaMatch ? '— matches overall deadline.' : `— does not match overall deadline (${overallDeadline} days).`}
          </div>
        </CardContent>
      </Card>

      {/* ── Section C: Pipeline Configuration ── */}
      <Card className="pt-0 gap-0">
        <CardHeader className="py-3 px-5">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-[13px] font-bold">Recruitment Pipeline</CardTitle>
              <p className="text-[10px] text-muted-foreground mt-0.5">Configure recruitment pipeline stages. Reorder using arrows. Final stage is locked.</p>
            </div>
          </div>
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
                <TableHead className="w-28 text-center text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                  Actions
                </TableHead>
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
                    <Select value={stage.category} onValueChange={v => updateStage(stage.id, 'category', v)}>
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STAGE_CATEGORIES.map(cat => (
                          <SelectItem key={cat} value={cat} className="text-xs">{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input
                      value={stage.name}
                      onChange={e => updateStage(stage.id, 'name', e.target.value)}
                      placeholder="Stage name"
                      className="h-9 text-xs"
                    />
                  </TableCell>
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
                </TableRow>
              ))}

              {/* Add Stage */}
              <TableRow className="hover:bg-primary/5 cursor-pointer border-border/40" onClick={addStage}>
                <TableCell colSpan={4} className="text-center py-3">
                  <span className="text-xs font-semibold text-primary">
                    <Plus className="h-3.5 w-3.5 inline mr-1" />
                    Add Stage
                  </span>
                </TableCell>
              </TableRow>

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
                <TableCell className="text-center">
                  <Lock className="h-3.5 w-3.5 text-muted-foreground inline" />
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ── Automation Rules Reminder ── */}
      <div className="flex items-center justify-between px-4 py-3 rounded-xl border-l-4 border-primary"
        style={{ background: 'linear-gradient(90deg, rgba(10,110,92,0.05), rgba(224,255,245,0.5))' }}>
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          <div>
            <p className="text-xs font-bold text-primary">Automation Rules — Configure Here Before Publishing</p>
            <p className="text-[10px] text-muted-foreground">
              Auto-reject thresholds, auto-advance rules, and notification settings live below. <strong>Set them now</strong> to avoid manual processing later.
            </p>
          </div>
        </div>
      </div>

      {/* ── Section D: AI & Automation ── */}
      <Card id="ai-automation-card" className="scroll-mt-20 pt-0 gap-0">
        <CardHeader className="py-3 px-5 rounded-t-xl border-b-2 border-amber-400"
          style={{ background: 'linear-gradient(90deg, #FEF3C7, #FFFBEB)' }}>
          <div className="flex items-center justify-between">
            <CardTitle className="text-[13px] font-bold text-amber-800">
              AI & Automation in Recruitment Process
            </CardTitle>
            <Badge variant="outline" className="text-[9px] bg-red-50 text-red-500 border-red-200 font-bold">
              Configure before publishing
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-5 pt-5 space-y-5">

          {/* AI Screening */}
          <AutoRow
            title="Enable AI Screening"
            desc="Auto-parse and score CVs using AI matching"
            checked={automation.aiScreening}
            onChange={v => setAuto('aiScreening', v)}
          />

          {/* AI Follow-up Q&A */}
          <AutoRow
            title="AI Follow-up Q&A"
            desc="AI sends follow-up questions by email. Candidates have 7 days to respond. Answers are auto-scored."
            checked={automation.aiFollowUp}
            onChange={v => setAuto('aiFollowUp', v)}
          />

          {/* Auto-schedule Interviews */}
          <AutoRow
            title="Auto-schedule Interviews"
            desc="Calendar sync + auto-invite shortlisted candidates"
            checked={automation.autoSchedule}
            onChange={v => setAuto('autoSchedule', v)}
          />

          {/* Auto-reject Below Threshold */}
          <div className="space-y-2">
            <AutoRow
              title="Auto-reject Below Threshold"
              desc="Auto-decline candidates scoring below AI minimum"
              checked={automation.autoReject}
              onChange={v => setAuto('autoReject', v)}
            />
            {automation.autoReject && (
              <ThresholdSlider
                value={automation.rejectThreshold}
                onChange={v => setAuto('rejectThreshold', v)}
                color="red"
              />
            )}
          </div>

          {/* Auto-advance Top Candidates */}
          <div className="space-y-2">
            <AutoRow
              title="Auto-advance Top Candidates"
              desc="Automatically move candidates scoring above threshold to next stage"
              checked={automation.autoAdvance}
              onChange={v => setAuto('autoAdvance', v)}
            />
            {automation.autoAdvance && (
              <ThresholdSlider
                value={automation.advanceThreshold}
                onChange={v => setAuto('advanceThreshold', v)}
                color="green"
              />
            )}
          </div>

          {/* Email Notification */}
          <AutoRow
            title="Email Notification"
            desc="Automated status updates via Email at each stage transition"
            checked={automation.emailNotify}
            onChange={v => setAuto('emailNotify', v)}
            icon={<Mail className="h-4 w-4 text-muted-foreground" />}
          />
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
