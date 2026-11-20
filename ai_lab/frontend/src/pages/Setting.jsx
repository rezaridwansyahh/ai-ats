import { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getEmployees } from '@/api/employees.api';
import BatasCard from '@/components/setting/BatasCard';
import PrivasiCard from '@/components/setting/PrivasiCard';
import DaftarPilihanCard from '@/components/setting/DaftarPilihanCard';
import { DEFAULTS, validate } from '@/components/setting/settingsDefaults.js';

const uniq = (rows, k) => [...new Set(rows.map((e) => e[k]).filter(Boolean))].sort();

export default function Pengaturan() {
  const { role = 'hr' } = useOutletContext() ?? {};
  const [form, setForm] = useState(DEFAULTS);
  const [lists, setLists] = useState({ divisi: [], lokasi: [] });

  useEffect(() => {
    let alive = true;
    getEmployees()
      .then((res) => {
        if (!alive) return;
        const body = res.data;
        const rows = Array.isArray(body) ? body : body?.employees ?? body?.data ?? [];
        setLists({ divisi: uniq(rows, 'divisi'), lokasi: uniq(rows, 'lokasi') });
      })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  const errors = useMemo(() => validate(form), [form]);
  const invalid = Object.keys(errors).length > 0;
  const dirty = JSON.stringify(form) !== JSON.stringify(DEFAULTS);

  const onChange = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const head = (
    <div className="mb-3">
      <div className="flex items-center gap-3">
        <span className="rounded-[5px] bg-[#11473d] px-[7px] py-0.5 text-[11.5px] text-white" style={{ fontFamily: "'JetBrains Mono', monospace" }}>M1-08</span>
        <h1 className="font-display text-[26px] font-bold leading-tight">Pengaturan People Hub</h1>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">Aturan ini dipakai semua rumus, dashboard dan pengingat</p>
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
        Tampilan awal: perubahan belum disimpan ke server dan belum memengaruhi angka di halaman lain.
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <BatasCard form={form} errors={errors} onChange={onChange} />
        <PrivasiCard />
      </div>

      <DaftarPilihanCard divisi={lists.divisi} lokasi={lists.lokasi} />

      <div className="flex justify-end gap-2">
        <Button variant="outline" disabled={!dirty} onClick={() => setForm(DEFAULTS)}>Kembalikan default</Button>
        <Button disabled={invalid} onClick={() => toast('Coming soon')}>Simpan pengaturan</Button>
      </div>
    </div>
  );
}