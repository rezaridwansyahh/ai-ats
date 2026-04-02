import { useState, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogFooter,
  DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input }  from '@/components/ui/input';
import { Label }  from '@/components/ui/label';

export function AccountFormDialog({ open, onOpenChange, account, platform, onSubmit, loading }) {
  const isEdit = !!account;

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');

  useEffect(() => {
    if (open) {
      setEmail(account?.email || '');
      setPassword('');
      setError('');
    }
  }, [open, account]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) { setError('Email is required'); return; }
    if (!isEdit && !password.trim()) { setError('Password is required'); return; }

    const payload = { email: email.trim() };
    if (password.trim()) payload.password = password.trim();

    if (!isEdit && platform) {
      payload.portal_name = platform.id;
      payload.user_id = JSON.parse(localStorage.getItem('user') || '{}')?.id;
    }

    try {
      await onSubmit(payload, account?.id);
      onOpenChange(false);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Something went wrong');
    }
  };

  const title = isEdit ? `Update ${platform?.name || ''} Account` : `Connect ${platform?.name || ''} Account`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update the credentials for this account.'
              : `Enter your ${platform?.name || ''} credentials to connect.`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
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
