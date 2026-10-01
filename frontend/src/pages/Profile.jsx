import { useState } from 'react';
import { KeyRound, Loader2, User as UserIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { changeMyPassword } from '@/api/users.api';

const getInitials = (name = '') =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('');

export default function ProfilePage() {
  let user = null;
  let roles = [];
  try {
    user = JSON.parse(localStorage.getItem('user') || 'null');
    roles = JSON.parse(localStorage.getItem('role') || '[]');
  } catch {
    // malformed localStorage — render with whatever we have (null/empty)
  }

  const displayName = user?.username || user?.email || 'User';
  const roleNames = Array.isArray(roles) ? roles.map((r) => r.name).filter(Boolean) : [];

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword]         = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting]           = useState(false);
  const [formError, setFormError]             = useState(null);

  const canSubmit = currentPassword.trim() && newPassword.trim().length >= 6 && newPassword === confirmPassword;

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!currentPassword.trim() || !newPassword.trim()) {
      setFormError('Fill in both your current and new password.');
      return;
    }
    if (newPassword.length < 6) {
      setFormError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setFormError('New password and confirmation do not match.');
      return;
    }

    setSubmitting(true);
    try {
      await changeMyPassword({ current_password: currentPassword, new_password: newPassword });
      toast.success('Password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || 'Failed to update password.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 p-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight font-serif">Profile</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Your account details and password.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <UserIcon className="h-4 w-4 text-primary" />
            Account
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="bg-primary text-white text-sm font-bold">
                {getInitials(displayName)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{displayName}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email ?? '—'}</p>
              {roleNames.length > 0 && (
                <div className="flex gap-1.5 mt-1.5 flex-wrap">
                  {roleNames.map((name) => (
                    <Badge key={name} variant="outline" className="text-[10px] px-1.5 py-0">
                      {name}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-primary" />
            Change Password
          </CardTitle>
          <CardDescription className="text-xs">
            Enter your current password, then choose a new one.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4 max-w-sm">
            <div className="space-y-1.5">
              <Label htmlFor="currentPassword" className="text-xs font-semibold text-foreground/80">
                Current password
              </Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="h-9"
                autoComplete="current-password"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="newPassword" className="text-xs font-semibold text-foreground/80">
                New password
              </Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="h-9"
                autoComplete="new-password"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword" className="text-xs font-semibold text-foreground/80">
                Confirm new password
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="h-9"
                autoComplete="new-password"
              />
            </div>

            {formError && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-red-50 border border-red-100 text-red-600">
                <span className="text-xs font-semibold">{formError}</span>
              </div>
            )}

            <Button type="submit" size="sm" disabled={!canSubmit || submitting} className="w-fit">
              {submitting ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : null}
              Update password
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
