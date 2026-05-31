import { Button } from '@/components/ui/button';

const TOTAL_TIME = '~15 menit';
const STRUCTURE = [
  {
    n: 1,
    name: '30 Pasang Pernyataan Konflik',
    color: '#0A6E5C',
    meta: 'Pilih satu pernyataan per soal · ~15 menit · 5 mode konflik',
  },
];

export default function Briefing({ profile, onStart }) {
  const firstName = (profile?.name || '').trim().split(/\s+/)[0] || 'Kandidat';

  const halPenting = [
    <><strong>Tes ini tidak bertimer</strong> — pilih jawaban dengan tenang, tapi tetap berdasarkan intuisi pertama</>,
    <><strong>Tidak ada jawaban benar atau salah</strong> — setiap mode konflik berguna pada konteks yang tepat</>,
    <>Pilih pernyataan yang <strong>paling sering Anda lakukan</strong> saat menghadapi ketidaksepakatan, bukan yang ideal</>,
    <>Jawaban pertama biasanya paling akurat — <strong>jangan terlalu lama berpikir</strong></>,
  ];

  const pastikan = [
    <>Menggunakan <strong>laptop atau komputer</strong> dengan layar yang nyaman</>,
    <><strong>Koneksi internet stabil</strong> dan baterai terisi cukup</>,
    <>Berada di <strong>ruangan yang tenang</strong> dan minim gangguan</>,
    <>Memiliki <strong>{TOTAL_TIME} waktu luang</strong> tanpa interupsi</>,
    <>Progres tersimpan otomatis — jika browser tertutup, Anda dapat melanjutkan</>,
  ];

  return (
    <div className="max-w-[640px] mx-auto px-4 py-8">
      <div className="bg-white border border-slate-200 rounded-xl p-7 text-center shadow-lg">
        <div className="text-5xl mb-3">📋</div>
        <div className="text-[11px] font-bold tracking-[.1em] uppercase text-slate-400 mb-1.5">
          Panduan Sebelum Memulai
        </div>
        <h2 className="font-serif text-2xl mb-1.5">Halo, {firstName} 👋</h2>
        <p className="text-[13px] text-slate-500 leading-relaxed max-w-[520px] mx-auto mb-5">
          Mohon luangkan <strong>2 menit</strong> untuk membaca panduan singkat ini agar pengalaman Anda
          lancar dan hasil yang Anda peroleh akurat.
        </p>

        {/* Struktur Asesmen */}
        <div className="rounded-[10px] border p-4 mb-3.5 text-left" style={{ background: '#F8FAFC', borderColor: '#E2E8F0' }}>
          <div className="text-[10px] font-bold tracking-[.09em] uppercase mb-2.5" style={{ color: '#475569' }}>
            🧩 Struktur Asesmen
          </div>
          <div className="grid grid-cols-1 gap-2">
            {STRUCTURE.map((s) => (
              <div key={s.n} className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg bg-white border" style={{ borderColor: '#E2E8F0' }}>
                <div
                  className="w-[26px] h-[26px] rounded-full grid place-items-center text-xs font-bold text-white flex-shrink-0"
                  style={{ background: s.color }}
                >
                  {s.n}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold flex items-center gap-1.5 flex-wrap" style={{ color: '#0F172A' }}>
                    {s.name}
                    <span className="text-[9px] font-bold tracking-wide px-1.5 py-0.5 rounded" style={{ background: `${s.color}1A`, color: s.color }}>
                      AUTO-LANJUT
                    </span>
                  </div>
                  <div className="text-[11px] mt-0.5" style={{ color: '#64748B' }}>{s.meta}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hal Penting Selama Tes */}
        <div className="rounded-[10px] border p-4 mb-3.5 text-left" style={{ background: '#FFFBEB', borderColor: '#FDE68A' }}>
          <div className="text-[10px] font-bold tracking-[.09em] uppercase mb-2.5" style={{ color: '#92400E' }}>
            ⚠️ Hal Penting Selama Tes
          </div>
          <ul className="space-y-1.5">
            {halPenting.map((node, i) => (
              <li key={i} className="text-xs leading-relaxed flex gap-1.5" style={{ color: '#78350F' }}>
                <span aria-hidden>•</span><span>{node}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Pastikan Sebelum Mulai */}
        <div className="rounded-[10px] border p-4 mb-4 text-left" style={{ background: '#EDF7F5', borderColor: '#C7E8E3' }}>
          <div className="text-[10px] font-bold tracking-[.09em] uppercase mb-2.5" style={{ color: '#0A6E5C' }}>
            ✅ Pastikan Sebelum Mulai
          </div>
          <ul className="space-y-1.5">
            {pastikan.map((node, i) => (
              <li key={i} className="text-xs leading-relaxed flex gap-1.5" style={{ color: '#0F4F45' }}>
                <span aria-hidden>•</span><span>{node}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Catatan */}
        <div className="rounded-r-lg px-3.5 py-3 mb-5 text-left" style={{ background: '#F1F5F9', borderLeft: '3px solid #0A6E5C' }}>
          <div className="text-xs leading-relaxed" style={{ color: '#334155' }}>
            <strong>Catatan:</strong> Asesmen ini memetakan gaya penanganan konflik Anda — bukan ujian
            dan setiap mode memiliki kegunaan situasionalnya masing-masing. Hasil terbaik diperoleh
            ketika Anda menjawab sesuai dengan kebiasaan nyata, bukan yang Anda kira "diharapkan".
          </div>
        </div>

        <Button
          onClick={onStart}
          className="w-full max-w-[340px] mx-auto h-11 bg-gradient-to-br from-teal-800 to-teal-600 hover:opacity-90"
        >
          Saya Siap — Mulai Tes →
        </Button>
      </div>
    </div>
  );
}
