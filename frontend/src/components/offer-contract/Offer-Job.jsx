import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Loader2, AlertTriangle, RotateCw, ChevronDown, ChevronRight, FileText,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getInitials } from '@/lib/batteries';

import { getJobById } from '@/api/job.api';
import { getOffersByJob } from '@/api/offer.api';

const STATUS_META = {
  draft:       { label: 'Draft',       color: 'bg-slate-100 text-slate-700'   },
  sent:        { label: 'Sent',        color: 'bg-blue-100 text-blue-700'     },
  negotiating: { label: 'Negotiating', color: 'bg-amber-100 text-amber-700'   },
  accepted:    { label: 'Accepted',    color: 'bg-emerald-100 text-emerald-700' },
  rejected:    { label: 'Rejected',    color: 'bg-rose-100 text-rose-700'     },
  expired:     { label: 'Expired',     color: 'bg-gray-100 text-gray-500'     },
};

function jobStatusTone(status) {
  switch ((status || '').toLowerCase()) {
    case 'active':
    case 'running': return 'border-emerald-200 text-emerald-700 bg-emerald-50';
    case 'draft':   return 'border-amber-200 text-amber-700 bg-amber-50';
    case 'expired':
    case 'failed':  return 'border-rose-200 text-rose-700 bg-rose-50';
    default:        return 'border-border text-muted-foreground bg-muted/40';
  }
}

function formatCurrency(value) {
  if (!value) return '—';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(value);
}

function Section({ title, subtitle, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 py-2 text-left"
      >
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? '' : '-rotate-90'}`} />
        <span className="text-sm font-semibold">{title}</span>
        {subtitle && <span className="text-xs text-muted-foreground">{subtitle}</span>}
      </button>
      {open && children}
    </div>
  );
}

function OfferRow({ offer, onOpen }) {
  const meta = STATUS_META[offer.offer_status] || { label: offer.offer_status, color: 'bg-muted text-muted-foreground' };
  const isSigned = offer.contract_status === 'signed';

  return (
    <div
      onClick={onOpen}
      className="flex items-center justify-between gap-3 p-3 border rounded-lg hover:bg-muted/30 cursor-pointer transition-colors"
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[11px] font-bold shrink-0">
          {getInitials(offer.candidate_name)}
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold truncate">{offer.candidate_name}</div>
          <div className="text-[10px] text-muted-foreground truncate mt-0.5">
            {offer.position_title} · {formatCurrency(offer.net_salary)}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {isSigned && (
          <span className="text-[10px] font-mono text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded">
            signed
          </span>
        )}
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${meta.color}`}>
          {meta.label}
        </span>
        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
    </div>
  );
}

export default function OfferJobPage() {
  const navigate         = useNavigate();
  const { jobId: param } = useParams();
  const jobId            = param ? Number(param) : null;

  const [job, setJob]     = useState(null);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const load = useCallback(async () => {
    if (!jobId) return;
    setLoading(true);
    setError(null);
    try {
      const [jobRes, offersRes] = await Promise.all([
        getJobById(jobId),
        getOffersByJob(jobId),
      ]);
      setJob(jobRes.data?.job || jobRes.data || null);
      setOffers(offersRes.data?.offers || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => { load(); }, [load]);

  const byStatus = (status) => offers.filter((o) => o.offer_status === status);

  const draftOffers       = byStatus('draft');
  const sentOffers        = byStatus('sent');
  const negotiatingOffers = byStatus('negotiating');
  const acceptedOffers    = byStatus('accepted');
  const rejectedOffers    = byStatus('rejected');

  const goCandidate = (offer) => navigate(`/selection/offer-contract/candidate/${offer.id}`);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-5 p-6">

      <Button variant="ghost" size="sm" className="text-xs -ml-2" onClick={() => navigate('/selection/offer-contract')}>
        <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back to workboard
      </Button>

      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" /> {job?.job_title || `Job #${jobId}`}
            </h1>
            {job?.status && (
              <Badge variant="outline" className={`text-[9px] uppercase tracking-wide ${jobStatusTone(job.status)}`}>
                {job.status}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {offers.length} offer{offers.length === 1 ? '' : 's'}
            {job?.job_location ? ` · ${job.job_location}` : ''}
          </p>
        </div>
        <Button variant="outline" size="sm" className="text-xs" onClick={load}>
          <RotateCw className="h-3.5 w-3.5 mr-1.5" /> Refresh
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg border border-red-200 bg-red-50 text-sm text-red-600">
          <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">
            By status
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              ['draft', draftOffers.length],
              ['sent', sentOffers.length],
              ['negotiating', negotiatingOffers.length],
              ['accepted', acceptedOffers.length],
              ['rejected', rejectedOffers.length],
            ].map(([key, count]) => {
              const meta = STATUS_META[key];
              return (
                <div key={key} className="rounded-lg border p-3 text-center">
                  <p className="text-[10px] text-muted-foreground">{meta.label}</p>
                  <p className="text-2xl font-bold font-mono">{count}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Section title="Draft" subtitle={`${draftOffers.length} not yet sent`} defaultOpen={draftOffers.length > 0}>
          {draftOffers.length === 0
            ? <p className="text-xs text-muted-foreground italic px-1">No draft offers.</p>
            : <div className="space-y-2">{draftOffers.map((o) => <OfferRow key={o.id} offer={o} onOpen={() => goCandidate(o)} />)}</div>}
        </Section>

        <Section title="Sent" subtitle={`${sentOffers.length} awaiting candidate response`}>
          {sentOffers.length === 0
            ? <p className="text-xs text-muted-foreground italic px-1">No offers sent.</p>
            : <div className="space-y-2">{sentOffers.map((o) => <OfferRow key={o.id} offer={o} onOpen={() => goCandidate(o)} />)}</div>}
        </Section>

        <Section title="Negotiating" subtitle={`${negotiatingOffers.length} in active negotiation`}>
          {negotiatingOffers.length === 0
            ? <p className="text-xs text-muted-foreground italic px-1">No offers in negotiation.</p>
            : <div className="space-y-2">{negotiatingOffers.map((o) => <OfferRow key={o.id} offer={o} onOpen={() => goCandidate(o)} />)}</div>}
        </Section>

        <Section title="Accepted" subtitle={`${acceptedOffers.length} accepted · contract in progress`}>
          {acceptedOffers.length === 0
            ? <p className="text-xs text-muted-foreground italic px-1">No accepted offers yet.</p>
            : <div className="space-y-2">{acceptedOffers.map((o) => <OfferRow key={o.id} offer={o} onOpen={() => goCandidate(o)} />)}</div>}
        </Section>

        <Section title="Rejected" subtitle={`${rejectedOffers.length} declined`}>
          {rejectedOffers.length === 0
            ? <p className="text-xs text-muted-foreground italic px-1">No rejected offers.</p>
            : <div className="space-y-2">{rejectedOffers.map((o) => <OfferRow key={o.id} offer={o} onOpen={() => goCandidate(o)} />)}</div>}
        </Section>
      </div>

    </div>
  );
}