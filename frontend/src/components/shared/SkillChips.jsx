import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

export function SkillChips({ values, onRemove, onAddKey, placeholder, tone = 'primary' }) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5 min-h-[1rem]">
        {values.length === 0 && (
          <span className="text-[11px] text-muted-foreground italic">none</span>
        )}
        {values.map((v, i) => (
          <Badge
            key={`${v}-${i}`}
            variant="secondary"
            className={`text-[10px] gap-1 cursor-default ${
              tone === 'primary' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
            }`}
          >
            {v}
            <button
              type="button"
              onClick={() => onRemove(i)}
              className="hover:text-rose-600 text-[12px] leading-none"
              aria-label="Remove"
            >×</button>
          </Badge>
        ))}
      </div>
      <Input
        placeholder={placeholder}
        onKeyDown={onAddKey}
        className="text-xs"
      />
    </div>
  );
}
