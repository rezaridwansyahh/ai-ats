import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, Loader2, AlertTriangle, Check, ChevronRight, X,
  FileText, Pencil, Wallet, Send, FileSignature, Plus, Trash2,
  MessageSquareText, PenLine, ShieldCheck, ThumbsDown,
  Copy, Sparkles, RefreshCw, Ban, XCircle, Download, Settings as SettingsIcon,
  Upload, FileCheck2, SkipForward, Lock, Link2, Mail,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { getInitials } from '@/lib/batteries';

import {
  getOfferById, updateCompensation,
  getSlipGaji, recordSlipGaji, skipSlipGaji, reviewSlipGaji,
  sendOffer, revokeOffer, getSendHistory,
  respondToNegotiation,
  generateContract, sendContract,
  getOfferLetterFields, saveOfferLetterData,
  generateOfferLetterPreview, getOfferLetterFinal, saveOfferLetterFinal,
  downloadOfferLetterDocx, downloadOfferLetterPdf,
  getOfferDocument, uploadOfferDocument,
  downloadCandidateFile,
} from '@/api/offer.api';
import {
  getApprovalStatus, decideApproval, generateApprovalViewLink,
} from '@/api/offer-pack.api';
import { getOfferTemplate } from '@/api/offer-template.api';

const SUBSTAGES = [
  { key: 'intake',   number: 1, label: 'Intake',   sub: 'slip gaji'                 },
  { key: 'build',    number: 2, label: 'Build',    sub: 'compensation'              },
  { key: 'review',   number: 3, label: 'Review',   sub: 'summary · letter · approval' },
  { key: 'send',     number: 4, label: 'Send',     sub: 'document · negotiate'      },
  { key: 'contract', number: 5, label: 'Contract', sub: 'sign'                      },
];

const STATUS_TONE = {
  draft:       'border-slate-300 text-slate-700 bg-slate-50',
  sent:        'border-blue-300 text-blue-700 bg-blue-50',
  negotiating: 'border-amber-300 text-amber-700 bg-amber-50',
  accepted:    'border-emerald-300 text-emerald-700 bg-emerald-50',
  rejected:    'border-rose-300 text-rose-700 bg-rose-50',
  expired:     'border-gray-300 text-gray-500 bg-gray-50',
};

const DECISION_TONE = {
  approved: 'border-emerald-300 text-emerald-700 bg-emerald-50',
  amend:    'border-amber-300 text-amber-700 bg-amber-50',
  rejected: 'border-rose-300 text-rose-700 bg-rose-50',
};

const DECISION_LABEL = {
  approved: 'Approved',
  amend:    'Amend requested',
  rejected: 'Not approved',
};

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

function downloadBlob(blobResponse, fallbackFilename) {
  let filename = fallbackFilename;
  const disposition = blobResponse.headers?.['content-disposition'];
  if (disposition) {
    const match = disposition.match(/filename="?([^"]+)"?/);
    if (match?.[1]) filename = match[1];
  }

  const url = window.URL.createObjectURL(new Blob([blobResponse.data]));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
}

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const diffMs = new Date(dateStr).getTime() - Date.now();
  return Math.max(0, Math.ceil(diffMs / (24 * 60 * 60 * 1000)));
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

function CandidateCard({ offer, approval }) {
  const currentDecision = approval?.current?.decision;
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
          {currentDecision && (
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] text-muted-foreground">Approval</span>
              <Badge variant="outline" className={`text-[9px] ${DECISION_TONE[currentDecision] || ''}`}>
                {DECISION_LABEL[currentDecision] || currentDecision}
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

const DEFAULT_ROWS = [
  { label: 'Gaji Pokok', amount: '' },
  { label: 'Transport', amount: '' },
  { label: 'Meal', amount: '' },
  { label: 'Komisi / Insentif', amount: '' },
  { label: 'Lain-lain', amount: '' },
];

function IntakeSection({ offer, offerId, setOffer, setBanner, setError, onAdvance }) {
  const initialSlipGaji = offer.metadata?.intake?.slip_gaji || { status: 'not_recorded' };

  const [slipGaji, setSlipGaji] = useState(initialSlipGaji);
  const [saving, setSaving]     = useState(false);
  const [editing, setEditing]   = useState(false);
  const [lineItems, setLineItems] = useState(DEFAULT_ROWS.map((r) => ({ ...r })));
  const [expectedSalary, setExpectedSalary] = useState('');
  const [skipReason, setSkipReason] = useState('');
  const [reviewNote, setReviewNote] = useState('');
  const [showSkip, setShowSkip] = useState(false);

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
      const res = await recordSlipGaji(offerId, cleaned, expectedSalary ? Number(expectedSalary) : null);
      const updated = res.data?.slip_gaji;
      setSlipGaji(updated);
      setOffer((prev) => ({
        ...prev,
        metadata: { ...(prev.metadata || {}), intake: { ...(prev.metadata?.intake || {}), slip_gaji: updated } },
      }));
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
      const res = await skipSlipGaji(offerId, skipReason || null);
      setSlipGaji(res.data?.slip_gaji);
      setOffer((prev) => ({
        ...prev,
        metadata: { ...(prev.metadata || {}), intake: { ...(prev.metadata?.intake || {}), slip_gaji: res.data?.slip_gaji } },
      }));
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
      const res = await reviewSlipGaji(offerId, reviewNote);
      setSlipGaji(res.data?.slip_gaji);
      setOffer((prev) => ({
        ...prev,
        metadata: { ...(prev.metadata || {}), intake: { ...(prev.metadata?.intake || {}), slip_gaji: res.data?.slip_gaji } },
      }));
      setBanner({ ok: true, text: 'Review recorded.' });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to save review');
    } finally {
      setSaving(false);
    }
  };

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

      <div className="flex items-center justify-between gap-3 pt-2 border-t">
        <p className="text-[10px] text-muted-foreground">
          Already have a finalized offer letter ready to upload? You can skip straight to Send.
        </p>
        <Button size="sm" variant="ghost" className="text-xs text-muted-foreground" onClick={() => onAdvance('send')}>
          <SkipForward className="h-3.5 w-3.5 mr-1" /> Skip to Send
        </Button>
      </div>
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
      const res = await updateCompensation(offer.id, {
        base_salary: Number(baseSalary),
        allowances: toObject(allowances),
        bonus_structure: toObject(bonuses),
      });
      const comp = res.data.compensation;
      setOffer((prev) => ({
        ...prev,
        base_salary: comp.base_salary,
        allowances: comp.allowances,
        bonus_structure: comp.bonus_structure,
        gross_salary: comp.gross_salary,
        pph21: comp.pph21,
        bpjs_kesehatan: comp.bpjs_kesehatan,
        bpjs_ketenagakerjaan: comp.bpjs_ketenagakerjaan,
        net_salary: comp.net_salary,
      }));
      setBanner({ ok: true, text: 'Compensation saved.' });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to update compensation');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <TemplateFieldsPart offer={offer} setBanner={setBanner} setError={setError} />

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
          {offer.offer_status === 'draft' ? 'Review the offer once compensation is finalized' : 'Offer already sent'}
        </p>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" className="text-xs text-muted-foreground" onClick={() => onAdvance('send')}>
            <SkipForward className="h-3.5 w-3.5 mr-1" /> Skip to Send
          </Button>
          <Button size="sm" variant="outline" className="text-xs" onClick={() => onAdvance('review')}>
            <ChevronRight className="h-3.5 w-3.5 mr-1" /> Go to Review
          </Button>
        </div>
      </div>
    </div>
  );
}

