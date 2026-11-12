import { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Ban,
  AlertTriangle,
  Clock,
  GraduationCap,
  Pencil,
  Sparkles,
  Upload,
  ScanLine,
} from 'lucide-react';

/* ─── Mock data (reference date 30 Nov 2026) — replaced by the API later ─── */
const REF_DATE = '30 Nov 2026';

const STATS = [
  { label: 'Karyawan aktif',               value: '49',    sub: '10 sudah keluar (tersimpan)', to: '/karyawan' },
  { label: 'Kontrak ≤ 30 hari / lewat',    value: '4',     sub: 'Segera + Lewat',              to: '/karyawan' },
  { label: 'Dalam masa percobaan',         value: '3',     sub: 'PKWTT, 3 bulan pertama',      to: '/karyawan' },
  { label: '% Perempuan',                  value: '38,8%', sub: '19 dari 49' },
];

// kind decides icon + colour; hrOnly items are hidden for the manager role
const TODOS = [
  { kind: 'overdue', title: 'Siti Sitompul — kontrak PKWT lewat 2 hari',        sub: 'Staf Purchasing · Pengadaan · berakhir 28 Nov 2026',        action: 'Buka',   to: '/karyawan' },
  { kind: 'soon',    title: 'Tari Nasution — kontrak PKWT habis dalam 5 hari',  sub: 'Operator Packing · Produksi · berakhir 5 Des 2026',         action: 'Buka',   to: '/karyawan' },
  { kind: 'soon',    title: 'Lestari Permata — kontrak PKWT habis dalam 12 hari', sub: 'Staf GA · SDM & GA · berakhir 12 Des 2026',               action: 'Buka',   to: '/karyawan' },
  { kind: 'soon',    title: 'Lukman Nasution — kontrak PKWT habis dalam 20 hari', sub: 'Driver · Gudang & Logistik · berakhir 20 Des 2026',       action: 'Buka',   to: '/karyawan' },
  { kind: 'prob',    title: 'Ayu Saputra — masa percobaan selesai 1 Des 2026',  sub: 'Staf QC · Produksi · 1 hari lagi',                          action: 'Buka',   to: '/karyawan' },
  { kind: 'prob',    title: 'Hendra Utami — masa percobaan selesai 21 Des 2026', sub: 'Staf QC · Produksi · 21 hari lagi',                        action: 'Buka',   to: '/karyawan' },
  { kind: 'cert',    title: '7 sertifikat kedaluwarsa atau ≤ 60 hari',          sub: 'Lestari Permata · Sertifikasi Manajemen SDM · Putri Wibowo · Sertifikasi Manajemen SDM · Ayu Saputra · K3 Umum', action: 'Lihat', to: '/pengingat' },
  { kind: 'quality', title: '5 data karyawan perlu dirapikan',                  sub: 'Tgl keluar kosong · NIK ganda · Pendidikan kosong · Akhir kontrak kosong', action: 'Perbaiki', to: '/karyawan', hrOnly: true },
];

const KIND = {
  overdue: { icon: Ban,           tone: 'bg-destructive/10 text-destructive' },
  soon:    { icon: AlertTriangle, tone: 'bg-warning/15 text-warning-foreground' },
  prob:    { icon: Clock,         tone: 'bg-blue-50 text-blue-600' },
  cert:    { icon: GraduationCap, tone: 'bg-warning/15 text-warning-foreground' },
  quality: { icon: Pencil,        tone: 'bg-violet-50 text-violet-600' },
};

const INSIGHTS = [
  <><b>4 kontrak</b> sudah lewat atau berakhir ≤30 hari, dan <b>2</b> lagi dalam 31–60 hari. Tersebar di 6 divisi. Saran: jadwalkan tinjauan perpanjangan bersama atasan langsung minggu ini.</>,
  <><b>3 karyawan</b> masih dalam masa percobaan; yang paling dekat selesai: Ayu Saputra (1 Des 2026). Saran: minta penilaian atasan sebelum tanggal tersebut.</>,
  <>Porsi PKWT + Magang di <b>SDM &amp; GA</b> 75,0% dari 4 karyawan aktif, di atas rata-rata perusahaan (32,7%). Saran: pastikan rencana kebutuhan tenaga kerja divisi ini jelas sebelum kontrak diperpanjang otomatis.</>,
  <>7 karyawan keluar di 2026; alasan terbanyak: <b>Resign sukarela</b> (5). Saran: bila resign sukarela dominan, pertimbangkan wawancara keluar terstruktur.</>,
  <><b>5 baris</b> punya masalah kualitas data (mis. Tgl keluar kosong pada Fitri Pratama). Angka dashboard bisa meleset sampai ini diperbaiki.</>,
];

