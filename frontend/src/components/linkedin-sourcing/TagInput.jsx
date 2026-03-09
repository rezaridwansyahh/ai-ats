import { X, Plus } from 'lucide-react';

const MAX_ROWS = 5;

export function TagInput({ value = [], onChange, placeholder = 'Type here...' }) {
  // Ensure at least one row
  const rows = value.length > 0 ? value : [''];

  const addRow = () => {
    if (rows.length >= MAX_ROWS) return;
    onChange([...rows, '']);
  };

  const removeRow = (index) => {
    const updated = rows.filter((_, i) => i !== index);
    onChange(updated.length > 0 ? updated : ['']);
  };

  const updateRow = (index, val) => {
    const updated = [...rows];
    updated[index] = val;
    onChange(updated);
  };

  return (
    <div className="flex flex-col gap-1.5">
      {rows.map((row, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <input
            type="text"
            value={row}
            onChange={(e) => updateRow(i, e.target.value)}
            placeholder={placeholder}
            className="flex-1 rounded-md border border-input bg-background px-2.5 py-1.5 text-sm outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-ring"
          />
          {rows.length > 1 && (
            <button
              type="button"
              onClick={() => removeRow(i)}
              className="shrink-0 rounded-md p-1 text-muted-foreground hover:text-destructive hover:bg-muted transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      ))}
      {rows.length < MAX_ROWS && (
        <button
          type="button"
          onClick={addRow}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors w-fit"
        >
          <Plus className="h-3.5 w-3.5" />
          Add more
        </button>
      )}
      {rows.length >= MAX_ROWS && (
        <span className="text-xs text-muted-foreground">Max {MAX_ROWS} reached</span>
      )}
    </div>
  );
}
