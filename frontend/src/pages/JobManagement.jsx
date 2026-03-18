import { useState } from 'react';
import {
  Briefcase, FileText, Send, Users, GitBranch, Check,
  Plus, Star, X, ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

// Field options matching backend ENUMs (setup.sql)
const WORK_OPTIONS = ['On-site', 'Hybrid', 'Remote'];
const WORK_TYPES = ['Full-time', 'Part-time', 'Contract', 'Casual'];
const PAY_TYPES = ['Hourly', 'Monthly', 'Annually'];
const CURRENCIES = ['AUD', 'HKD', 'IDR', 'MYR', 'NZD', 'PHP', 'SGD', 'THB', 'USD'];
const PAY_DISPLAY_OPTIONS = ['Show', 'Hide'];
const SENIORITY_LEVELS = ['Internship', 'Entry Level', 'Associate', 'Mid-Senior Level', 'Director', 'Executive'];
const STATUS_OPTIONS = ['Draft', 'Active', 'Running', 'Expired', 'Failed', 'Blocked'];

const STEPS = [
  { key: 'creation', label: 'Job Creation', icon: FileText },
  { key: 'stages', label: 'Job Stages', icon: GitBranch },
  { key: 'posting', label: 'Job Posting', icon: Send },
  { key: 'sourcing', label: 'Job Sourcing', icon: Users },
  { key: 'pipeline', label: 'Applicant Pipeline', icon: Briefcase },
];

// ── Step Components ─────────────────────────────────────────────────

function StepPlaceholder({ title, stepNum }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
        <span className="text-2xl font-bold text-primary">{stepNum}</span>
      </div>
      <h3 className="text-lg font-bold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-md">
        This step will be available once Job Creation is configured. Content coming soon.
      </p>
    </div>
  );
}

