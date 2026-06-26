import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Loader2, AlertTriangle, Check, ChevronRight,
  Wand2, Plus, X, Pencil, ShieldCheck, FileText,
  ClipboardList, GitBranch, Scale, RotateCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { getInitials } from '@/lib/batteries';

import {
  getBgCheck, getClaims, extractClaims,
  addClaim, updateClaim, toggleClaim, deleteClaim,
  confirmClaims, saveVerdict, updateBgStatus,
} from '@/api/background-check.api';

const VALID_LANES = ['identity', 'edu', 'emp', 'cert', 'crim', 'cred', 'salary'];

const LANE_META = {
  identity: { label: 'identity', color: 'border-blue-200 bg-blue-50 text-blue-700'         },
  edu:      { label: 'edu',      color: 'border-violet-200 bg-violet-50 text-violet-700'    },
  emp:      { label: 'emp',      color: 'border-amber-200 bg-amber-50 text-amber-700'       },
  cert:     { label: 'cert',     color: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
  crim:     { label: 'crim',     color: 'border-rose-200 bg-rose-50 text-rose-700'          },
  cred:     { label: 'cred',     color: 'border-orange-200 bg-orange-50 text-orange-700'    },
  salary:   { label: 'salary',   color: 'border-cyan-200 bg-cyan-50 text-cyan-700'          },
};

const SUBSTAGES = [
  { key: 'claims',  number: 1, label: 'Claims',  sub: 'select items' },
  { key: 'consent', number: 2, label: 'Consent', sub: 'UU PDP'       },
  { key: 'tracker', number: 3, label: 'Tracker', sub: 'run lanes'    },
  { key: 'verdict', number: 4, label: 'Verdict', sub: 'HRM decide'   },
];

const STATUS_ORDER = ['claims', 'consent', 'tracker', 'verdict', 'done'];

const VERDICT_OPTIONS = [
  {
    value:       'pass',
    label:       'Pass',
    description: 'All lanes clean · advance to Offer immediately',
    activeColor: 'border-emerald-500 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-300',
    color:       'border-emerald-200 bg-emerald-50/50 text-emerald-700',
  },
  {
    value:       'pass_with_concerns',
    label:       'Pass with concerns',
    description: 'Concerns noted · flag at Offer-time · proceed if HM accepts',
    activeColor: 'border-amber-500 bg-amber-50 text-amber-700 ring-2 ring-amber-300',
    color:       'border-amber-200 bg-amber-50/50 text-amber-700',
  },
  {
    value:       'fail',
    label:       'Fail',
    description: 'Lane finding disqualifies · UU PDP data-retention 24mo',
    activeColor: 'border-rose-500 bg-rose-50 text-rose-700 ring-2 ring-rose-300',
    color:       'border-rose-200 bg-rose-50/50 text-rose-700',
  },
];

function LanePill({ lane_type }) {
  const meta = LANE_META[lane_type] || {
    label: lane_type,
    color: 'border-border bg-muted text-muted-foreground',
  };
  return (
    <Badge variant="outline" className={`text-[9px] font-mono shrink-0 ${meta.color}`}>
      {meta.label}
    </Badge>
  );
}

function SubStageStepper({ currentStatus, activeSection, onSelect }) {
  const currentIndex = STATUS_ORDER.indexOf(currentStatus);
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-0">
          {SUBSTAGES.map((s, i) => {
            const stageIndex = STATUS_ORDER.indexOf(s.key);
            const isDone     = stageIndex < currentIndex;
            const isActive   = activeSection === s.key;
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
                    isDone
                      ? 'bg-emerald-500 text-white'
                      : isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                  }`}>
                    {isDone ? <Check className="h-3.5 w-3.5" /> : s.number}
                  </span>
                  <span className={`text-[11px] font-semibold ${isActive ? 'text-primary' : 'text-foreground'}`}>
                    {s.label}
                  </span>
                  <span className="text-[9px] text-muted-foreground">{s.sub}</span>
                </button>
                {i < SUBSTAGES.length - 1 && (
                  <div className={`h-px w-6 shrink-0 mx-1 ${
                    stageIndex < currentIndex ? 'bg-emerald-400' : 'bg-border'
                  }`} />
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function CandidateCard({ bg }) {
  return (
    <Card>
      <CardContent className="p-3 space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Candidate
        </p>
        {bg.last_position  && <div className="text-xs text-foreground">{bg.last_position}</div>}
        {bg.address        && <div className="text-[10px] text-muted-foreground">{bg.address}</div>}
        {bg.education_text && <div className="text-[10px] text-muted-foreground">{bg.education_text}</div>}
        <div className="pt-1 border-t space-y-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] text-muted-foreground">Stage</span>
            <Badge variant="outline" className="text-[9px]">{bg.status}</Badge>
          </div>
          {bg.verdict && (
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] text-muted-foreground">Verdict</span>
              <Badge
                variant="outline"
                className={`text-[9px] ${
                  bg.verdict === 'pass'
                    ? 'border-emerald-300 text-emerald-700 bg-emerald-50'
                    : bg.verdict === 'pass_with_concerns'
                      ? 'border-amber-300 text-amber-700 bg-amber-50'
                      : 'border-rose-300 text-rose-700 bg-rose-50'
                }`}
              >
                {bg.verdict.replace(/_/g, ' ')}
              </Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ClaimsSection({ bg, claims, setClaims, setBanner, setError, onAdvance }) {
  const [extracting,  setExtracting]  = useState(false);
  const [confirming,  setConfirming]  = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId,   setEditingId]   = useState(null);

  const [addText,   setAddText]   = useState('');
  const [addDetail, setAddDetail] = useState('');
  const [addLane,   setAddLane]   = useState('');

  const [editText,   setEditText]   = useState('');
  const [editDetail, setEditDetail] = useState('');
  const [editLane,   setEditLane]   = useState('');

  const selectedCount = claims.filter((c) => c.selected).length;
  const laneTypes     = [...new Set(claims.filter((c) => c.selected).map((c) => c.lane_type))];

  const handleExtract = async () => {
    setExtracting(true);
    setError(null);
    try {
      const res = await extractClaims(bg.bg_id);
      setClaims(res.data?.claims || []);
      setBanner({ ok: true, text: `${res.data?.claims?.length || 0} claims extracted from CV.` });
    } catch (err) {
      if (err.response?.status === 422) {
        setBanner({ ok: false, text: 'No parsed CV data found — add claims manually.' });
      } else {
        setError(err.response?.data?.message || err.message || 'Extraction failed');
      }
    } finally {
      setExtracting(false);
    }
  };

  const handleToggle = async (claim) => {
    try {
      const res = await toggleClaim(claim.id, !claim.selected);
      setClaims((prev) => prev.map((c) => c.id === claim.id ? res.data.claim : c));
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Update failed');
    }
  };

  const handleAdd = async () => {
    if (!addText.trim() || !addLane) return;
    try {
      const res = await addClaim(bg.bg_id, {
        claim_text:   addText.trim(),
        claim_detail: addDetail.trim() || null,
        lane_type:    addLane,
      });
      setClaims((prev) => [...prev, res.data.claim]);
      setAddText(''); setAddDetail(''); setAddLane('');
      setShowAddForm(false);
      setBanner({ ok: true, text: 'Claim added.' });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Add failed');
    }
  };

  const openEdit = (claim) => {
    setEditingId(claim.id);
    setEditText(claim.claim_text);
    setEditDetail(claim.claim_detail || '');
    setEditLane(claim.lane_type);
  };

  const handleUpdate = async (claim_id) => {
    if (!editText.trim() || !editLane) return;
    try {
      const res = await updateClaim(claim_id, {
        claim_text:   editText.trim(),
        claim_detail: editDetail.trim() || null,
        lane_type:    editLane,
      });
      setClaims((prev) => prev.map((c) => c.id === claim_id ? res.data.claim : c));
      setEditingId(null);
      setBanner({ ok: true, text: 'Claim updated.' });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Update failed');
    }
  };

  const handleDelete = async (claim_id) => {
    try {
      await deleteClaim(claim_id);
      setClaims((prev) => prev.filter((c) => c.id !== claim_id));
      setBanner({ ok: true, text: 'Claim removed.' });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Delete failed');
    }
  };

  const handleConfirm = async () => {
    setConfirming(true);
    setError(null);
    try {
      await confirmClaims(bg.bg_id);
      setBanner({ ok: true, text: bg.status === 'claims' ? 'Claims confirmed — advanced to Consent.' : 'Claim changes saved.' });
      if (bg.status === 'claims') onAdvance('consent');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Confirm failed');
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="space-y-4">

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-[10px] text-muted-foreground">Total items</p>
            <p className="text-2xl font-bold font-mono">{claims.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-[10px] text-muted-foreground">Selected</p>
            <p className="text-2xl font-bold font-mono">{selectedCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-[10px] text-muted-foreground">Lanes derived</p>
            <p className="text-2xl font-bold font-mono text-primary">{laneTypes.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          size="sm" variant="outline" className="text-xs"
          onClick={handleExtract} disabled={extracting}
        >
          {extracting
            ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Extracting…</>
            : <><Wand2 className="h-3.5 w-3.5 mr-1.5" />
                {claims.length ? 'Re-extract from CV' : 'Extract from CV'}</>}
        </Button>
        <Button
          size="sm" variant="outline" className="text-xs"
          onClick={() => setShowAddForm((v) => !v)}
        >
          <Plus className="h-3.5 w-3.5 mr-1.5" /> Add manually
        </Button>
        <p className="text-[10px] text-muted-foreground ml-auto">~Rp 6 / extract</p>
      </div>

      {/* Manual add form */}
      {showAddForm && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4 space-y-3">
            <p className="text-xs font-semibold">Add claim manually</p>
            <Input
              value={addText}
              onChange={(e) => setAddText(e.target.value)}
              placeholder="Claim text — e.g. PT Tokopedia · Frontend Engr · 2020–2021"
              className="text-xs h-8"
            />
            <Input
              value={addDetail}
              onChange={(e) => setAddDetail(e.target.value)}
              placeholder="Detail (optional) — e.g. ref: Bu Lestari (manager)"
              className="text-xs h-8"
            />
            <div className="flex items-center gap-2 flex-wrap">
              <Select value={addLane} onValueChange={setAddLane}>
                <SelectTrigger className="h-8 text-xs w-36">
                  <SelectValue placeholder="Lane type" />
                </SelectTrigger>
                <SelectContent>
                  {VALID_LANES.map((l) => (
                    <SelectItem key={l} value={l} className="text-xs">{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm" className="text-xs h-8"
                onClick={handleAdd}
                disabled={!addText.trim() || !addLane}
              >
                <Check className="h-3.5 w-3.5 mr-1" /> Add
              </Button>
              <Button
                size="sm" variant="ghost" className="text-xs h-8"
                onClick={() => {
                  setShowAddForm(false);
                  setAddText(''); setAddDetail(''); setAddLane('');
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Claims list */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-primary" />
            Claim items
            <span className="text-[11px] font-normal text-muted-foreground ml-1">
              · checkbox to include · pencil to edit
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {claims.length === 0 ? (
            <div className="py-10 text-center text-xs text-muted-foreground italic">
              No claims yet — extract from CV or add manually.
            </div>
          ) : (
            <div className="divide-y">
              {claims.map((claim) => (
                <div
                  key={claim.id}
                  className={`px-4 py-3 transition-colors ${!claim.selected ? 'opacity-50' : ''}`}
                >
                  {editingId === claim.id ? (
                    <div className="space-y-2">
                      <Input
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="text-xs h-8"
                        placeholder="Claim text"
                        autoFocus
                      />
                      <Input
                        value={editDetail}
                        onChange={(e) => setEditDetail(e.target.value)}
                        className="text-xs h-8"
                        placeholder="Detail (optional)"
                      />
                      <div className="flex items-center gap-2 flex-wrap">
                        <Select value={editLane} onValueChange={setEditLane}>
                          <SelectTrigger className="h-8 text-xs w-36">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {VALID_LANES.map((l) => (
                              <SelectItem key={l} value={l} className="text-xs">{l}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          size="sm" className="text-xs h-8"
                          onClick={() => handleUpdate(claim.id)}
                          disabled={!editText.trim() || !editLane}
                        >
                          <Check className="h-3.5 w-3.5 mr-1" /> Save
                        </Button>
                        <Button
                          size="sm" variant="ghost" className="text-xs h-8"
                          onClick={() => setEditingId(null)}
                        >
                          Cancel
                        </Button>
                        <button
                          type="button"
                          onClick={() => handleDelete(claim.id)}
                          className="ml-auto text-[11px] text-rose-600 flex items-center gap-1 hover:underline"
                        >
                          <X className="h-3 w-3" /> Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={claim.selected}
                        onChange={() => handleToggle(claim)}
                        className="mt-1 shrink-0 cursor-pointer"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-semibold">
                            {claim.claim_text}
                          </span>
                          <LanePill lane_type={claim.lane_type} />
                          {claim.edited_at && (
                            <Badge variant="outline" className="text-[8px] border-violet-200 text-violet-600">
                              edited
                            </Badge>
                          )}
                        </div>
                        {claim.claim_detail && (
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {claim.claim_detail}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => openEdit(claim)}
                        className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>

        {/* Card footer — summary + re-extract */}
        {claims.length > 0 && (
          <div className="px-4 py-3 border-t bg-muted/20 flex items-center justify-between gap-3 flex-wrap">
            <p className="text-[10px] text-muted-foreground">
              <span className="font-semibold">{selectedCount} of {claims.length} selected</span>
              {laneTypes.length > 0 && (
                <> · {laneTypes.length} lane{laneTypes.length === 1 ? '' : 's'}: {laneTypes.join(' · ')}</>
              )}
            </p>
            <Button
              size="sm" variant="outline" className="text-xs h-7"
              onClick={handleExtract} disabled={extracting}
            >
              <RotateCw className="h-3 w-3 mr-1" /> Re-extract
            </Button>
          </div>
        )}
      </Card>

      {/* Primary action — always visible below the card */}
      <div className="flex items-center justify-between gap-3 pt-2 border-t flex-wrap">
        <p className="text-[10px] text-muted-foreground">
          {bg.status === 'claims'
            ? 'Confirm selection to advance to Consent stage'
            : 'Already advanced — edit claims above then save'}
        </p>
        <Button
          size="sm" className="text-xs"
          onClick={handleConfirm}
          disabled={confirming || selectedCount === 0}
        >
          {confirming
            ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Saving…</>
            : <><Check className="h-3.5 w-3.5 mr-1.5" />
                {bg.status === 'claims' ? 'Lock & request consent' : 'Save claim changes'}</>}
        </Button>
      </div>

    </div>
  );
}

function ConsentSection({ bg, onAdvance }) {
  const [advancing, setAdvancing] = useState(false);

  const handleAdvance = async () => {
    setAdvancing(true);
    try {
      await updateBgStatus(bg.bg_id, 'tracker');
      onAdvance('tracker');
    } catch (err) {
      console.error(err);
    } finally {
      setAdvancing(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="py-12 text-center space-y-3">
          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center mx-auto">
            <FileText className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-semibold">Consent · UU PDP 27/2022</p>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Consent collection and e-signature portal will be built in the next sprint.
            Once the candidate signs, this panel will show the signed document, IP log, and revocation link.
          </p>
          <Button
            size="sm" className="text-xs mt-2"
            onClick={handleAdvance}
            disabled={advancing}
          >
            {advancing
              ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Advancing…</>
              : <><ChevronRight className="h-3.5 w-3.5 mr-1" /> Mark consent received &amp; open Tracker</>}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function TrackerSection({ bg, onAdvance }) {
  const [advancing, setAdvancing] = useState(false);

  const handleAdvance = async () => {
    setAdvancing(true);
    try {
      await updateBgStatus(bg.bg_id, 'verdict');
      onAdvance('verdict');
    } catch (err) {
      console.error(err);
    } finally {
      setAdvancing(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="py-12 text-center space-y-3">
          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center mx-auto">
            <GitBranch className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-semibold">Tracker · verification lanes</p>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Per-lane vendor tracking will be built alongside the{' '}
            <code className="text-[10px]">bg_lane</code> table.
            Each selected claim will spawn a lane row here once consent is collected.
          </p>
          <Button
            size="sm" className="text-xs mt-2"
            onClick={handleAdvance}
            disabled={advancing}
          >
            {advancing
              ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Advancing…</>
              : <><ChevronRight className="h-3.5 w-3.5 mr-1" /> All lanes resolved — open Verdict</>}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function VerdictSection({ bg, setBg, setBanner, setError }) {
  const [selected,   setSelected]   = useState(bg.verdict || null);
  const [gap,        setGap]        = useState(bg.verdict_note?.gap        || '');
  const [ctx,        setCtx]        = useState(bg.verdict_note?.context    || '');
  const [mitigation, setMitigation] = useState(bg.verdict_note?.mitigation || '');
  const [saving,     setSaving]     = useState(false);

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    setError(null);
    try {
      const verdict_note = selected === 'pass_with_concerns'
        ? { gap: gap.trim(), context: ctx.trim(), mitigation: mitigation.trim() }
        : null;

      await saveVerdict(bg.bg_id, { verdict: selected, verdict_note });
      setBg((prev) => ({ ...prev, verdict: selected, status: 'done' }));
      setBanner({ ok: true, text: `Verdict saved: ${selected.replace(/_/g, ' ')}.` });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">

      {/* Current verdict banner */}
      {bg.verdict && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-lg border text-xs font-semibold ${
          bg.verdict === 'pass'
            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
            : bg.verdict === 'pass_with_concerns'
              ? 'border-amber-200 bg-amber-50 text-amber-700'
              : 'border-rose-200 bg-rose-50 text-rose-700'
        }`}>
          <Check className="h-4 w-4 shrink-0" />
          Current verdict: {bg.verdict.replace(/_/g, ' ')} · change below and re-submit if needed
        </div>
      )}

      {/* Verdict picker */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Scale className="h-4 w-4 text-primary" /> Decision
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {VERDICT_OPTIONS.map((opt) => {
            const isActive = selected === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setSelected(isActive ? null : opt.value)}
                className={`w-full flex items-start gap-3 px-4 py-3 rounded-lg border text-left transition-all cursor-pointer ${
                  isActive ? opt.activeColor : `${opt.color} hover:brightness-95`
                }`}
              >
                <div className={`h-5 w-5 rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center ${
                  isActive ? 'border-current' : 'border-muted-foreground'
                }`}>
                  {isActive && <div className="h-2 w-2 rounded-full bg-current" />}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold">{opt.label}</p>
                  <p className="text-[10px] opacity-80 mt-0.5">{opt.description}</p>
                </div>
              </button>
            );
          })}
        </CardContent>
      </Card>

      {/* pass_with_concerns note */}
      {selected === 'pass_with_concerns' && (
        <Card className="border-amber-200 bg-amber-50/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-amber-800">
              Concern note — required for pass with concerns
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Gap identified
              </label>
              <Textarea
                value={gap}
                onChange={(e) => setGap(e.target.value)}
                placeholder="e.g. Team-size claim: stated 12, confirmed 8 (incl. 4 interns)"
                rows={2}
                className="text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Context
              </label>
              <Textarea
                value={ctx}
                onChange={(e) => setCtx(e.target.value)}
                placeholder="e.g. Minor inflation, not material misrepresentation"
                rows={2}
                className="text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Mitigation
              </label>
              <Textarea
                value={mitigation}
                onChange={(e) => setMitigation(e.target.value)}
                placeholder="e.g. Flag to HM at offer stage"
                rows={2}
                className="text-xs"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* UU PDP fail notice */}
      {selected === 'fail' && (
        <div className="px-4 py-3 rounded-lg border border-rose-200 bg-rose-50/50 text-[10px] text-rose-700">
          <strong>UU PDP 27/2022 routing.</strong> Failed BG cases are routed to the locked
          🔒 <em>BG concerns</em> Talent Pool segment — view-only, never auto-resurfaced.
          Data retained for 24 months after final decision.
        </div>
      )}

      {/* Submit — always available */}
      <div className="flex justify-end pt-1 border-t">
        <Button
          size="sm" className="text-xs"
          onClick={handleSave}
          disabled={
            saving || !selected ||
            (selected === 'pass_with_concerns' &&
              (!gap.trim() || !ctx.trim() || !mitigation.trim()))
          }
        >
          {saving
            ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Saving…</>
            : <><Check className="h-3.5 w-3.5 mr-1.5" />
                {bg.verdict ? 'Update verdict' : 'Commit verdict'}</>}
        </Button>
      </div>

    </div>
  );
}

