import { Button } from '@/components/ui/button';

const GEO_TEXT = {
  denied: 'Lokasi ditolak',
  unavailable: 'Lokasi tidak tersedia',
  lookup_failed: 'Lokasi tercatat',
};

const place = (p) => (p.geo_status === 'ok' ? p.geo_label ?? 'Lokasi tercatat' : GEO_TEXT[p.geo_status] ?? '—');
const placeWithAccuracy = (p) => `${place(p)}${p.geo_accuracy != null ? ` · akurasi ±${p.geo_accuracy} m` : ''}`;

const greeting = () => {
  const h = new Date().getHours();
  return h < 11 ? 'Selamat pagi,' : h < 15 ? 'Selamat siang,' : h < 18 ? 'Selamat sore,' : 'Selamat malam,';
};

export default function PhonePreview({ clock, busy, onPunch, onLeave, onSaldo }) {
  const punches = clock?.punches ?? [];
  const last = punches[punches.length - 1];
  const isIn = clock?.next !== 'out';

  return (
    <div className="mx-auto w-[300px] overflow-hidden rounded-[34px] border-[10px] border-[#1b2b27] bg-card shadow-[0_10px_30px_rgba(0,0,0,.15)]">
      <div className="min-h-[520px] px-4 pb-[22px] pt-4">
        {!clock ? (
          <p className="text-xs text-muted-foreground">Memuat…</p>
        ) : (
          <>
            <p className="text-xs text-muted-foreground">{greeting()}</p>
            <p className="font-display text-[21px] font-semibold">{clock.employee.nama}</p>
            <p className="text-xs text-muted-foreground">
              {[clock.employee.jabatan, clock.employee.lokasi].filter(Boolean).join(' · ')}
            </p>

            <div className="my-3.5 rounded-[10px] border border-[#cde5dd] bg-[#eaf5f1] px-2.5 py-2 text-[12.5px]">
              📍 {last ? placeWithAccuracy(last) : 'Lokasi diminta saat Anda menekan tombol absen'}
            </div>

            <button
              type="button"
              disabled={busy}
              onClick={onPunch}
              className={`w-full rounded-[14px] py-[18px] text-[17px] font-semibold text-white disabled:opacity-60 ${isIn ? 'bg-primary' : 'bg-[#C2741A]'}`}
            >
              {busy ? 'Mengirim…' : isIn ? 'Absen masuk' : 'Absen pulang'}
            </button>

            <div className="mt-3.5">
              {punches.length ? (
                punches.slice().reverse().map((p) => (
                  <div key={p.ts} className="flex items-center gap-3 border-b border-border/60 py-2 last:border-0">
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#eaf5f1]">{p.type === 'in' ? '→' : '←'}</div>
                    <div className="min-w-0">
                      <b className="block text-sm">{p.type === 'in' ? 'Masuk' : 'Pulang'} {p.time}</b>
                      <span className="block text-xs text-muted-foreground">{placeWithAccuracy(p)}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground">Belum ada absen hari ini.</p>
              )}
            </div>

            <div className="mt-2.5 flex gap-1.5">
              <Button variant="outline" size="sm" className="h-7 flex-1 text-xs" onClick={onLeave}>Ajukan cuti</Button>
              <Button variant="outline" size="sm" className="h-7 flex-1 text-xs" onClick={onSaldo}>Saldo cuti</Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}