import { useState, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogFooter,
  DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input }  from '@/components/ui/input';
import { Label }  from '@/components/ui/label';
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select';

export function UserFormDialog({ open, onOpenChange, user, roles, onSubmit, loading }) {
  const isEdit = !!user;

  const [form, setForm] = useState({ email: '', username: '', password: '', role_id: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      if (isEdit) {
        setForm({
          email: user.email || '',
          username: user.username || '',
          password: '',
          role_id: user.roles?.[0]?.id?.toString() || '',
        });
      } else {
        setForm({ email: '', username: '', password: '', role_id: '' });
      }
      setError('');
    }
  }, [open, user, isEdit]);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.email.trim()) {
      setError('Email is required');
      return;
    }
    if (!isEdit && !form.password.trim()) {
      setError('Password is required for new users');
      return;
    }

    const payload = {
      email: form.email.trim(),
      username: form.username.trim(),
      role_ids: form.role_id ? [parseInt(form.role_id, 10)] : [],
    };

    if (form.password.trim()) {
      payload.password = form.password;
    }

    try {
      await onSubmit(payload, user?.id);
      onOpenChange(false);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Something went wrong');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit User' : 'Create User'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update user details and role assignment.'
              : 'Fill in the details to create a new user.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="user@example.com"
              value={form.email}
              onChange={handleChange('email')}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              placeholder="username"
              value={form.username}
              onChange={handleChange('username')}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="password">
              Password
              {isEdit && (
                <span className="text-muted-foreground font-normal ml-1">
                  (leave blank to keep current)
                </span>
              )}
            </Label>
            <Input
              id="password"
              type="password"
              placeholder={isEdit ? '••••••••' : 'Enter password'}
              value={form.password}
              onChange={handleChange('password')}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Role</Label>
            <Select value={form.role_id} onValueChange={(v) => setForm((prev) => ({ ...prev, role_id: v }))}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.id.toString()}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (isEdit ? 'Saving...' : 'Creating...') : (isEdit ? 'Save Changes' : 'Create User')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
