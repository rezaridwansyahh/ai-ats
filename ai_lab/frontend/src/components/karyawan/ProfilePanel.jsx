import { Card, CardContent } from '@/components/ui/card';
import { initials } from './karyawanUtils.js';

function Node({ x, me, count, onOpen }) {
  return (
    <div
      onClick={me ? undefined : onOpen}
      className={`flex items-center gap-2.5 rounded-lg border px-2.5 py-2 ${
        me ? 'border-primary bg-accent' : 'cursor-pointer border-border bg-card hover:bg-accent/50'
      }`}
    >
      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#cfe8e0] text-[11px] font-semibold text-primary">
        {initials(x.nama)}
      </div>
      <div className="min-w-0 flex-1 leading-tight">
        <b className="block truncate text-[13px]">{x.nama}</b>
        <span className="block truncate text-xs text-muted-foreground">{x.jabatan}</span>
      </div>
      {count != null && (
        <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">{count}</span>
      )}
    </div>
  );
}

const Line = () => <div className="ml-5 h-3 w-px bg-border" />;

export default function OrgPanel({ e, all, onOpen }) {
  const boss = all.find((x) => x.nik === e.atasan);
  const boss2 = boss ? all.find((x) => x.nik === boss.atasan) : null;
  const subs = all.filter((x) => x.atasan === e.nik && x.aktif === 'Aktif');
  const reports = (x) => all.filter((y) => y.atasan === x.nik && y.aktif === 'Aktif').length;
  const open = (x) => () => onOpen(x);

  return (
    <Card className="gap-0 py-0 shadow-none">
      <CardContent className="p-4">
        <h3 className="mb-3 text-base font-semibold">Struktur</h3>
        {boss2 && <><Node x={boss2} count={reports(boss2)} onOpen={open(boss2)} /><Line /></>}
        {boss && <><Node x={boss} count={reports(boss)} onOpen={open(boss)} /><Line /></>}
        <Node x={e} me />
        {subs.length > 0 ? (
          <div className="ml-5 mt-1.5 space-y-1.5 border-l border-border pl-3">
            {subs.slice(0, 6).map((s) => <Node key={s.id ?? s.nik} x={s} count={reports(s)} onOpen={open(s)} />)}
            {subs.length > 6 && <p className="text-xs text-muted-foreground">+{subs.length - 6} lainnya</p>}
          </div>
        ) : (
          <p className="mt-2 text-xs text-muted-foreground">Tidak ada bawahan langsung.</p>
        )}
        <p className="mt-3 text-xs text-muted-foreground">
          Angka = jumlah bawahan langsung aktif. Klik untuk membuka profil.
        </p>
      </CardContent>
    </Card>
  );
}