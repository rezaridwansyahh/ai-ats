import { useMemo } from 'react';
import { ArrowLeft, ArrowRight, Briefcase, Calendar as CalendarIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Field, SelectBox } from './StepField';
import { parseLocalDate, formatLocalDate } from '../../hooks/use-job-edit';

const WORK_OPTIONS = ['On-site', 'Hybrid', 'Remote'];
const WORK_TYPES = ['Full-time', 'Part-time', 'Contract', 'Casual'];
const PAY_TYPES = ['Hourly', 'Monthly', 'Annually'];
const CURRENCIES = ['AUD', 'HKD', 'IDR', 'MYR', 'NZD', 'PHP', 'SGD', 'THB', 'USD'];
const PAY_DISPLAY_OPTIONS = ['Show', 'Hide'];
const SENIORITY_LEVELS = [
  'Internship', 'Entry Level', 'Associate', 'Mid-Senior Level', 'Director', 'Executive',
];

export default function BasicsStep({ form, setField, isLocked, missingRequired, invalidUrlFields, showValidation, step = 0, totalSteps = 5, onStepChange }) {
  const isMissing = (k) => showValidation && missingRequired.includes(k);

  // Live salary band preview shown beneath the pay fields.
  const salaryPreview = useMemo(() => {
    const min = form.pay_min;
    const max = form.pay_max;
    if (!min && !max) return null;
    if (form.pay_display === 'Hide') return 'Hidden from candidates';
    const fmt = (n) => {
      if (n == null || n === '') return '';
      if (form.currency === 'IDR') return `Rp ${Number(n).toLocaleString('id-ID')}`;
      return `${form.currency || ''} ${Number(n).toLocaleString()}`.trim();
    };
    const unit = form.pay_type === 'Hourly' ? '/hour'
              : form.pay_type === 'Monthly' ? '/month'
              : form.pay_type === 'Annually' ? '/year' : '';
    if (min && max) return `${fmt(min)} – ${fmt(max)}${unit}`;
    return `${fmt(min || max)}${unit}`;
  }, [form.pay_min, form.pay_max, form.currency, form.pay_type, form.pay_display]);

  // Target hiring window length, in days (inclusive).
  const slaDuration = useMemo(() => {
    if (!form.sla_start_date || !form.sla_end_date) return null;
    const days = Math.round(
      (parseLocalDate(form.sla_end_date) - parseLocalDate(form.sla_start_date)) / 86400000
    ) + 1;
    return days > 0 ? days : null;
  }, [form.sla_start_date, form.sla_end_date]);

  return (
    <Card data-wizard="basics-card" className="py-4 gap-3">
      <CardHeader className="flex flex-row items-center gap-2 pb-2">
        <Button
          variant="ghost" size="icon"
          className="h-7 w-7 shrink-0"
          disabled={step === 0}
          onClick={() => onStepChange?.(Math.max(0, step - 1))}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <CardTitle className="text-sm flex items-center gap-2 flex-1 justify-center">
          <Briefcase className="h-4 w-4 text-primary" /> Basics
        </CardTitle>
        <Button
          variant="ghost" size="icon"
          className="h-7 w-7 shrink-0"
          disabled={step === totalSteps - 1}
          onClick={() => onStepChange?.(Math.min(totalSteps - 1, step + 1))}
        >
          <ArrowRight className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* ── Identity ── */}
        <Field
          label="Job title"
          help="The role's official posting title."
          required missing={isMissing('job_title')}
        >
          <Input
            data-wizard="job-title"
            value={form.job_title || ''}
            onChange={(e) => setField('job_title', e.target.value)}
            disabled={isLocked('job_title')}
            placeholder="e.g. Senior Frontend Engineer"
            className="text-sm"
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Company" help="Legal entity name." required missing={isMissing('company')}>
            <Input
              value={form.company || ''}
              onChange={(e) => setField('company', e.target.value)}
              disabled={isLocked('company')}
              placeholder="e.g. PT Cahaya Nusantara"
              className="text-sm"
            />
          </Field>
          <Field
            label="Company URL"
            help="Where candidates can learn more."
            required
            missing={isMissing('company_url') || invalidUrlFields.includes('company_url')}
            missingMessage={isMissing('company_url') ? 'required' : 'must be a valid URL (e.g. https://example.com)'}
          >
            <Input
              type="url"
              value={form.company_url || ''}
              onChange={(e) => setField('company_url', e.target.value)}
              disabled={isLocked('company_url')}
              placeholder="https://your-company.com"
              className="text-sm"
            />
          </Field>
        </div>

        {/* ── Location (left) + engagement (right) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Field label="Location" help="City + country (or hybrid base)." required missing={isMissing('job_location')}>
            <Input
              value={form.job_location || ''}
              onChange={(e) => setField('job_location', e.target.value)}
              disabled={isLocked('job_location')}
              placeholder="e.g. Jakarta, Indonesia"
              className="text-sm"
            />
          </Field>
          <div className="grid grid-cols-3 gap-2">
            <Field label="Work option" required missing={isMissing('work_option')}>
              <SelectBox value={form.work_option || ''} onChange={(v) => setField('work_option', v)} options={WORK_OPTIONS} disabled={isLocked('work_option')} />
            </Field>
            <Field label="Work type" required missing={isMissing('work_type')}>
              <SelectBox value={form.work_type || ''} onChange={(v) => setField('work_type', v)} options={WORK_TYPES} disabled={isLocked('work_type')} />
            </Field>
            <Field label="Seniority" required missing={isMissing('seniority_level')}>
              <SelectBox value={form.seniority_level || ''} onChange={(v) => setField('seniority_level', v)} options={SENIORITY_LEVELS} disabled={isLocked('seniority_level')} />
            </Field>
          </div>
        </div>

        {/* ── Compensation (left) + hiring timeline (right) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2 border-t">
          {/* Compensation */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Compensation
              </p>
              {salaryPreview && (
                <span className="text-[11px] font-mono text-muted-foreground">
                  {salaryPreview}
                </span>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Field label="Pay type" required missing={isMissing('pay_type')}>
                <SelectBox
                  value={form.pay_type || ''}
                  onChange={(v) => setField('pay_type', v)}
                  options={PAY_TYPES}
                  disabled={isLocked('pay_type')}
                />
              </Field>
              <Field label="Currency" required missing={isMissing('currency')}>
                <SelectBox
                  value={form.currency || ''}
                  onChange={(v) => setField('currency', v)}
                  options={CURRENCIES}
                  disabled={isLocked('currency')}
                />
              </Field>
              <Field label="Show salary?" required missing={isMissing('pay_display')}>
                <SelectBox value={form.pay_display || ''} onChange={(v) => setField('pay_display', v)} options={PAY_DISPLAY_OPTIONS} disabled={isLocked('pay_display')} />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-3">
              <Field label="Pay min" required missing={isMissing('pay_min')}>
                <Input
                  type="number"
                  value={form.pay_min ?? ''}
                  onChange={(e) => setField('pay_min', e.target.value === '' ? '' : Number(e.target.value))}
                  disabled={isLocked('pay_min')}
                  className="text-sm font-mono"
                  placeholder="0"
                />
              </Field>
              <Field label="Pay max" required missing={isMissing('pay_max')}>
                <Input
                  type="number"
                  value={form.pay_max ?? ''}
                  onChange={(e) => setField('pay_max', e.target.value === '' ? '' : Number(e.target.value))}
                  disabled={isLocked('pay_max')}
                  className="text-sm font-mono"
                  placeholder="0"
                />
              </Field>
            </div>
          </div>

          {/* Hiring timeline (SLA) */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Hiring timeline
              </p>
              {slaDuration && (
                <span className="text-[11px] font-mono text-muted-foreground">
                  {slaDuration} day{slaDuration > 1 ? 's' : ''} target
                </span>
              )}
            </div>

            <Popover>
            <PopoverTrigger asChild disabled={isLocked('sla_start_date')}>
              <div
                role="button"
                tabIndex={isLocked('sla_start_date') ? -1 : 0}
                className={`grid grid-cols-2 rounded-md border border-input bg-background transition-colors focus:outline-none focus:ring-1 focus:ring-ring ${
                  isLocked('sla_start_date') ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'cursor-pointer hover:bg-muted/30'
                }`}
              >
                <div className="flex flex-col gap-1 p-3 border-r">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Start date</span>
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className={`text-sm ${form.sla_start_date ? 'font-medium' : 'text-muted-foreground'}`}>
                      {form.sla_start_date || 'Pick start date'}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-1 p-3">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">End date</span>
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className={`text-sm ${form.sla_end_date ? 'font-medium' : 'text-muted-foreground'}`}>
                      {form.sla_end_date || 'Pick end date'}
                    </span>
                  </div>
                </div>
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="range"
                selected={{
                  from: form.sla_start_date ? parseLocalDate(form.sla_start_date) : undefined,
                  to: form.sla_end_date ? parseLocalDate(form.sla_end_date) : undefined,
                }}
                onSelect={(range) => {
                  setField('sla_start_date', range?.from ? formatLocalDate(range.from) : '');
                  setField('sla_end_date', range?.to ? formatLocalDate(range.to) : '');
                }}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
            <p className="text-[10px] text-muted-foreground mt-1 leading-snug">
              Optional — the target window to fill this role. A job's age is counted from the start date.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
