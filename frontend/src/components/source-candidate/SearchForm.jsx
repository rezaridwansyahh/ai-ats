import { useState, useEffect, useMemo } from 'react';
import { Loader2, Search, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { getJobAccountsByUserId } from '@/api/job-accounts.api';

const INITIAL_FORM = {
  account_id:    '',
  job_title:     '',
  location:      '',
  skill:         '',
  company:       '',
  school:        '',
  year_graduate: '',
  industry:      '',
  keyword:       '',
};

export default function SearchForm({ onSearchStart, loading, error }) {
  const [form, setForm]                 = useState(INITIAL_FORM);
  const [accounts, setAccounts]         = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [accountsError, setAccountsError]     = useState(false);
  const [fieldError, setFieldError]     = useState(null);

  // Parse once — not on every render
  const userId = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}')?.id;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    if (!userId) {
      setLoadingAccounts(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoadingAccounts(true);
      setAccountsError(false);
      try {
        const { data } = await getJobAccountsByUserId(userId);
        if (cancelled) return;
        const linkedinAccounts = (data.accounts || []).filter(
          a => a.portal_name === 'linkedin'
        );
        setAccounts(linkedinAccounts);
      } catch {
        if (cancelled) return;
        setAccountsError(true);
        setAccounts([]);
      } finally {
        if (!cancelled) setLoadingAccounts(false);
      }
    })();
    return () => { cancelled = true; };
  }, [userId]);

  const updateField = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setFieldError(null);
  };

  const hasAtLeastOne = () => {
    const { account_id, ...searchFields } = form;
    return Object.values(searchFields).some(v => v && String(v).trim().length > 0);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.account_id) {
      setFieldError('Please select a LinkedIn account.');
      return;
    }
    if (!hasAtLeastOne()) {
      setFieldError('Fill at least one search field before searching.');
      return;
    }
    const payload = {
      account_id: Number(form.account_id),
      ...(form.job_title     && { job_title:     form.job_title.trim() }),
      ...(form.location      && { location:      form.location.trim() }),
      ...(form.skill         && { skill:         form.skill.trim() }),
      ...(form.company       && { company:       form.company.trim() }),
      ...(form.school        && { school:        form.school.trim() }),
      ...(form.year_graduate && { year_graduate: Number(form.year_graduate) }),
      ...(form.industry      && { industry:      form.industry.trim() }),
      ...(form.keyword       && { keyword:       form.keyword.trim() }),
    };
    onSearchStart(payload);
  };

  // ── Derived account selector state ──────────────────────────────
  const accountPlaceholder = loadingAccounts
    ? 'Loading accounts...'
    : accountsError
      ? 'Failed to load accounts — check your connection'
      : accounts.length === 0
        ? 'No LinkedIn accounts connected'
        : 'Select a LinkedIn account';

  const accountSelectorDisabled =
    loadingAccounts || accountsError || accounts.length === 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Search Parameters</CardTitle>
        <p className="text-xs text-muted-foreground">
          Fill at least one field below. LinkedIn Recruiter will be searched with your criteria.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* LinkedIn account selector */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-[11px] text-muted-foreground font-semibold">
              LinkedIn Account <span className="text-red-500">*</span>
            </Label>
            <Select
              value={form.account_id}
              onValueChange={v => updateField('account_id', v)}
              disabled={accountSelectorDisabled}
            >
              <SelectTrigger className="text-xs w-[260px]">
                <SelectValue placeholder={accountPlaceholder} />
              </SelectTrigger>
              <SelectContent>
                {accounts.map(acc => (
                  <SelectItem key={acc.id} value={String(acc.id)}>
                    {acc.email} — {acc.status_connection || 'Unknown'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/* Accounts failed to load — tell the user why */}
            {accountsError && (
              <p className="text-[11px] text-red-500">
                Could not load LinkedIn accounts. Refresh the page or contact your admin.
              </p>
            )}
            {/* No accounts connected — guide them to fix it */}
            {!loadingAccounts && !accountsError && accounts.length === 0 && (
              <p className="text-[11px] text-muted-foreground">
                No LinkedIn accounts connected. Add one under Settings → Integrations.
              </p>
            )}
          </div>

          {/* Search fields — 2-column grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <FormField
              label="Job Title"
              value={form.job_title}
              onChange={v => updateField('job_title', v)}
              placeholder="e.g. Software Engineer"
            />
            <FormField
              label="Location"
              value={form.location}
              onChange={v => updateField('location', v)}
              placeholder="e.g. Jakarta"
            />
            <FormField
              label="Skill"
              value={form.skill}
              onChange={v => updateField('skill', v)}
              placeholder="e.g. React, Node.js"
            />
            <FormField
              label="Company"
              value={form.company}
              onChange={v => updateField('company', v)}
              placeholder="e.g. Google"
            />
            <FormField
              label="School"
              value={form.school}
              onChange={v => updateField('school', v)}
              placeholder="e.g. MIT"
            />
            <FormField
              label="Year Graduate"
              value={form.year_graduate}
              onChange={v => updateField('year_graduate', v)}
              placeholder="e.g. 2023"
              type="number"
            />
            <FormField
              label="Industry"
              value={form.industry}
              onChange={v => updateField('industry', v)}
              placeholder="e.g. Software"
            />
            <FormField
              label="Keyword"
              value={form.keyword}
              onChange={v => updateField('keyword', v)}
              placeholder="e.g. machine learning"
            />
          </div>

          {/* Validation error */}
          {fieldError && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-amber-200 bg-amber-50 text-xs text-amber-700">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              <span>{fieldError}</span>
            </div>
          )}

          {/* API error (passed from parent) */}
          {error && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-red-200 bg-red-50 text-xs text-red-600">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit */}
          <div className="flex justify-end pt-1">
            <Button
              type="submit"
              size="sm"
              className="text-xs"
              disabled={loading || accountSelectorDisabled}
            >
              {loading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                  Queuing...
                </>
              ) : (
                <>
                  <Search className="h-3.5 w-3.5 mr-1.5" />
                  Search LinkedIn
                </>
              )}
            </Button>
          </div>

        </form>
      </CardContent>
    </Card>
  );
}

// ── Reusable field ─────────────────────────────────────────────────
function FormField({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-[11px] text-muted-foreground font-semibold">{label}</Label>
      <Input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="text-xs"
      />
    </div>
  );
}