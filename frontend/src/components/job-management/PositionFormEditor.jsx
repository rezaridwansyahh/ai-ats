import { useEffect, useState } from 'react';
import { Loader2, Check, Plus, X, ClipboardList } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { getJobById, updateJob } from '@/api/job.api';

const FIELD_TYPES = ['text', 'date', 'select'];

// Position-specific questions, shown to candidates in addition to — never
// replacing — the company's default application form (Settings →
// Application Form). Saved on core_job.additional_application_questions.
export default function PositionFormEditor({ jobId }) {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!jobId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await getJobById(jobId);
        if (cancelled) return;
        const existing = res.data?.job?.additional_application_questions;
        setQuestions(Array.isArray(existing) ? existing : []);
      } catch { /* keep empty list */ }
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [jobId]);

  const addQuestion = () => {
    setQuestions((qs) => [
      ...qs,
      { key: `q_${Date.now()}`, label: '', type: 'text', required: false, options: [] },
    ]);
  };

  const updateQuestion = (idx, patch) => {
    setQuestions((qs) => qs.map((q, i) => (i === idx ? { ...q, ...patch } : q)));
  };

  const removeQuestion = (idx) => {
    setQuestions((qs) => qs.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await updateJob(jobId, { additional_application_questions: questions });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to save position questions');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-primary" /> Position-specific questions
        </CardTitle>
        <p className="text-[11px] text-muted-foreground">
          Shown to candidates in addition to the company's default application form — never replaces it.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-red-200 bg-red-50 text-xs text-red-600">
            {error}
          </div>
        )}

        {questions.length === 0 ? (
          <p className="text-xs text-muted-foreground italic py-2">
            No additional questions yet — candidates will only see the company's default form.
          </p>
        ) : (
          <div className="space-y-3">
            {questions.map((q, idx) => (
              <div key={q.key} className="rounded-lg border p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Input
                    value={q.label}
                    onChange={(e) => updateQuestion(idx, { label: e.target.value })}
                    placeholder="Question label…"
                    className="h-8 text-xs flex-1"
                  />
                  <Select value={q.type} onValueChange={(v) => updateQuestion(idx, { type: v })}>
                    <SelectTrigger className="h-8 w-28 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {FIELD_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <button
                    type="button"
                    onClick={() => removeQuestion(idx)}
                    className="text-muted-foreground hover:text-rose-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>

                {q.type === 'select' && (
                  <Input
                    value={(q.options || []).join(', ')}
                    onChange={(e) => updateQuestion(idx, {
                      options: e.target.value.split(',').map((o) => o.trim()).filter(Boolean),
                    })}
                    placeholder="Options, comma separated…"
                    className="h-8 text-xs"
                  />
                )}

                <label className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  <Checkbox
                    checked={!!q.required}
                    onCheckedChange={(v) => updateQuestion(idx, { required: !!v })}
                  />
                  Required
                </label>
              </div>
            ))}
          </div>
        )}

        <Button size="sm" variant="outline" className="h-8 text-xs" onClick={addQuestion}>
          <Plus className="h-3.5 w-3.5 mr-1.5" /> Add question
        </Button>

        <div className="flex items-center justify-end gap-2 pt-2 border-t">
          {saved && (
            <Badge variant="outline" className="text-[9px] border-emerald-300 text-emerald-700 bg-emerald-50">
              <Check className="h-3 w-3 mr-1" /> Saved
            </Badge>
          )}
          <Button size="sm" className="text-xs" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Check className="h-3.5 w-3.5 mr-1.5" />}
            Save Questions
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
