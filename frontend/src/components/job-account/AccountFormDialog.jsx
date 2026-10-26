import { useState, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogFooter,
  DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input }  from '@/components/ui/input';
import { Label }  from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

// `platform` is `{ id, name }` when pre-bound (editing an existing account,
// or creating from a specific row's "Connect" button) — null when opened
// from a generic "Add Account" action, in which case `platforms` (the full
// selectable list) must be provided and the user picks one here instead.
export function AccountFormDialog({ open, onOpenChange, account, user, platform, platforms, onSubmit, loading }) {
  const isEdit = !!account;

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [pickedPlatformId, setPickedPlatformId] = useState('');
  const [error, setError]       = useState('');

  useEffect(() => {
    if (open) {
      setEmail(account?.email || '');
      setPassword('');
      setPickedPlatformId('');
      setError('');
    }
  }, [open, account]);

  // The platform this dialog is actually operating on right now — either
  // pre-bound by the caller, or whatever the user just picked below.
  const effectivePlatform = platform || platforms?.find((p) => p.id === pickedPlatformId) || null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!isEdit && !effectivePlatform) { setError('Choose a platform'); return; }
    if (!email.trim()) { setError('Email is required'); return; }
    if (!isEdit && !password.trim()) { setError('Password is required'); return; }

    const payload = { email: email.trim() };
    if (password.trim()) payload.password = password.trim();

    if (!isEdit) {
      payload.portal_name = effectivePlatform.id;
      payload.user_id = user?.id;
    }

    try {
      await onSubmit(payload, account?.id);
      onOpenChange(false);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Something went wrong');
    }
  };

  const title = isEdit
    ? `Update ${effectivePlatform?.name || ''} Account`
    : effectivePlatform
      ? `Connect ${effectivePlatform.name} Account`
      : 'Add Account';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update the credentials for this account.'
              : effectivePlatform
                ? `Enter your ${effectivePlatform.name} credentials to connect.`
                : 'Pick a platform, then enter the credentials to connect.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isEdit && !platform && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="acc-platform">Platform <span className="text-destructive">*</span></Label>
              <Select value={pickedPlatformId} onValueChange={setPickedPlatformId}>
                <SelectTrigger id="acc-platform" className="w-full"><SelectValue placeholder="Select a platform" /></SelectTrigger>
                <SelectContent>
                  {platforms?.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Label htmlFor="acc-email">Email <span className="text-destructive">*</span></Label>
            <Input
              id="acc-email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="acc-password">
              Password {!isEdit && <span className="text-destructive">*</span>}
            </Label>
            <Input
              id="acc-password"
              type="password"
              placeholder={isEdit ? 'Leave blank to keep current' : 'Enter password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (isEdit ? 'Saving...' : 'Connecting...') : (isEdit ? 'Save Changes' : 'Connect')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
