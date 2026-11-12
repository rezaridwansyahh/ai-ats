import { AlertTriangle } from 'lucide-react';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

export function Field({ label, required, missing, missingMessage = 'required', help, children }) {
  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1 flex items-center gap-1.5">
        {label}
        {required && <span className="text-rose-600">*</span>}
        {missing && (
          <span className="text-[10px] text-rose-600 inline-flex items-center gap-1 font-normal normal-case">
            <AlertTriangle className="h-3 w-3" /> {missingMessage}
          </span>
        )}
      </div>
      {children}
      {help && <p className="text-[10px] text-muted-foreground mt-1 leading-snug">{help}</p>}
    </div>
  );
}

export function SelectBox({ value, onChange, options, disabled }) {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled} modal={false}>
      <SelectTrigger className="text-sm">
        <SelectValue placeholder="Select…" />
      </SelectTrigger>
      <SelectContent position="popper">
        {options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}
