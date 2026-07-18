import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Loader2, AlertTriangle, Check, ChevronRight, X,
  FileText, Pencil, Wallet, Send, FileSignature, Plus, Trash2,
  MessageSquareText, PenLine, ShieldCheck, ThumbsDown, Clock, Circle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { getInitials } from '@/lib/batteries';

import offerAPI from '@/api/offer.api';

const SUBSTAGES = [
  { key: 'intake',   number: 1, label: 'Intake',   sub: 'slip gaji'     },
  { key: 'build',    number: 2, label: 'Build',    sub: 'compensation'  },
  { key: 'approve',  number: 3, label: 'Approve',  sub: 'chain'         },
  { key: 'send',     number: 4, label: 'Send',     sub: 'negotiate'     },
  { key: 'contract', number: 5, label: 'Contract', sub: 'sign'          },
];

const STATUS_TONE = {
  draft:       'border-slate-300 text-slate-700 bg-slate-50',
  sent:        'border-blue-300 text-blue-700 bg-blue-50',
  negotiating: 'border-amber-300 text-amber-700 bg-amber-50',
  accepted:    'border-emerald-300 text-emerald-700 bg-emerald-50',
  rejected:    'border-rose-300 text-rose-700 bg-rose-50',
  expired:     'border-gray-300 text-gray-500 bg-gray-50',
};

const APPROVAL_TONE = {
  not_started: 'border-slate-300 text-slate-700 bg-slate-50',
  in_progress: 'border-blue-300 text-blue-700 bg-blue-50',
  approved:    'border-emerald-300 text-emerald-700 bg-emerald-50',
  rejected:    'border-rose-300 text-rose-700 bg-rose-50',
};

const DEFAULT_APPROVAL_STEPS = [
  { role: 'Recruiter', name: '' },
  { role: 'Hiring Manager', name: '' },
  { role: 'CHRO', name: '' },
  { role: 'Finance', name: '' },
];

function fmtCurrency(value) {
  if (value == null) return '—';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(value);
}

function fmtDate(d) {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch { return '—'; }
}

