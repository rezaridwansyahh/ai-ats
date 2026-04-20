import { useState, useEffect } from 'react';
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
  account_id: '',
  job_title: '',
  location: '',
  skill: '',
  company: '',
  school: '',
  year_graduate: '',
  industry: '',
  keyword: '',
};

export default function SearchForm({ onSearchStart, loading, error }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [accounts, setAccounts] = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [fieldError, setFieldError] = useState(null);

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    (async () => {
      setLoadingAccounts(true);
      try {
        const { data } = await getJobAccountsByUserId(user.id);
        const linkedinAccounts = (data.accounts || []).filter(a => a.portal_name === 'linkedin');
        setAccounts(linkedinAccounts);
      } catch {
        setAccounts([]);
      } finally {
        setLoadingAccounts(false);
      }
    })();
  }, [user.id]);

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
      setFieldError('Please select a LinkedIn account');
      return;
    }
    if (!hasAtLeastOne()) {
      setFieldError('Please fill at least one search field');
      return;
    }
    const payload = {
      account_id: Number(form.account_id),
      ...(form.job_title     && { job_title: form.job_title.trim() }),
      ...(form.location      && { location: form.location.trim() }),
      ...(form.skill         && { skill: form.skill.trim() }),
      ...(form.company       && { company: form.company.trim() }),
      ...(form.school        && { school: form.school.trim() }),
      ...(form.year_graduate && { year_graduate: Number(form.year_graduate) }),
      ...(form.industry      && { industry: form.industry.trim() }),
      ...(form.keyword       && { keyword: form.keyword.trim() }),
    };
    onSearchStart(payload);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Search Parameters</CardTitle>
        <p className="text-xs text-muted-foreground">
          Fill at least one field below. LinkedIn Recruiter will be searched with your criteria.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Account selector */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-[11px] text-muted-foreground font-semibold">
              LinkedIn Account <span className="text-red-500">*</span>
            </Label>
            <Select
              value={form.account_id}
              onValueChange={v => updateField('account_id', v)}
              disabled={loadingAccounts || accounts.length === 0}
            >
              <SelectTrigger className="text-xs">
                <SelectValue placeholder={
                  loadingAccounts ? 'Loading accounts...' :
                  accounts.length === 0 ? 'No LinkedIn accounts connected' :
                  'Select a LinkedIn account'
                } />
              </SelectTrigger>
              <SelectContent>
                {accounts.map(acc => (
                  <SelectItem key={acc.id} value={String(acc.id)}>
                    {acc.email} — {acc.status_connection || 'Unknown'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Search fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <FormField label="Job Title"  value={form.job_title}     onChange={v => updateField('job_title', v)}    placeholder="e.g. Software Engineer" />
            <FormField label="Location"    value={form.location}      onChange={v => updateField('location', v)}     placeholder="e.g. Jakarta" />
            <FormField label="Skill"       value={form.skill}         onChange={v => updateField('skill', v)}        placeholder="e.g. React, Node.js" />
            <FormField label="Company"     value={form.company}       onChange={v => updateField('company', v)}      placeholder="e.g. Google" />
            <FormField label="School"      value={form.school}        onChange={v => updateField('school', v)}       placeholder="e.g. MIT" />
            <FormField label="Year Graduate" value={form.year_graduate} onChange={v => updateField('year_graduate', v)} type="number" placeholder="e.g. 2023" />
            <FormField label="Industry"    value={form.industry}      onChange={v => updateField('industry', v)}     placeholder="e.g. Software" />
            <FormField label="Keyword"     value={form.keyword}       onChange={v => updateField('keyword', v)}      placeholder="e.g. machine learning" />
          </div>

          {/* Field error */}
          {fieldError && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-amber-200 bg-amber-50 text-xs text-amber-700">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              <span>{fieldError}</span>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-red-200 bg-red-50 text-xs text-red-600">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit */}
          <div className="flex justify-end">
            <Button type="submit" size="sm" className="text-xs" disabled={loading || accounts.length === 0}>
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
