import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Loader2, AlertTriangle, Check, ChevronRight,
  Wand2, Plus, X, Pencil, ShieldCheck, FileText,
  ClipboardList, GitBranch, Scale, RotateCw,
  Copy, RefreshCw, XCircle, Sparkles, Ban,
  Activity, ChevronDown, ChevronUp,
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
  getConsent, generateConsentLink, revokeConsent,
  getLanes, createLanes, updateTracker,
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

const LANE_LABELS_ID = {
  identity: 'Identitas (identity) — verifikasi NIK, KTP, dan dokumen identitas resmi',
  edu:      'Pendidikan (edu) — verifikasi ijazah dan transkrip pendidikan',
  emp:      'Pekerjaan (emp) — verifikasi riwayat pekerjaan',
  cert:     'Sertifikasi (cert) — verifikasi sertifikat dan lisensi profesional',
  crim:     'Catatan kepolisian (crim) — SKCK aktif dari POLRI',
  cred:     'Riwayat kredit (cred) — BI Checking / OJK SLIK Online',
  salary:   'Riwayat gaji (salary) — verifikasi kompensasi terakhir',
};

const TRACKER_STATUSES = [
  { value: 'pending',            label: 'Pending',       color: 'border-border text-muted-foreground bg-muted/40'     },
  { value: 'in_progress',        label: 'In progress',   color: 'border-blue-200 text-blue-700 bg-blue-50'           },
  { value: 'pass',               label: 'Pass',          color: 'border-emerald-200 text-emerald-700 bg-emerald-50'  },
  { value: 'pass_with_concerns', label: 'Pass · note',   color: 'border-amber-200 text-amber-700 bg-amber-50'       },
  { value: 'fail',               label: 'Fail',          color: 'border-rose-200 text-rose-700 bg-rose-50'          },
  { value: 'stalled',            label: 'Stalled',       color: 'border-orange-200 text-orange-700 bg-orange-50'    },
];

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

function fmtDate(d) {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  } catch { return '—'; }
}

function getStatusMeta(status) {
  return TRACKER_STATUSES.find((s) => s.value === status) || TRACKER_STATUSES[0];
}

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

