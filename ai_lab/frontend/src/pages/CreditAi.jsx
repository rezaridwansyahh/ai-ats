import { useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import KpiCard from '@/components/dashboard/KpiCard';
import { pct } from '@/components/dashboard/demografiMetrics.js';
import KuotaBar from '@/components/credit/QuotaBar';
import AktivitasTable from '@/components/credit/ActivityTable';
import LogTable from '@/components/credit/LogTable';
import { PKG, MOCK_LOG, summarise, fmtNum } from '@/components/credit/creditData.js';

export default function KreditAi() {
  const { role = 'hr' } = useOutletContext() ?? {};
  const s = useMemo(() => summarise(MOCK_LOG), []);

  const head = (
    <div className="mb-3">
      <div className="flex items-center gap-3">
        <span className="rounded-[5px] bg-[#11473d] px-[7px] py-0.5 text-[11.5px] text-white" style={{ fontFamily: "'JetBrains Mono', monospace" }}>M1-09</span>
        <h1 className="font-display text-[26px] font-bold leading-tight">Pemakaian kredit AI</h1>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {PKG.name} · periode {PKG.period} · harga dan kuota masih ilustrasi
      </p>
    </div>
  );

  if (role !== 'hr') {
    return (
      <div>
        {head}
        <Card className="gap-0 py-0 shadow-none">
          <CardContent className="px-4 py-6 text-sm text-muted-foreground">Menu ini hanya untuk HR Admin.</CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {head}

      <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
        Tampilan awal: kuota, bobot dan log di bawah adalah contoh fiktif. Belum terhubung ke backend, dan fitur lain belum memotong kredit.
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard label="Kuota bulan ini" value={fmtNum(PKG.quota)} sub="kredit" />
        <KpiCard label="Terpakai" value={fmtNum(s.used)} sub={pct(s.used, PKG.quota)} />
        <KpiCard label="Sisa" value={fmtNum(s.remaining)} sub="peringatan di 20% & 0%" />
        <KpiCard label="Aktivitas AI" value={String(MOCK_LOG.length)} sub="kali" />
      </div>

      <KuotaBar used={s.used} remaining={s.remaining} />

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <AktivitasTable rows={s.byActivity} />
        <LogTable rows={s.recent} />
      </div>
    </div>
  );
}