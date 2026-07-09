import { Input } from '@/components/ui/input';

export default function FacetInput({ icon, placeholder, value, onChange }) {
  return (
    <div className="relative">
      <div className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
        {icon}
      </div>
      <Input
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="text-xs h-8 pl-7 w-[140px]"
      />
    </div>
  );
}