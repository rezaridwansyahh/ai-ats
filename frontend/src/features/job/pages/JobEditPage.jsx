import { useNavigate, useParams } from 'react-router-dom';
import {
  Loader2, AlertTriangle, ArrowLeft, Check, Save, Send, ChevronUp,
  Briefcase, FileText, Workflow, Megaphone, ClipboardCheck,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import {
  useJobEdit, REQUIRED_BASICS, REQUIRED_JD, REQUIRED_BATTERY,
} from '../hooks/use-job-edit';

import BasicsStep from '../components/job-edit/BasicsStep';
import JDStep from '../components/job-edit/JDStep';
import PipelineStep from '../components/job-edit/PipelineStep';
import BatteryStep from '../components/job-edit/BatteryStep';
import PostingStep from '../components/job-edit/PostingStep';

import { StatusBadge } from '@/components/common';
import FirstJobWizard, { useFirstJobWizard, FirstJobWizardPrompt } from '@/components/tours/FirstJobWizard';

import { hasPermission } from '@/utils/permissions';

const SECTIONS = [
  { id: 'basics',   label: 'Basics',           icon: Briefcase },
  { id: 'jd',       label: 'Job description',  icon: FileText },
  { id: 'pipeline', label: 'Pipeline & AI',    icon: Workflow },
  { id: 'battery',  label: 'Assessment',       icon: ClipboardCheck },
  { id: 'posting',  label: 'Posting',          icon: Megaphone },
];

export default function JobEditPage() {
  const canCreate = hasPermission('Sourcing', 'Job Management', 'create');
  const canUpdate = hasPermission('Sourcing', 'Job Management', 'create');
  const navigate = useNavigate();
  const { id: idParam } = useParams();
  const creating = !idParam; // /new vs /:id/edit
  const canEditNow = creating ? canCreate : canUpdate;

  const {
    job, form, setField,
    loading, error,
    savedAt, saving, publishing,
    validationErrors,
    generating, generateError, handleGenerateAI,
    generatingSkills, generateSkillsError, handleGenerateSkillsAI,
    step, setStep,
    hasStages, setHasStages,
    isLocked,
    missingRequired, invalidUrlFields,
    handlePublish,
  } = useJobEdit(idParam, creating, canEditNow);

  const {
    run: wizardRun, setRun: setWizardRun, markSeen: markWizardSeen,
    showPrompt, accept: acceptWizard, decline: declineWizard,
  } = useFirstJobWizard();

  if (loading || !form) {
    if (error) {
      return (
        <div className="p-6">
          <div className="flex items-center gap-2 px-4 py-3 rounded-lg border border-red-200 bg-red-50 text-sm text-red-600">
            <AlertTriangle className="h-4 w-4" />
            {error}
          </div>
        </div>
      );
    }
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const titleText = creating
    ? 'New Job'
    : `Edit Job · ${form?.job_title || `#${idParam}`}`;
  const isPublished = job?.status && job.status !== 'Draft';

  const onStepChange = (s) => { setStep(s); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  const missingForSection = (sectionId) => {
    if (sectionId === 'basics')   return missingRequired.filter((k) => REQUIRED_BASICS.includes(k)).length;
    if (sectionId === 'jd')       return missingRequired.filter((k) => REQUIRED_JD.includes(k)).length;
    if (sectionId === 'pipeline') return hasStages ? 0 : 1;
    if (sectionId === 'battery')  return missingRequired.filter((k) => REQUIRED_BATTERY.includes(k)).length;
    return 0;
  };

  return (
    <>
      <div
        className="sticky z-10 bg-background/95 backdrop-blur-sm -mt-5 -mx-5 px-5 pt-5 pb-5 border-b border-border/60 space-y-3"
        style={{ top: 'var(--app-header-h)' }}
      >
        {/* Top action row */}
        <div className="flex items-center gap-3 flex-wrap">
          <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate('/sourcing/job-management')}>
            <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back to Jobs
          </Button>
        </div>

        {/* Title + lede */}
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <h1 className="text-xl font-bold tracking-tight">{titleText}</h1>
              {job?.status && (
                <StatusBadge
                  label={job.status}
                  variant={
                    job.status === 'Active'  ? 'success' :
                    job.status === 'Expired' ? 'danger'  :
                    job.status === 'Blocked' ? 'danger'  : 'muted'
                  }
                  dot
                />
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {creating
                ? 'Start with a job title — we auto-save the rest as you type.'
                : isPublished
                  ? <>Active job · most fields are locked. <span className="text-[11px]">Editable: JD, skills, channels, automation.</span></>
                  : 'Auto-saving as Draft. Click Publish job when all required fields are green.'}
            </p>
          </div>
        </div>
      </div>

      {showPrompt && (
        <div className="px-6 pt-4">
          <FirstJobWizardPrompt onAccept={acceptWizard} onDecline={declineWizard} />
        </div>
      )}

      <div className="px-6 pb-6 pt-4">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_240px] gap-6">
          {/* MAIN COLUMN — renders only the active step. */}
          <div className="space-y-4 min-w-0">
            {/* STEP 0 · BASICS */}
            {step === 0 && (
              <BasicsStep
                form={form}
                setField={setField}
                isLocked={isLocked}
                missingRequired={missingRequired}
                invalidUrlFields={invalidUrlFields}
                showValidation={validationErrors.length > 0}
                step={step}
                totalSteps={SECTIONS.length}
                onStepChange={onStepChange}
              />
            )}

            {/* STEP 1 · JD */}
            {step === 1 && (
              <JDStep
                form={form}
                setField={setField}
                isLocked={isLocked}
                missingRequired={missingRequired}
                showValidation={validationErrors.length > 0}
                onGenerateAI={handleGenerateAI}
                generating={generating}
                generateError={generateError}
                canGenerate={!!job?.id}
                onGenerateSkillsAI={handleGenerateSkillsAI}
                generatingSkills={generatingSkills}
                generateSkillsError={generateSkillsError}
                canGenerateSkills={!!(form.job_desc?.trim() || form.qualifications?.trim())}
                step={step}
                totalSteps={SECTIONS.length}
                onStepChange={onStepChange}
              />
            )}

            {/* STEP 2 · PIPELINE & AI */}
            {step === 2 && (
              <PipelineStep
                job={job}
                step={step}
                totalSteps={SECTIONS.length}
                onStepChange={onStepChange}
                onHasStagesChange={setHasStages}
              />
            )}

            {/* STEP 3 · ASSESSMENT BATTERY */}
            {step === 3 && (
              <BatteryStep
                form={form}
                setField={setField}
                isLocked={isLocked}
                missingRequired={missingRequired}
                showValidation={validationErrors.length > 0}
                step={step}
                totalSteps={SECTIONS.length}
                onStepChange={onStepChange}
              />
            )}

            {/* STEP 4 · POSTING */}
            {step === 4 && (
              <PostingStep
                job={job}
                step={step}
                totalSteps={SECTIONS.length}
                onStepChange={onStepChange}
              />
            )}

            {/* STEP PAGINATION */}
            <div className="border-t border-border/60 pt-4 space-y-2">
              <div className="flex items-center justify-center gap-2.5">
                {SECTIONS.map((s, i) => {
                  const active = step === i;
                  const missing = missingForSection(s.id);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      title={s.label}
                      onClick={() => onStepChange(i)}
                      className={`h-8 w-8 rounded-md text-xs font-semibold flex items-center justify-center transition-colors ${
                        active
                          ? 'bg-primary text-primary-foreground'
                          : missing > 0
                            ? 'border border-amber-300 text-amber-700 hover:bg-amber-50'
                            : 'border border-border text-muted-foreground hover:bg-muted/60'
                      }`}
                    >
                      {i + 1}
                    </button>
                  );
                })}
              </div>

              {/* Caption */}
              <p className="text-center text-[11px] text-muted-foreground">
                Step {step + 1} of {SECTIONS.length} · {SECTIONS[step].label}
              </p>
            </div>
          </div>

          {/* SIDEBAR — anchor nav + completeness. */}
          <aside className="hidden lg:block">
            <div
              className="sticky space-y-3"
              style={{ top: 'calc(var(--app-header-h) + 1rem)' }}
            >
              {/* Save status (left) + publish (right) — moved out of the sticky header */}
              <div className="flex items-center justify-between gap-2 px-1">
                <SavedIndicator saving={saving} savedAt={savedAt} error={error} />
                {!isPublished ? (
                  <Button
                    data-wizard="publish-btn"
                    size="sm"
                    className="text-xs"
                    onClick={handlePublish}
                    disabled={publishing || !job?.id || !canEditNow}
                    title={!canEditNow ? 'You do not have permission to publish this job.' : !job?.id ? 'Fill Basics to start (auto-creates draft)' : ''}
                  >
                    {publishing ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Send className="h-3.5 w-3.5 mr-1.5" />}
                    Publish job
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs"
                    onClick={() => navigate(`/sourcing/job-management/${job.id}`)}
                  >
                    View detail
                  </Button>
                )}
              </div>

              <Card>
                <CardContent className="p-3 space-y-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
                    Steps
                  </p>
                  {SECTIONS.map((s, i) => {
                    const Icon = s.icon;
                    const active = step === i;
                    const missing = missingForSection(s.id);
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => onStepChange(i)}
                        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-left transition-colors ${
                          active
                            ? 'bg-primary/10 text-primary font-medium'
                            : 'hover:bg-muted/50 text-foreground'
                        }`}
                      >
                        <span className={`flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-semibold ${
                          active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                        }`}>
                          {i + 1}
                        </span>
                        <Icon className={`h-3 w-3 ${active ? 'text-primary' : 'text-muted-foreground'}`} />
                        <span className="flex-1 truncate">{s.label}</span>
                        {missing > 0 && (
                          <Badge variant="outline" className="text-[9px] border-amber-200 text-amber-700">
                            {missing}
                          </Badge>
                        )}
                      </button>
                    );
                  })}
                </CardContent>
              </Card>

              <CompletenessCard
                missing={missingRequired.length + invalidUrlFields.length + (hasStages ? 0 : 1)}
                total={REQUIRED_BASICS.length + REQUIRED_JD.length + REQUIRED_BATTERY.length + 1}
              />

              {isPublished && (
                <Card>
                  <CardContent className="p-3">
                    <Badge variant="outline" className="text-[10px] border-emerald-200 text-emerald-700">
                      {job.status}
                    </Badge>
                    <p className="text-[10px] text-muted-foreground mt-2 leading-relaxed">
                      Compensation, core identity, and assessment battery are locked. Pause the job to unlock them.
                    </p>
                  </CardContent>
                </Card>
              )}

              <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1 px-2"
              >
                <ChevronUp className="h-3 w-3" /> Back to top
              </button>
            </div>
          </aside>
        </div>
      </div>

      <FirstJobWizard
        form={form}
        job={job}
        hasStages={hasStages}
        isPublished={isPublished}
        missingRequiredBasics={missingRequired.filter((k) => REQUIRED_BASICS.includes(k))}
        missingRequiredJD={missingRequired.filter((k) => REQUIRED_JD.includes(k))}
        invalidUrlFields={invalidUrlFields}
        setStep={setStep}
        run={wizardRun}
        setRun={setWizardRun}
        markSeen={markWizardSeen}
      />
    </>
  );
}

function SavedIndicator({ saving, savedAt, error }) {
  if (error) {
    return (
      <span className="text-[11px] text-rose-600 flex items-center gap-1">
        <AlertTriangle className="h-3 w-3" /> Save failed
      </span>
    );
  }
  if (saving) {
    return (
      <span className="text-[11px] text-muted-foreground flex items-center gap-1">
        <Loader2 className="h-3 w-3 animate-spin" /> Saving…
      </span>
    );
  }
  if (savedAt) {
    return (
      <span className="text-[11px] text-muted-foreground flex items-center gap-1">
        <Check className="h-3 w-3 text-emerald-600" />
        Saved {timeAgo(savedAt)}
      </span>
    );
  }
  return <span className="text-[11px] text-muted-foreground"><Save className="inline h-3 w-3 mr-1" />Auto-save on</span>;
}

function CompletenessCard({ missing, total }) {
  const filled = total - missing;
  const pct = total === 0 ? 100 : Math.round((filled / total) * 100);
  const ok = missing === 0;
  return (
    <Card>
      <CardContent className="p-3">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
          Required fields
        </p>
        <div className="flex items-baseline gap-1 mb-1.5">
          <span className={`text-lg font-bold font-mono ${ok ? 'text-emerald-600' : 'text-amber-600'}`}>
            {filled}/{total}
          </span>
          <span className="text-[10px] text-muted-foreground">{pct}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full ${ok ? 'bg-emerald-500' : 'bg-amber-500'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        {!ok && (
          <p className="text-[10px] text-muted-foreground mt-2 leading-relaxed">
            Fill required fields to enable Publish.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function timeAgo(date) {
  const sec = Math.floor((Date.now() - date.getTime()) / 1000);
  if (sec < 5) return 'just now';
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  return date.toLocaleTimeString();
}
