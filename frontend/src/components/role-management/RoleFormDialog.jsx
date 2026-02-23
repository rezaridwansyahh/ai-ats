import { useState, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogFooter,
  DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input }  from '@/components/ui/input';
import { Label }  from '@/components/ui/label';
import { Plus, X } from 'lucide-react';

// Functionality badge colours
const FUNC_COLORS = {
  read:   'bg-blue-100 text-blue-700',
  create: 'bg-green-100 text-green-700',
  update: 'bg-yellow-100 text-yellow-700',
  delete: 'bg-red-100 text-red-700',
  export: 'bg-purple-100 text-purple-700',
};

export function RoleFormDialog({
  open,
  onOpenChange,
  role,           
  allModules,     
  onSubmit,
  loading,
}) {
  const isEdit = !!role;

  const [name,     setName]     = useState('');
  const [pairs,    setPairs]    = useState([{ key: '', value: '' }]); // additional key-value pairs
  const [selected, setSelected] = useState(new Set()); // Set of permission IDs
  const [error,    setError]    = useState('');

  // Reset form when dialog opens
  useEffect(() => {
    if (!open) return;
    setError('');
    if (isEdit) {
      setName(role.name || '');
      const entries = Object.entries(role.additional || {});
      setPairs(entries.length ? entries.map(([k, v]) => ({ key: k, value: String(v) })) : [{ key: '', value: '' }]);
      const ids = new Set(role.permissions?.map(p => p.id) ?? []);
      setSelected(ids);
    } else {
      setName('');
      setPairs([{ key: '', value: '' }]);
      setSelected(new Set());
    }
  }, [open, role, isEdit]);

  const addPair    = () => setPairs(prev => [...prev, { key: '', value: '' }]);
  const removePair = (i) => setPairs(prev => prev.filter((_, idx) => idx !== i));
  const updatePair = (i, field, val) =>
    setPairs(prev => prev.map((p, idx) => idx === i ? { ...p, [field]: val } : p));

  const togglePermission = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleMenu = (permissions) => {
    const ids = permissions.map(p => p.id);
    const allChecked = ids.every(id => selected.has(id));
    setSelected(prev => {
      const next = new Set(prev);
      if (allChecked) ids.forEach(id => next.delete(id));
      else            ids.forEach(id => next.add(id));
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) { setError('Role name is required'); return; }

    // Build additional object from non-empty key pairs
    const additionalObj = pairs
      .filter(p => p.key.trim())
      .reduce((acc, p) => ({ ...acc, [p.key.trim()]: p.value.trim() }), {});

    try {
      await onSubmit(
        {
          name: name.trim(),
          additional: Object.keys(additionalObj).length ? additionalObj : null,
          permission_ids: [...selected],
        },
        role?.id,
      );
      onOpenChange(false);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Something went wrong');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Role' : 'Create Role'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update role details and permissions.' : 'Fill in a name and assign permissions.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 overflow-hidden flex-1">
          {/* Role Name */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="role-name">Role Name</Label>
            <Input
              id="role-name"
              placeholder="e.g. Manager"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Additional Info</Label>
            <div className="flex flex-col gap-2">
              {pairs.map((pair, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    placeholder="key"
                    value={pair.key}
                    onChange={e => updatePair(i, 'key', e.target.value)}
                    className="w-36"
                  />
                  <span className="text-muted-foreground text-sm">:</span>
                  <Input
                    placeholder="value"
                    value={pair.value}
                    onChange={e => updatePair(i, 'value', e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => removePair(i)}
                    disabled={pairs.length === 1}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="self-start"
                onClick={addPair}
              >
                <Plus className="h-3.5 w-3.5 mr-1" /> Add field
              </Button>
            </div>
          </div>

          {/* Permissions */}
          <div className="flex flex-col gap-2 flex-1 overflow-hidden">
            <Label>Permissions</Label>
            <div className="border rounded-md overflow-y-auto flex-1 max-h-64 divide-y">
              {allModules.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground text-center">
                  Loading permissions…
                </p>
              ) : (
                allModules.map(mod => (
                  <div key={mod.id}>
                    <div className="px-4 py-2 bg-muted/50 font-semibold text-sm">
                      {mod.name}
                    </div>
                    {mod.menus.map(menu => {
                      const allChecked = menu.permissions.every(p => selected.has(p.id));
                      return (
                        <div key={menu.id} className="px-4 py-2 flex items-center gap-3 hover:bg-muted/20">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-input accent-primary cursor-pointer"
                            checked={allChecked}
                            onChange={() => toggleMenu(menu.permissions)}
                          />
                          <span className="text-sm w-40 shrink-0">{menu.name}</span>
                          <div className="flex flex-wrap gap-2">
                            {menu.permissions.map(perm => (
                              <label key={perm.id} className="flex items-center gap-1 cursor-pointer">
                                <input
                                  type="checkbox"
                                  className="h-3.5 w-3.5 rounded border-input accent-primary cursor-pointer"
                                  checked={selected.has(perm.id)}
                                  onChange={() => togglePermission(perm.id)}
                                />
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${FUNC_COLORS[perm.functionality] ?? 'bg-muted text-muted-foreground'}`}>
                                  {perm.functionality}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {selected.size} permission{selected.size !== 1 ? 's' : ''} selected
            </p>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading
                ? (isEdit ? 'Saving…' : 'Creating…')
                : (isEdit ? 'Save Changes' : 'Create Role')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
