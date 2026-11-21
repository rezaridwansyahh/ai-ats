import { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getEmployees } from '@/api/employees.api';
import { B1, B2, PROB_MONTHS } from '@/components/dashboard/dashboardMetrics.js';
import { buildPengingat, MOCK_CERTS } from '@/components/notification/notificationMetrics.js';
import ReminderTable from '@/components/notification/ReminderTable';
import SertifikatTable from '@/components/notification/CertificateTable';

export default function Pengingat() {
  const { role = 'hr' } = useOutletContext() ?? {};
  const [rows, setRows] = useState(null);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [reviewed, setReviewed] = useState(() => new Set());

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

  const retry = () => { setError(null); setRows(null); setReloadKey((k) => k + 1); };
  const d = useMemo(() => (rows ? buildPengingat(rows, role) : null), [rows, role]);

  // Local only: lost on reload until a backend exists.
  const markReviewed = (key) => {
    setReviewed((s) => new Set(s).add(key));
    toast('Ditandai ditinjau');
  };

  const head = (
    <div className="mb-3">
      <div className="flex items-center gap-3">
        <span className="rounded-[5px] bg-[#11473d] px-[7px] py-0.5 text-[11.5px] text-white" style={{ fontFamily: "'JetBrains Mono', monospace" }}>M1-07</span>
        <h1 className="font-display text-[26px] font-bold leading-tight">Pengingat kontrak &amp; masa percobaan</h1>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Batas peringatan: Segera ≤ {B1} hari · Perhatian {B1 + 1}–{B2} hari · masa percobaan {PROB_MONTHS} bulan (ubah di Pengaturan)
      </p>
    </div>
  );

  if (error) {
    return (
      <div>
        {head}
        <Card className="gap-0 py-0 shadow-none">
          <CardContent className="flex items-center justify-between gap-3 px-4 py-3">
            <p className="text-sm text-destructive">Gagal memuat data karyawan: {error}</p>
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={retry}>Coba lagi</Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  if (!d) {
    return (
      <div>
        {head}
        <Card className="gap-0 py-0 shadow-none">
          <CardContent className="px-4 py-6 text-sm text-muted-foreground">Memuat data karyawan…</CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {head}

      <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
        Tampilan awal: tanda "ditinjau" belum disimpan ke server dan email pengingat belum aktif.
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">
          Rencana: email ringkasan tiap Senin ke HR{role === 'hr' ? ' dan ke tiap atasan untuk timnya' : ''}.
        </span>
        <span className="flex-1" />
        <Button variant="outline" size="sm" onClick={() => toast('Coming soon')}>✦ Ringkasan untuk atasan</Button>
      </div>

      <ReminderTable
        title="Kontrak berakhir"
        type="k"
        rows={d.kontrak}
        bossOf={d.bossOf}
        reviewed={reviewed}
        onReview={markReviewed}
      />
      <ReminderTable
        title="Masa percobaan berjalan"
        type="p"
        rows={d.prob}
        bossOf={d.bossOf}
        reviewed={reviewed}
        onReview={markReviewed}
      />
      <SertifikatTable rows={MOCK_CERTS} warnDays={60} />
    </div>
  );
}