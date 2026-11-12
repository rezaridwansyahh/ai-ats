import { AlertTriangle, ArrowLeft, ArrowRight, FileText, Loader2, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { SkillChips } from '@/components/shared/SkillChips';
import { Field } from './StepField';

export default function JDStep({
  form, setField, isLocked, missingRequired, showValidation,
  onGenerateAI, generating, generateError, canGenerate,
  onGenerateSkillsAI, generatingSkills, generateSkillsError, canGenerateSkills,
  step = 1, totalSteps = 5, onStepChange,
}) {
  const isMissing = (k) => showValidation && missingRequired.includes(k);

  const onSkillInput = (k) => (e) => {
    if (e.key !== 'Enter') return;
    const v = e.target.value.trim();
    if (!v) return;
    e.preventDefault();
    const cur = Array.isArray(form[k]) ? form[k] : [];
    if (cur.includes(v)) { e.target.value = ''; return; }
    setField(k, [...cur, v]);
    e.target.value = '';
  };

  const removeSkill = (k, idx) => {
    setField(k, (form[k] || []).filter((_, i) => i !== idx));
  };

  return (
    <Card data-wizard="jd-card" className="py-4 gap-3">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost" size="icon"
            className="h-7 w-7 shrink-0"
            disabled={step === 0}
            onClick={() => onStepChange?.(Math.max(0, step - 1))}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center justify-between gap-3 flex-wrap flex-1">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" /> Job description
            </CardTitle>
            <Button
              size="sm"
              variant="outline"
              className="text-xs"
              onClick={onGenerateAI}
              disabled={!canGenerate || generating || isLocked('job_desc')}
              title={isLocked('job_desc') ? 'You do not have permission to edit this job.' : !canGenerate ? 'Save the draft first by filling the job title in Basics.' : ''}
            >
              {generating ? (
                <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Generating…</>
              ) : (
                <><Sparkles className="h-3.5 w-3.5 mr-1.5 text-primary" /> AI Generate</>
              )}
            </Button>
          </div>
          <Button
            variant="ghost" size="icon"
            className="h-7 w-7 shrink-0"
            disabled={step === totalSteps - 1}
            onClick={() => onStepChange?.(Math.min(totalSteps - 1, step + 1))}
          >
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {generateError && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-md border border-red-200 bg-red-50 text-xs text-red-600">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            {generateError}
          </div>
        )}
        <Field label="Summary" required missing={isMissing('job_desc')}>
          <Textarea
            value={form.job_desc || ''}
            onChange={(e) => setField('job_desc', e.target.value)}
            disabled={isLocked('job_desc')}
            placeholder="2–3 sentence overview of the role."
            rows={8}
            className="text-sm"
          />
        </Field>

        <Field label="Responsibilities & qualifications" required missing={isMissing('qualifications')}>
          <Textarea
            value={form.qualifications || ''}
            onChange={(e) => setField('qualifications', e.target.value)}
            disabled={isLocked('qualifications')}
            placeholder="Bullet points — what they'll do and what they need."
            rows={12}
            className="text-sm"
          />
        </Field>

        <div className="flex items-center justify-between gap-3">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Skills</div>
          <Button
            size="sm"
            variant="outline"
            className="text-xs"
            onClick={onGenerateSkillsAI}
            disabled={!canGenerateSkills || generatingSkills || isLocked('required_skills')}
            title={isLocked('required_skills') ? 'You do not have permission to edit this job.' : !canGenerateSkills ? 'Fill in the description or qualifications first.' : ''}
          >
            {generatingSkills ? (
              <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Generating…</>
            ) : (
              <><Sparkles className="h-3.5 w-3.5 mr-1.5 text-primary" /> AI Generate</>
            )}
          </Button>
        </div>
        {generateSkillsError && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-md border border-red-200 bg-red-50 text-xs text-red-600">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            {generateSkillsError}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Required skills" required missing={isMissing('required_skills')}>
            <SkillChips
              values={form.required_skills || []}
              onRemove={(i) => removeSkill('required_skills', i)}
              onAddKey={onSkillInput('required_skills')}
              placeholder="Type a skill, press Enter"
              tone="primary"
            />
          </Field>
          <Field label="Preferred skills">
            <SkillChips
              values={form.preferred_skills || []}
              onRemove={(i) => removeSkill('preferred_skills', i)}
              onAddKey={onSkillInput('preferred_skills')}
              placeholder="Type a skill, press Enter"
              tone="muted"
            />
          </Field>
        </div>
      </CardContent>
    </Card>
  );
}
