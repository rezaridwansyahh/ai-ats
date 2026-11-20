import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, RefreshCw, XCircle, Building2, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PageHeader } from '@/components/common';
import { toast } from 'sonner';

import { getAllCompanies, createCompany, updateCompanyById } from '@/features/company/api/company.api';
import { CompanyFormDialog } from '@/components/admin/CompanyFormDialog';

export default function AdminCompanies() {
  const navigate = useNavigate();

  const [companies, setCompanies] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);

  const [formOpen, setFormOpen]       = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [submitting, setSubmitting]   = useState(false);

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllCompanies();
      setCompanies(data || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load companies');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCompanies(); }, [fetchCompanies]);

  const openCreate = () => { setSelectedCompany(null); setFormOpen(true); };

  const handleSubmit = async (payload, companyId) => {
    setSubmitting(true);
    try {
      if (companyId) {
        await updateCompanyById(companyId, payload);
        toast.success('Company updated');
      } else {
        await createCompany(payload);
        toast.success('Company created');
      }
      await fetchCompanies();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader title="Companies" subtitle="All tenants on the platform." />

      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" size="sm" onClick={fetchCompanies} disabled={loading}>
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
        <Button size="sm" onClick={openCreate}>
          <Plus className="h-3.5 w-3.5" />
          Add Company
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">All tenants</CardTitle>
          <CardDescription className="text-xs">
            {loading ? 'Loading…' : `${companies.length} compan${companies.length === 1 ? 'y' : 'ies'}`}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          {error ? (
            <div className="flex flex-col items-center gap-2 py-16 text-destructive">
              <XCircle className="h-8 w-8" />
              <p className="text-sm font-medium">{error}</p>
              <Button variant="outline" size="sm" onClick={fetchCompanies}>Try again</Button>
            </div>
          ) : loading ? (
            <div className="px-4 py-6 text-sm text-muted-foreground text-center">Loading…</div>
          ) : companies.length === 0 ? (
            <div className="px-4 py-6 text-sm text-muted-foreground text-center">No companies yet.</div>
          ) : (
            <div className="divide-y divide-border">
              {companies.map((c) => (
                <button
                  key={c.id}
                  onClick={() => navigate(`/portal/admin/companies/${c.id}`)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Building2 className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{c.name}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{c.email || '—'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-muted-foreground">
                      {c.user_count} user{c.user_count === 1 ? '' : 's'}
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <CompanyFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        company={selectedCompany}
        onSubmit={handleSubmit}
        loading={submitting}
      />
    </div>
  );
}
