import { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getEmployees } from '@/api/employees.api';
import { buildDashboard, fmtDate, REF_DATE } from '@/components/dashboard/dashboardMetrics.js';
import { buildDemografi } from '@/components/dashboard/demografiMetrics.js';
import KpiCard from '@/components/dashboard/KpiCard';
import BarCard from '@/components/dashboard/BarCard';
import GenderCard from '@/components/dashboard/GenderCard';
import DivisiTable from '@/components/dashboard/DivisiTable';
import DrillList from '@/components/dashboard/DrillList';
import InsightCard from '@/components/dashboard/InsightCard';
import TanyaDataCard from '@/components/dashboard/TanyaDataCard';

export default function Demografi() {
  const { role = 'hr' } = useOutletContext() ?? {};
  const [rows, setRows] = useState(null);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [drill, setDrill] = useState(null);

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

  const d = useMemo(() => (rows ? buildDemografi(rows, role) : null), [rows, role]);
  const insights = useMemo(() => (rows ? buildDashboard(rows, role).insights : []), [rows, role]);

  const head = (
    <div className="mb-3">
      <div className="flex items-center gap-3">
        <span className="rounded-[5px] bg-[#11473d] px-[7px] py-0.5 text-[11.5px] text-white" style={{ fontFamily: "'JetBrains Mono', monospace" }}>M1-06</span>
        <h1 className="font-display text-[26px] font-bold leading-tight">Dashboard demografi</h1>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {role === 'hr' ? 'Seluruh perusahaan' : 'Cakupan tim Anda'} · per {fmtDate(REF_DATE)} · klik angka atau batang untuk melihat daftar nama
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

  const g = d.groups;
  const pick = (x) => setDrill(x);

  return (
    <div className="space-y-4">
      {head}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {d.kpis.map((k) => (
          <KpiCard
            key={k.key}
            label={k.label}
            value={k.value}
            sub={k.sub}
            onClick={k.list ? () => pick({ title: k.label, list: k.list }) : undefined}
          />
        ))}
      </div>

      {drill && <DrillList drill={drill} onClose={() => setDrill(null)} />}

      <div className="grid items-start gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2"><InsightCard insights={insights} /></div>
        <TanyaDataCard />
      </div>

      <div className="grid items-start gap-4 md:grid-cols-2 lg:grid-cols-3">
        <BarCard title="Per divisi" items={g.divisi} total={d.total} onPick={pick} />
        <GenderCard gender={d.gender} perLevel={d.perLevel} total={d.total} onPick={pick} />
        <BarCard title="Status kontrak" items={g.status} total={d.total} onPick={pick} />
        <BarCard title="Kelompok usia" items={g.usia} total={d.total} onPick={pick} />
        <BarCard title="Generasi" items={g.generasi} total={d.total} onPick={pick} />
        <BarCard title="Masa kerja" items={g.masa} total={d.total} onPick={pick} />
        <BarCard title="Lokasi" items={g.lokasi} total={d.total} onPick={pick} />
        <BarCard title="Pendidikan" items={g.pendidikan} total={d.total} onPick={pick} />
        <BarCard title="Level jabatan" items={g.level} total={d.total} onPick={pick} />
      </div>

      <DivisiTable rows={d.divRows} totals={d.totals} year={REF_DATE.slice(0, 4)} onPick={pick} />
    </div>
  );
}