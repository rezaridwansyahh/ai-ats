import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useOutletContext, useParams, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { generateEmployeeSummary, getEmployees, getEmployeeSummary } from '@/api/employees.api';
import { normalise, teamNiks } from '@/components/dashboard/dashboardMetrics.js';
import { Tag, WarnTag } from '@/components/karyawan/EmployeeTags';
import { initials } from '@/components/karyawan/karyawanUtils.js';
import { buildProfile } from '@/components/karyawan/profileData.js';
import ProfilePanel from '@/components/karyawan/ProfilePanel';
import {
  TabRingkasan, TabPekerjaan, TabKontrak, TabKontak, TabPendidikan, TabSensitif, TabDokumen, TabRiwayat,
} from '@/components/karyawan/ProfileTabs';
import EmployeeEdit from '@/components/karyawan/EmployeeEdit';
import { Sparkles } from 'lucide-react';

function parseSummary(body) {
  const s = body?.ai_summary ?? body?.summary ?? body?.data ?? body;
  const text = typeof s === 'string' ? s : s?.summary ?? s?.text ?? s?.content ?? '';
  return text ? { text, at: s?.generated_at ?? s?.updated_at ?? null, stale: !!s?.stale } : null;
}

export default function KaryawanDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { role = 'hr', spend } = useOutletContext() ?? {};
  const isHr = role === 'hr';
  const [params, setParams] = useSearchParams();

  const [rows, setRows] = useState(null);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [sumState, setSumState] = useState({ id: null, data: null });
  const [busyId, setBusyId] = useState(null);
  const [genErr, setGenErr] = useState(null);
  const [audit, setAudit] = useState([]);
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    getEmployees()
      .then((res) => {
        if (!alive) return;
        const body = res.data;
        setRows(Array.isArray(body) ? body : body?.employees ?? body?.data ?? []);
      })
      .catch((err) => {
        if (alive) setError(err?.response?.data?.message || err?.message || 'Gagal memuat data karyawan');
      });
    return () => { alive = false; };
  }, [reloadKey]);

  useEffect(() => {
    if (!isHr) return undefined;
    let alive = true;
    getEmployeeSummary(id)
      .then((res) => { if (alive) setSumState({ id, data: parseSummary(res.data) }); })
      .catch(() => {});
    return () => { alive = false; };
  }, [id, isHr, reloadKey]);
  const summary = sumState.id === id ? sumState.data : null;
  const busy = busyId === id;
  const summaryError = genErr?.id === id ? genErr.msg : null;

  const refresh = () => setReloadKey((k) => k + 1);
  const retry = () => {
    setError(null);
    setRows(null);
    setReloadKey((k) => k + 1);
  };

  const all = useMemo(() => (rows ? normalise(rows) : null), [rows]);
  const e = useMemo(() => all?.find((x) => String(x.id ?? x.nik) === id) ?? null, [all, id]);
  const inScope = useMemo(() => !e || isHr || teamNiks(all).has(e.nik), [e, all, isHr]);
  const p = useMemo(() => (e ? buildProfile(e) : null), [e]);

  const tabs = [
    ['ring', 'Ringkasan'], ['kerja', 'Pekerjaan'], ['kontrak', 'Kontrak'], ['kontak', 'Kontak'],
    ['edu', 'Pendidikan & Pelatihan'], ...(isHr ? [['sens', 'Data Sensitif 🔒']] : []), ['dok', 'Dokumen'], ['riw', 'Riwayat'],
  ];
  const tab = tabs.some(([k]) => k === params.get('tab')) ? params.get('tab') : 'ring';
  const setTab = (k) => setParams((prev) => { const n = new URLSearchParams(prev); n.set('tab', k); return n; }, { replace: true });

  const goTo = (x) => navigate(`/karyawan/${x.id ?? x.nik}`);
  const revealed = !!e && audit.some((a) => a.id === e.id);
  const access = e ? audit.filter((a) => a.id === e.id) : [];
  const reveal = () => {
    setAudit((a) => [...a, { id: e.id, t: new Date().toISOString().slice(0, 16).replace('T', ' '), who: 'Rina (HR Admin)' }]);
    toast('Data sensitif dibuka · tercatat di audit');
  };

  const summarise = async () => {
    setBusyId(id);
    setGenErr(null);
    try {
      const res = await generateEmployeeSummary(id);
      const s = parseSummary(res.data);
      if (!s) throw new Error('Respons ringkasan kosong');
      setSumState({ id, data: s });
      spend?.('ph_sum', 1);
    } catch (err) {
      setGenErr({ id, msg: err?.response?.data?.message || err?.message || 'Gagal membuat ringkasan' });
    } finally {
      setBusyId(null);
    }
  };

  const back = <div className="mb-2"><Link to="/karyawan" className="text-sm text-primary underline underline-offset-2">← Daftar karyawan</Link></div>;
  const head = (
    <div className="mb-3 flex items-center gap-3">
      <span className="rounded-[5px] bg-[#11473d] px-[7px] py-0.5 text-[11.5px] text-white" style={{ fontFamily: "'JetBrains Mono', monospace" }}>M1-05</span>
      <h1 className="font-display text-[26px] font-bold leading-tight">Profil 360</h1>
    </div>
  );

  if (error) {
    return (
      <div>
        {back}{head}
        <Card className="gap-0 py-0 shadow-none">
          <CardContent className="flex items-center justify-between gap-3 px-4 py-3">
            <p className="text-sm text-destructive">Gagal memuat data karyawan: {error}</p>
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={retry}>Coba lagi</Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  if (!all) {
    return <div>{back}{head}<Card className="gap-0 py-0 shadow-none"><CardContent className="px-4 py-6 text-sm text-muted-foreground">Memuat data karyawan…</CardContent></Card></div>;
  }
  if (!e || !inScope) {
    return (
      <div>
        {back}{head}
        <Card className="gap-0 py-0 shadow-none">
          <CardContent className="px-4 py-6 text-sm text-muted-foreground">
            {e ? 'Karyawan ini di luar cakupan peran Anda.' : 'Karyawan tidak ditemukan.'}
          </CardContent>
        </Card>
      </div>
    );
  }

  const boss = all.find((x) => x.nik === e.atasan);
  const boss2 = boss ? all.find((x) => x.nik === boss.atasan) : null;

  return (
    <div>
      {back}{head}
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_330px]">
        <div className="min-w-0">
          {/* Header card */}
          <Card className="gap-0 py-0 shadow-none">
            <CardContent className="flex flex-wrap items-center gap-4 p-4">
              <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-[#cfe8e0] text-[22px] font-semibold text-primary">
                {initials(e.nama)}
              </div>
              <div className="min-w-[200px] flex-1">
                <div className="font-display text-[22px] font-semibold leading-tight">{e.nama}</div>
                <p className="text-xs text-muted-foreground">
                  {e.jabatan} · {e.divisi || '—'} · {e.lokasi} · <span className="font-mono tracking-wide">{e.nik}</span>
                </p>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <Tag tone={e.aktif === 'Aktif' ? 'ok' : 'muted'}>{e.aktif}</Tag>
                  <Tag>{e.status}</Tag>
                  <WarnTag warn={e.warn} />
                  {e.dalamProb && <Tag tone="info">Masa percobaan</Tag>}
                  <Tag tone={p.cp.pct >= 90 ? 'ok' : 'warn'}>Data {p.cp.pct}%</Tag>
                </div>
              </div>
              {isHr && (
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={() => setEditOpen(true)}>✎ Ubah data</Button>
                  <Button variant="outline" disabled={busy} onClick={summarise}>
                    {busy ? '✦ Menyusun…' : summary ? '✦ Perbarui ringkasan' : '✦ Ringkas profil '}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {summaryError && <p className="mt-2 text-sm text-destructive">Gagal membuat ringkasan: {summaryError}</p>}

          {summary && (
            <div className="mt-3 rounded-xl border border-violet-200 bg-gradient-to-b from-violet-50 to-card px-4 py-3">
              <div className="mb-1.5 flex items-center gap-2 text-xs font-semibold text-violet-700">
                <Sparkles className="h-3.5 w-3.5" /> Ringkasan profil
                <Badge variant="secondary" className="bg-violet-100 text-[11px] text-violet-700">Saran AI</Badge>
              </div>
              <p className="text-[15px]">{summary.text}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                Disusun AI dari data karyawan ini; periksa kembali sebelum dipakai.
                {summary.at && ` Dibuat ${new Date(summary.at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}.`}
                {summary.stale && <b className="text-warning-foreground"> Data karyawan berubah sejak ringkasan ini dibuat.</b>}
              </p>
            </div>
          )}

          {/* Tabs */}
          <div className="mt-4 flex flex-wrap gap-1 border-b border-border">
            {tabs.map(([k, label]) => (
              <button
                key={k}
                type="button"
                onClick={() => setTab(k)}
                className={`-mb-px border-b-2 px-3 py-2 text-sm ${
                  tab === k ? 'border-primary font-semibold text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="mt-4">
            {tab === 'ring' && <TabRingkasan e={e} p={p} isHr={isHr} onAskEss={() => toast('Coming soon')} />}
            {tab === 'kerja' && <TabPekerjaan e={e} boss={boss} boss2={boss2} />}
            {tab === 'kontrak' && <TabKontrak e={e} p={p} />}
            {tab === 'kontak' && <TabKontak e={e} p={p} isHr={isHr} />}
            {tab === 'edu' && <TabPendidikan p={p} isHr={isHr} onScan={() => navigate('/scan')} />}
            {tab === 'sens' && isHr && <TabSensitif e={e} revealed={revealed} onReveal={reveal} />}
            {tab === 'dok' && <TabDokumen p={p} />}
            {tab === 'riw' && <TabRiwayat p={p} access={access} />}
          </div>
        </div>

        <ProfilePanel e={e} all={all} onOpen={goTo} />
      </div>

      {isHr && (
        <EmployeeEdit
          open={editOpen}
          onOpenChange={setEditOpen}
          employee={e}
          all={all}
          onSaved={() => { setEditOpen(false); refresh(); toast('Perubahan disimpan'); }}
        />
      )}
    </div>
  );
}