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

const STATUS_OPTIONS = ['Active', 'Onboarding'];

export function RecruiterFormDialog({ open, onOpenChange, recruiter, onSubmit, loading }) {
  const isEdit = !!recruiter;

  const [form, setForm] = useState({ name: '', email: '', status: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      if (isEdit) {
        setForm({
          name: recruiter.name || '',
          email: recruiter.email || '',
          status: recruiter.status || '',
        });
      } else {
        setForm({ name: '', email: '', status: '' });
      }
      setError('');
    }
  }, [open, recruiter, isEdit]);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.name.trim()) {
      setError('Name is required');
      return;
    }
    if (!form.email.trim()) {
      setError('Email is required');
      return;
    }

    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      status: form.status || 'Active',
    };

    try {
      await onSubmit(payload, recruiter?.id);
      onOpenChange(false);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Something went wrong');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Recruiter' : 'Add Recruiter'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update recruiter details.'
              : 'Fill in the details to add a new recruiter.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="rec-name">Name</Label>
            <Input
              id="rec-name"
              placeholder="e.g. Ahmad Rizki"
              value={form.name}
              onChange={handleChange('name')}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="rec-email">Email</Label>
            <Input
              id="rec-email"
              type="email"
              placeholder="recruiter@company.com"
              value={form.email}
              onChange={handleChange('email')}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => setForm((prev) => ({ ...prev, status: v }))}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
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
              {loading ? (isEdit ? 'Saving...' : 'Adding...') : (isEdit ? 'Save Changes' : 'Add Recruiter')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