/* ─── Small pieces ─── */
function StatCard({ stat, onClick }) {
  return (
    <Card
      onClick={onClick}
      className={`gap-0 py-0 shadow-none ${onClick ? 'cursor-pointer transition-colors hover:border-primary' : ''}`}
    >
      <CardContent className="px-3.5 py-3">
        <p className="text-xs text-muted-foreground">{stat.label}</p>
        <p className="font-display text-[27px] font-semibold leading-tight">{stat.value}</p>
        <p className="text-[11.5px] text-muted-foreground">{stat.sub}</p>
      </CardContent>
    </Card>
  );
}

function TodoRow({ todo, onOpen }) {
  const { icon: Icon, tone } = KIND[todo.kind];
  return (
    <div className="flex items-center gap-2.5 border-b border-border py-2.5 last:border-0">
      <div className={`flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-lg ${tone}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{todo.title}</p>
        <p className="text-[12.5px] text-muted-foreground">{todo.sub}</p>
      </div>
      <Button variant="outline" size="sm" className="h-7 text-xs" onClick={onOpen}>
        {todo.action}
      </Button>
    </div>
  );
}

/* ─── Page ─── */
// `role` will come from the Myralix session when this is merged; no login here.
export default function Dashboard() {
  const navigate = useNavigate();
  // role + spend() come from PeopleHub-Layout via <Outlet context>
  const { role = 'hr', spend } = useOutletContext() ?? {};
  const [insightUpdated, setInsightUpdated] = useState(false);
  const isHr = role === 'hr';
  const todos = TODOS.filter((t) => isHr || !t.hrOnly);

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
          {isHr ? 'Konsol HR · ringkasan hari ini' : 'Tim Produksi · 49 karyawan aktif dalam cakupan Anda'}
        </p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        {STATS.map((s) => (
          <StatCard key={s.label} stat={s} onClick={s.to ? () => navigate(s.to) : undefined} />
        ))}
      </div>

      <div className="grid gap-3.5 lg:grid-cols-2">
        {/* Perlu tindakan */}
        <Card className="gap-0 py-0 shadow-none">
          <CardHeader className="px-4 pt-4 pb-1">
            <CardTitle className="text-[15px]">Perlu tindakan</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-2">
            {todos.length ? (
              todos.map((t) => <TodoRow key={t.title} todo={t} onOpen={() => navigate(t.to)} />)
            ) : (
              <p className="py-3 text-xs text-muted-foreground">Tidak ada yang mendesak.</p>
            )}
          </CardContent>
        </Card>

        <div className="space-y-3.5">
          {/* AI insight */}
          <div className="rounded-xl border border-violet-200 bg-gradient-to-b from-violet-50 to-card px-4 py-3">
            <div className="mb-1.5 flex items-center gap-2 text-xs font-semibold text-violet-700">
              <Sparkles className="h-3.5 w-3.5" />
              Insight minggu ini
              <Badge variant="secondary" className="bg-violet-100 text-[11px] text-violet-700">Saran AI</Badge>
            </div>
            <ul className="list-disc space-y-1.5 pl-5 text-sm">
              {INSIGHTS.map((text, i) => <li key={i}>{text}</li>)}
            </ul>
            <p className="mt-2 text-[11.5px] text-muted-foreground">
              Angka dihitung sistem dari data per {REF_DATE}; AI hanya menulis kalimat &amp; saran (simulasi di prototipe).
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

          {/* Masukkan data (HR only) */}
          {isHr && (
            <Card className="gap-0 py-0 shadow-none">
              <CardHeader className="px-4 pt-4 pb-2">
                <CardTitle className="text-[15px]">Masukkan data</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="grid grid-cols-2 gap-3.5">
                  <Button variant="outline" className="h-[52px] gap-2" onClick={() => navigate('/impor')}>
                    <Upload className="h-4 w-4" /> Impor Excel
                  </Button>
                  <Button variant="outline" className="h-[52px] gap-2" onClick={() => navigate('/scan')}>
                    <ScanLine className="h-4 w-4" /> Scan formulir
                  </Button>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  File template Myralix dikenali otomatis tanpa kredit. File lain dipetakan AI (5 kredit/file); scan 10 kredit/halaman.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}