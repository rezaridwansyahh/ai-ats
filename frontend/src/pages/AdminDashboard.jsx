import { useEffect, useState } from 'react';
import { Building2, Users, AlertTriangle } from 'lucide-react';
import { PageHeader } from '@/components/common';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function getDisplayName(user) {
  if (!user) return 'there';
  return user.full_name
    ?? (user.username
      ? user.username.charAt(0).toUpperCase() + user.username.slice(1)
      : user.email?.split('@')[0] ?? 'there');
}

export default function AdminDashboard() {
  const [user, setUser]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);

  useEffect(() => {
    try {
      const str = localStorage.getItem('user');
      if (str && str !== 'undefined' && str !== 'null') setUser(JSON.parse(str));
    } catch (err) {
      console.error('Failed to parse user from localStorage:', err);
    }
  }, []);

  const greeting    = getGreeting();
  const displayName = getDisplayName(user);

  const STATS = [
    { label: 'Total Users',   value: '—', sub: 'pending cross-tenant API' },
    { label: 'AI Spend (MTD)', value: '—', sub: 'pending API' },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title={`${greeting},`}
        highlight={`${displayName}.`}
        subtitle="Platform overview across all tenants."
      />

      <div className="grid grid-cols-3 gap-4">
        {STATS.map((stat, i) => (
          <div key={i} className="rounded-xl border border-border bg-card px-5 py-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{stat.label}</p>
            <p className="text-2xl font-bold text-foreground mt-0.5">{stat.value}</p>
            <p className="text-[11px] text-muted-foreground">{stat.sub}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Building2 className="h-3.5 w-3.5 text-primary" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Tenants
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}