function GenerateLinkRow({ onGenerate, generating, label = 'Generate link' }) {
  return (
    <div className="rounded-lg border border-dashed bg-muted/20 p-3 flex items-center justify-between gap-3 flex-wrap">
      <div className="min-w-0">
        <p className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">
          Portal link
        </p>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          Generate a 7-day portal link for the candidate to review and e-sign.
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
          Portal link · 7-day consent token
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
      <p className="text-[10px] text-muted-foreground">
        sent {fmtDate(sentAt)}
      </p>
    </div>
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
      setBanner({
        ok: true,
        text: bg.status === 'claims'
          ? 'Claims confirmed — advanced to Consent.'
          : 'Claim changes saved.',
      });
      if (bg.status === 'claims') onAdvance('consent');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Confirm failed');
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="space-y-4">

      <div className="grid grid-cols-3 gap-3">
        <Card><CardContent className="p-3 text-center">
          <p className="text-[10px] text-muted-foreground">Total items</p>
          <p className="text-2xl font-bold font-mono">{claims.length}</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <p className="text-[10px] text-muted-foreground">Selected</p>
          <p className="text-2xl font-bold font-mono">{selectedCount}</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <p className="text-[10px] text-muted-foreground">Lanes derived</p>
          <p className="text-2xl font-bold font-mono text-primary">{laneTypes.length}</p>
        </CardContent></Card>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Button size="sm" variant="outline" className="text-xs"
          onClick={handleExtract} disabled={extracting}>
          {extracting
            ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Extracting…</>
            : <><Wand2 className="h-3.5 w-3.5 mr-1.5" />{claims.length ? 'Re-extract from CV' : 'Extract from CV'}</>}
        </Button>
        <Button size="sm" variant="outline" className="text-xs"
          onClick={() => setShowAddForm((v) => !v)}>
          <Plus className="h-3.5 w-3.5 mr-1.5" /> Add manually
        </Button>
        <p className="text-[10px] text-muted-foreground ml-auto">~Rp 6 / extract</p>
      </div>

      {showAddForm && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4 space-y-3">
            <p className="text-xs font-semibold">Add claim manually</p>
            <Input value={addText} onChange={(e) => setAddText(e.target.value)}
              placeholder="Claim text — e.g. PT Tokopedia · Frontend Engr · 2020–2021"
              className="text-xs h-8" />
            <Input value={addDetail} onChange={(e) => setAddDetail(e.target.value)}
              placeholder="Detail (optional) — e.g. ref: Bu Lestari (manager)"
              className="text-xs h-8" />
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
              <Button size="sm" className="text-xs h-8"
                onClick={handleAdd} disabled={!addText.trim() || !addLane}>
                <Check className="h-3.5 w-3.5 mr-1" /> Add
              </Button>
              <Button size="sm" variant="ghost" className="text-xs h-8"
                onClick={() => { setShowAddForm(false); setAddText(''); setAddDetail(''); setAddLane(''); }}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

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
                <div key={claim.id}
                  className={`px-4 py-3 transition-colors ${!claim.selected ? 'opacity-50' : ''}`}>
                  {editingId === claim.id ? (
                    <div className="space-y-2">
                      <Input value={editText} onChange={(e) => setEditText(e.target.value)}
                        className="text-xs h-8" placeholder="Claim text" autoFocus />
                      <Input value={editDetail} onChange={(e) => setEditDetail(e.target.value)}
                        className="text-xs h-8" placeholder="Detail (optional)" />
                      <div className="flex items-center gap-2 flex-wrap">
                        <Select value={editLane} onValueChange={setEditLane}>
                          <SelectTrigger className="h-8 text-xs w-36"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {VALID_LANES.map((l) => (
                              <SelectItem key={l} value={l} className="text-xs">{l}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button size="sm" className="text-xs h-8"
                          onClick={() => handleUpdate(claim.id)}
                          disabled={!editText.trim() || !editLane}>
                          <Check className="h-3.5 w-3.5 mr-1" /> Save
                        </Button>
                        <Button size="sm" variant="ghost" className="text-xs h-8"
                          onClick={() => setEditingId(null)}>
                          Cancel
                        </Button>
                        <button type="button" onClick={() => handleDelete(claim.id)}
                          className="ml-auto text-[11px] text-rose-600 flex items-center gap-1 hover:underline">
                          <X className="h-3 w-3" /> Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3">
                      <input type="checkbox" checked={claim.selected}
                        onChange={() => handleToggle(claim)}
                        className="mt-1 shrink-0 cursor-pointer" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-semibold">{claim.claim_text}</span>
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
                      <button type="button" onClick={() => openEdit(claim)}
                        className="shrink-0 text-muted-foreground hover:text-foreground transition-colors">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
        {claims.length > 0 && (
          <div className="px-4 py-3 border-t bg-muted/20 flex items-center justify-between gap-3 flex-wrap">
            <p className="text-[10px] text-muted-foreground">
              <span className="font-semibold">{selectedCount} of {claims.length} selected</span>
              {laneTypes.length > 0 && (
                <> · {laneTypes.length} lane{laneTypes.length === 1 ? '' : 's'}: {laneTypes.join(' · ')}</>
              )}
            </p>
            <Button size="sm" variant="outline" className="text-xs h-7"
              onClick={handleExtract} disabled={extracting}>
              <RotateCw className="h-3 w-3 mr-1" /> Re-extract
            </Button>
          </div>
        )}
      </Card>

      <div className="flex items-center justify-between gap-3 pt-2 border-t flex-wrap">
        <p className="text-[10px] text-muted-foreground">
          {bg.status === 'claims'
            ? 'Confirm selection to advance to Consent stage'
            : 'Already advanced — edit claims above then save'}
        </p>
        <Button size="sm" className="text-xs"
          onClick={handleConfirm} disabled={confirming || selectedCount === 0}>
          {confirming
            ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Saving…</>
            : <><Check className="h-3.5 w-3.5 mr-1.5" />
                {bg.status === 'claims' ? 'Lock & request consent' : 'Save claim changes'}</>}
        </Button>
      </div>

    </div>
  );
}

function ConsentSection({ bg, setBg, claims, setBanner, setError, onAdvance }) {
  const [consent,      setConsent]      = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [generating,   setGenerating]   = useState(false);
  const [revoking,     setRevoking]     = useState(false);
  const [advancing,    setAdvancing]    = useState(false);
  const [showRevoke,   setShowRevoke]   = useState(false);
  const [revokeReason, setRevokeReason] = useState('');

  const loadConsent = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getConsent(bg.bg_id);
      setConsent(res.data?.consent || null);
    } catch { } finally {
      setLoading(false);
    }
  }, [bg.bg_id]);

  useEffect(() => { loadConsent(); }, [loadConsent]);

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await generateConsentLink(bg.bg_id);
      setConsent(res.data?.consent || null);
      setBanner({ ok: true, text: 'Consent link generated — copy and share with candidate.' });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to generate link');
    } finally {
      setGenerating(false);
    }
  };

  const handleRevoke = async () => {
    if (consent?.status === 'signed') {
      setError('Consent has been signed and cannot be revoked.');
      setShowRevoke(false);
      return;
    }
    setRevoking(true);
    setError(null);
    try {
      const res = await revokeConsent(bg.bg_id, revokeReason || null);
      setConsent(res.data?.consent || null);
      setShowRevoke(false);
      setRevokeReason('');
      setBanner({ ok: true, text: 'Consent revoked.' });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Revoke failed');
    } finally {
      setRevoking(false);
    }
  };

  const handleAdvanceToTracker = async () => {
    if (bg.status === 'claims') {
      setError('Complete Claims stage and confirm selection before advancing to Tracker.');
      return;
    }
    setAdvancing(true);
    setError(null);
    try {
      await updateBgStatus(bg.bg_id, 'tracker');
      setBg((prev) => ({ ...prev, status: 'tracker' }));
      setBanner({ ok: true, text: 'Advanced to Tracker.' });
      onAdvance('tracker');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to advance');
    } finally {
      setAdvancing(false);
    }
  };

  const selectedClaims = claims.filter((c) => c.selected);
  const uniqueLanes    = [...new Set(selectedClaims.map((c) => c.lane_type))];
  const isSigned       = consent?.status === 'signed';
  const isRevoked      = consent?.status === 'revoked';

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary shrink-0" />
            <div className="min-w-0 flex-1">
              <CardTitle className="text-sm">Consent · UU PDP 27/2022 compliant</CardTitle>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                candidate e-signed via portal
                {isSigned ? ' ' : ' · revocable until signed'}
              </p>
            </div>
            {consent?.status && (
              <Badge
                variant="outline"
                className={`text-[9px] shrink-0 ${
                  isSigned   ? 'border-emerald-300 text-emerald-700 bg-emerald-50'
                  : isRevoked ? 'border-rose-300 text-rose-700 bg-rose-50'
                  : consent.status === 'sent' ? 'border-blue-300 text-blue-700 bg-blue-50'
                  : 'border-border text-muted-foreground'
                }`}
              >
                {consent.status}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {isSigned && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-emerald-200 bg-emerald-50 text-xs text-emerald-700">
              <Check className="h-4 w-4 shrink-0" />
              Consent signed {fmtDate(consent.signed_at)} 
            </div>
          )}
          {isRevoked && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-rose-200 bg-rose-50 text-xs text-rose-700">
              <XCircle className="h-4 w-4 shrink-0" />
              Consent revoked {fmtDate(consent.revoked_at)}
              {consent.revocation_reason && (
                <span className="italic"> — "{consent.revocation_reason}"</span>
              )}
            </div>
          )}

          {/* Portal link row */}
          {isSigned ? (
            <div className="rounded-lg border border-dashed bg-emerald-50/50 border-emerald-200 p-3 text-center space-y-0.5">
              <p className="text-[11px] text-emerald-700 font-semibold flex items-center justify-center gap-1.5">
                <Check className="h-3.5 w-3.5" /> Signed {fmtDate(consent.signed_at)}
              </p>
            </div>
          ) : consent?.status === 'sent' && consent.portal_url ? (
            /* Sent — show the link with revoke option */
            <PortalLinkRow
              url={consent.portal_url}
              expiresAt={consent.token_expires_at}
              sentAt={consent.sent_at}
              onRegenerate={handleGenerate}
              onRevoke={() => { setShowRevoke(true); setRevokeReason(''); }}
              generating={generating}
            />
          ) : (
            /* Draft or revoked — show generate button */
            <GenerateLinkRow
              onGenerate={handleGenerate}
              generating={generating}
              label={isRevoked ? 'Regenerate link' : 'Generate link'}
            />
          )}

          {showRevoke && !isSigned && (
            <div className="space-y-2 p-3 rounded-lg border border-rose-200 bg-rose-50/30">
              <p className="text-[10px] font-semibold text-rose-700 uppercase tracking-wide">
                Revoke consent
              </p>
              <Input
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
                placeholder="Reason (optional) — e.g. candidate withdrew"
                className="text-xs h-8"
              />
              <div className="flex gap-2">
                <Button size="sm" variant="destructive" className="text-xs h-8"
                  onClick={handleRevoke} disabled={revoking}>
                  {revoking
                    ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Revoking…</>
                    : 'Confirm revoke'}
                </Button>
                <Button size="sm" variant="ghost" className="text-xs h-8"
                  onClick={() => { setShowRevoke(false); setRevokeReason(''); }}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Consent document · {uniqueLanes.length} lane{uniqueLanes.length === 1 ? '' : 's'} enumerated
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="mx-4 mb-4 rounded-lg border bg-muted/10 overflow-hidden">
            <div className="px-5 py-4 border-b bg-muted/20 text-center">
              <p className="text-xs font-bold tracking-wide uppercase text-foreground">
                SURAT PERSETUJUAN PEMERIKSAAN LATAR BELAKANG
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">
                PT — · sesuai UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi
              </p>
            </div>
            <div className="px-5 py-4 space-y-3 text-[11px] leading-relaxed text-foreground">
              <p>
                Saya yang bertanda tangan di bawah ini,{' '}
                <strong>{bg.candidate_name}</strong>,
                dengan ini memberikan persetujuan tertulis kepada{' '}
                <strong>perusahaan</strong> untuk melakukan pemeriksaan latar belakang
                ("BG Check") sehubungan dengan proses rekrutmen saya untuk posisi{' '}
                <strong>{bg.job_title}</strong>.
              </p>
              {uniqueLanes.length > 0 ? (
                <>
                  <p>Pemeriksaan akan mencakup lajur-lajur (lanes) berikut:</p>
                  <ol className="space-y-1.5 pl-5 list-decimal">
                    {uniqueLanes.map((lt, i) => {
                      const claimsForLane = selectedClaims.filter((c) => c.lane_type === lt);
                      return (
                        <li key={i}>
                          <strong>{LANE_LABELS_ID[lt] || lt}</strong>
                          {claimsForLane.length > 0 && (
                            <span className="text-muted-foreground">
                              {' '}· {claimsForLane.map((c) => c.claim_text).join(', ')}
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ol>
                </>
              ) : (
                <p className="text-muted-foreground italic">
                  No claims selected yet — go back to Claims and select items to verify.
                </p>
              )}
              <p className="text-muted-foreground">
                Data yang terkumpul akan disimpan paling lama 24 bulan setelah keputusan akhir,
                dan saya berhak mencabut persetujuan ini kapan saja sebelum keputusan akhir
                (Verdict) ditetapkan, sesuai Pasal 9 UU 27/2022.
              </p>
              {isSigned && (
                <p className="text-emerald-700 font-medium">
                  Ditandatangani secara elektronik · {fmtDate(consent.signed_at)}
                </p>
              )}
            </div>
          </div>
          {isSigned && (
            <div className="grid grid-cols-2 gap-3 px-4 pb-4">
              <div className="rounded-lg border bg-muted/10 p-3 space-y-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Signature record
                </p>
                <div className="text-[11px] text-foreground leading-relaxed space-y-0.5">
                  <p>Method: agreed checkbox · portal</p>
                  <p>Audit ref: <span className="font-mono text-[10px]">consent#{consent.id}</span></p>
                  <p>Date: {fmtDate(consent.signed_at)}</p>
                </div>
              </div>
              <div className="rounded-lg border bg-muted/10 p-3 space-y-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Revocation
                </p>
                <div className="text-[11px] text-foreground leading-relaxed space-y-0.5">
                  <Badge variant="outline" className="text-[9px] border-rose-200 text-rose-700 bg-rose-50">
                    permanently locked
                  </Badge>
                </div>
              </div>
            </div>
          )}

        </CardContent>
      </Card>

      <div className="flex items-center justify-between gap-3 pt-2 border-t flex-wrap">
        <p className="text-[10px] text-muted-foreground">
          {bg.status === 'claims'
            ? 'Complete Claims stage and confirm selection before advancing to Tracker'
            : isSigned
              ? 'Consent signed — open Tracker to begin lane verification'
              : 'Once the candidate signs via the portal link, advance to Tracker'}
        </p>
        <Button
          size="sm" className="text-xs"
          onClick={handleAdvanceToTracker}
          disabled={advancing || bg.status === 'claims'}
        >
          {advancing
            ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Advancing…</>
            : <><ChevronRight className="h-3.5 w-3.5 mr-1" /> Open Tracker</>}
        </Button>
      </div>

    </div>
  );
}

function TrackerSection({ bg, setBg, setBanner, setError, onAdvance }) {
  const [lanes,      setLanes]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [spawning,   setSpawning]   = useState(false);
  const [advancing,  setAdvancing]  = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [editingId,  setEditingId]  = useState(null);
  const [editNote,   setEditNote]   = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [saving,     setSaving]     = useState(false);

  const loadLanes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getLanes(bg.bg_id);
      setLanes(res.data?.lanes || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load lanes');
    } finally {
      setLoading(false);
    }
  }, [bg.bg_id]);

  useEffect(() => { loadLanes(); }, [loadLanes]);

  const handleSpawn = async () => {
    setSpawning(true);
    setError(null);
    try {
      const res = await createLanes(bg.bg_id);
      setLanes(res.data?.lanes || []);
      setBanner({ ok: true, text: `${res.data?.lanes?.length || 0} verification lanes created.` });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to create lanes');
    } finally {
      setSpawning(false);
    }
  };

  const openEdit = (lane) => {
    setEditingId(lane.id);
    setEditNote(lane.note || '');
    setEditStatus(lane.status);
    setExpandedId(lane.id);
  };

  const handleSaveLane = async (lane_id) => {
    setSaving(true);
    setError(null);
    try {
      const res = await updateTracker(lane_id, { note: editNote, status: editStatus });
      setLanes((prev) => prev.map((l) => l.id === lane_id ? { ...l, ...res.data.lane } : l));
      setEditingId(null);
      setBanner({ ok: true, text: 'Lane updated.' });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handleAdvanceToVerdict = async () => {
    if (bg.status === 'claims' || bg.status === 'consent') {
      setError(
        bg.status === 'claims'
          ? 'Complete Claims and Consent stages before opening Verdict.'
          : 'Complete Consent stage before opening Verdict.'
      );
      return;
    }

    if (lanes.length === 0) {
      setError('Create verification lanes before opening Verdict.');
      return;
    }

    const unresolvedCount = lanes.filter(
      (l) => !['pass', 'pass_with_concerns', 'fail'].includes(l.status)
    ).length;

    if (unresolvedCount > 0) {
      setError(`${unresolvedCount} lane${unresolvedCount === 1 ? '' : 's'} not yet resolved — mark each lane pass or fail before opening Verdict.`);
      return;
    }

    setAdvancing(true);
    setError(null);
    try {
      await updateBgStatus(bg.bg_id, 'verdict');
      setBg((prev) => ({ ...prev, status: 'verdict' }));
      setBanner({ ok: true, text: 'All lanes resolved — advanced to Verdict.' });
      onAdvance('verdict');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to advance');
    } finally {
      setAdvancing(false);
    }
  };

  const counts = {
    pass:        lanes.filter((l) => ['pass', 'pass_with_concerns'].includes(l.status)).length,
    in_progress: lanes.filter((l) => l.status === 'in_progress').length,
    stalled:     lanes.filter((l) => l.status === 'stalled').length,
    fail:        lanes.filter((l) => l.status === 'fail').length,
    pending:     lanes.filter((l) => l.status === 'pending').length,
  };

  const passLaneTypes    = lanes.filter((l) => ['pass', 'pass_with_concerns'].includes(l.status)).map((l) => l.lane_type);
  const stalledTypes     = lanes.filter((l) => l.status === 'stalled').map((l) => l.lane_type);
  const inProgressTypes  = lanes.filter((l) => l.status === 'in_progress').map((l) => l.lane_type);

  const unresolvedCount = lanes.filter(
    (l) => !['pass', 'pass_with_concerns', 'fail'].includes(l.status)
  ).length;
  const isBlocked = bg.status === 'claims' || bg.status === 'consent'
    || lanes.length === 0
    || unresolvedCount > 0;  

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">

      {/* Header card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary shrink-0" />
            <div className="min-w-0 flex-1">
              <CardTitle className="text-sm">
                Tracker · {lanes.length} verification lane{lanes.length === 1 ? '' : 's'}
              </CardTitle>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {counts.pass}/{lanes.length} pass · {counts.stalled} stalled · {counts.in_progress} in progress
              </p>
            </div>
            <Button size="sm" variant="outline" className="text-xs shrink-0"
              onClick={handleSpawn} disabled={spawning}>
              {spawning
                ? <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> Creating…</>
                : <><GitBranch className="h-3.5 w-3.5 mr-1.5" />
                    {lanes.length ? 'Re-sync lanes' : 'Create lanes'}</>}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {lanes.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center space-y-3">
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center mx-auto">
              <GitBranch className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground">
              No lanes yet — click "Create lanes" to spawn one verification lane per selected claim.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Stat tiles */}
          <div className="grid grid-cols-4 gap-3">
            <Card><CardContent className="p-3 text-center">
              <p className="text-[10px] text-muted-foreground">Lanes pass</p>
              <p className="text-2xl font-bold font-mono text-emerald-600">{counts.pass}</p>
              {passLaneTypes.length > 0 && (
                <p className="text-[9px] text-muted-foreground mt-0.5 truncate">{passLaneTypes.join(' · ')}</p>
              )}
            </CardContent></Card>
            <Card><CardContent className="p-3 text-center">
              <p className="text-[10px] text-muted-foreground">In progress</p>
              <p className="text-2xl font-bold font-mono text-blue-600">{counts.in_progress}</p>
              {inProgressTypes.length > 0 && (
                <p className="text-[9px] text-muted-foreground mt-0.5 truncate">{inProgressTypes.join(' · ')}</p>
              )}
            </CardContent></Card>
            <Card><CardContent className="p-3 text-center">
              <p className="text-[10px] text-muted-foreground">Stalled</p>
              <p className="text-2xl font-bold font-mono text-amber-600">{counts.stalled}</p>
              {stalledTypes.length > 0 && (
                <p className="text-[9px] text-muted-foreground mt-0.5 truncate">{stalledTypes.join(' · ')}</p>
              )}
            </CardContent></Card>
            <Card><CardContent className="p-3 text-center">
              <p className="text-[10px] text-muted-foreground">Fail</p>
              <p className={`text-2xl font-bold font-mono ${counts.fail > 0 ? 'text-rose-600' : 'text-muted-foreground'}`}>
                {counts.fail}
              </p>
              <p className="text-[9px] text-muted-foreground mt-0.5">
                {counts.fail === 0 ? 'none' : 'needs attention'}
              </p>
            </CardContent></Card>
          </div>

          {/* Lane rows */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">
                Lanes · per-lane status · click to expand
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {lanes.map((lane) => {
                  const meta      = getStatusMeta(lane.status);
                  const isExp     = expandedId === lane.id;
                  const isEditing = editingId  === lane.id;

                  return (
                    <div key={lane.id} className="px-4 py-3">
                      {/* Lane header row */}
                      <div
                        className="flex items-center gap-3 cursor-pointer"
                        onClick={() => { if (!isEditing) setExpandedId(isExp ? null : lane.id); }}
                      >
                        <LanePill lane_type={lane.lane_type} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-semibold">{lane.claim_text}</span>
                          </div>
                          {lane.note && !isExp && (
                            <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                              {lane.note}
                            </p>
                          )}
                        </div>
                        <Badge variant="outline" className={`text-[9px] shrink-0 ${meta.color}`}>
                          {meta.label}
                        </Badge>
                        <button type="button" className="text-muted-foreground shrink-0">
                          {isExp
                            ? <ChevronUp className="h-3.5 w-3.5" />
                            : <ChevronDown className="h-3.5 w-3.5" />}
                        </button>
                      </div>

                      {/* Expanded detail */}
                      {isExp && (
                        <div className="mt-3 space-y-3 pl-1">
                          {lane.claim_detail && (
                            <p className="text-[10px] text-muted-foreground">{lane.claim_detail}</p>
                          )}

                          {isEditing ? (
                            <div className="space-y-2">
                              <div className="space-y-1">
                                <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                                  Finding note
                                </label>
                                <Textarea
                                  value={editNote}
                                  onChange={(e) => setEditNote(e.target.value)}
                                  placeholder="e.g. KTP / NIK 3174 verified · Dukcapil match"
                                  rows={2}
                                  className="text-xs"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                                  Status
                                </label>
                                <div className="flex flex-wrap gap-2">
                                  {TRACKER_STATUSES.map((s) => (
                                    <button
                                      key={s.value}
                                      type="button"
                                      onClick={() => setEditStatus(s.value)}
                                      className={`px-2.5 py-1 rounded-full border text-[10px] font-semibold transition-all ${
                                        editStatus === s.value
                                          ? `${s.color} ring-2 ring-offset-1 ring-current`
                                          : `${s.color} opacity-60 hover:opacity-100`
                                      }`}
                                    >
                                      {s.label}
                                    </button>
                                  ))}
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button size="sm" className="text-xs h-8"
                                  onClick={() => handleSaveLane(lane.id)}
                                  disabled={saving || !editStatus}>
                                  {saving
                                    ? <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> Saving…</>
                                    : <><Check className="h-3.5 w-3.5 mr-1" /> Save</>}
                                </Button>
                                <Button size="sm" variant="ghost" className="text-xs h-8"
                                  onClick={() => setEditingId(null)}>
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {lane.note && (
                                <p className="text-[11px] text-foreground leading-relaxed">
                                  {lane.note}
                                </p>
                              )}
                              {lane.resolved_at && (
                                <p className="text-[10px] text-muted-foreground">
                                  Resolved {fmtDate(lane.resolved_at)}
                                </p>
                              )}
                              <Button size="sm" variant="outline" className="text-xs h-7"
                                onClick={(e) => { e.stopPropagation(); openEdit(lane); }}>
                                <Pencil className="h-3 w-3 mr-1" /> Edit lane
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Advance to verdict */}
      <div className="flex items-center justify-between gap-3 pt-2 border-t flex-wrap">
        <p className="text-[10px] text-muted-foreground">
          {bg.status === 'claims' || bg.status === 'consent'
            ? 'Complete Claims and Consent stages first before opening Verdict'
            : lanes.length === 0
              ? 'Create verification lanes before opening Verdict'
              : unresolvedCount > 0
                ? `${unresolvedCount} lane${unresolvedCount === 1 ? '' : 's'} not yet resolved — mark each lane pass or fail`
                : 'All lanes resolved — open Verdict when ready'}
        </p>
        <Button
          size="sm" className="text-xs"
          onClick={handleAdvanceToVerdict}
          disabled={advancing || isBlocked}
        >
          {advancing
            ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Advancing…</>
            : <><ChevronRight className="h-3.5 w-3.5 mr-1" /> Open Verdict</>}
        </Button>
      </div>

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
              <button key={opt.value} type="button"
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

      {selected === 'pass_with_concerns' && (
        <Card className="border-amber-200 bg-amber-50/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-amber-800">Concern note — required</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Gap identified
              </label>
              <Textarea value={gap} onChange={(e) => setGap(e.target.value)}
                placeholder="e.g. Team-size claim: stated 12, confirmed 8" rows={2} className="text-xs" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Context
              </label>
              <Textarea value={ctx} onChange={(e) => setCtx(e.target.value)}
                placeholder="e.g. Minor inflation, not material misrepresentation" rows={2} className="text-xs" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Mitigation
              </label>
              <Textarea value={mitigation} onChange={(e) => setMitigation(e.target.value)}
                placeholder="e.g. Flag to HM at offer stage" rows={2} className="text-xs" />
            </div>
          </CardContent>
        </Card>
      )}

      {selected === 'fail' && (
        <div className="px-4 py-3 rounded-lg border border-rose-200 bg-rose-50/50 text-[10px] text-rose-700">
          <strong>UU PDP 27/2022 routing.</strong> Failed BG cases are routed to the locked
          🔒 <em>BG concerns</em> Talent Pool segment — data retained 24 months.
        </div>
      )}

      <div className="flex justify-end pt-1 border-t">
        <Button size="sm" className="text-xs" onClick={handleSave}
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
          <Button variant="ghost" size="sm" className="text-xs -ml-2 w-fit"
            onClick={() => navigate(`/selection/background-check/job/${bg.job_id}`)}>
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
            <Badge variant="outline" className={`text-[10px] shrink-0 ${
              bg.status === 'done'
                ? 'border-emerald-300 text-emerald-700 bg-emerald-50'
                : 'border-border text-muted-foreground'
            }`}>
              <ShieldCheck className="h-3 w-3 mr-1" />
              {bg.status}
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

        <SubStageStepper
          currentStatus={bg.status}
          activeSection={activeSection}
          onSelect={setActiveSection}
        />

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_220px] gap-6">
          <div className="min-w-0">
            {activeSection === 'claims' && (
              <ClaimsSection
                bg={bg} claims={claims} setClaims={setClaims}
                setBanner={setBanner} setError={setError} onAdvance={handleAdvance}
              />
            )}
            {activeSection === 'consent' && (
              <ConsentSection
                bg={bg} setBg={setBg} claims={claims}
                setBanner={setBanner} setError={setError} onAdvance={handleAdvance}
              />
            )}
            {activeSection === 'tracker' && (
              <TrackerSection
                bg={bg} setBg={setBg}
                setBanner={setBanner} setError={setError} onAdvance={handleAdvance}
              />
            )}
            {activeSection === 'verdict' && (
              <VerdictSection
                bg={bg} setBg={setBg}
                setBanner={setBanner} setError={setError}
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