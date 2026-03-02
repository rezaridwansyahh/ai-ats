import { useState } from 'react';
import { CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Input }  from '@/components/ui/input';
import { Label }  from '@/components/ui/label';
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select';

const PLATFORMS = [
  { value: 'jobstreet', label: 'JobStreet' },
  { value: 'linkedin',  label: 'LinkedIn' },
  { value: 'indeed',    label: 'Indeed' },
];

const PLACEHOLDER_CONNECTED = [
  { id: 1, platform: 'linkedin',  label: 'LinkedIn',  lastSync: '2 hours ago' },
  { id: 2, platform: 'jobstreet', label: 'JobStreet', lastSync: '1 day ago' },
];

export default function Integrations() {
  const [form, setForm] = useState({ platform: '', username: '', password: '' });
  const [connected, setConnected] = useState(PLACEHOLDER_CONNECTED);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleConnect = (e) => {
    e.preventDefault();
    const platform = PLATFORMS.find((p) => p.value === form.platform);
    setConnected((prev) => [
      ...prev,
      { id: Date.now(), platform: form.platform, label: platform.label, lastSync: 'just now' },
    ]);
    setForm({ platform: '', username: '', password: '' });
  };

  const handleDisconnect = (id) => {
    setConnected((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <div className="space-y-6 px-4 py-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Integrations</h1>
        <p className="text-muted-foreground text-sm">
          Connect your job portal accounts to sync candidates and applications.
        </p>
      </div>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Connect Platform</CardTitle>
          <CardDescription>
            Enter your job portal credentials to link your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleConnect} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label>Platform</Label>
              <Select
                value={form.platform}
                onValueChange={(v) => setForm((prev) => ({ ...prev, platform: v }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a platform" />
                </SelectTrigger>
                <SelectContent>
                  {PLATFORMS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="platform-username">Username</Label>
              <Input
                id="platform-username"
                placeholder="Enter your username"
                value={form.username}
                onChange={handleChange('username')}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="platform-password">Password</Label>
              <Input
                id="platform-password"
                type="password"
                placeholder="Enter your password"
                value={form.password}
                onChange={handleChange('password')}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={!form.platform || !form.username || !form.password}
            >
              Connect
            </Button>
          </form>
        </CardContent>

        {connected.length > 0 && (
          <>
            <Separator />
            <CardHeader>
              <CardTitle>Connected Accounts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {connected.map((account) => (
                <div
                  key={account.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="text-sm font-medium">{account.label}</p>
                      <p className="text-xs text-muted-foreground">
                        last synced {account.lastSync}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDisconnect(account.id)}
                  >
                    Disconnect
                  </Button>
                </div>
              ))}
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}