/* Approval — UNCHANGED. Uses offer-pack.api.js, out of scope for this pass. */

function DecisionHistoryList({ history }) {
  if (!history || history.length === 0) return null;
  return (
    <div className="space-y-1.5 pt-2 border-t">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Decision history</p>
      <div className="rounded-lg border divide-y">
        {history.map((h) => (
          <div key={h.id} className="p-2.5 text-xs space-y-1">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <Badge variant="outline" className={`text-[9px] ${DECISION_TONE[h.decision] || ''}`}>
                {DECISION_LABEL[h.decision] || h.decision}
              </Badge>
              <span className="text-[10px] text-muted-foreground">
                {fmtDate(h.decided_at)}{h.decided_by_name ? ` · ${h.decided_by_name}` : ''}
              </span>
            </div>
            {h.note && (
              <p className="text-[11px] text-muted-foreground flex items-start gap-1.5">
                <MessageSquareText className="h-3 w-3 shrink-0 mt-0.5" /> {h.note}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ApprovalViewLinkPart({ offerId, viewLink, setApproval, setBanner, setError }) {
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const portalUrl = viewLink?.portal_link ? `${window.location.origin}${viewLink.portal_link}` : null;

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await generateApprovalViewLink(offerId, 7);
      setApproval((prev) => ({
        ...(prev || {}),
        view_link: {
          portal_link: res.data.portal_link,
          token_expires_at: res.data.token_expires_at,
          sent_to_email: res.data.sent_to_email,
          generated_at: new Date(),
        },
      }));
      setBanner({ ok: true, text: 'View link generated.' });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to generate view link');
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!portalUrl) return;
    try {
      await navigator.clipboard.writeText(portalUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  return (
    <div className="space-y-2 pb-2 border-b">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        Optional — read-only view (data summary only, no letter), gated by your own account email
      </p>

      {viewLink && portalUrl ? (
        <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-[11px] text-muted-foreground">
              Gated to <strong>{viewLink.sent_to_email}</strong> — your account email
            </span>
            {viewLink.token_expires_at && (
              <span className="text-[10px] text-muted-foreground">Expires {fmtDate(viewLink.token_expires_at)}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 truncate text-[11px] font-mono text-foreground bg-background border rounded px-2 py-1.5">
              {portalUrl}
            </code>
            <Button size="sm" variant="outline" className="h-7 text-xs shrink-0" onClick={handleCopy}>
              {copied ? <><Check className="h-3 w-3 mr-1" /> Copied</> : <><Copy className="h-3 w-3 mr-1" /> Copy</>}
            </Button>
          </div>
          <Button size="sm" variant="ghost" className="text-xs h-7" onClick={handleGenerate} disabled={generating}>
            {generating ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5 mr-1.5" />}
            Regenerate
          </Button>
        </div>
      ) : (
        <Button size="sm" className="text-xs h-8" onClick={handleGenerate} disabled={generating}>
          {generating ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Link2 className="h-3.5 w-3.5 mr-1.5" />}
          Generate view link
        </Button>
      )}
    </div>
  );
}

function ApproveSection({ offer, offerId, approval, setApproval, setBanner, setError, onAdvance }) {
  const [deciding, setDeciding] = useState(null); // 'approved' | 'amend' | 'rejected' | null
  const [amendNote, setAmendNote] = useState('');
  const [showAmendForm, setShowAmendForm] = useState(false);
  const [rejectNote, setRejectNote] = useState('');
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);

  const hasCompensation = offer.base_salary != null;
  const isDraft = offer.offer_status === 'draft';
  const current = approval?.current || null;
  const history = approval?.history || [];
  const viewLink = approval?.view_link || null;

  const refresh = async () => {
    const res = await getApprovalStatus(offerId);
    setApproval(res.data);
  };

  const submitDecision = async (decision, note) => {
    setDeciding(decision);
    setError(null);
    try {
      await decideApproval(offerId, decision, note || null);
      await refresh();
      setShowAmendForm(false);
      setAmendNote('');
      setShowRejectConfirm(false);
      setRejectNote('');
      setBanner({
        ok: true,
        text: decision === 'approved' ? 'Offer approved.' : decision === 'amend' ? 'Amend requested.' : 'Marked as not approved.',
      });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to record decision');
    } finally {
      setDeciding(null);
    }
  };

  const handleAmendSubmit = () => {
    if (!amendNote.trim()) {
      setError('A note is required when requesting an amend');
      return;
    }
    submitDecision('amend', amendNote.trim());
  };

  const canDecide = hasCompensation && isDraft;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
            <div className="min-w-0 flex-1">
              <CardTitle className="text-sm">Approval</CardTitle>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                One decision from a higher-up — approve, request changes, or close the offer
              </p>
            </div>
            {current && (
              <Badge variant="outline" className={`text-[9px] shrink-0 ${DECISION_TONE[current.decision] || ''}`}>
                {DECISION_LABEL[current.decision] || current.decision}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">

          {!hasCompensation ? (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-amber-200 bg-amber-50 text-xs text-amber-700">
              <AlertTriangle className="h-4 w-4 shrink-0" /> Finish Build (compensation) before recording an approval decision.
            </div>
          ) : !isDraft ? (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-600">
              <Lock className="h-4 w-4 shrink-0" /> Offer is no longer in draft — approval no longer applies.
            </div>
          ) : null}

          {current && (
            <div className={`flex items-start gap-2 px-3 py-2 rounded-lg border text-xs ${DECISION_TONE[current.decision] || ''}`}>
              {current.decision === 'approved' ? <Check className="h-4 w-4 shrink-0 mt-0.5" />
                : current.decision === 'amend' ? <RefreshCw className="h-4 w-4 shrink-0 mt-0.5" />
                : <X className="h-4 w-4 shrink-0 mt-0.5" />}
              <div>
                <span className="font-semibold">{DECISION_LABEL[current.decision] || current.decision}</span>
                {' '}{fmtDate(current.decided_at)}{current.decided_by_name ? ` · by ${current.decided_by_name}` : ''}
                {current.note && <p className="italic mt-0.5">"{current.note}"</p>}
              </div>
            </div>
          )}

          {/* View link — sits above the decide controls */}
          <ApprovalViewLinkPart
            offerId={offerId} viewLink={viewLink}
            setApproval={setApproval} setBanner={setBanner} setError={setError}
          />

          {canDecide && !showAmendForm && !showRejectConfirm && (
            <div className="grid grid-cols-3 gap-2">
              <Button
                size="sm" className="text-xs bg-emerald-600 hover:bg-emerald-700"
                onClick={() => submitDecision('approved', null)} disabled={!!deciding}
              >
                {deciding === 'approved' ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Check className="h-3.5 w-3.5 mr-1.5" />}
                Approve
              </Button>
              <Button
                size="sm" variant="outline" className="text-xs text-amber-700 border-amber-300 hover:bg-amber-50"
                onClick={() => setShowAmendForm(true)} disabled={!!deciding}
              >
                <PenLine className="h-3.5 w-3.5 mr-1.5" /> Amend
              </Button>
              <Button
                size="sm" variant="outline" className="text-xs text-rose-600 border-rose-300 hover:bg-rose-50"
                onClick={() => setShowRejectConfirm(true)} disabled={!!deciding}
              >
                <ThumbsDown className="h-3.5 w-3.5 mr-1.5" /> Not Approved
              </Button>
            </div>
          )}

          {canDecide && showAmendForm && (
            <div className="space-y-2 p-3 rounded-lg border border-amber-200 bg-amber-50/40">
              <p className="text-[11px] text-amber-700">
                Explain what needs to change — Intake, Build, and the offer letter stay unlocked so you can rework them; nothing is wiped.
              </p>
              <Textarea
                value={amendNote}
                onChange={(e) => setAmendNote(e.target.value)}
                placeholder="What needs to change? (required)"
                rows={3}
                className="text-xs"
              />
              <div className="flex gap-2">
                <Button size="sm" className="text-xs h-8 bg-amber-600 hover:bg-amber-700" onClick={handleAmendSubmit} disabled={deciding === 'amend'}>
                  {deciding === 'amend' ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : null} Submit amend
                </Button>
                <Button size="sm" variant="ghost" className="text-xs h-8" onClick={() => { setShowAmendForm(false); setAmendNote(''); }} disabled={deciding === 'amend'}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {canDecide && showRejectConfirm && (
            <div className="space-y-2 p-3 rounded-lg border border-rose-200 bg-rose-50/40">
              <p className="text-[11px] text-rose-700 font-semibold">
                Are you sure? This ends the candidate's journey on this offer — nothing further can be done from here.
              </p>
              <Textarea
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                placeholder="Note (optional)"
                rows={2}
                className="text-xs"
              />
              <div className="flex gap-2">
                <Button size="sm" variant="destructive" className="text-xs h-8" onClick={() => submitDecision('rejected', rejectNote.trim() || null)} disabled={deciding === 'rejected'}>
                  {deciding === 'rejected' ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : null} Confirm Not Approved
                </Button>
                <Button size="sm" variant="ghost" className="text-xs h-8" onClick={() => { setShowRejectConfirm(false); setRejectNote(''); }} disabled={deciding === 'rejected'}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          <DecisionHistoryList history={history} />

        </CardContent>
      </Card>

      {current?.decision === 'approved' && (
        <div className="flex items-center justify-end pt-2 border-t">
          <Button size="sm" variant="outline" className="text-xs" onClick={() => onAdvance('send')}>
            <ChevronRight className="h-3.5 w-3.5 mr-1" /> Go to Send
          </Button>
        </div>
      )}
    </div>
  );
}

/* Review Section — A. Data summary · B. Offer letter · C. Approval */

function DataSummaryPart({ offer }) {
  const slipGaji = offer.metadata?.intake?.slip_gaji;
  const isIntakeSkipped = slipGaji?.status === 'skipped';
  const hasIntake = slipGaji?.status === 'recorded';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Wallet className="h-4 w-4 text-primary" /> Intake summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-xs">
          {isIntakeSkipped ? (
            <Badge variant="outline" className="text-[9px]">
              skipped{slipGaji.skip_reason ? ` — ${slipGaji.skip_reason}` : ''}
            </Badge>
          ) : hasIntake ? (
            <>
              {slipGaji.line_items.map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-mono">{fmtCurrency(item.amount)}</span>
                </div>
              ))}
              <div className="flex items-center justify-between pt-1 border-t font-semibold">
                <span>Total</span>
                <span className="font-mono">{fmtCurrency(slipGaji.total)}</span>
              </div>
            </>
          ) : (
            <p className="text-muted-foreground italic">Not recorded yet.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Wallet className="h-4 w-4 text-primary" /> Build summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-xs">
          {offer.base_salary != null ? (
            <>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Base salary</span>
                <span className="font-mono">{fmtCurrency(offer.base_salary)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Gross salary</span>
                <span className="font-mono">{fmtCurrency(offer.gross_salary)}</span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t font-semibold">
                <span>Net salary</span>
                <span className="font-mono">{fmtCurrency(offer.net_salary)}</span>
              </div>
            </>
          ) : (
            <p className="text-muted-foreground italic">Not built yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function TemplateGateCard({ template, loading }) {
  if (loading) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!template) {
    return (
      <Card className="border-amber-200 bg-amber-50/40">
        <CardContent className="p-4 flex items-center justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-amber-800">No offer letter template uploaded</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Upload your company's offer letter template (.docx) in Settings before building this offer.
            </p>
          </div>
          <Button size="sm" className="text-xs shrink-0" asChild>
            <Link to="/settings" state={{ section: 'offer-template' }}>
              <SettingsIcon className="h-3.5 w-3.5 mr-1.5" /> Go to Settings
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-3 flex items-center justify-between gap-3 flex-wrap text-xs">
        <span className="flex items-center gap-2 text-muted-foreground">
          <FileText className="h-3.5 w-3.5 shrink-0" />
          Using company template · {template.fields?.length || 0} field{template.fields?.length === 1 ? '' : 's'} detected
        </span>
        <Link
          to="/settings"
          state={{ section: 'offer-template' }}
          className="text-primary hover:underline shrink-0"
        >
          Want to upload a different template? Go to Settings →
        </Link>
      </CardContent>
    </Card>
  );
}

function TemplateFieldsPart({ offer, setBanner, setError }) {
  const [template, setTemplate] = useState(null);
  const [fields, setFields] = useState([]);
  const [values, setValues] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [templateRes, fieldsRes] = await Promise.all([
        getOfferTemplate(),
        getOfferLetterFields(offer.id),
      ]);
      setTemplate(templateRes.data?.template || null);
      setFields(fieldsRes.data?.fields || []);
      setValues(fieldsRes.data?.values || {});
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load offer letter fields');
    } finally {
      setLoading(false);
    }
  }, [offer.id]);

  useEffect(() => { load(); }, [load]);

  const updateValue = (key, value) => setValues((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await saveOfferLetterData(offer.id, values);
      setBanner({ ok: true, text: 'Offer letter fields saved.' });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to save offer letter fields');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <TemplateGateCard template={template} loading={loading} />

      {!loading && template && offer.base_salary != null && (
        <Card className="bg-muted/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">
              Compensation reference · from this section
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-xs">
            <div className="flex justify-between"><span className="text-muted-foreground">Base salary</span><span className="font-mono">{fmtCurrency(offer.base_salary)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Gross salary</span><span className="font-mono">{fmtCurrency(offer.gross_salary)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">PPh 21</span><span className="font-mono">{fmtCurrency(offer.pph21)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">BPJS Kesehatan</span><span className="font-mono">{fmtCurrency(offer.bpjs_kesehatan)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">BPJS Ketenagakerjaan</span><span className="font-mono">{fmtCurrency(offer.bpjs_ketenagakerjaan)}</span></div>
            <div className="flex justify-between font-semibold border-t pt-1"><span>Net salary</span><span className="font-mono">{fmtCurrency(offer.net_salary)}</span></div>
          </CardContent>
        </Card>
      )}

      {!loading && template && fields.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Offer letter fields</CardTitle>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              From your company's template — type the value for each {'<<field>>'} manually. Copy figures from the
              reference above if your template needs a salary amount.
            </p>
          </CardHeader>
          <CardContent className="space-y-2">
            {fields.map((field) => (
              <div key={field} className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {field}
                </label>
                <Input
                  className="text-xs h-8"
                  value={values[field] || ''}
                  onChange={(e) => updateValue(field, e.target.value)}
                />
              </div>
            ))}
            <Button size="sm" className="text-xs" onClick={handleSave} disabled={saving}>
              {saving ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Saving…</> : <><Check className="h-3.5 w-3.5 mr-1.5" /> Save fields</>}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function OfferLetterSummaryPart({ offer, setOffer, setBanner, setError }) {
  const [html, setHtml] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const editableRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getOfferLetterFinal(offer.id);
      setHtml(res.data?.html || null);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load offer letter');
    } finally {
      setLoading(false);
    }
  }, [offer.id]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (editing && editableRef.current) {
      editableRef.current.innerHTML = html || '';
      editableRef.current.focus();
    }
  }, [editing]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await generateOfferLetterPreview(offer.id);
      setHtml(res.data?.html || '');
      setOffer((prev) => ({
        ...prev,
        metadata: {
          ...(prev.metadata || {}),
          offer_letter_final: { html: res.data?.html, edited: false, generated_at: new Date() },
        },
      }));
      setBanner({ ok: true, text: 'Offer letter merged from your template.' });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to generate offer letter');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    setError(null);
    try {
      const res = await downloadOfferLetterDocx(offer.id);
      downloadBlob(res, `offer_letter_${offer.id}.docx`);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to download offer letter');
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);
    setError(null);
    try {
      const res = await downloadOfferLetterPdf(offer.id);
      downloadBlob(res, `offer_letter_${offer.id}.pdf`);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to download PDF');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const startEdit = () => setEditing(true);

  const handleSaveEdit = async () => {
    const currentHtml = editableRef.current?.innerHTML || '';
    setSaving(true);
    setError(null);
    try {
      const res = await saveOfferLetterFinal(offer.id, currentHtml);
      setHtml(res.data?.html || currentHtml);
      setOffer((prev) => ({
        ...prev,
        metadata: { ...(prev.metadata || {}), offer_letter_final: res.data },
      }));
      setEditing(false);
      setBanner({ ok: true, text: 'Preview text saved — note the downloads still reflect the original merge, not this edit.' });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to save edits');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-6"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>;
  }

  const hasContent = html != null && html !== '';

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary shrink-0" />
          <div className="min-w-0 flex-1">
            <CardTitle className="text-sm">Offer letter</CardTitle>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {editing ? 'Editing preview text — the download stays as the original merge' : hasContent ? 'Preview of the merged document' : 'Not generated yet'}
            </p>
          </div>
          {hasContent && !editing && (
            <Button size="sm" variant="outline" className="text-xs h-7" onClick={startEdit}>
              <Pencil className="h-3 w-3 mr-1.5" /> Edit
            </Button>
          )}
          <Button size="sm" variant="outline" className="text-xs h-7" onClick={handleGenerate} disabled={generating || editing}>
            {generating ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5 mr-1.5" />}
            {hasContent ? 'Re-generate' : 'Generate'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {!hasContent && !editing ? (
          <div className="py-8 text-center text-xs text-muted-foreground italic">
            Fill in the fields above, then click Generate to merge them into your template.
          </div>
        ) : editing ? (
          <>
            <div
              ref={editableRef}
              className="prose prose-sm max-w-none border rounded-lg p-4 min-h-[300px] focus:outline-none"
              contentEditable
              suppressContentEditableWarning
            />
            <div className="flex gap-2">
              <Button size="sm" className="text-xs" onClick={handleSaveEdit} disabled={saving}>
                {saving ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Saving…</> : <><Check className="h-3.5 w-3.5 mr-1.5" /> Save</>}
              </Button>
              <Button size="sm" variant="ghost" className="text-xs" onClick={() => setEditing(false)} disabled={saving}>
                Cancel
              </Button>
            </div>
          </>
        ) : (
          <>
            <div
              className="prose prose-sm max-w-none border rounded-lg p-4 bg-muted/10 max-h-[500px] overflow-y-auto"
              dangerouslySetInnerHTML={{ __html: html }}
            />
            <div className="flex gap-2 pt-1 border-t">
              <Button size="sm" variant="outline" className="text-xs" onClick={handleDownload} disabled={downloading}>
                {downloading ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Download className="h-3.5 w-3.5 mr-1.5" />}
                Download .docx
              </Button>
              <Button size="sm" variant="outline" className="text-xs" onClick={handleDownloadPdf} disabled={downloadingPdf}>
                {downloadingPdf ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Download className="h-3.5 w-3.5 mr-1.5" />}
                Download .pdf
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function ReviewSection({ offer, offerId, approval, setApproval, setOffer, setBanner, setError, onAdvance }) {
  return (
    <div className="space-y-5">

      <div>
        <p className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground mb-2">
          A. Data summary
        </p>
        <DataSummaryPart offer={offer} />
      </div>

      <div>
        <p className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground mb-2">
          B. Offer letter
        </p>
        <OfferLetterSummaryPart offer={offer} setOffer={setOffer} setBanner={setBanner} setError={setError} />
      </div>

      <div>
        <p className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground mb-2">
          C. Approval
        </p>
        <ApproveSection
          offer={offer} offerId={offerId} approval={approval} setApproval={setApproval}
          setBanner={setBanner} setError={setError} onAdvance={onAdvance}
        />
      </div>

      <div className="flex items-center justify-between gap-3 pt-2 border-t">
        <p className="text-[10px] text-muted-foreground">
          Already have a finalized offer letter ready to upload? You can skip approval and go straight to Send.
        </p>
        <Button size="sm" variant="ghost" className="text-xs text-muted-foreground" onClick={() => onAdvance('send')}>
          <SkipForward className="h-3.5 w-3.5 mr-1" /> Skip to Send
        </Button>
      </div>

    </div>
  );
}

function OfferDocumentUploadPart({ offer, offerId, document, setDocument, setBanner, setError }) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; 
    if (!file) return;

    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await uploadOfferDocument(offerId, formData);
      setDocument(res.data.document);
      setBanner({ ok: true, text: 'Finalized offer letter uploaded.' });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Upload className="h-4 w-4 text-primary shrink-0" />
          <div className="min-w-0 flex-1">
            <CardTitle className="text-sm">Upload finalized offer letter</CardTitle>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Generated it in Review, or already have your own finalized letter? Upload the signed-off .docx or .pdf here — required before generating a portal link. This is what the candidate downloads from the portal.
            </p>
          </div>
          {document && (
            <Badge variant="outline" className="text-[9px] shrink-0 border-emerald-300 text-emerald-700 bg-emerald-50">
              uploaded
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {document ? (
          <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg border bg-muted/20 text-xs">
            <span className="flex items-center gap-2 text-muted-foreground truncate">
              <FileCheck2 className="h-3.5 w-3.5 shrink-0" />
              {document.file?.split('/').pop() || 'Uploaded file'}
            </span>
            <span className="text-[10px] text-muted-foreground shrink-0">{fmtDate(document.uploaded_at)}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-amber-200 bg-amber-50 text-xs text-amber-700">
            <AlertTriangle className="h-4 w-4 shrink-0" /> No finalized document uploaded yet.
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept=".docx,.pdf"
          className="hidden"
          onChange={handleFileSelect}
        />
        <Button
          size="sm" variant="outline" className="text-xs"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading
            ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Uploading…</>
            : <><Upload className="h-3.5 w-3.5 mr-1.5" /> {document ? 'Replace file' : 'Upload file'}</>}
        </Button>
      </CardContent>
    </Card>
  );
}

function GenerateLinkRow({ onGenerate, generating, label = 'Generate link' }) {
  return (
    <div className="rounded-lg border border-dashed bg-muted/20 p-3 flex items-center justify-between gap-3 flex-wrap">
      <div className="min-w-0">
        <p className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">
          Portal link
        </p>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          Generate a portal link for the candidate to download, review, and submit their signed copy back.
        </p>
      </div>
      <Button size="sm" onClick={onGenerate} disabled={generating} className="shrink-0">
        {generating
          ? <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> Generating…</>
          : <><Sparkles className="h-3.5 w-3.5 mr-1.5" /> {label}</>}
      </Button>
    </div>
  );
}

function PortalLinkRow({ url, expiresAt, sentAt, onRegenerate, onRevoke, generating }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  return (
    <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">
          Portal link · offer token
        </p>
        <span className="text-[10px] text-muted-foreground">Expires {fmtDate(expiresAt)}</span>
      </div>
      <div className="flex items-center gap-2">
        <code className="flex-1 truncate text-[11px] font-mono text-foreground bg-background border rounded px-2 py-1.5">
          {url}
        </code>
        <Button size="sm" variant="outline" className="h-7 text-xs shrink-0" onClick={handleCopy}>
          {copied ? <><Check className="h-3 w-3 mr-1" /> Copied</> : <><Copy className="h-3 w-3 mr-1" /> Copy</>}
        </Button>
        <Button
          size="sm" variant="outline" className="h-7 text-xs shrink-0"
          onClick={onRegenerate} disabled={generating} title="Regenerate link"
        >
          <RefreshCw className="h-3 w-3" />
        </Button>
        <Button
          size="sm" variant="outline"
          className="h-7 text-xs shrink-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
          onClick={onRevoke}
        >
          <Ban className="h-3 w-3 mr-1" /> Revoke
        </Button>
      </div>
      <p className="text-[10px] text-muted-foreground">sent {fmtDate(sentAt)}</p>
    </div>
  );
}

function buildDefaultOfferEmail(jobTitle) {
  return {
    subject: `Your Offer Letter — ${jobTitle || 'the position'}`,
    body: `Hi there,\n\nCongratulations! We're pleased to offer you the position${jobTitle ? ` of ${jobTitle}` : ''}.\n\nPlease review your offer letter and submit your signed copy via the link below:\n\n{{LINK}}\n\nThis link is personal — kindly do not share it with others.\n\nThank you,\nThe Recruitment Team`,
  };
}

function CandidateSignedFilePart({ offer, isSubmitted, submittedAt }) {
  const [downloading, setDownloading] = useState(false);
  const [localError, setLocalError] = useState(null);

  const handleDownload = async () => {
    setDownloading(true);
    setLocalError(null);
    try {
      const res = await downloadCandidateFile(offer.id);
      downloadBlob(res, `signed_offer_${offer.candidate_name || offer.id}`);
    } catch (err) {
      setLocalError(err.response?.data?.message || err.message || 'Failed to download the signed file');
    } finally {
      setDownloading(false);
    }
  };

  if (!isSubmitted) return null;

  return (
    <div className="rounded-lg border bg-muted/30 p-3 flex items-center justify-between gap-3 flex-wrap">
      <div className="min-w-0">
        <p className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">
          Signed copy from candidate
        </p>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          Submitted {fmtDate(submittedAt)}
        </p>
        {localError && (
          <p className="text-[11px] text-rose-600 mt-1">{localError}</p>
        )}
      </div>
      <Button size="sm" variant="outline" className="text-xs shrink-0" onClick={handleDownload} disabled={downloading}>
        {downloading
          ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Downloading…</>
          : <><Download className="h-3.5 w-3.5 mr-1.5" /> Download signed file</>}
      </Button>
    </div>
  );
}

function SendSection({ offer, approval, setOffer, setBanner, setError, onAdvance }) {
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [sending, setSending] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [showRevoke, setShowRevoke] = useState(false);
  const [revokeReason, setRevokeReason] = useState('');

  const [responding, setResponding] = useState(false);
  const [responseMsg, setResponseMsg] = useState('');
  const [responseType, setResponseType] = useState('accept');

  const [document, setDocument] = useState(null);
  const [loadingDocument, setLoadingDocument] = useState(true);

  const [emailModal, setEmailModal] = useState({ open: false, subject: '', body: '' });

  const isApproved = approval?.current?.decision === 'approved';
  const hasLetterGenerated = offer.metadata?.offer_letter_final != null;
  const hasDocument = !!document;

  const loadHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const res = await getSendHistory(offer.id);
      setHistory(res.data || []);
    } catch {
      // not sent yet
    } finally {
      setLoadingHistory(false);
    }
  }, [offer.id]);

  const loadDocument = useCallback(async () => {
    setLoadingDocument(true);
    try {
      const res = await getOfferDocument(offer.id);
      setDocument(res.data || null);
    } catch {
      setDocument(null);
    } finally {
      setLoadingDocument(false);
    }
  }, [offer.id]);

  useEffect(() => { loadHistory(); }, [loadHistory]);
  useEffect(() => { loadDocument(); }, [loadDocument]);

  const latestSend  = history[0] || null;
  const isSubmitted = latestSend?.status === 'submitted';
  const isRevoked    = !isSubmitted && !!latestSend?.revoked_at;
  const isActive     = latestSend?.status === 'sent' && !latestSend?.revoked_at;
  const portalUrl    = isActive ? `${window.location.origin}/offer/send/${latestSend.token}` : null;
  const expiryDaysLeft = isActive ? daysUntil(latestSend.token_expires_at) : null;

  const openSendModal = () => {
    const defaults = buildDefaultOfferEmail(offer.position_title || offer.job_title);
    setEmailModal({ open: true, ...defaults });
  };

  const handleConfirmSend = async () => {
    if (sending) return;
    setSending(true);
    setError(null);
    try {
      await sendOffer(offer.id, { subject: emailModal.subject, body: emailModal.body });
      setOffer((prev) => ({ ...prev, offer_status: prev.offer_status === 'draft' ? 'sent' : prev.offer_status }));
      setEmailModal({ open: false, subject: '', body: '' });
      await loadHistory();
      setBanner({ ok: true, text: latestSend ? 'Link regenerated — previous link revoked.' : 'Offer letter sent — copy the link below to share with the candidate.' });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to send offer');
    } finally {
      setSending(false);
    }
  };

  const handleRevoke = async () => {
    setRevoking(true);
    setError(null);
    try {
      await revokeOffer(offer.id, revokeReason || null);
      await loadHistory();
      setShowRevoke(false);
      setRevokeReason('');
      setBanner({ ok: true, text: 'Offer link revoked.' });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Revoke failed');
    } finally {
      setRevoking(false);
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
      await respondToNegotiation(offer.id, responseType, responseMsg.trim());
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

      <OfferDocumentUploadPart
        offer={offer}
        offerId={offer.id}
        document={document}
        setDocument={setDocument}
        setBanner={setBanner}
        setError={setError}
      />

      {/* Offer letter · portal link */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary shrink-0" />
            <div className="min-w-0 flex-1">
              <CardTitle className="text-sm">Offer letter · portal link</CardTitle>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                candidate downloads, uploads their signed copy, and submits via portal{isSubmitted ? ' ' : ' · revocable until submitted'}
              </p>
            </div>
            <Badge
              variant="outline"
              className={`text-[9px] shrink-0 ${
                isSubmitted ? 'border-emerald-300 text-emerald-700 bg-emerald-50'
                : isRevoked ? 'border-rose-300 text-rose-700 bg-rose-50'
                : isActive  ? 'border-blue-300 text-blue-700 bg-blue-50'
                : 'border-border text-muted-foreground'
              }`}
            >
              {isSubmitted ? 'submitted' : isRevoked ? 'revoked' : isActive ? 'sent' : 'not sent'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">

          {!hasDocument && !latestSend && !loadingDocument && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-amber-200 bg-amber-50 text-xs text-amber-700">
              <AlertTriangle className="h-4 w-4 shrink-0" /> Upload the finalized offer letter above before generating a portal link.
            </div>
          )}

          {!isApproved && !hasLetterGenerated && !latestSend && hasDocument && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-[11px] text-slate-600">
              Note: Build, Review, and Approval were skipped for this offer — sending based on the uploaded document only.
            </div>
          )}

          {isSubmitted && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-emerald-200 bg-emerald-50 text-xs text-emerald-700">
              <Check className="h-4 w-4 shrink-0" /> Signed offer letter submitted {fmtDate(latestSend.submitted_at)}
            </div>
          )}
          {isRevoked && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-rose-200 bg-rose-50 text-xs text-rose-700">
              <XCircle className="h-4 w-4 shrink-0" />
              Link revoked {fmtDate(latestSend.revoked_at)}
              {latestSend.revocation_reason && (
                <span className="italic"> — "{latestSend.revocation_reason}"</span>
              )}
            </div>
          )}

          {isSubmitted ? (
            <div className="rounded-lg border border-dashed bg-emerald-50/50 border-emerald-200 p-3 text-center space-y-0.5">
              <p className="text-[11px] text-emerald-700 font-semibold flex items-center justify-center gap-1.5">
                <Check className="h-3.5 w-3.5" /> Submitted {fmtDate(latestSend.submitted_at)}
              </p>
            </div>
          ) : isActive && portalUrl ? (
            <PortalLinkRow
              url={portalUrl}
              expiresAt={latestSend.token_expires_at}
              sentAt={latestSend.sent_at}
              onRegenerate={openSendModal}
              onRevoke={() => { setShowRevoke(true); setRevokeReason(''); }}
              generating={sending}
            />
          ) : hasDocument ? (
            <GenerateLinkRow
              onGenerate={openSendModal}
              generating={sending}
              label={isRevoked ? 'Regenerate link' : 'Generate link'}
            />
          ) : null}

          <CandidateSignedFilePart
            offer={offer}
            isSubmitted={isSubmitted}
            submittedAt={latestSend?.submitted_at}
          />

          {showRevoke && isActive && (
            <div className="space-y-2 p-3 rounded-lg border border-rose-200 bg-rose-50/30">
              <p className="text-[10px] font-semibold text-rose-700 uppercase tracking-wide">
                Revoke offer link
              </p>
              <Input
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
                placeholder="Reason (optional) — e.g. offer pulled, terms changed"
                className="text-xs h-8"
              />
              <div className="flex gap-2">
                <Button size="sm" variant="destructive" className="text-xs h-8" onClick={handleRevoke} disabled={revoking}>
                  {revoking
                    ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Revoking…</>
                    : 'Confirm revoke'}
                </Button>
                <Button size="sm" variant="ghost" className="text-xs h-8" onClick={() => { setShowRevoke(false); setRevokeReason(''); }}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

        </CardContent>
      </Card>

      {offer.offer_status === 'negotiating' && offer.negotiations?.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">
              Negotiation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
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
          </CardContent>
        </Card>
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

      {/* Offer document preview */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">
              Send · dispatch preview
            </CardTitle>
            <span className="text-[10px] text-muted-foreground">
              candidate-facing email · portal · token-based
            </span>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {loadingHistory ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <div className="rounded-lg border bg-muted/10 overflow-hidden">
                <div className="px-4 py-2.5 border-b bg-muted/20">
                  <p className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">
                    Document preview
                  </p>
                </div>
                <div className="px-4 py-3 space-y-2.5 text-[11px] leading-relaxed text-foreground">
                  <p>Halo {offer.candidate_name || 'Kandidat'},</p>
                  <p>
                    Selamat! Kami senang menawarkan posisi{' '}
                    <strong>{offer.position_title || offer.job_title}</strong>
                    {offer.net_salary != null && (
                      <> dengan paket kompensasi total <strong>{fmtCurrency(offer.net_salary)}</strong>/bulan</>
                    )}.
                  </p>
                  {isActive ? (
                    <>
                      <p>
                        Silakan unduh, tinjau, dan unggah kembali surat penawaran yang telah ditandatangani melalui
                        portal di tautan di bawah ini. Tautan akan kedaluwarsa dalam {expiryDaysLeft ?? '—'} hari.
                      </p>
                      <p className="font-mono text-primary break-all">{portalUrl}</p>
                    </>
                  ) : isSubmitted ? (
                    <p className="text-emerald-700">Surat penawaran yang telah ditandatangani telah diterima.</p>
                  ) : (
                    <p className="text-muted-foreground italic">
                      Belum dikirim — hasilkan tautan portal di atas untuk melihat pratinjau lengkap.
                    </p>
                  )}
                </div>
              </div>

              <div className="rounded-lg border bg-muted/10 overflow-hidden">
                <div className="px-4 py-2.5 border-b bg-muted/20">
                  <p className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">
                    Offer reference
                  </p>
                </div>
                <div className="px-4 py-3 space-y-2 text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Position</span>
                    <span className="font-medium">{offer.position_title || offer.job_title || '—'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Contract type</span>
                    <span className="font-mono">{offer.contract_type || '—'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <span className="font-mono">{isSubmitted ? 'submitted' : isRevoked ? 'revoked' : isActive ? 'sent' : 'not sent'}</span>
                  </div>
                  {latestSend?.sent_by_name && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Sent by</span>
                      <span>{latestSend.sent_by_name}</span>
                    </div>
                  )}
                  {latestSend?.sent_at && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Sent</span>
                      <span>{fmtDate(latestSend.sent_at)}</span>
                    </div>
                  )}
                  {latestSend?.submitted_at && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Submitted</span>
                      <span>{fmtDate(latestSend.submitted_at)}</span>
                    </div>
                  )}
                </div>
              </div>

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

      {/* Email to Candidate modal — same pattern as AI Screening's Q&A send modal */}
      <Dialog open={emailModal.open} onOpenChange={(open) => !open && !sending && setEmailModal((m) => ({ ...m, open: false }))}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary" /> Email to Candidate
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Review and edit the email before sending. The portal link is inserted automatically where you see{' '}
              <code className="bg-muted px-1 rounded">{'{{LINK}}'}</code>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Subject</label>
              <Input
                value={emailModal.subject}
                onChange={(e) => setEmailModal((m) => ({ ...m, subject: e.target.value }))}
                className="h-9 text-sm"
                placeholder="Email subject…"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Body</label>
              <Textarea
                value={emailModal.body}
                onChange={(e) => setEmailModal((m) => ({ ...m, body: e.target.value }))}
                rows={12}
                className="text-sm font-mono leading-relaxed resize-y"
                placeholder="Email body…"
              />
            </div>
            {!emailModal.body.includes('{{LINK}}') && (
              <div className="flex items-start gap-2 px-3 py-2 rounded-md border border-amber-200 bg-amber-50 text-[11px] text-amber-700">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span>
                  <strong>{'{{LINK}}'}</strong> is missing from the body. The portal link will be appended automatically at the bottom of the email.
                </span>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => setEmailModal((m) => ({ ...m, open: false }))}
              disabled={sending}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="text-xs"
              onClick={handleConfirmSend}
              disabled={sending || !emailModal.subject.trim()}
            >
              {sending
                ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Sending…</>
                : <><Send className="h-3.5 w-3.5 mr-1.5" />Confirm Send</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
      await generateContract(offer.id, contractType, startDate, contractType === 'PKWT' ? endDate : null);
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
      await sendContract(offer.id);
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
  const [approval, setApproval] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [banner, setBanner]   = useState(null);
  const [activeSection, setActiveSection] = useState('intake');

  const load = useCallback(async () => {
    if (!offerId) return;
    setLoading(true);
    setError(null);
    try {
      const [offerRes, approvalRes] = await Promise.all([
        getOfferById(offerId),
        getApprovalStatus(offerId).catch(() => null),
      ]);
      setOffer(offerRes.data || null);
      setApproval(approvalRes?.data || { current: null, history: [], view_link: null });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load offer');
    } finally {
      setLoading(false);
    }
  }, [offerId]);

  const hasLoadedRef = useRef(false);
  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;
    load();
  }, [load]);

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
              <IntakeSection offer={offer} offerId={offer.id} setOffer={setOffer} setBanner={setBanner} setError={setError} onAdvance={setActiveSection} />
            )}
            {activeSection === 'build' && (
              <BuildSection offer={offer} setOffer={setOffer} setBanner={setBanner} setError={setError} onAdvance={setActiveSection} />
            )}
            {activeSection === 'review' && (
              <ReviewSection
                offer={offer} offerId={offer.id} approval={approval} setApproval={setApproval}
                setOffer={setOffer} setBanner={setBanner} setError={setError} onAdvance={setActiveSection}
              />
            )}
            {activeSection === 'send' && (
              <SendSection offer={offer} approval={approval} setOffer={setOffer} setBanner={setBanner} setError={setError} onAdvance={setActiveSection} />
            )}
            {activeSection === 'contract' && (
              <ContractSection offer={offer} setOffer={setOffer} setBanner={setBanner} setError={setError} />
            )}
          </div>
          <aside>
            <div className="sticky top-[184px]">
              <CandidateCard offer={offer} approval={approval} />
            </div>
          </aside>
        </div>

      </div>
    </>
  );
}