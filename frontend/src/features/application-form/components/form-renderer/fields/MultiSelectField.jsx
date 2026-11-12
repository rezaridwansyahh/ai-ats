import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

export default function MultiSelectField({ field, value, onChange, readOnly }) {
  const selected = Array.isArray(value) ? value : [];

  const toggle = (option) => {
    onChange(
      selected.includes(option)
        ? selected.filter((o) => o !== option)
        : [...selected, option]
    );
  };

  return (
    <div className="space-y-2">
      <Label>
        {field.label}
        {field.required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <div className="space-y-1.5">
        {(field.options || []).map((option) => (
          <label key={option} className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={selected.includes(option)}
              onCheckedChange={() => toggle(option)}
              disabled={readOnly}
            />
            {option}
          </label>
        ))}
      </div>
    </div>
  );
}