export default function BgCheckCandidatePage() {
  const navigate        = useNavigate();
  const { bgId: param } = useParams();
  const bgId            = param ? Number(param) : null;

  const [bg,       setBg]      = useState(null);
  const [claims,   setClaims]  = useState([]);
  const [loading,  setLoading] = useState(true);
  const [error,    setError]   = useState(null);
  const [banner,   setBanner]  = useState(null);
  const [activeSection, setActiveSection] = useState('claims');

  const load = useCallback(async () => {
    if (!bgId) return;
    setLoading(true);
    setError(null);
    try {
      const [bgRes, claimsRes] = await Promise.all([
        getBgCheck(bgId),
        getClaims(bgId),
      ]);
      const row = bgRes.data?.bg_check;
      setBg(row);
      setClaims(claimsRes.data?.claims || []);
      if (row?.status && STATUS_ORDER.includes(row.status)) {
        setActiveSection(row.status === 'done' ? 'verdict' : row.status);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [bgId]);

  useEffect(() => { load(); }, [load]);

  const handleAdvance = (nextStatus) => {
    setBg((prev) => ({ ...prev, status: nextStatus }));
    setActiveSection(nextStatus);
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error && !bg) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg border border-red-200 bg-red-50 text-sm text-red-600">
          <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
        </div>
      </div>
    );
  }

  if (!bg) return null;

  return (
    <>
      {/* Sticky header */}
      <div className="sticky top-[52px] z-10 bg-background/95 backdrop-blur-sm -mt-5 -mx-5 px-5 pt-5 pb-4 border-b border-border/60">
        <div className="space-y-3">
          <Button
            variant="ghost" size="sm" className="text-xs -ml-2 w-fit"
            onClick={() => navigate(`/selection/background-check/job/${bg.job_id}`)}
          >
            <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back to position
          </Button>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="h-11 w-11 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold flex-shrink-0 text-sm">
              {getInitials(bg.candidate_name || '?')}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg font-bold tracking-tight truncate">
                {bg.candidate_name || `Candidate #${bg.candidate_id}`}
              </h1>
              <div className="text-[11px] text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5">
                <span>{bg.job_title || `Job #${bg.job_id}`}</span>
                {bg.job_location && <span>· {bg.job_location}</span>}
                {bg.work_type    && <span>· {bg.work_type}</span>}
              </div>
            </div>
            <Badge
              variant="outline"
              className={`text-[10px] shrink-0 ${
                bg.status === 'done'
                  ? 'border-emerald-300 text-emerald-700 bg-emerald-50'
                  : 'border-border text-muted-foreground'
              }`}
            >
              <ShieldCheck className="h-3 w-3 mr-1" />
              {bg.status}
            </Badge>
          </div>
        </div>
      </div>

      <div className="px-6 pb-6 pt-4 space-y-5">

        {/* Error banner */}
        {error && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-lg border border-red-200 bg-red-50 text-sm text-red-600">
            <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
            <button type="button" onClick={() => setError(null)} className="ml-auto">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Success/info banner */}
        {banner && (
          <div className={`flex items-center gap-2 px-4 py-3 rounded-lg border text-sm ${
            banner.ok
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-amber-200 bg-amber-50 text-amber-700'
          }`}>
            <Check className="h-4 w-4 shrink-0" /> {banner.text}
            <button type="button" onClick={() => setBanner(null)} className="ml-auto">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Stepper — always fully navigable */}
        <SubStageStepper
          currentStatus={bg.status}
          activeSection={activeSection}
          onSelect={setActiveSection}
        />

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_220px] gap-6">
          <div className="min-w-0">
            {activeSection === 'claims' && (
              <ClaimsSection
                bg={bg}
                claims={claims}
                setClaims={setClaims}
                setBanner={setBanner}
                setError={setError}
                onAdvance={handleAdvance}
              />
            )}
            {activeSection === 'consent' && (
              <ConsentSection bg={bg} onAdvance={handleAdvance} />
            )}
            {activeSection === 'tracker' && (
              <TrackerSection bg={bg} onAdvance={handleAdvance} />
            )}
            {activeSection === 'verdict' && (
              <VerdictSection
                bg={bg}
                setBg={setBg}
                setBanner={setBanner}
                setError={setError}
              />
            )}
          </div>

          <aside>
            <div className="sticky top-[184px]">
              <CandidateCard bg={bg} />
            </div>
          </aside>
        </div>

      </div>
    </>
  );
}