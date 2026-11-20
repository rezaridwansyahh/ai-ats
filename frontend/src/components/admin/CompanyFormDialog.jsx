import { useState, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogFooter,
  DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input }  from '@/components/ui/input';
import { Label }  from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export function CompanyFormDialog({ open, onOpenChange, company, onSubmit, loading }) {
  const isEdit = !!company;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setError('');
    setName(company?.name || '');
    setEmail(company?.email || '');
    setWebsite(company?.website || '');
    setDescription(company?.description || '');
  }, [open, company]);

  const handleSubmit = async () => {
    if (!name.trim()) { setError('Company name is required.'); return; }
    setError('');
    try {
      await onSubmit({ name: name.trim(), email: email.trim() || null, website: website.trim() || null, description: description.trim() || null }, company?.id);
      onOpenChange(false);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to save company');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Company' : 'Add Company'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update this tenant\'s profile.' : 'Onboard a new tenant on the platform.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="company-name">Name</Label>
            <Input id="company-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Acme Inc." />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="company-email">Contact email</Label>
            <Input id="company-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="contact@acme.com" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="company-website">Website</Label>
            <Input id="company-website" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://acme.com" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="company-description">Description</Label>
            <Textarea id="company-description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Saving…' : isEdit ? 'Save changes' : 'Create company'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
