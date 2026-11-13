import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useOutletContext, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getEmployees } from '@/api/employees.api';
import { normalise, teamNiks } from '@/components/dashboard/dashboardMetrics.js';
import EmployeeSidePanel from '@/components/karyawan/EmployeeSidePanel';
import { Tag, WarnTag } from '@/components/karyawan/EmployeeTags';
import { dec, rowKey } from '@/components/karyawan/karyawanUtils.js';

const SELECT_CLASS = 'h-9 rounded-lg border border-input bg-card px-2.5 text-sm';
const TH = 'sticky top-0 border-b border-border bg-muted/60 px-2.5 py-2 text-left text-[11.5px] font-semibold uppercase tracking-wide text-muted-foreground';

function FilterSelect({ label, value, options, onChange }) {
  return (
    <select className={SELECT_CLASS} value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">{label}</option>
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function FilterChip({ children, onClear }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-2.5 py-0.5 text-[12.5px] font-medium text-primary">
      {children}
      <button type="button" className="text-sm leading-none" onClick={onClear} aria-label="Hapus filter">×</button>
    </span>
  );
}

export default function Karyawan() {
  const navigate = useNavigate();
  const { role = 'hr' } = useOutletContext() ?? {};
  const isHr = role === 'hr';

  const [rows, setRows] = useState(null);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [selKey, setSelKey] = useState(null);

  // Filters live in the URL, so /karyawan?warn=urg works from the Beranda KPIs.
  const [params, setParams] = useSearchParams();
  const f = {
    q: params.get('q') ?? '',
    divisi: params.get('divisi') ?? '',
    lokasi: params.get('lokasi') ?? '',
    status: params.get('status') ?? '',
    aktif: params.get('aktif') ?? '',
    warn: params.get('warn') ?? '',
    prob: params.get('prob') ?? '',
  };
  const setF = (key, value) =>
    setParams((p) => {
      const n = new URLSearchParams(p);
      if (value) n.set(key, value); else n.delete(key);
      return n;
    }, { replace: true });

  // GET /employee → plain array, or { data: [...] }
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

  const retry = () => {
    setError(null);
    setRows(null);
    setReloadKey((k) => k + 1);
  };

  const all = useMemo(() => (rows ? normalise(rows) : null), [rows]);
  const scoped = useMemo(() => {
    if (!all) return null;
    if (isHr) return all;
    const team = teamNiks(all);
    return all.filter((e) => team.has(e.nik));
  }, [all, isHr]);

  const uniq = (k) => (scoped ? [...new Set(scoped.map((e) => e[k]).filter(Boolean))].sort() : []);

  const list = useMemo(() => {
    if (!scoped) return [];
    const q = f.q.toLowerCase();
    return scoped.filter((e) => {
      if (f.aktif && e.aktif !== f.aktif) return false;
      if (f.divisi && e.divisi !== f.divisi) return false;
      if (f.lokasi && e.lokasi !== f.lokasi) return false;
      if (f.status && e.status !== f.status) return false;
      if (f.warn === 'urg' && !(e.warn === 'Lewat' || e.warn === 'Segera')) return false;
      if (f.warn && f.warn !== 'urg' && e.warn !== f.warn) return false;
      if (f.prob && !e.dalamProb) return false;
      if (q && !`${e.nama ?? ''} ${e.nik ?? ''} ${e.jabatan ?? ''}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [scoped, f.q, f.aktif, f.divisi, f.lokasi, f.status, f.warn, f.prob]);

  const selected = scoped?.find((e) => rowKey(e) === selKey) ?? null;
  const boss = selected && all ? all.find((x) => x.nik === selected.atasan) : null;
  const openProfile = (e) => navigate(`/karyawan/${e.id ?? e.nik}`);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <span
            className="rounded-[5px] bg-[#11473d] px-[7px] py-0.5 text-[11.5px] text-white"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            M1-04
          </span>
          <h1 className="font-display text-[26px] font-bold leading-tight">Karyawan</h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {isHr
            ? 'Semua karyawan PT Contoh Sejahtera'
            : 'Cakupan Anda: tim Produksi (rantai atasan). Field sensitif disembunyikan.'}
        </p>
      </div>

      {error && (
        <Card className="gap-0 py-0 shadow-none">
          <CardContent className="flex items-center justify-between gap-3 px-4 py-3">
            <p className="text-sm text-destructive">Gagal memuat data karyawan: {error}</p>
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={retry}>Coba lagi</Button>
          </CardContent>
        </Card>
      )}

      {!error && !scoped && (
        <Card className="gap-0 py-0 shadow-none">
          <CardContent className="px-4 py-6 text-sm text-muted-foreground">Memuat data karyawan…</CardContent>
        </Card>
      )}

      {scoped && (
        <>
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <Input
              type="search"
              placeholder="Cari nama, NIK, jabatan…"
              value={f.q}
              onChange={(e) => setF('q', e.target.value)}
              className="h-9 w-full min-w-[220px] sm:w-[260px]"
            />
            <FilterSelect label="Semua divisi" value={f.divisi} options={uniq('divisi')} onChange={(v) => setF('divisi', v)} />
            <FilterSelect label="Semua lokasi" value={f.lokasi} options={uniq('lokasi')} onChange={(v) => setF('lokasi', v)} />
            <FilterSelect label="Semua status" value={f.status} options={['PKWTT', 'PKWT', 'Magang']} onChange={(v) => setF('status', v)} />
            <FilterSelect label="Aktif + Keluar" value={f.aktif} options={['Aktif', 'Keluar']} onChange={(v) => setF('aktif', v)} />
            {f.warn && (
              <FilterChip onClear={() => setF('warn', '')}>
                {f.warn === 'urg' ? 'Kontrak Segera + Lewat' : `Kontrak ${f.warn}`}
              </FilterChip>
            )}
            {f.prob && <FilterChip onClear={() => setF('prob', '')}>Dalam masa percobaan</FilterChip>}
            <span className="flex-1" />
            <span className="text-xs text-muted-foreground">{list.length} orang</span>
            {isHr && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  // MOCK: the real .xlsx export + audit log come later
                  onClick={() => toast('Disimulasikan: ekspor .xlsx · tercatat di audit (field sensitif tidak ikut)')}
                >
                  ⇩ Ekspor
                </Button>
                <Button size="sm" className="h-8 text-xs" onClick={() => navigate('/scan')}>＋ Tambah</Button>
              </>
            )}
          </div>

          <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
            {/* Table */}
            <Card className="max-h-[70vh] gap-0 overflow-auto py-0 shadow-none">
              <table className="w-full border-collapse text-[13px]">
                <thead>
                  <tr>
                    <th className={TH}>Nama</th>
                    <th className={`${TH} hidden md:table-cell`}>NIK</th>
                    <th className={TH}>Jabatan · Divisi</th>
                    <th className={`${TH} hidden md:table-cell`}>Lokasi</th>
                    <th className={TH}>Status</th>
                    <th className={`${TH} hidden text-right md:table-cell`}>Masa kerja</th>
                    <th className={TH} />
                  </tr>
                </thead>
                <tbody>
                  {list.length === 0 && (
                    <tr><td colSpan={7} className="px-2.5 py-4 text-xs text-muted-foreground">Tidak ada yang cocok.</td></tr>
                  )}
                  {list.map((e) => {
                    const key = rowKey(e);
                    return (
                      <tr
                        key={key}
                        onClick={() => setSelKey(key)}
                        className={`cursor-pointer border-b border-border/60 hover:bg-accent/60 ${key === selKey ? 'bg-accent' : ''}`}
                      >
                        <td className="px-2.5 py-2">
                          <b>{e.nama}</b>{' '}
                          {e.aktif === 'Keluar' && <Tag>Keluar</Tag>}
                        </td>
                        <td className="hidden px-2.5 py-2 font-mono text-xs tracking-wide md:table-cell">{e.nik}</td>
                        <td className="px-2.5 py-2">
                          {e.jabatan}
                          <div className="text-xs text-muted-foreground">{e.divisi || '— divisi kosong'}</div>
                        </td>
                        <td className="hidden px-2.5 py-2 md:table-cell">{(e.lokasi || '').split(' (')[0]}</td>
                        <td className="px-2.5 py-2">
                          <span className="flex flex-wrap items-center gap-1.5">
                            {e.status}
                            <WarnTag warn={e.warn} />
                            {e.dalamProb && <Tag tone="info">Percobaan</Tag>}
                          </span>
                        </td>
                        <td className="hidden px-2.5 py-2 text-right tabular-nums md:table-cell">{dec(e.masa)} thn</td>
                        <td className="px-2.5 py-2">
                          {isHr && e.cek.length > 0 && <Tag tone="warn" title={e.cek.join(', ')}>✎ {e.cek.length}</Tag>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Card>

            {/* Side panel */}
            <div className="lg:sticky lg:top-16">
              {selected ? (
                <EmployeeSidePanel employee={selected} boss={boss} isHr={isHr} onOpen={() => openProfile(selected)} />
              ) : (
                <Card className="gap-0 py-0 shadow-none">
                  <CardContent className="p-4 text-xs text-muted-foreground">
                    Klik baris untuk melihat ringkasan di sini.
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}