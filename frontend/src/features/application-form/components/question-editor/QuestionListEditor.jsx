import { Plus, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { FIELD_TYPES, OPTIONS_FIELD_TYPES } from '../../lib/field-types';

export default function QuestionListEditor({ questions, onChange, emptyHint }) {
  const addQuestion = () => {
    onChange([
      ...questions,
      { key: `q_${Date.now()}`, label: '', type: 'text', required: false, options: [] },
    ]);
  };

  const updateQuestion = (idx, patch) => {
    onChange(questions.map((q, i) => (i === idx ? { ...q, ...patch } : q)));
  };

  const removeQuestion = (idx) => {
    onChange(questions.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-3">
      {questions.length === 0 ? (
        <p className="text-xs text-muted-foreground italic py-2">{emptyHint}</p>
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
                  <SelectTrigger className="h-8 w-36 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FIELD_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
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

              {OPTIONS_FIELD_TYPES.has(q.type) && (
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
    </div>
  );
}
