import { useState, useEffect, useCallback } from 'react';
import { Mail, Pencil, Loader2, XCircle, RefreshCw, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

import { getEmailTemplates, saveEmailTemplate } from '@/api/email-template.api';

const STAGE_LABELS = {
  2: 'Screening & Matching',
  4: 'Assessment',
  6: 'Offering & Contract',
};

const TEMPLATE_LABELS = {
  qa_invite: 'Follow-up Questions',
  invite: 'Assessment Invitation',
  offer: 'Offer Letter Email',
  contract: 'Contract Email',
};

const PLACEHOLDER_HINTS = ['{{CANDIDATE_NAME}}', '{{JOB_TITLE}}', '{{BATTERY}}', '{{LINK}}'];

// Preview substitutes sample data — no real candidate/link context exists
// here in Settings, unlike the per-candidate previews used when actually
// sending (e.g. screening.service.js's previewQa).
const SAMPLE_VARS = {
  CANDIDATE_NAME: 'John Doe',
  JOB_TITLE: 'Senior Software Engineer',
  BATTERY: 'A',
  LINK: 'https://app.example.com/portal/sample-link',
};

function interpolate(str) {
  let out = str || '';
  for (const [key, value] of Object.entries(SAMPLE_VARS)) {
    out = out.replaceAll(`{{${key}}}`, value);
  }
  return out;
}

export default function EmailTemplateSettings() {
  const [stages, setStages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [editing, setEditing] = useState(null); // { stage_type_id, template_key, is_customized }
  const [form, setForm] = useState({ subject: '', body: '' });
  const [submitting, setSubmitting] = useState(false);
  const [previewing, setPreviewing] = useState(null); // { subject, body } — already interpolated

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await getEmailTemplates();
      setStages(data || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load email templates');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const openEdit = (stage_type_id, tpl) => {
    setEditing({ stage_type_id, template_key: tpl.template_key, is_customized: tpl.is_customized });
    setForm({ subject: tpl.subject, body: tpl.body });
  };

  const closeEdit = () => {
    setEditing(null);
    setForm({ subject: '', body: '' });
  };

  const openPreview = ({ subject, body }) => {
    setPreviewing({ subject: interpolate(subject), body: interpolate(body) });
  };

  const handleSave = async () => {
    if (!editing) return;
    if (!form.subject.trim() || !form.body.trim()) {
      toast.error('Subject and body are required');
      return;
    }
    setSubmitting(true);
    try {
      await saveEmailTemplate(editing.stage_type_id, editing.template_key, {
        subject: form.subject.trim(),
        body: form.body,
      });
      toast.success('Email template saved');
      closeEdit();
      await fetchTemplates();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to save email template');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold tracking-tight">Email Templates</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Subject and body used for every candidate-facing email
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchTemplates} disabled={loading}>
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {error ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-16 text-destructive">
            <XCircle className="h-8 w-8" />
            <p className="text-sm font-medium">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchTemplates}>Try again</Button>
          </CardContent>
        </Card>
      ) : loading ? (
        <Card>
          <CardContent className="py-12 flex items-center justify-center text-sm text-muted-foreground gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading email templates...
          </CardContent>
        </Card>
      ) : (
        stages.map((stage) => (
          <Card key={stage.stage_type_id}>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-semibold text-sm">
                  {STAGE_LABELS[stage.stage_type_id] || `Stage ${stage.stage_type_id}`}
                </h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Emails sent to candidates during the {(STAGE_LABELS[stage.stage_type_id] || `stage ${stage.stage_type_id}`).toLowerCase()} step.
              </p>
            </CardHeader>
            <CardContent className="p-0">
              {stage.templates.map((tpl, idx) => (
                <div
                  key={tpl.template_key}
                  className={`flex items-start justify-between gap-4 px-6 py-4 ${
                    idx !== stage.templates.length - 1 ? 'border-b' : ''
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        {TEMPLATE_LABELS[tpl.template_key] || tpl.template_key}
                      </span>
                      {tpl.is_customized ? (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-emerald-50 text-emerald-600 border-emerald-200">
                          Customized
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-muted-foreground">
                          Default
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm font-medium mt-1 truncate">{tpl.subject}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                      {tpl.body.replace(/<[^>]*>/g, ' ').trim()}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => openPreview(tpl)}>
                      <Eye className="h-3.5 w-3.5 mr-1.5" />
                      Preview
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEdit(stage.stage_type_id, tpl)}
                    >
                      <Pencil className="h-3.5 w-3.5 mr-1.5" />
                      Edit
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))
      )}

      <Dialog open={!!editing} onOpenChange={(open) => !open && closeEdit()}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Edit {editing ? (TEMPLATE_LABELS[editing.template_key] || editing.template_key) : ''}
            </DialogTitle>
            <DialogDescription>
              This wording is used every time this email is sent — recruiters can no longer edit it per-send.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="et-subject">Subject</Label>
              <Input
                id="et-subject"
                value={form.subject}
                onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                placeholder="Your Offer Letter — {{JOB_TITLE}}"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="et-body">Body</Label>
              <Textarea
                id="et-body"
                value={form.body}
                onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                rows={10}
                className="font-mono text-sm"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {PLACEHOLDER_HINTS.map((ph) => (
                <Badge key={ph} variant="outline" className="text-[10px] font-mono text-muted-foreground">
                  {ph}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {'{{LINK}}'} is inserted automatically if you leave it out and a link is available. Other placeholders are filled in with the candidate's data when the email is sent.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => openPreview(form)} disabled={submitting}>
              <Eye className="h-3.5 w-3.5 mr-1.5" />
              Preview
            </Button>
            <Button variant="outline" onClick={closeEdit} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!previewing} onOpenChange={(open) => !open && setPreviewing(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Email Preview</DialogTitle>
            <DialogDescription>
              Sample data shown below — {'{{CANDIDATE_NAME}}'}, {'{{JOB_TITLE}}'}, etc. are replaced with
              placeholder values for illustration only.
            </DialogDescription>
          </DialogHeader>

          {previewing && (
            <div className="rounded-lg border overflow-hidden">
              <div className="px-4 py-2.5 border-b bg-muted/40">
                <span className="text-xs text-muted-foreground">Subject</span>
                <p className="text-sm font-semibold">{previewing.subject}</p>
              </div>
              <div className="px-4 py-3 text-sm whitespace-pre-wrap max-h-[50vh] overflow-y-auto">
                {previewing.body}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewing(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}