function JobCreationStep() {
  const [requiredSkills] = useState([
    { name: 'React', weight: 5 },
    { name: 'TypeScript', weight: 4 },
    { name: 'Node.js', weight: 3 },
  ]);
  const [preferredSkills] = useState([
    { name: 'GraphQL', weight: 2 },
    { name: 'Docker', weight: 2 },
  ]);

  const renderStars = (weight) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star key={i} className={`h-3 w-3 ${i < weight ? 'text-amber-500 fill-amber-500' : 'text-muted-foreground/30'}`} />
    ));
  };

  return (
    <div className="space-y-5">
      {/* Step Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-base font-bold">Job Creation</h3>
          <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md">
            <Check className="h-3 w-3" /> Draft saved 2 min ago
          </span>
        </div>
        <span className="text-xs font-bold text-muted-foreground tracking-widest">Step 1</span>
      </div>

      {/* Job Information — unified Seek + LinkedIn fields from core_job */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Job Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Job Title */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-[11px] text-muted-foreground font-semibold">Job Title *</Label>
            <Input placeholder="e.g. Senior Frontend Developer" />
          </div>

          {/* Location + Work Option */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label className="text-[11px] text-muted-foreground font-semibold">Location</Label>
              <Input placeholder="e.g. Jakarta" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-[11px] text-muted-foreground font-semibold">Work Option</Label>
              <Select>
                <SelectTrigger className="w-full"><SelectValue placeholder="Select work option" /></SelectTrigger>
                <SelectContent>
                  {WORK_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Work Type + Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label className="text-[11px] text-muted-foreground font-semibold">Work Type</Label>
              <Select>
                <SelectTrigger className="w-full"><SelectValue placeholder="Select work type" /></SelectTrigger>
                <SelectContent>
                  {WORK_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-[11px] text-muted-foreground font-semibold">Status</Label>
              <Select defaultValue="Draft">
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Job Description */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-[11px] text-muted-foreground font-semibold">Job Description</Label>
            <Textarea className="min-h-[100px] text-xs" placeholder="Enter job description..." />
          </div>

          {/* ── Compensation (Seek fields) ── */}
          <div className="border rounded-lg p-4 bg-muted/20 space-y-4">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
              Compensation
              <Badge variant="secondary" className="text-[9px] bg-emerald-50 text-emerald-600">SEEK</Badge>
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label className="text-[11px] text-muted-foreground font-semibold">Currency</Label>
                <Select>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Select currency" /></SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-[11px] text-muted-foreground font-semibold">Pay Type</Label>
                <Select>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Select pay type" /></SelectTrigger>
                  <SelectContent>
                    {PAY_TYPES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label className="text-[11px] text-muted-foreground font-semibold">Pay Min</Label>
                <Input type="number" placeholder="e.g. 8000000" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-[11px] text-muted-foreground font-semibold">Pay Max</Label>
                <Input type="number" placeholder="e.g. 15000000" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-[11px] text-muted-foreground font-semibold">Display on Ad</Label>
                <Select>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Show / Hide" /></SelectTrigger>
                  <SelectContent>
                    {PAY_DISPLAY_OPTIONS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* ── LinkedIn Details ── */}
          <div className="border rounded-lg p-4 bg-muted/20 space-y-4">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
              LinkedIn Details
              <Badge variant="secondary" className="text-[9px] bg-blue-50 text-blue-600">LINKEDIN</Badge>
            </p>

            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label className="text-[11px] text-muted-foreground font-semibold">Company</Label>
                <Input placeholder="e.g. Acme Corp" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-[11px] text-muted-foreground font-semibold">Seniority Level</Label>
                <Select>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Select level" /></SelectTrigger>
                  <SelectContent>
                    {SENIORITY_LEVELS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-[11px] text-muted-foreground font-semibold">Company URL</Label>
                <Input placeholder="e.g. https://linkedin.com/company/..." />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Skills & Qualifications */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Skills & Qualifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Qualifications */}
          <div>
            <Label className="text-[11px] text-muted-foreground font-semibold mb-1.5 block">Qualifications</Label>
            <Textarea className="min-h-[70px] text-xs" placeholder="Enter qualifications..." />
          </div>

          {/* Required Skills */}
          <div>
            <Label className="text-[11px] text-muted-foreground font-semibold mb-1.5 block">
              Required Skills <Badge variant="secondary" className="text-[9px] bg-primary/10 text-primary ml-1">WITH WEIGHT</Badge>
            </Label>
            <div className="flex flex-col gap-1.5 p-2 border rounded-lg bg-muted/30">
              {requiredSkills.map(skill => (
                <div key={skill.name} className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold min-w-[75px]">{skill.name}</span>
                  <div className="flex gap-0.5">{renderStars(skill.weight)}</div>
                  <Badge variant="secondary" className={`text-[9px] ${skill.weight >= 4 ? 'bg-primary/10 text-primary' : 'bg-amber-50 text-amber-600'}`}>
                    {skill.weight}/5
                  </Badge>
                  <button className="ml-auto text-muted-foreground hover:text-red-500"><X className="h-3 w-3" /></button>
                </div>
              ))}
              <input className="border-none outline-none text-[10px] bg-transparent px-0 py-1" placeholder="+ Add skill (weights pre-populate AI Matching)" />
            </div>
          </div>

          {/* Preferred Skills */}
          <div>
            <Label className="text-[11px] text-muted-foreground font-semibold mb-1.5 block">Preferred Skills</Label>
            <div className="flex flex-col gap-1.5 p-2 border rounded-lg bg-muted/30">
              {preferredSkills.map(skill => (
                <div key={skill.name} className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold min-w-[75px]">{skill.name}</span>
                  <div className="flex gap-0.5">{renderStars(skill.weight)}</div>
                  <Badge variant="secondary" className="text-[9px] bg-muted text-muted-foreground border">{skill.weight}/5</Badge>
                  <button className="ml-auto text-muted-foreground hover:text-red-500"><X className="h-3 w-3" /></button>
                </div>
              ))}
              <input className="border-none outline-none text-[10px] bg-transparent px-0 py-1" placeholder="+ Add preferred skill" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-end pt-2 border-t">
        <Button>Next <ChevronRight className="h-4 w-4 ml-1" /></Button>
      </div>
    </div>
  );
}

// ── Main Page Component ─────────────────────────────────────────────

export default function JobManagementPage() {
  const [activeStep, setActiveStep] = useState(0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold tracking-tight">Job Management</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            End-to-end job lifecycle — create, configure stages, publish, source, and manage applicants
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-1.5" /> Create New Job
        </Button>
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-center gap-0 py-3 border-b">
        {STEPS.map((step, i) => (
          <div key={step.key} className="flex items-center">
            <button
              onClick={() => setActiveStep(i)}
              className={`flex items-center gap-2 px-1 py-1 transition-all ${
                i === activeStep ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                i < activeStep
                  ? 'bg-primary text-white'
                  : i === activeStep
                    ? 'bg-primary text-white'
                    : 'bg-muted text-muted-foreground'
              }`}>
                {i < activeStep ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </div>
              <span className={`text-[11px] font-bold transition-colors ${
                i === activeStep ? 'text-primary' : 'text-muted-foreground'
              }`}>{step.label}</span>
            </button>
            {i < STEPS.length - 1 && (
              <div className={`w-7 h-0.5 mx-1 ${i < activeStep ? 'bg-primary' : 'bg-muted'}`} />
            )}
          </div>
        ))}
      </div>
      <p className="text-center text-[9px] text-muted-foreground italic -mt-4">
        Progress indicator — navigate using the tabs below
      </p>

      {/* Tab Navigation */}
      <div className="flex border-b -mt-2">
        {STEPS.map((step, i) => (
          <button
            key={step.key}
            onClick={() => setActiveStep(i)}
            className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all -mb-px ${
              i === activeStep
                ? 'text-primary border-primary'
                : 'text-muted-foreground border-transparent hover:text-foreground hover:bg-accent/50'
            }`}
          >
            {step.label}
          </button>
        ))}
      </div>

      {/* Step Content */}
      {activeStep === 0 && <JobCreationStep />}
      {activeStep === 1 && <StepPlaceholder title="Job Stages" stepNum={2} />}
      {activeStep === 2 && <StepPlaceholder title="Job Posting" stepNum={3} />}
      {activeStep === 3 && <StepPlaceholder title="Job Sourcing" stepNum={4} />}
      {activeStep === 4 && <StepPlaceholder title="Applicant Pipeline" stepNum={5} />}
    </div>
  );
}
