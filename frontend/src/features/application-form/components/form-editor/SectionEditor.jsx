import { X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import QuestionListEditor from '../question-editor/QuestionListEditor';

export default function SectionEditor({ section, onChange, onRemove }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2 pb-2">
        <Input
          value={section.label}
          onChange={(e) => onChange({ ...section, label: e.target.value })}
          placeholder="Section label…"
          className="h-8 text-sm font-semibold flex-1"
        />
        <button
          type="button"
          onClick={onRemove}
          className="text-muted-foreground hover:text-rose-600"
          title="Remove section"
        >
          <X className="h-4 w-4" />
        </button>
      </CardHeader>
      <CardContent>
        <QuestionListEditor
          questions={section.fields}
          onChange={(fields) => onChange({ ...section, fields })}
          emptyHint="No questions in this section yet."
        />
      </CardContent>
    </Card>
  );
}