function SubStageStepper({ activeSection, onSelect }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-0">
          {SUBSTAGES.map((s, i) => {
            const isActive = activeSection === s.key;
            return (
              <div key={s.key} className="flex items-center flex-1 min-w-0">
                <button
                  type="button"
                  onClick={() => onSelect(s.key)}
                  className={`flex flex-col items-center gap-1 flex-1 py-2 px-1 rounded-lg transition-colors ${
                    isActive ? 'bg-primary/10' : 'hover:bg-muted/50'
                  }`}
                >
                  <span className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}>
                    {s.number}
                  </span>
                  <span className={`text-[11px] font-semibold ${isActive ? 'text-primary' : 'text-foreground'}`}>
                    {s.label}
                  </span>
                  <span className="text-[9px] text-muted-foreground">{s.sub}</span>
                </button>
                {i < SUBSTAGES.length - 1 && <div className="h-px w-6 shrink-0 mx-1 bg-border" />}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function CandidateCard({ offer }) {
  return (
    <Card>
      <CardContent className="p-3 space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Offer
        </p>
        <div className="text-xs text-foreground">{offer.position_title}</div>
        {offer.candidate_email && (
          <div className="text-[10px] text-muted-foreground">{offer.candidate_email}</div>
        )}
        <div className="pt-1 border-t space-y-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] text-muted-foreground">Status</span>
            <Badge variant="outline" className={`text-[9px] ${STATUS_TONE[offer.offer_status] || ''}`}>
              {offer.offer_status}
            </Badge>
          </div>
          {offer.metadata?.approval?.status && (
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] text-muted-foreground">Approval</span>
              <Badge variant="outline" className={`text-[9px] ${APPROVAL_TONE[offer.metadata.approval.status] || ''}`}>
                {offer.metadata.approval.status.replace(/_/g, ' ')}
              </Badge>
            </div>
          )}
          {offer.contract_status && (
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] text-muted-foreground">Contract</span>
              <Badge variant="outline" className="text-[9px]">{offer.contract_status}</Badge>
            </div>
          )}
          {offer.net_salary && (
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] text-muted-foreground">Net salary</span>
              <span className="text-[10px] font-mono">{fmtCurrency(offer.net_salary)}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/* Intake Section — slip gaji, manual line-item entry, editable after saving */

const DEFAULT_ROWS = [
  { label: 'Gaji Pokok', amount: '' },
  { label: 'Transport', amount: '' },
  { label: 'Meal', amount: '' },
  { label: 'Komisi / Insentif', amount: '' },
  { label: 'Lain-lain', amount: '' },
];

function IntakeSection({ offer, offerId, setBanner, setError }) {
  const [slipGaji, setSlipGaji] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [editing, setEditing]   = useState(false);
  const [lineItems, setLineItems] = useState(DEFAULT_ROWS.map((r) => ({ ...r })));
  const [expectedSalary, setExpectedSalary] = useState('');
  const [skipReason, setSkipReason] = useState('');
  const [reviewNote, setReviewNote] = useState('');
  const [showSkip, setShowSkip] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await offerAPI.getSlipGaji(offerId);
      setSlipGaji(res.data || { status: 'not_recorded' });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load slip gaji');
    } finally {
      setLoading(false);
    }
  }, [offerId, setError]);

  useEffect(() => { load(); }, [load]);

  const addRow = () => setLineItems((prev) => [...prev, { label: '', amount: '' }]);
  const removeRow = (i) => setLineItems((prev) => prev.filter((_, idx) => idx !== i));
  const updateRow = (i, field, value) =>
    setLineItems((prev) => prev.map((row, idx) => idx === i ? { ...row, [field]: value } : row));

  const total = lineItems.reduce((sum, row) => sum + (Number(row.amount) || 0), 0);

  const startEdit = () => {
    setLineItems(
      slipGaji.line_items.map((item) => ({ label: item.label, amount: String(item.amount) }))
    );
    setExpectedSalary(slipGaji.expected_salary != null ? String(slipGaji.expected_salary) : '');
    setEditing(true);
  };

  const cancelEdit = () => setEditing(false);

  const handleSave = async () => {
    const cleaned = lineItems
      .filter((row) => row.label.trim() && row.amount !== '')
      .map((row) => ({ label: row.label.trim(), amount: Number(row.amount) }));

    if (cleaned.length === 0) {
      setError('Fill in at least one line item with an amount');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const res = await offerAPI.recordSlipGaji(offerId, cleaned, expectedSalary ? Number(expectedSalary) : null);
      setSlipGaji(res.data?.slip_gaji);
      setEditing(false);
      setReviewNote('');
      setBanner({ ok: true, text: editing ? 'Slip gaji updated.' : 'Slip gaji saved.' });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to save slip gaji');
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await offerAPI.skipSlipGaji(offerId, skipReason || null);
      setSlipGaji(res.data?.slip_gaji);
      setShowSkip(false);
      setBanner({ ok: true, text: 'Slip gaji step skipped.' });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to skip');
    } finally {
      setSaving(false);
    }
  };

  const handleReview = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await offerAPI.reviewSlipGaji(offerId, reviewNote);
      setSlipGaji(res.data?.slip_gaji);
      setBanner({ ok: true, text: 'Review recorded.' });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to save review');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const status = slipGaji?.status || 'not_recorded';
  const showForm = status === 'not_recorded' || editing;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-primary shrink-0" />
            <div className="min-w-0 flex-1">
              <CardTitle className="text-sm">Verify slip gaji</CardTitle>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Optional sanity-check against the candidate's current salary · no OCR, manual entry
              </p>
            </div>

            {status === 'recorded' && !editing && (
              <Button size="sm" variant="outline" className="text-xs h-7 shrink-0" onClick={startEdit}>
                <Pencil className="h-3 w-3 mr-1.5" /> Edit
              </Button>
            )}

            <Badge variant="outline" className="text-[9px] shrink-0">{status.replace(/_/g, ' ')}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">

          {status === 'skipped' && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-xs text-gray-600">
              Skipped{slipGaji.skip_reason ? ` — ${slipGaji.skip_reason}` : ''}
            </div>
          )}

          {status === 'recorded' && !editing && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-lg border overflow-hidden">
                  <div className="px-4 py-3 border-b bg-muted/20">
                    <p className="text-sm font-bold">{offer?.company_name || 'Slip Gaji'}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Slip Gaji · {fmtDate(slipGaji.recorded_at)} · {offer?.candidate_name}
                    </p>
                  </div>
                  <div className="divide-y">
                    {slipGaji.line_items.map((item, i) => (
                      <div key={i} className="flex items-center justify-between px-4 py-2 text-xs">
                        <span className="text-muted-foreground">{item.label}</span>
                        <span className="font-mono">{fmtCurrency(item.amount)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between px-4 py-3 text-xs font-bold bg-muted/30 border-t">
                    <span>Total Gross</span>
                    <span className="font-mono">{fmtCurrency(slipGaji.total)}</span>
                  </div>
                </div>

                <div className="rounded-lg border p-4 space-y-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                    Recorded values
                  </p>
                  {slipGaji.line_items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{item.label}</span>
                      <span className="font-mono">{fmtCurrency(item.amount)}</span>
                    </div>
                  ))}
                  {slipGaji.expected_salary != null && (
                    <div className="flex items-center justify-between text-xs px-2 py-1.5 rounded border border-emerald-200 bg-emerald-50 mt-2">
                      <span className="text-emerald-700 font-medium">Expected</span>
                      <span className="font-mono text-emerald-700">{fmtCurrency(slipGaji.expected_salary)}</span>
                    </div>
                  )}
                </div>
              </div>

              {slipGaji.review_note && (
                <div className="flex items-start gap-2 px-3 py-2 rounded-lg border border-emerald-200 bg-emerald-50 text-xs text-emerald-700">
                  <MessageSquareText className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  {slipGaji.review_note}
                </div>
              )}
            </div>
          )}

          {showForm && (
            <div className="space-y-2">
              {editing && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-amber-200 bg-amber-50 text-[11px] text-amber-700">
                  Editing recorded values — saving will overwrite the previous entry and clear any existing review note.
                </div>
              )}

              {lineItems.map((row, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    placeholder="Label"
                    className="text-xs h-9"
                    value={row.label}
                    onChange={(e) => updateRow(i, 'label', e.target.value)}
                  />
                  <div className="relative w-44 shrink-0">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] text-muted-foreground pointer-events-none">
                      Rp
                    </span>
                    <Input
                      type="number"
                      className="text-xs h-9 pl-7"
                      value={row.amount}
                      onChange={(e) => updateRow(i, 'amount', e.target.value)}
                    />
                  </div>
                  <button type="button" onClick={() => removeRow(i)} className="shrink-0 text-muted-foreground hover:text-rose-600">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}

              <div className="flex items-center gap-2">
                <span className="text-xs w-full max-w-[calc(100%-3rem)] text-muted-foreground">
                  Expected (candidate's ask — informational only)
                </span>
                <div className="relative w-44 shrink-0">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] text-emerald-700 pointer-events-none">
                    Rp
                  </span>
                  <Input
                    type="number"
                    className="text-xs h-9 pl-7 border-emerald-300 bg-emerald-50/40 focus-visible:ring-emerald-400"
                    value={expectedSalary}
                    onChange={(e) => setExpectedSalary(e.target.value)}
                  />
                </div>
                <span className="w-3.5 shrink-0" />
              </div>

              <div className="flex items-center justify-between pt-1">
                <Button size="sm" variant="outline" className="text-xs h-7" onClick={addRow}>
                  <Plus className="h-3 w-3 mr-1" /> Add row
                </Button>
                <span className="text-xs font-mono text-muted-foreground">Total: {fmtCurrency(total)}</span>
              </div>

              <div className="flex gap-2 pt-1">
                <Button size="sm" className="text-xs" onClick={handleSave} disabled={saving}>
                  {saving
                    ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Saving…</>
                    : <><Check className="h-3.5 w-3.5 mr-1.5" /> {editing ? 'Save changes' : 'Save'}</>}
                </Button>
                {editing ? (
                  <Button size="sm" variant="ghost" className="text-xs" onClick={cancelEdit} disabled={saving}>
                    Cancel
                  </Button>
                ) : !showSkip ? (
                  <Button size="sm" variant="outline" className="text-xs" onClick={() => setShowSkip(true)}>
                    Skip this step
                  </Button>
                ) : null}
              </div>
            </div>
          )}

          {showSkip && !editing && (
            <div className="space-y-2 p-3 rounded-lg border border-dashed">
              <Input
                placeholder="Reason (optional) — e.g. entry-level, fresh-grad"
                className="text-xs h-8"
                value={skipReason}
                onChange={(e) => setSkipReason(e.target.value)}
              />
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" className="text-xs h-8" onClick={handleSkip} disabled={saving}>
                  Confirm skip
                </Button>
                <Button size="sm" variant="ghost" className="text-xs h-8" onClick={() => setShowSkip(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {status === 'recorded' && !editing && !slipGaji.review_note && (
            <div className="space-y-2 pt-2 border-t">
              <Textarea
                placeholder="Review note — e.g. matches candidate's stated expectation, proceeding"
                rows={2}
                className="text-xs"
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
              />
              <Button size="sm" className="text-xs" onClick={handleReview} disabled={saving || !reviewNote.trim()}>
                {saving ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Saving…</> : 'Save review'}
              </Button>
            </div>
          )}

        </CardContent>
      </Card>
    </div>
  );
}

function MoneyRow({ row, onLabelChange, onAmountChange, onRemove, disabled, labelPlaceholder = 'Label' }) {
  return (
    <div className="flex items-center gap-2">
      <Input
        placeholder={labelPlaceholder}
        className="text-xs h-9"
        value={row.label}
        onChange={(e) => onLabelChange(e.target.value)}
        disabled={disabled}
      />
      <div className="relative w-44 shrink-0">
        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] text-muted-foreground pointer-events-none">
          Rp
        </span>
        <Input
          type="number"
          className="text-xs h-9 pl-7"
          value={row.amount}
          onChange={(e) => onAmountChange(e.target.value)}
          disabled={disabled}
        />
      </div>
      {!disabled && (
        <button type="button" onClick={onRemove} className="shrink-0 text-muted-foreground hover:text-rose-600">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

function BuildSection({ offer, setOffer, setBanner, setError, onAdvance }) {
  const [baseSalary, setBaseSalary] = useState(offer.base_salary || '');
  const [allowances, setAllowances] = useState(
    Object.keys(offer.allowances || {}).length > 0
      ? Object.entries(offer.allowances).map(([label, amount]) => ({ label, amount: String(amount) }))
      : [{ label: 'Transport', amount: '' }, { label: 'Meal', amount: '' }]
  );
  const [bonuses, setBonuses] = useState(
    Object.keys(offer.bonus_structure || {}).length > 0
      ? Object.entries(offer.bonus_structure).map(([label, amount]) => ({ label, amount: String(amount) }))
      : [{ label: 'THR (1x base)', amount: '' }]
  );
  const [saving, setSaving] = useState(false);

  const isEditable = offer.offer_status === 'draft';

  const addAllowance = () => setAllowances((prev) => [...prev, { label: '', amount: '' }]);
  const removeAllowance = (i) => setAllowances((prev) => prev.filter((_, idx) => idx !== i));
  const updateAllowance = (i, field, value) =>
    setAllowances((prev) => prev.map((row, idx) => idx === i ? { ...row, [field]: value } : row));

  const addBonus = () => setBonuses((prev) => [...prev, { label: '', amount: '' }]);
  const removeBonus = (i) => setBonuses((prev) => prev.filter((_, idx) => idx !== i));
  const updateBonus = (i, field, value) =>
    setBonuses((prev) => prev.map((row, idx) => idx === i ? { ...row, [field]: value } : row));

  const allowancesTotal = allowances.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  const bonusesTotal = bonuses.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

  const handleSave = async () => {
    if (!baseSalary || Number(baseSalary) <= 0) {
      setError('Base salary is required');
      return;
    }

    const toObject = (rows) => rows.reduce((acc, row) => {
      if (row.label.trim() && row.amount !== '') acc[row.label.trim()] = Number(row.amount);
      return acc;
    }, {});

    setSaving(true);
    setError(null);
    try {
      const res = await offerAPI.updateCompensation(offer.id, {
        base_salary: Number(baseSalary),
        allowances: toObject(allowances),
        bonus_structure: toObject(bonuses),
      });
      setOffer((prev) => ({ ...prev, ...res.data.compensation }));
      setBanner({ ok: true, text: 'Compensation saved.' });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to update compensation');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-primary shrink-0" />
            <div className="min-w-0 flex-1">
              <CardTitle className="text-sm">Compensation build</CardTitle>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {isEditable ? 'Editable while offer is in draft' : 'Locked — offer has been sent'}
              </p>
            </div>
            {!isEditable && (
              <Badge variant="outline" className="text-[9px] shrink-0">locked</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">

          <div className="space-y-1">
            <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Base salary (monthly)
            </label>
            <div className="relative max-w-xs">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] text-muted-foreground pointer-events-none">
                Rp
              </span>
              <Input
                type="number"
                className="text-xs h-9 pl-7"
                value={baseSalary}
                onChange={(e) => setBaseSalary(e.target.value)}
                disabled={!isEditable}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Allowances
              </label>
              <span className="text-[10px] font-mono text-muted-foreground">Rp {allowancesTotal.toLocaleString('id-ID')}</span>
            </div>
            {allowances.map((row, i) => (
              <MoneyRow
                key={i}
                row={row}
                disabled={!isEditable}
                onLabelChange={(v) => updateAllowance(i, 'label', v)}
                onAmountChange={(v) => updateAllowance(i, 'amount', v)}
                onRemove={() => removeAllowance(i)}
              />
            ))}
            {isEditable && (
              <Button size="sm" variant="outline" className="text-xs h-7" onClick={addAllowance}>
                <Plus className="h-3 w-3 mr-1" /> Add allowance
              </Button>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Bonus structure
              </label>
              <span className="text-[10px] font-mono text-muted-foreground">Rp {bonusesTotal.toLocaleString('id-ID')}</span>
            </div>
            {bonuses.map((row, i) => (
              <MoneyRow
                key={i}
                row={row}
                disabled={!isEditable}
                labelPlaceholder="e.g. THR, annual bonus"
                onLabelChange={(v) => updateBonus(i, 'label', v)}
                onAmountChange={(v) => updateBonus(i, 'amount', v)}
                onRemove={() => removeBonus(i)}
              />
            ))}
            {isEditable && (
              <Button size="sm" variant="outline" className="text-xs h-7" onClick={addBonus}>
                <Plus className="h-3 w-3 mr-1" /> Add bonus
              </Button>
            )}
          </div>

          {offer.gross_salary != null && (
            <div className="rounded-lg border overflow-hidden">
              <div className="px-4 py-2 border-b bg-muted/20">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Calculated breakdown
                </p>
              </div>
              <div className="divide-y text-xs">
                <div className="flex items-center justify-between px-4 py-2">
                  <span className="text-muted-foreground">Gross salary</span>
                  <span className="font-mono">{fmtCurrency(offer.gross_salary)}</span>
                </div>
                <div className="flex items-center justify-between px-4 py-2">
                  <span className="text-muted-foreground">PPh 21</span>
                  <span className="font-mono">− {fmtCurrency(offer.pph21)}</span>
                </div>
                <div className="flex items-center justify-between px-4 py-2">
                  <span className="text-muted-foreground">BPJS Kesehatan</span>
                  <span className="font-mono">− {fmtCurrency(offer.bpjs_kesehatan)}</span>
                </div>
                <div className="flex items-center justify-between px-4 py-2">
                  <span className="text-muted-foreground">BPJS Ketenagakerjaan</span>
                  <span className="font-mono">− {fmtCurrency(offer.bpjs_ketenagakerjaan)}</span>
                </div>
                <div className="flex items-center justify-between px-4 py-3 font-bold bg-muted/30">
                  <span>Net salary</span>
                  <span className="font-mono">{fmtCurrency(offer.net_salary)}</span>
                </div>
              </div>
            </div>
          )}

          {isEditable && (
            <Button size="sm" className="text-xs" onClick={handleSave} disabled={saving}>
              {saving
                ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Saving…</>
                : <><Check className="h-3.5 w-3.5 mr-1.5" /> Save compensation</>}
            </Button>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between gap-3 pt-2 border-t">
        <p className="text-[10px] text-muted-foreground">
          {offer.offer_status === 'draft' ? 'Set up the approval chain once compensation is finalized' : 'Offer already sent'}
        </p>
        <Button size="sm" variant="outline" className="text-xs" onClick={() => onAdvance('approve')}>
          <ChevronRight className="h-3.5 w-3.5 mr-1" /> Go to Approve
        </Button>
      </div>
    </div>
  );
}

function ApprovalStepRow({ step, onRoleChange, onNameChange, onRemove }) {
  return (
    <div className="flex items-center gap-2">
      <Input
        placeholder="Role — e.g. Hiring Manager"
        className="text-xs h-9"
        value={step.role}
        onChange={(e) => onRoleChange(e.target.value)}
      />
      <Input
        placeholder="Name"
        className="text-xs h-9"
        value={step.name}
        onChange={(e) => onNameChange(e.target.value)}
      />
      <button type="button" onClick={onRemove} className="shrink-0 text-muted-foreground hover:text-rose-600">
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function ApproveSection({ offer, offerId, setOffer, setBanner, setError, onAdvance }) {
  const [approval, setApproval] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [editingChain, setEditingChain] = useState(false);
  const [draftSteps, setDraftSteps] = useState(DEFAULT_APPROVAL_STEPS.map((s) => ({ ...s })));
  const [note, setNote] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await offerAPI.getApproval(offerId);
      setApproval(res.data || { status: 'not_started', steps: [] });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load approval chain');
    } finally {
      setLoading(false);
    }
  }, [offerId, setError]);

  useEffect(() => { load(); }, [load]);

  const hasCompensation = offer.base_salary != null;

  const addDraftStep = () => setDraftSteps((prev) => [...prev, { role: '', name: '' }]);
  const removeDraftStep = (i) => setDraftSteps((prev) => prev.filter((_, idx) => idx !== i));
  const updateDraftStep = (i, field, value) =>
    setDraftSteps((prev) => prev.map((s, idx) => idx === i ? { ...s, [field]: value } : s));

  const startEditChain = () => {
    setDraftSteps(
      (approval?.steps?.length ? approval.steps : DEFAULT_APPROVAL_STEPS).map((s) => ({ role: s.role, name: s.name }))
    );
    setEditingChain(true);
  };

  const handleSetupChain = async () => {
    const cleaned = draftSteps.filter((s) => s.role.trim() && s.name.trim());
    if (cleaned.length === 0) {
      setError('Add at least one approval step with a role and a name');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await offerAPI.setupApprovalChain(offerId, cleaned);
      setApproval(res.data?.approval);
      setOffer((prev) => ({ ...prev, metadata: { ...(prev.metadata || {}), approval: res.data?.approval } }));
      setEditingChain(false);
      setBanner({ ok: true, text: 'Approval chain set up.' });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to set up chain');
    } finally {
      setSaving(false);
    }
  };

  const activeIndex = approval?.steps?.findIndex((s) => s.status !== 'approved') ?? -1;

  const handleDecide = async (decision) => {
    setSaving(true);
    setError(null);
    try {
      const res = await offerAPI.decideApprovalStep(offerId, activeIndex, decision, note || null);
      setApproval(res.data?.approval);
      setOffer((prev) => ({ ...prev, metadata: { ...(prev.metadata || {}), approval: res.data?.approval } }));
      setNote('');
      setBanner({ ok: true, text: `Step ${decision}.` });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to record decision');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const status = approval?.status || 'not_started';
  const steps = approval?.steps || [];
  const chainStarted = steps.length > 0;
  const anyDecided = steps.some((s) => s.status === 'approved' || s.status === 'rejected');

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
            <div className="min-w-0 flex-1">
              <CardTitle className="text-sm">Approval chain</CardTitle>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Custom chain, recorded by you after confirming with each approver
              </p>
            </div>
            {chainStarted && (
              <Badge variant="outline" className={`text-[9px] shrink-0 ${APPROVAL_TONE[status] || ''}`}>
                {status.replace(/_/g, ' ')}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">

          {!hasCompensation ? (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-amber-200 bg-amber-50 text-xs text-amber-700">
              <AlertTriangle className="h-4 w-4 shrink-0" /> Finish Build (compensation) before setting up the approval chain.
            </div>
          ) : !chainStarted || editingChain ? (
            <div className="space-y-2">
              {editingChain && anyDecided && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-amber-200 bg-amber-50 text-[11px] text-amber-700">
                  This chain already has decisions recorded — it can't be edited anymore.
                </div>
              )}
              {(!editingChain || !anyDecided) && (
                <>
                  {draftSteps.map((step, i) => (
                    <ApprovalStepRow
                      key={i}
                      step={step}
                      onRoleChange={(v) => updateDraftStep(i, 'role', v)}
                      onNameChange={(v) => updateDraftStep(i, 'name', v)}
                      onRemove={() => removeDraftStep(i)}
                    />
                  ))}
                  <div className="flex items-center gap-2 pt-1">
                    <Button size="sm" variant="outline" className="text-xs h-7" onClick={addDraftStep}>
                      <Plus className="h-3 w-3 mr-1" /> Add step
                    </Button>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button size="sm" className="text-xs" onClick={handleSetupChain} disabled={saving}>
                      {saving ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Check className="h-3.5 w-3.5 mr-1.5" />}
                      {chainStarted ? 'Save chain' : 'Start approval chain'}
                    </Button>
                    {editingChain && (
                      <Button size="sm" variant="ghost" className="text-xs" onClick={() => setEditingChain(false)} disabled={saving}>
                        Cancel
                      </Button>
                    )}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {!anyDecided && (
                <div className="flex justify-end">
                  <Button size="sm" variant="ghost" className="text-xs h-7" onClick={startEditChain}>
                    <Pencil className="h-3 w-3 mr-1.5" /> Edit chain
                  </Button>
                </div>
              )}

              <div className="rounded-lg border divide-y">
                {steps.map((step, i) => {
                  const isApproved = step.status === 'approved';
                  const isRejected = step.status === 'rejected';
                  const isActive = i === activeIndex;

                  return (
                    <div key={i} className="p-3 space-y-2">
                      <div className="flex items-center gap-3">
                        <span className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 ${
                          isApproved ? 'bg-emerald-500 text-white'
                          : isRejected ? 'bg-rose-500 text-white'
                          : isActive ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                        }`}>
                          {isApproved ? <Check className="h-3.5 w-3.5" />
                            : isRejected ? <X className="h-3.5 w-3.5" />
                            : isActive ? <Clock className="h-3.5 w-3.5" />
                            : <Circle className="h-2.5 w-2.5" />}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-semibold">{step.role} · {step.name}</div>
                          {step.decided_at && (
                            <div className="text-[10px] text-muted-foreground">
                              {isApproved ? 'Approved' : 'Rejected'} {fmtDate(step.decided_at)}
                            </div>
                          )}
                          {!step.decided_at && (
                            <div className="text-[10px] text-muted-foreground">
                              {isActive ? 'Awaiting decision' : 'Queued'}
                            </div>
                          )}
                        </div>
                        {isApproved && <Badge variant="outline" className="text-[9px] border-emerald-300 text-emerald-700 bg-emerald-50">approved</Badge>}
                        {isRejected && <Badge variant="outline" className="text-[9px] border-rose-300 text-rose-700 bg-rose-50">rejected</Badge>}
                      </div>

                      {step.note && (
                        <div className="flex items-start gap-2 pl-9 text-[11px] text-muted-foreground">
                          <MessageSquareText className="h-3 w-3 shrink-0 mt-0.5" />
                          {step.note}
                        </div>
                      )}

                      {isActive && (
                        <div className="pl-9 space-y-2">
                          {isRejected && (
                            <p className="text-[10px] text-amber-700">
                              Re-confirm with {step.name} and record the corrected decision below.
                            </p>
                          )}
                          <Textarea
                            placeholder="Note (optional)"
                            rows={2}
                            className="text-xs"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                          />
                          <div className="flex gap-2">
                            <Button size="sm" className="text-xs h-7" onClick={() => handleDecide('approved')} disabled={saving}>
                              {saving ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Check className="h-3 w-3 mr-1" />}
                              Approve
                            </Button>
                            <Button size="sm" variant="destructive" className="text-xs h-7" onClick={() => handleDecide('rejected')} disabled={saving}>
                              <ThumbsDown className="h-3 w-3 mr-1" /> Reject
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </CardContent>
      </Card>

      {status === 'approved' && (
        <div className="flex items-center justify-end pt-2 border-t">
          <Button size="sm" variant="outline" className="text-xs" onClick={() => onAdvance('send')}>
            <ChevronRight className="h-3.5 w-3.5 mr-1" /> Go to Send
          </Button>
        </div>
      )}
    </div>
  );
}

function SendSection({ offer, setOffer, setBanner, setError, onAdvance }) {
  const [sending, setSending] = useState(false);
  const [responding, setResponding] = useState(false);
  const [responseMsg, setResponseMsg] = useState('');
  const [responseType, setResponseType] = useState('accept');

  const isApproved = offer.metadata?.approval?.status === 'approved';

  const handleSend = async () => {
    setSending(true);
    setError(null);
    try {
      await offerAPI.sendOfferLetter(offer.id);
      setOffer((prev) => ({ ...prev, offer_status: 'sent' }));
      setBanner({ ok: true, text: 'Offer letter sent.' });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to send offer');
    } finally {
      setSending(false);
    }
  };

  const handleRespond = async () => {
    if (!responseMsg.trim()) {
      setError('Enter a response message');
      return;
    }
    setResponding(true);
    setError(null);
    try {
      await offerAPI.respondToNegotiation(offer.id, responseType, responseMsg.trim());
      setOffer((prev) => ({
        ...prev,
        offer_status: responseType === 'accept' ? 'sent' : responseType === 'decline' ? 'rejected' : prev.offer_status,
      }));
      setResponseMsg('');
      setBanner({ ok: true, text: 'Response sent.' });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to respond');
    } finally {
      setResponding(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Send className="h-4 w-4 text-primary shrink-0" />
            <CardTitle className="text-sm">Offer status</CardTitle>
            <Badge variant="outline" className={`text-[9px] ml-auto ${STATUS_TONE[offer.offer_status] || ''}`}>
              {offer.offer_status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {offer.offer_status === 'draft' && !isApproved && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-amber-200 bg-amber-50 text-xs text-amber-700">
              <AlertTriangle className="h-4 w-4 shrink-0" /> Offer needs the approval chain completed before it can be sent.
            </div>
          )}

          {offer.offer_status === 'draft' && isApproved && (
            <Button size="sm" className="text-xs" onClick={handleSend} disabled={sending}>
              {sending ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Sending…</> : <><Send className="h-3.5 w-3.5 mr-1.5" /> Send offer letter</>}
            </Button>
          )}

          {offer.offer_status === 'sent' && (
            <p className="text-xs text-muted-foreground">Awaiting candidate response.</p>
          )}

          {offer.offer_status === 'negotiating' && offer.negotiations?.length > 0 && (
            <div className="space-y-3">
              <div className="rounded-lg border divide-y">
                {offer.negotiations.map((n) => (
                  <div key={n.id} className="px-3 py-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold capitalize">{n.initiated_by}</span>
                      <span className="text-[10px] text-muted-foreground">{fmtDate(n.created_at)}</span>
                    </div>
                    <p className="text-muted-foreground mt-0.5">{n.message}</p>
                    {n.requested_salary && (
                      <p className="font-mono mt-0.5">{fmtCurrency(n.requested_salary)}</p>
                    )}
                  </div>
                ))}
              </div>

              <div className="space-y-2 pt-2 border-t">
                <div className="flex gap-2">
                  {['accept', 'counter', 'decline'].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setResponseType(t)}
                      className={`px-2.5 py-1 rounded-full border text-[10px] font-semibold capitalize ${
                        responseType === t ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <Textarea
                  placeholder="Response message"
                  rows={2}
                  className="text-xs"
                  value={responseMsg}
                  onChange={(e) => setResponseMsg(e.target.value)}
                />
                <Button size="sm" className="text-xs" onClick={handleRespond} disabled={responding}>
                  {responding ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Sending…</> : 'Send response'}
                </Button>
              </div>
            </div>
          )}

          {offer.offer_status === 'accepted' && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-emerald-200 bg-emerald-50 text-xs text-emerald-700">
              <Check className="h-4 w-4 shrink-0" /> Offer accepted — proceed to Contract
            </div>
          )}

          {offer.offer_status === 'rejected' && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-rose-200 bg-rose-50 text-xs text-rose-700">
              <X className="h-4 w-4 shrink-0" /> Offer rejected
            </div>
          )}
        </CardContent>
      </Card>

      {offer.offer_status === 'accepted' && (
        <div className="flex items-center justify-end pt-2 border-t">
          <Button size="sm" variant="outline" className="text-xs" onClick={() => onAdvance('contract')}>
            <ChevronRight className="h-3.5 w-3.5 mr-1" /> Go to Contract
          </Button>
        </div>
      )}
    </div>
  );
}

function ContractSection({ offer, setOffer, setBanner, setError }) {
  const [contractType, setContractType] = useState('PKWTT');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);

  if (offer.offer_status !== 'accepted') {
    return (
      <Card>
        <CardContent className="py-10 text-center text-xs text-muted-foreground">
          Contract can only be generated once the offer is accepted.
        </CardContent>
      </Card>
    );
  }

  const handleGenerate = async () => {
    if (!startDate) {
      setError('Start date is required');
      return;
    }
    setGenerating(true);
    setError(null);
    try {
      await offerAPI.generateContract(offer.id, contractType, startDate, contractType === 'PKWT' ? endDate : null);
      setOffer((prev) => ({ ...prev, contract_status: 'ready' }));
      setBanner({ ok: true, text: 'Contract generated.' });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to generate contract');
    } finally {
      setGenerating(false);
    }
  };

  const handleSend = async () => {
    setSending(true);
    setError(null);
    try {
      await offerAPI.sendContract(offer.id);
      setOffer((prev) => ({ ...prev, contract_status: 'sent' }));
      setBanner({ ok: true, text: 'Contract sent for signature.' });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to send contract');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <FileSignature className="h-4 w-4 text-primary shrink-0" />
            <CardTitle className="text-sm">Contract & signing</CardTitle>
            {offer.contract_status && (
              <Badge variant="outline" className="text-[9px] ml-auto">{offer.contract_status}</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">

          {!offer.contract_status || offer.contract_status === 'draft' ? (
            <>
              <div className="flex items-center gap-2 flex-wrap">
                {['PKWTT', 'PKWT'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setContractType(t)}
                    className={`px-2.5 py-1 rounded-full border text-[10px] font-semibold ${
                      contractType === t ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Start date</label>
                  <Input type="date" className="text-xs h-8" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                {contractType === 'PKWT' && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">End date</label>
                    <Input type="date" className="text-xs h-8" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                  </div>
                )}
              </div>
              <Button size="sm" className="text-xs" onClick={handleGenerate} disabled={generating}>
                {generating ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Generating…</> : <><PenLine className="h-3.5 w-3.5 mr-1.5" /> Generate contract</>}
              </Button>
            </>
          ) : offer.contract_status === 'ready' ? (
            <>
              <p className="text-xs text-muted-foreground">Contract generated — ready to send for signature.</p>
              <Button size="sm" className="text-xs" onClick={handleSend} disabled={sending}>
                {sending ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Sending…</> : <><Send className="h-3.5 w-3.5 mr-1.5" /> Send for signature</>}
              </Button>
            </>
          ) : offer.contract_status === 'sent' ? (
            <p className="text-xs text-muted-foreground">Awaiting candidate signature.</p>
          ) : offer.contract_status === 'signed' ? (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-emerald-200 bg-emerald-50 text-xs text-emerald-700">
              <Check className="h-4 w-4 shrink-0" /> Contract signed — offer complete
            </div>
          ) : null}

        </CardContent>
      </Card>
    </div>
  );
}

export default function OfferCandidatePage() {
  const navigate           = useNavigate();
  const { offerId: param } = useParams();
  const offerId            = param ? Number(param) : null;

  const [offer, setOffer]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [banner, setBanner]   = useState(null);
  const [activeSection, setActiveSection] = useState('intake');

  const load = useCallback(async () => {
    if (!offerId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await offerAPI.getOfferById(offerId);
      setOffer(res.data || null);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load offer');
    } finally {
      setLoading(false);
    }
  }, [offerId]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error && !offer) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg border border-red-200 bg-red-50 text-sm text-red-600">
          <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
        </div>
      </div>
    );
  }

  if (!offer) return null;

  return (
    <>
      <div className="sticky top-[52px] z-10 bg-background/95 backdrop-blur-sm -mt-5 -mx-5 px-5 pt-5 pb-4 border-b border-border/60">
        <div className="space-y-3">
          <Button
            variant="ghost" size="sm" className="text-xs -ml-2 w-fit"
            onClick={() => navigate(`/selection/offer-contract/job/${offer.job_id}`)}
          >
            <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back to position
          </Button>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="h-11 w-11 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold flex-shrink-0 text-sm">
              {getInitials(offer.candidate_name || '?')}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg font-bold tracking-tight truncate">
                {offer.candidate_name || `Candidate #${offer.candidate_id}`}
              </h1>
              <div className="text-[11px] text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5">
                <span>{offer.position_title || offer.job_title}</span>
                <span>· {offer.contract_type}</span>
              </div>
            </div>
            <Badge variant="outline" className={`text-[10px] shrink-0 ${STATUS_TONE[offer.offer_status] || 'border-border text-muted-foreground'}`}>
              <FileText className="h-3 w-3 mr-1" />
              {offer.offer_status}
            </Badge>
          </div>
        </div>
      </div>

      <div className="px-6 pb-6 pt-4 space-y-5">

        {error && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-lg border border-red-200 bg-red-50 text-sm text-red-600">
            <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
            <button type="button" onClick={() => setError(null)} className="ml-auto">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {banner && (
          <div className={`flex items-center gap-2 px-4 py-3 rounded-lg border text-sm ${
            banner.ok ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'
          }`}>
            <Check className="h-4 w-4 shrink-0" /> {banner.text}
            <button type="button" onClick={() => setBanner(null)} className="ml-auto">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <SubStageStepper activeSection={activeSection} onSelect={setActiveSection} />

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_220px] gap-6">
          <div className="min-w-0">
            {activeSection === 'intake' && (
              <IntakeSection offer={offer} offerId={offer.id} setBanner={setBanner} setError={setError} />
            )}
            {activeSection === 'build' && (
              <BuildSection offer={offer} setOffer={setOffer} setBanner={setBanner} setError={setError} onAdvance={setActiveSection} />
            )}
            {activeSection === 'approve' && (
              <ApproveSection offer={offer} offerId={offer.id} setOffer={setOffer} setBanner={setBanner} setError={setError} onAdvance={setActiveSection} />
            )}
            {activeSection === 'send' && (
              <SendSection offer={offer} setOffer={setOffer} setBanner={setBanner} setError={setError} onAdvance={setActiveSection} />
            )}
            {activeSection === 'contract' && (
              <ContractSection offer={offer} setOffer={setOffer} setBanner={setBanner} setError={setError} />
            )}
          </div>
          <aside>
            <div className="sticky top-[184px]">
              <CandidateCard offer={offer} />
            </div>
          </aside>
        </div>

      </div>
    </>
  );
}