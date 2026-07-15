import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText, AlertTriangle, Loader2, RotateCw, Search,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/common';
import { TablePagination } from '@/components/shared/TablePagination';
import { getInitials } from '@/lib/batteries';

import offerAPI from '@/api/offer.api';

const STATUS_META = {
  draft:       { label: 'Draft',       color: 'bg-slate-100 text-slate-700'     },
  sent:        { label: 'Sent',        color: 'bg-blue-100 text-blue-700'       },
  negotiating: { label: 'Negotiating', color: 'bg-amber-100 text-amber-700'     },
  accepted:    { label: 'Accepted',    color: 'bg-emerald-100 text-emerald-700' },
  rejected:    { label: 'Rejected',    color: 'bg-rose-100 text-rose-700'       },
  signed:      { label: 'Signed',      color: 'bg-purple-100 text-purple-700'   },
};

const CHIP_KEYS = ['draft', 'sent', 'negotiating', 'accepted', 'rejected', 'signed'];

function jobStatusTone(status) {
  switch ((status || '').toLowerCase()) {
    case 'active':
    case 'running':
      return 'border-emerald-200 text-emerald-700 bg-emerald-50';
    case 'draft':
      return 'border-amber-200 text-amber-700 bg-amber-50';
    case 'expired':
    case 'failed':
      return 'border-rose-200 text-rose-700 bg-rose-50';
    default:
      return 'border-border text-muted-foreground bg-muted/40';
  }
}

function formatCurrency(value) {
  if (!value) return '—';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(value);
}

