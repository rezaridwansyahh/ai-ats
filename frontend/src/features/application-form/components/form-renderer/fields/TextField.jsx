import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function TextField({ field, value, onChange, readOnly }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={field.key}>
        {field.label}
        {field.required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <Input className="read-only:bg-muted read-only:cursor-default"
        id={field.key}
        type={field.type === 'date' ? 'date' : 'text'}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        required={field.required}
        readOnly={readOnly}
      />
    </div>
  );
}