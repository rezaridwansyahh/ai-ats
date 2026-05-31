import { Button } from '@/components/ui/button';

const TOTAL_TIME = '~165 menit';
const STRUCTURE = [
  { n: 1, name: 'Tes Kemampuan Kognitif',             color: '#0A6E5C', timed: true,  meta: '4 subtes berurutan · ~72 menit · tidak bisa dijeda' },
  { n: 2, name: 'Tes Penilaian Situasional (SJT)',    color: '#6366F1', timed: true,  meta: '22 skenario · 4 pilihan tindakan · 30 menit · tidak bisa dijeda' },
  { n: 3, name: 'Tes Kepribadian 16PF',               color: '#7C3AED', timed: false, meta: '105 pernyataan · pilih a / b / c · ~30 menit' },
  { n: 4, name: 'Tes Gaya Kepemimpinan MSDT',         color: '#DB2777', timed: false, meta: '64 pasang · pilih 1 dari 2 · ~20 menit' },
  { n: 5, name: 'Tes Preferensi Kepemimpinan PAPI-L', color: '#0891B2', timed: false, meta: '90 pasang · pilih 1 dari 2 · ~15 menit' },
];

export default function Briefing({ profile, onStart }) {
  const firstName = (profile?.name || '').trim().split(/\s+/)[0] || 'Kandidat';

  const timed = STRUCTURE.filter((s) => s.timed);
  const timedLabel = timed.map((s) => `Tes ${s.n}`).join(' dan ');
  const hasUntimed = STRUCTURE.some((s) => !s.timed);

  const halPenting = [
    timed.length > 0 && (
      <><strong>{timedLabel} bertimer dan tidak bisa dijeda</strong> — pastikan Anda siap sebelum menekan tombol Mulai</>
    ),
    hasUntimed && (
      <><strong>Tes lainnya tidak bertimer</strong>, tapi setiap jawaban langsung lanjut ke soal berikutnya — pilih dengan yakin</>
    ),
    <><strong>Tidak ada jawaban benar/salah</strong> pada tes kepribadian dan preferensi — jawablah sejujurnya</>,
    <><strong>Berpindah tab atau jendela</strong> selama tes berlangsung akan dicatat sistem</>,
    <>Selesaikan seluruh tes <strong>dalam urutan yang sudah ditentukan</strong></>,
  ].filter(Boolean);

  const pastikan = [
    <>Menggunakan <strong>laptop atau komputer</strong> (bukan ponsel) dengan layar yang nyaman</>,
    <><strong>Koneksi internet stabil</strong> dan baterai terisi cukup</>,
    <>Berada di <strong>ruangan yang tenang</strong> dan minim gangguan</>,
    <>Memiliki <strong>{TOTAL_TIME} waktu luang</strong> tanpa interupsi</>,
    <>Progres tersimpan otomatis — jika browser tertutup, Anda dapat melanjutkan dengan tautan yang sama</>,
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
        <div className="rounded-[10px] border p-4 mb-3.5 text-left" style={{ background: '#FAF9F5', borderColor: '#E9E3D5' }}>
          <div className="text-[10px] font-bold tracking-[.09em] uppercase mb-2.5" style={{ color: '#475569' }}>
            🧩 Struktur Asesmen
          </div>
          <div className="grid grid-cols-1 gap-2">
            {STRUCTURE.map((s) => (
              <div key={s.n} className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg bg-white border" style={{ borderColor: '#E9E3D5' }}>
                <div
                  className="w-[26px] h-[26px] rounded-full grid place-items-center text-xs font-bold text-white flex-shrink-0"
                  style={{ background: s.color }}
                >
                  {s.n}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold flex items-center gap-1.5 flex-wrap" style={{ color: '#0F172A' }}>
                    {s.name}
                    {s.timed ? (
                      <span className="text-[9px] font-bold tracking-wide px-1.5 py-0.5 rounded" style={{ background: '#FEF3C7', color: '#92400E' }}>
                        ⏱ BERTIMER
                      </span>
                    ) : (
                      <span className="text-[9px] font-bold tracking-wide px-1.5 py-0.5 rounded" style={{ background: `${s.color}1A`, color: s.color }}>
                        AUTO-LANJUT
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] mt-0.5" style={{ color: '#6E6A5E' }}>{s.meta}</div>
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
            <strong>Catatan:</strong> Asesmen ini dirancang untuk memetakan kekuatan dan gaya kerja Anda —
            bukan untuk dijadikan ujian. Hasil terbaik diperoleh ketika Anda menjawab sesuai dengan diri Anda
            yang sebenarnya, bukan jawaban yang Anda kira “diharapkan”.
          </div>
        </div>

        <Button
          onClick={onStart}
          className="w-full max-w-[340px] mx-auto h-11 bg-gradient-to-br from-teal-800 to-teal-600 hover:opacity-90"
        >
          Saya Siap — Lihat Daftar Tes →
        </Button>
      </div>
    </div>
  );
}
