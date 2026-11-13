import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getEmployees } from '@/api/employees.api';
import { buildDashboard, fmtDate, REF_DATE } from '@/components/dashboard/dashboardMetrics.js';
import {
  Ban,
  AlertTriangle,
  Clock,
  GraduationCap,
  Pencil,
  Plus,
  Sparkles,
  Upload,
  ScanLine,
} from 'lucide-react';

// kind decides icon + colour
const KIND = {
  overdue: { icon: Ban,           tone: 'bg-destructive/10 text-destructive' },
  soon:    { icon: AlertTriangle, tone: 'bg-warning/15 text-warning-foreground' },
  prob:    { icon: Clock,         tone: 'bg-blue-50 text-blue-600' },
  cert:    { icon: GraduationCap, tone: 'bg-warning/15 text-warning-foreground' },
  quality: { icon: Pencil,        tone: 'bg-violet-50 text-violet-600' },
  more:    { icon: Plus,          tone: 'bg-muted text-muted-foreground' },
};

function StatCard({ stat, onClick }) {
  return (
    <Card
      onClick={onClick}
      className={`gap-0 py-0 shadow-none ${onClick ? 'cursor-pointer transition-colors hover:border-primary' : ''}`}
    >
      <CardContent className="px-4 py-4">
        <p className="text-[13px] text-muted-foreground">{stat.label}</p>
        <p className="font-display text-[32px] font-semibold leading-tight">{stat.value}</p>
        <p className="text-xs text-muted-foreground">{stat.sub}</p>
      </CardContent>
    </Card>
  );
}

function TodoRow({ todo, onOpen }) {
  const { icon: Icon, tone } = KIND[todo.kind];
  return (
    <div className="flex items-center gap-3 border-b border-border py-3 last:border-0">
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${tone}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-semibold">{todo.title}</p>
        {todo.sub && <p className="text-[13px] text-muted-foreground">{todo.sub}</p>}
      </div>
      <Button variant="outline" size="sm" className="h-8 text-xs" onClick={onOpen}>
        {todo.action}
      </Button>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  // role + spend() come from PeopleHub-Layout via <Outlet context>
  const { role = 'hr', spend } = useOutletContext() ?? {};
  const isHr = role === 'hr';

  const [rows, setRows] = useState(null);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [insightUpdated, setInsightUpdated] = useState(false);

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

  const dash = useMemo(() => (rows ? buildDashboard(rows, role) : null), [rows, role]);
  const todos = dash ? dash.todos.filter((t) => isHr || !t.hrOnly) : [];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <span
            className="rounded-[5px] bg-[#11473d] px-[7px] py-0.5 text-[11.5px] text-white"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            M1-01
          </span>
          <h1 className="font-display text-[26px] font-bold leading-tight">
            {isHr ? 'Selamat pagi, Rina' : 'Selamat pagi, Pak Joko'}
          </h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {isHr
            ? 'Konsol HR · ringkasan hari ini'
            : `Tim Produksi · ${dash ? dash.activeCount : '…'} karyawan aktif dalam cakupan Anda`}
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

      {!error && !dash && (
        <Card className="gap-0 py-0 shadow-none">
          <CardContent className="px-4 py-6 text-sm text-muted-foreground">Memuat data karyawan…</CardContent>
        </Card>
      )}

      {dash && (
        <>
          {/* KPI row */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {dash.stats.map((s) => (
              <StatCard key={s.label} stat={s} onClick={s.to ? () => navigate(s.to) : undefined} />
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {/* Perlu tindakan */}
            <Card className="gap-0 py-0 shadow-none">
              <CardHeader className="px-5 pt-5 pb-1">
                <CardTitle className="text-base">Perlu tindakan</CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-2">
                {todos.length ? (
                  todos.map((t) => <TodoRow key={t.key} todo={t} onOpen={() => navigate(t.to)} />)
                ) : (
                  <p className="py-3 text-xs text-muted-foreground">Tidak ada yang mendesak.</p>
                )}
              </CardContent>
            </Card>

            <div className="flex flex-col gap-4">
              {/* AI insight */}
              <div className="rounded-xl border border-violet-200 bg-gradient-to-b from-violet-50 to-card px-5 py-4">
                <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-violet-700">
                  <Sparkles className="h-3.5 w-3.5" />
                  Insight minggu ini
                  <Badge variant="secondary" className="bg-violet-100 text-[11px] text-violet-700">Saran AI</Badge>
                </div>
                <ul className="list-disc space-y-2 pl-5 text-[15px]">
                  {dash.insights.length ? (
                    dash.insights.map((parts, i) => (
                      <li key={i}>{parts.map((p, j) => (typeof p === 'string' ? p : <b key={j}>{p.b}</b>))}</li>
                    ))
                  ) : (
                    <li>Belum ada insight — data karyawan belum cukup.</li>
                  )}
                </ul>
                <p className="mt-3 text-xs text-muted-foreground">
                  Angka dihitung sistem dari data per {fmtDate(REF_DATE)}; AI hanya menulis kalimat &amp; saran (simulasi di prototipe).
                  Nama &amp; field sensitif tidak dikirim ke AI.{' '}
                  {insightUpdated
                    ? 'Diperbarui baru saja.'
                    : 'Disimpan sampai data berubah — membuka ulang tidak memotong kredit.'}{' '}
                  <button
                    type="button"
                    className="text-primary underline underline-offset-2"
                    onClick={() => {
                      spend?.('ph_insight', 2);
                      setInsightUpdated(true);
                    }}
                  >
                    Perbarui (2 kredit)
                  </button>
                </p>
              </div>

              {isHr && (
                <Card className="flex-1 gap-0 py-0 shadow-none">
                  <CardHeader className="px-5 pt-5 pb-2">
                    <CardTitle className="text-base">Masukkan data</CardTitle>
                  </CardHeader>
                  <CardContent className="px-5 pb-5">
                    <div className="grid grid-cols-2 gap-4">
                      <Button variant="outline" className="h-14 gap-2" onClick={() => navigate('/impor')}>
                        <Upload className="h-4 w-4" /> Impor Excel
                      </Button>
                      <Button variant="outline" className="h-14 gap-2" onClick={() => navigate('/scan')}>
                        <ScanLine className="h-4 w-4" /> Scan formulir
                      </Button>
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground">
                      File template Myralix dikenali otomatis tanpa kredit. File lain dipetakan AI (5 kredit/file); scan 10 kredit/halaman.
                    </p>
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