export default function OfferWorkboard() {
  const navigate = useNavigate();

  const [offers, setOffers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const [activeStatus, setActiveStatus] = useState(null);
  const [search, setSearch]             = useState('');
  const [page, setPage]                 = useState(1);
  const [pageSize, setPageSize]         = useState(25);

  const loadWorkboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await offerAPI.getWorkboard();
      setOffers(res.data?.offers || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load workboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadWorkboard(); }, []);

  // Positions rail derived from the offers themselves — one row per job_id
  const positions = useMemo(() => {
    const map = new Map();
    for (const o of offers) {
      if (!map.has(o.job_id)) {
        map.set(o.job_id, { job_id: o.job_id, job_title: o.job_title, status: o.job_status, total: 0 });
      }
      map.get(o.job_id).total++;
    }
    return Array.from(map.values());
  }, [offers]);

  const statusCounts = useMemo(() => {
    const c = { draft: 0, sent: 0, negotiating: 0, accepted: 0, rejected: 0, signed: 0 };
    for (const o of offers) {
      if (c[o.offer_status] != null) c[o.offer_status]++;
      if (o.contract_status === 'signed') c.signed++;
    }
    return c;
  }, [offers]);

  const filtered = useMemo(() => {
    let list = offers;
    if (activeStatus) {
      list = activeStatus === 'signed'
        ? list.filter((o) => o.contract_status === 'signed')
        : list.filter((o) => o.offer_status === activeStatus);
    }
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((o) =>
        (o.candidate_name  || '').toLowerCase().includes(q) ||
        (o.position_title  || '').toLowerCase().includes(q) ||
        (o.job_title       || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [offers, activeStatus, search]);

  const totalPages  = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageClamped = Math.min(page, totalPages);
  const paged       = filtered.slice((pageClamped - 1) * pageSize, pageClamped * pageSize);

  const totalOffers  = offers.length;
  const activePositions = positions.filter((p) =>
    ['active', 'running'].includes((p.status || '').toLowerCase())
  ).length;

  const toggleStatus = (status) => {
    setActiveStatus((cur) => (cur === status ? null : status));
    setPage(1);
  };

  const resetView = () => { setActiveStatus(null); setSearch(''); setPage(1); };

  return (
    <div className="space-y-5 p-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <PageHeader
          title="Offer &"
          highlight="Contract"
          subtitle={`${activePositions} active position${activePositions === 1 ? '' : 's'} · ${totalOffers} candidate${totalOffers === 1 ? '' : 's'} in offer`}
        />
        <Button variant="outline" size="sm" onClick={loadWorkboard} className="text-xs">
          <RotateCw className="h-3.5 w-3.5 mr-1.5" /> Refresh
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg border border-red-200 bg-red-50 text-sm text-red-600">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Status chip strip */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
              By status · click to filter
            </span>
            {CHIP_KEYS.map((status) => {
              const meta   = STATUS_META[status];
              const count  = statusCounts[status] || 0;
              const active = activeStatus === status;
              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => toggleStatus(status)}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold transition-colors ${
                    active
                      ? 'bg-primary text-primary-foreground border-primary'
                      : `${meta.color} border-transparent hover:brightness-95 cursor-pointer`
                  }`}
                >
                  <span className="font-mono">{count}</span>
                  <span>{meta.label}</span>
                </button>
              );
            })}
            {activeStatus && (
              <Button variant="ghost" size="sm" onClick={resetView} className="text-xs text-muted-foreground">
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-4">

        {/* Positions rail */}
        <Card className="self-start">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">
              Positions · {positions.length}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 px-2 pb-2">
            {loading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : positions.length === 0 ? (
              <p className="text-xs text-muted-foreground italic px-2 py-3">No positions.</p>
            ) : (
              <>
                <button
                  type="button"
                  onClick={resetView}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-md text-xs bg-primary/10 text-primary font-semibold"
                >
                  <span>All positions</span>
                  <span className="font-mono text-[10px]">{totalOffers}</span>
                </button>
                <div className="space-y-0.5 mt-1">
                  {positions.map((p) => (
                    <button
                      key={p.job_id}
                      type="button"
                      onClick={() => navigate(`/selection/offer-contract/job/${p.job_id}`)}
                      className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-md text-xs hover:bg-muted/50 text-foreground transition-colors"
                    >
                      <span className="truncate text-left flex items-center gap-1.5 min-w-0">
                        <span className="truncate">{p.job_title}</span>
                        {p.status && (
                          <Badge
                            variant="outline"
                            className={`text-[8px] uppercase tracking-wide shrink-0 ${jobStatusTone(p.status)}`}
                          >
                            {p.status}
                          </Badge>
                        )}
                      </span>
                      <span className="font-mono text-[10px] text-muted-foreground shrink-0">
                        {p.total}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Candidates panel */}
        <Card>
          <CardHeader className="pb-3 space-y-3">
            <CardTitle className="text-sm">
              All candidates
              <span className="ml-2 text-[11px] font-normal text-muted-foreground">
                {filtered.length} {activeStatus ? `at ${STATUS_META[activeStatus]?.label}` : 'total'}
              </span>
            </CardTitle>
            <div className="relative max-w-sm">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search name, position, or job…"
                className="pl-8 h-8 text-xs"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-10 text-xs text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin inline mr-1.5" /> Loading…
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-10 text-xs text-muted-foreground">
                {offers.length === 0
                  ? 'No candidates in offer yet.'
                  : 'No candidates match this filter.'}
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  {paged.map((o) => {
                    const name = o.candidate_name || `#${o.candidate_id}`;
                    const isSigned = o.contract_status === 'signed';
                    const meta = STATUS_META[o.offer_status] || { label: o.offer_status, color: 'bg-muted text-muted-foreground' };
                    return (
                      <div
                        key={o.id}
                        onClick={() => navigate(`/selection/offer-contract/candidate/${o.id}`)}
                        className="flex items-center justify-between gap-3 p-3 border rounded-lg transition-colors hover:bg-muted/30 cursor-pointer"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[11px] font-bold shrink-0">
                            {getInitials(name)}
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-semibold truncate">{name}</div>
                            <div className="flex items-center gap-3 mt-1">
                              {o.position_title && (
                                <span className="text-[10px] text-muted-foreground truncate">
                                  {o.position_title}
                                </span>
                              )}
                              <span className="text-[10px] text-muted-foreground truncate">
                                {formatCurrency(o.net_salary)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                            {o.contract_type}
                          </span>
                          {isSigned && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-100 text-purple-700">
                              Signed
                            </span>
                          )}
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${meta.color}`}>
                            {meta.label}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="pt-3">
                  <TablePagination
                    page={pageClamped}
                    totalPages={totalPages}
                    totalItems={filtered.length}
                    pageSize={pageSize}
                    setPage={setPage}
                    setPageSize={setPageSize}
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}