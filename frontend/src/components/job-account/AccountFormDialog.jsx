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
import { Eye, EyeOff } from 'lucide-react';

export function AccountFormDialog({ open, onOpenChange, account, users, onSubmit, loading }) {
  const isEdit = !!account;

  const [userId,     setUserId]     = useState('');
  const [portalName, setPortalName] = useState('');
  const [email,   setEmail] = useState('');
  const [password,     setPassword]     = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error,        setError]        = useState('');

  useEffect(() => {
    if (!open) return;
    setError('');
    setShowPassword(false);
    if (isEdit) {
      setUserId(String(account.user_id));
      setPortalName(account.portal_name);
      setEmail(account.email);
      setPassword('');
    } else {
      setUserId('');
      setPortalName('');
      setEmail('');
      setPassword('');
    }
  }, [open, account, isEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (isEdit) {
      if (!email.trim()) { setError('Email is required'); return; }
    } else {
      if (!userId)           { setError('Please select a user'); return; }
      if (!portalName)       { setError('Please select a portal'); return; }
      if (!email.trim())  { setError('Email is required'); return; }
      if (!password)         { setError('Password is required'); return; }
    }

    try {
      await onSubmit(
        isEdit
          ? { email: email.trim(), ...(password ? { password } : {}) }
          : { user_id: Number(userId), portal_name: portalName, email: email.trim(), password },
        account?.id,
      );
      onOpenChange(false);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Something went wrong');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Job Account' : 'Create Job Account'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update email or password for this account.'
              : 'Link a user to a job portal account.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* User - only on create */}
          {!isEdit && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="account-user">User</Label>
              <Select value={userId} onValueChange={setUserId}>
                <SelectTrigger id="account-user">
                  <SelectValue placeholder="Select a user" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={String(u.id)}>
                      {u.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Portal - only on create */}
          {!isEdit && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="account-portal">Portal</Label>
              <Select value={portalName} onValueChange={setPortalName}>
                <SelectTrigger id="account-portal">
                  <SelectValue placeholder="Select a portal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="seek">Seek</SelectItem>
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* email */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="account-email">Email</Label>
            <Input
              id="account-email"
              placeholder="Portal email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* Password */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="account-password">Password</Label>
            <div className="relative">
              <Input
                id="account-password"
                type={showPassword ? 'text' : 'password'}
                placeholder={isEdit ? 'Leave blank to keep current' : 'Portal password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full w-10 text-muted-foreground hover:text-foreground"
                onClick={() => setShowPassword((prev) => !prev)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading
                ? (isEdit ? 'Saving…' : 'Creating…')
                : (isEdit ? 'Save Changes' : 'Create Account')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
