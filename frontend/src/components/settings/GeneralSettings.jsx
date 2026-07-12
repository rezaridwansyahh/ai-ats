import { useState, useEffect } from 'react';
import { Loader2, AlertTriangle, Check, Pencil, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { getCompanyById, updateCompany } from '@/api/company.api';

/*
 * General settings — Organization section.
 *
 * Only 3 fields are real, backed by core_company: name, website, email.
 * The mockup's Legal Entity, Industry, entire Locale & Regional section,
 * and entire Workspace Defaults section have no backend support — confirmed
 * against company.model.js (only name/description/email/website/logo_url
 * exist) and automation-setting (scoped per-job, not per-workspace).
 * Not rendering those here rather than showing dead "Edit" buttons.
 */
export default function GeneralSettings() {
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  // Which field is currently being edited inline — null means none.
  const [editingField, setEditingField] = useState(null);
  const [draftValue, setDraftValue]     = useState('');
  const [saving, setSaving]             = useState(false);
  const [saveError, setSaveError]       = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const storage = JSON.parse(localStorage.getItem('user'));
      const res = await getCompanyById(storage.company_id);
      setCompany(res.data.company || null);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load company');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const startEdit = (field) => {
    setEditingField(field);
    setDraftValue(company?.[field] || '');
    setSaveError(null);
  };

  const cancelEdit = () => {
    setEditingField(null);
    setDraftValue('');
    setSaveError(null);
  };

  const saveEdit = async () => {
    if (!editingField || !company) return;
    setSaving(true);
    setSaveError(null);
    try {
      const res = await updateCompany(company.id, { [editingField]: draftValue });
      setCompany(res.data.company || { ...company, [editingField]: draftValue });
      setEditingField(null);
    } catch (err) {
      setSaveError(err.response?.data?.message || err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 rounded-lg border border-red-200 bg-red-50 text-sm text-red-600">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <span>{error || 'Company not found'}</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold tracking-tight">General</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Workspace configuration · team access · roles · workflows · compliance · billing.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Organization</CardTitle>
          <p className="text-xs text-muted-foreground">Company profile used on job posts and candidate communication.</p>
        </CardHeader>
        <CardContent className="space-y-0 divide-y">
          <SettingRow
            label="Company Name"
            field="name"
            value={company.name}
            editing={editingField === 'name'}
            draftValue={draftValue}
            setDraftValue={setDraftValue}
            onEdit={() => startEdit('name')}
            onSave={saveEdit}
            onCancel={cancelEdit}
            saving={saving}
          />
          <SettingRow
            label="Website"
            field="website"
            value={company.website}
            editing={editingField === 'website'}
            draftValue={draftValue}
            setDraftValue={setDraftValue}
            onEdit={() => startEdit('website')}
            onSave={saveEdit}
            onCancel={cancelEdit}
            saving={saving}
          />
          <SettingRow
            label="Email"
            field="email"
            value={company.email}
            editing={editingField === 'email'}
            draftValue={draftValue}
            setDraftValue={setDraftValue}
            onEdit={() => startEdit('email')}
            onSave={saveEdit}
            onCancel={cancelEdit}
            saving={saving}
          />
        </CardContent>
      </Card>

      {saveError && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg border border-red-200 bg-red-50 text-sm text-red-600">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{saveError}</span>
        </div>
      )}

      {/*
        Not rendered — no backend support:
        - Legal Entity, Industry (not in core_company)
        - Locale & Regional (Timezone, Currency, Language, Date Format)
        - Workspace Defaults toggles (pipeline stages, rubric requirement,
          AI screening default, public job pages) — automation-setting is
          scoped per-job (getAutomationSetting(jobId)), not per-workspace,
          so it can't back workspace-level defaults either.
        Ask backend to add these fields/toggles if this section needs to
        match the mockup in full.
      */}
    </div>
  );
}

function SettingRow({ label, value, editing, draftValue, setDraftValue, onEdit, onSave, onCancel, saving }) {
  return (
    <div className="py-3 flex items-center justify-between gap-4">
      <div className="min-w-0 flex-1">
        <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>
        {editing ? (
          <Input
            autoFocus
            value={draftValue}
            onChange={(e) => setDraftValue(e.target.value)}
            className="mt-1 h-8 text-sm max-w-sm"
            onKeyDown={(e) => { if (e.key === 'Enter') onSave(); if (e.key === 'Escape') onCancel(); }}
          />
        ) : (
          <div className="text-sm font-medium mt-0.5">{value || <span className="text-muted-foreground italic">Not set</span>}</div>
        )}
      </div>

      {editing ? (
        <div className="flex items-center gap-1 shrink-0">
          <Button size="sm" variant="ghost" className="h-7 px-2" onClick={onCancel} disabled={saving}>
            <X className="h-3.5 w-3.5" />
          </Button>
          <Button size="sm" className="h-7 px-2" onClick={onSave} disabled={saving}>
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
          </Button>
        </div>
      ) : (
        <Button size="sm" variant="ghost" className="h-7 text-xs shrink-0" onClick={onEdit}>
          <Pencil className="h-3 w-3 mr-1" /> Edit
        </Button>
      )}
    </div>
  );
}