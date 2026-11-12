import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

export default function TextareaField({ field, value, onChange, readOnly }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={field.key}>
        {field.label}
        {field.required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <Textarea
        className="read-only:bg-muted read-only:cursor-default"
        id={field.key}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        required={field.required}
        readOnly={readOnly}
        rows={4}
      />
    </div>
  );
}
