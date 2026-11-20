import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Pencil, Globe, Mail, Users, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

import { getCompanyById, getCompanyUsers, updateCompanyById } from '@/features/company/api/company.api';
import { CompanyFormDialog } from '@/components/admin/CompanyFormDialog';

export default function AdminCompanyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [company, setCompany] = useState(null);
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const [formOpen, setFormOpen]     = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [companyData, usersData] = await Promise.all([
        getCompanyById(id),
        getCompanyUsers(id),
      ]);
      setCompany(companyData);
      setUsers(usersData || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load company');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSubmit = async (payload, companyId) => {
    setSubmitting(true);
    try {
      await updateCompanyById(companyId, payload);
      toast.success('Company updated');
      await fetchData();
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="px-4 py-10 text-sm text-muted-foreground text-center">Loading…</div>;
  }

  if (error || !company) {
    return (
      <div className="flex flex-col items-center gap-2 py-16 text-destructive">
        <AlertTriangle className="h-8 w-8" />
        <p className="text-sm font-medium">{error || 'Company not found'}</p>
        <Button variant="outline" size="sm" onClick={() => navigate('/portal/admin/companies')}>
          Back to Companies
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('/portal/admin/companies')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold tracking-tight">{company.name}</h1>
          <p className="text-xs text-muted-foreground">Tenant profile and roster.</p>
        </div>
        <Button size="sm" variant="outline" onClick={() => setFormOpen(true)}>
          <Pencil className="h-3.5 w-3.5" />
          Edit
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Users</p>
          <p className="text-2xl font-bold text-foreground mt-0.5">{company.user_count}</p>
        </div>
        <div className="rounded-xl border border-border bg-card px-5 py-4 col-span-2">
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span>{company.email || '—'}</span>
          </div>
          <div className="flex items-center gap-2 text-sm mt-1.5">
            <Globe className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            {company.website ? (
              <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">
                {company.website}
              </a>
            ) : <span>—</span>}
          </div>
        </div>
      </div>

      {company.description && (
        <Card>
          <CardContent className="py-3 px-4 text-sm text-muted-foreground">
            {company.description}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Users className="h-3.5 w-3.5 text-primary" />
            Users
          </CardTitle>
          <CardDescription className="text-xs">
            {users.length} user{users.length === 1 ? '' : 's'} in this company
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          {users.length === 0 ? (
            <div className="px-4 py-6 text-sm text-muted-foreground text-center">No users yet.</div>
          ) : (
            <div className="divide-y divide-border">
              {users.map((u) => (
                <div key={u.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold">{u.username || u.email}</p>
                    <p className="text-[11px] text-muted-foreground">{u.email}</p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap justify-end">
                    {(u.roles || []).length === 0 ? (
                      <span className="text-xs text-muted-foreground">No role</span>
                    ) : (
                      u.roles.map((r) => (
                        <Badge key={r.id} variant="outline" className="text-[10px] px-2 py-0">
                          {r.name}
                        </Badge>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <CompanyFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        company={company}
        onSubmit={handleSubmit}
        loading={submitting}
      />
    </div>
  );
}
