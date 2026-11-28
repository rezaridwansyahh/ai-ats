import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, Clock, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getLeavePortal, decideLeavePortal } from '@/api/portal-leave.api';
import { fmtDate } from '@/components/dashboard/dashboardMetrics.js';

const BLOCKED_TITLE = { 403: 'Belum bisa diproses', 409: 'Sudah diputuskan', 410: 'Link kedaluwarsa' };
const range = (a, b) => (a === b ? fmtDate(a) : `${fmtDate(a)} – ${fmtDate(b)}`);

const pick = (data, key) =>
  data?.[key] !== undefined
    ? data
    : Object.values(data ?? {}).find((v) => v && typeof v === 'object' && v[key] !== undefined) ?? data;

function Shell({ children }) {
  return (
    <div className="flex min-h-screen items-start justify-center bg-muted/30 p-4 pt-10">
      <div className="w-full max-w-md space-y-3">
        <div className="mb-4 text-center">
          <div className="text-base font-bold tracking-widest text-primary">MYRALIX</div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Portal Persetujuan Cuti</div>
        </div>
        {children}
      </div>
    </div>
  );
}

function Notice({ icon: Icon, tone, title, children }) {
  return (
    <Card>
      <CardContent className="space-y-2 p-6 text-center">
        <Icon className={`mx-auto h-8 w-8 ${tone}`} />
        <h2 className="text-sm font-bold">{title}</h2>
        <p className="text-[11px] leading-relaxed text-muted-foreground">{children}</p>
      </CardContent>
    </Card>
  );
}

export default function LeavePortal() {
  const { token } = useParams();
  const [view, setView] = useState({ kind: 'loading' });
  const [catatan, setCatatan] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;
    getLeavePortal(token)
      .then((res) => {
        if (!alive) return;
        const data = pick(res.data, 'karyawan');
        if (!data?.karyawan) {
          setView({ kind: 'blocked', status: 0, message: 'Format respons dari server tidak dikenali.' });
          return;
        }
        setView({ kind: 'form', data });
      })
      .catch((err) => {
        if (!alive) return;
        const status = err?.response?.status;
        setView({
          kind: 'blocked',
          status,
          message: err?.response?.data?.message || 'Tidak dapat memuat pengajuan. Coba muat ulang halaman.',
        });
      });
    return () => { alive = false; };
  }, [token]);

  const decide = async (keputusan) => {
    setBusy(true);
    setError(null);
    try {
      const res = await decideLeavePortal(token, { keputusan, catatan: catatan.trim() || undefined });
      setView({ kind: 'done', result: pick(res.data, 'keputusan') });
    } catch (err) {
      const status = err?.response?.status;
      const message = err?.response?.data?.message || 'Gagal menyimpan keputusan. Coba lagi.';
      if (status === 409 || status === 410) setView({ kind: 'blocked', status, message });
      else setError(message);
    } finally {
      setBusy(false);
    }
  };

  if (view.kind === 'loading') {
    return (
      <Shell>
        <Card><CardContent className="py-10 text-center text-xs text-muted-foreground">
          <Loader2 className="mr-2 inline h-4 w-4 animate-spin" /> Memuat pengajuan…
        </CardContent></Card>
      </Shell>
    );
  }

  if (view.kind === 'blocked') {
    const Icon = view.status === 410 ? Clock : AlertTriangle;
    const tone = view.status === 409 ? 'text-emerald-600' : view.status === 410 ? 'text-rose-500' : 'text-amber-500';
    return (
      <Shell>
        <Notice icon={Icon} tone={tone} title={BLOCKED_TITLE[view.status] ?? 'Link tidak valid'}>{view.message}</Notice>
      </Shell>
    );
  }

  if (view.kind === 'done') {
    const { keputusan, hari_dicatat, hari_dilewati } = view.result;
    return (
      <Shell>
        <Notice icon={CheckCircle2} tone="text-emerald-600" title="Terima kasih!">
          Pengajuan <b>{keputusan.toLowerCase()}</b>.
          {keputusan === 'Disetujui' && ` ${hari_dicatat} hari dicatat di data kehadiran.`}
          {hari_dilewati > 0 && ` ${hari_dilewati} hari dilewati karena sudah ada data kehadiran.`}
          {' '}Anda dapat menutup halaman ini.
        </Notice>
      </Shell>
    );
  }

  const d = view.data;
  const rows = [
    ['Tanggal', `${range(d.tgl_mulai, d.tgl_selesai)} (${d.hari_kerja} hari kerja)`],
    ['Jabatan', `${d.karyawan.jabatan ?? '—'} · ${d.karyawan.divisi ?? '—'}`],
    ...(d.alasan ? [['Alasan', d.alasan]] : []),
    ...(d.saldo ? [['Sisa saldo', d.saldo.berhak ? `${d.saldo.sisa} hari` : 'belum berhak']] : []),
  ];

  return (
    <Shell>
      <Card>
        <CardContent className="space-y-3 p-5">
          <p className="text-[11px] text-muted-foreground">
            Untuk {d.atasan ?? 'atasan'} · berlaku sampai {new Date(d.token_expires_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
          </p>
          <h2 className="font-display text-[19px] font-semibold leading-tight">
            {d.karyawan.nama} mengajukan {d.jenis.toLowerCase()}
          </h2>
          <dl className="grid grid-cols-[100px_1fr] gap-x-3 gap-y-1.5 text-sm">
            {rows.map(([label, value]) => (
              <div key={label} className="contents">
                <dt className="text-muted-foreground">{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <textarea
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            maxLength={255}
            rows={3}
            placeholder="Catatan (opsional)"
            className="w-full rounded-lg border border-input bg-background p-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          {error && (
            <p className="flex items-center gap-1.5 text-xs text-destructive">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> {error}
            </p>
          )}
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" disabled={busy} onClick={() => decide('Ditolak')}>Tolak</Button>
            <Button className="flex-1" disabled={busy} onClick={() => decide('Disetujui')}>
              {busy ? 'Menyimpan…' : 'Setujui'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </Shell>
  );
}