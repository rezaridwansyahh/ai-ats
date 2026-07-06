import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, DollarSign, Loader2, RotateCw, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TablePagination } from '@/components/shared/TablePagination';
import { getInitials } from '@/lib/batteries';

import offerAPI from '@/api/offer.api';

// Offer status colors
const STATUS_META = {
  draft: { label: 'Draft', color: 'bg-slate-100 text-slate-700', dot: 'bg-slate-500' },
  sent: { label: 'Sent', color: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' },
  negotiating: { label: 'Negotiating', color: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
  accepted: { label: 'Accepted', color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  rejected: { label: 'Rejected', color: 'bg-rose-100 text-rose-700', dot: 'bg-rose-500' },
  signed: { label: 'Signed', color: 'bg-purple-100 text-purple-700', dot: 'bg-purple-500' },
};

function formatCurrency(value) {
  if (!value) return '-';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
}

function formatDate(date) {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

export default function OfferWorkboard() {
  const navigate = useNavigate();

  const [offers, setOffers] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeStatus, setActiveStatus] = useState(null); // null = all
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const loadWorkboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await offerAPI.getWorkboard();
      setOffers(response.data.offers || []);
      setGrouped(response.data.grouped || {});
      setSummary(response.data.summary || {});
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load workboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkboard();
  }, []);

  // Filter by status
  const displayOffers = useMemo(() => {
    if (!activeStatus) return offers;
    if (activeStatus === 'signed') {
      return offers.filter(o => o.contract_status === 'signed');
    }
    return offers.filter(o => o.offer_status === activeStatus);
  }, [offers, activeStatus]);

  // Search filter
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return displayOffers;
    return displayOffers.filter((o) =>
      (o.candidate_name || '').toLowerCase().includes(q) ||
      (o.position_title || '').toLowerCase().includes(q) ||
      (o.job_title || '').toLowerCase().includes(q)
    );
  }, [displayOffers, search]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageClamped = Math.min(page, totalPages);
  const paged = filtered.slice((pageClamped - 1) * pageSize, pageClamped * pageSize);

  const toggleStatus = (status) => {
    setActiveStatus((cur) => (cur === status ? null : status));
    setPage(1);
  };

  const resetView = () => {
    setActiveStatus(null);
    setSearch('');
    setPage(1);
  };

  const openOffer = (offer) => {
    navigate(`/selection/offer/candidate/${offer.id}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-5 p-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" /> Offer & Contract
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {summary.total || 0} total offers · {summary.signed || 0} signed contracts
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadWorkboard}
          className="gap-2"
        >
          <RotateCw className="h-4 w-4" /> Refresh
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {Object.entries(STATUS_META).map(([key, meta]) => {
          const count = key === 'signed' ? summary.signed || 0 : summary[key] || 0;
          const isActive = activeStatus === key;
          return (
            <Card
              key={key}
              className={`cursor-pointer transition-all ${
                isActive ? 'ring-2 ring-primary shadow-md' : 'hover:shadow-sm'
              }`}
              onClick={() => toggleStatus(key)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className={`h-2 w-2 rounded-full ${meta.dot}`} />
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${meta.color}`}>
                    {meta.label}
                  </span>
                </div>
                <div className="text-2xl font-bold">{count}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex gap-3 items-center flex-wrap">
        <div className="relative flex-1 min-w-[250px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search candidates, positions..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>
        {(activeStatus || search) && (
          <Button variant="ghost" size="sm" onClick={resetView}>
            Clear filters
          </Button>
        )}
      </div>

      {/* Offers Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            {filtered.length} {activeStatus ? STATUS_META[activeStatus].label : 'Offer'}{filtered.length === 1 ? '' : 's'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {paged.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {search ? 'No offers match your search' : 'No offers yet'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-sm text-muted-foreground">
                    <th className="text-left py-3 px-4 font-medium">Candidate</th>
                    <th className="text-left py-3 px-4 font-medium">Position</th>
                    <th className="text-left py-3 px-4 font-medium">Status</th>
                    <th className="text-left py-3 px-4 font-medium">Contract Type</th>
                    <th className="text-right py-3 px-4 font-medium">Salary (Net)</th>
                    <th className="text-left py-3 px-4 font-medium">Sent Date</th>
                    <th className="text-left py-3 px-4 font-medium">Signed Date</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map((offer) => {
                    const statusKey = offer.contract_status === 'signed' ? 'signed' : offer.offer_status;
                    const meta = STATUS_META[statusKey] || STATUS_META.draft;

                    return (
                      <tr
                        key={offer.id}
                        className="border-b hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => openOffer(offer)}
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-primary/10 text-primary font-semibold flex items-center justify-center text-sm">
                              {getInitials(offer.candidate_name)}
                            </div>
                            <div>
                              <div className="font-medium">{offer.candidate_name}</div>
                              <div className="text-xs text-muted-foreground">{offer.candidate_email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium">{offer.position_title}</div>
                          <div className="text-xs text-muted-foreground">{offer.job_title}</div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={meta.color} variant="secondary">
                            {meta.label}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="outline">
                            {offer.contract_type}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right font-semibold">
                          {formatCurrency(offer.net_salary)}
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">
                          {formatDate(offer.sent_at)}
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">
                          {formatDate(offer.signed_at)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {filtered.length > pageSize && (
            <div className="mt-4">
              <TablePagination
                currentPage={pageClamped}
                totalPages={totalPages}
                pageSize={pageSize}
                totalItems={filtered.length}
                onPageChange={setPage}
                onPageSizeChange={(newSize) => {
                  setPageSize(newSize);
                  setPage(1);
                }}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
