import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer } from 'lucide-react';
import { MODES, MODE_KEYS, MAX_PER_MODE, NORMS, normBand, MATRIX_POS, SITUATIONS } from '../data/tki';

const RCR_OPTIONS = {
  dominan: [
    { val: 'sesuai', label: '✅ Sesuai Konteks' },
    { val: 'pertimbangkan', label: '⚠️ Perlu Dipertimbangkan' },
    { val: 'tidak', label: '❌ Berisiko untuk Tim' },
  ],
  fleksibilitas: [
    { val: 'sesuai', label: '✅ Fleksibel & Adaptif' },
    { val: 'pertimbangkan', label: '⚠️ Perlu Pengembangan' },
    { val: 'tidak', label: '❌ Sangat Kaku' },
  ],
  kesesuaian: [
    { val: 'sesuai', label: '✅ Siap Onboarding Standar' },
    { val: 'pertimbangkan', label: '⚠️ Perlu Coaching Tambahan' },
    { val: 'tidak', label: '❌ Perlu Penyesuaian Khusus' },
  ],
};

const RCR_STYLE = {
  sesuai: 'bg-emerald-50 border-emerald-500 text-emerald-700',
  pertimbangkan: 'bg-amber-50 border-amber-500 text-amber-700',
  tidak: 'bg-red-50 border-red-500 text-red-700',
};

/**
 * Integrated HR psychological report for Thomas-Kilmann (controlled-state).
 *
 * Props:
 *  - profile:    participant data (name, position, department, umur, gender, ...)
 *  - results:    { tki: <computeTKI output> }   ← ScoreDecideTab convention
 *                If `results.tki` is missing, the report renders an empty notice.
 *  - state:      flat HR-annotation state from unpackAssessorState
 *  - updateState({ [key]: value }):  patches state and marks dirty (parent auto-saves)
 *  - saveNow:    optional async fn to force an immediate save
 *  - onClose:    optional back-button handler (standalone use)
 */
export default function ReportView({ profile, results, state = {}, updateState, saveNow, onClose }) {
  const result = results?.tki;
  if (!result) {
    return (
      <div className="max-w-[700px] mx-auto px-4 py-10 text-center text-slate-500">
        Data tes tidak ditemukan.
        {onClose && <div className="mt-3"><Button variant="outline" onClick={onClose}>← Kembali</Button></div>}
      </div>
    );
  }

  const scores = result.scores || {};
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const dominant = result.dominant || sorted[0]?.[0];
  const secondary = result.secondary || sorted[1]?.[0];

  const meta = (k) => state[`meta_${k}`] || '';
  const setMeta = (k, v) => updateState?.({ [`meta_${k}`]: v });

  return (
    <div className="max-w-[1100px] mx-auto px-4 py-5 pb-20">
      {/* Top actions */}
      <div className="flex flex-wrap items-center gap-2 mb-3 no-print">
        <Button size="sm" onClick={() => window.print()} className="bg-teal-700 hover:bg-teal-800 gap-1.5">
          <Printer className="w-4 h-4" /> Cetak / Simpan PDF
        </Button>
        {saveNow && (
          <Button size="sm" variant="outline" onClick={() => saveNow().catch(() => {})}>
            💾 Simpan Sekarang
          </Button>
        )}
        {onClose && (
          <Button variant="outline" size="sm" onClick={onClose} className="ml-auto gap-1.5">
            <ArrowLeft className="w-4 h-4" /> Kembali
          </Button>
        )}
      </div>

      {/* Letterhead */}
      <div
        className="rounded-xl text-white shadow-xl px-6 py-5 mb-4 flex items-start justify-between gap-4 flex-wrap"
        style={{ background: 'linear-gradient(135deg,#064E3B,#0A6E5C 55%,#0D9488)' }}
      >
        <div>
          <div className="font-serif text-2xl font-extrabold tracking-wide">MYRALIX</div>
          <div className="text-[10px] uppercase tracking-wider opacity-70 mb-1.5">Laporan Asesmen Onboarding · Pre-Day 1</div>
          <div className="text-sm font-bold">Thomas-Kilmann Assessment</div>
          <div className="text-[11px] opacity-80">Laporan Asesmen Mode Konflik</div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-[10px] font-bold text-yellow-100 tracking-wider mb-1">🔒 RAHASIA</div>
          <div className="text-sm font-bold" style={{ color: MODES[dominant]?.bg }}>{MODES[dominant]?.name}</div>
          <div className="text-[10px] text-white/70">Mode Dominan</div>
        </div>
      </div>

      {/* Data tambahan (HR) */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 mb-4 no-print">
        <div className="text-[10px] font-bold tracking-wider uppercase text-slate-400 mb-3">📋 Data Tambahan Laporan (diisi HR / Asesor)</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            ['nomer', 'No. Kandidat / Pegawai', 'text'],
            ['dept', 'Departemen / Tim (override)', 'text'],
            ['tgl', 'Tanggal Laporan', 'date'],
            ['asesor', 'Nama HR / Fasilitator', 'text'],
          ].map(([k, label, type]) => (
            <div key={k}>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1 block">{label}</label>
              <input
                type={type}
                value={meta(k)}
                onChange={(e) => setMeta(k, e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-500"
              />
            </div>
          ))}
          <div className="md:col-span-2">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1 block">Mengetahui</label>
            <input
              value={meta('mengetahui')}
              onChange={(e) => setMeta('mengetahui', e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-500"
            />
          </div>
        </div>
      </div>

      {/* Data Peserta */}
      <Section title="Data Peserta">
        <table className="w-full text-sm border-collapse">
          <tbody>
            {[
              ['Nama Lengkap', profile?.name],
              ['Jabatan / Posisi', profile?.position],
              ['Departemen / Divisi', meta('dept') || profile?.department],
              ['Usia', profile?.umur],
              ['Jenis Kelamin', profile?.gender],
              ['No. Kandidat / Pegawai', meta('nomer')],
              ['Tanggal Tes', result.date || profile?.date],
              ['Tanggal Laporan', meta('tgl') ? new Date(meta('tgl')).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : null],
            ].map(([label, val]) => (
              <tr key={label} className="border-b border-slate-100">
                <td className="px-3 py-2 font-semibold text-slate-600 w-[38%]">{label}</td>
                <td className="px-3 py-2">{val || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      {/* I. Profil Skor 5 Mode */}
      <Section num="I" title="Profil Skor Lima Mode Konflik">
        <p className="text-[11px] text-slate-500 italic mb-2 leading-relaxed">
          <strong>Instrumen:</strong> 30 pasang pernyataan pilihan paksa · Skor maks. {MAX_PER_MODE} per mode. <strong>Band:</strong> Tinggi ≥ (norma+2) · Rata-rata dalam ±2 · Rendah &lt; (norma−2).
        </p>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b-2 border-slate-200">
              <th className="text-left px-3 py-2 text-[10.5px] font-bold uppercase tracking-wider text-slate-500">Mode</th>
              <th className="text-left px-3 py-2 text-[10.5px] font-bold uppercase tracking-wider text-slate-500">Karakteristik</th>
              <th className="text-center px-3 py-2 text-[10.5px] font-bold uppercase tracking-wider text-slate-500">Norma</th>
              <th className="text-center px-3 py-2 text-[10.5px] font-bold uppercase tracking-wider text-slate-500">Skor</th>
              <th className="text-left px-3 py-2 text-[10.5px] font-bold uppercase tracking-wider text-slate-500">Band &amp; Profil</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(([k, v]) => {
              const m = MODES[k];
              const nb = normBand(k, v);
              const isDom = k === dominant;
              const isSec = k === secondary;
              return (
                <tr key={k} className="border-b border-slate-100" style={{ background: isDom ? m.bg : isSec ? '#FFFBEB' : undefined }}>
                  <td className="px-3 py-2.5" style={{ fontWeight: isDom ? 700 : 400, color: isDom ? m.color : 'inherit' }}>
                    {m.name}
                    {isDom && <span className="ml-1.5 text-[9px] font-bold text-white px-1.5 py-0.5 rounded-full" style={{ background: m.color }}>★ DOMINAN</span>}
                    {isSec && <span className="ml-1.5 text-[9px] font-bold text-slate-600 bg-slate-200 px-1.5 py-0.5 rounded-full">2nd</span>}
                  </td>
                  <td className="px-3 py-2.5 text-[10px]" style={{ color: m.color }}>{m.tag}</td>
                  <td className="px-3 py-2.5 text-center text-slate-500">{NORMS[k]} / {MAX_PER_MODE}</td>
                  <td className="px-3 py-2.5 text-center font-serif text-base font-bold" style={{ color: m.color }}>{v} / {MAX_PER_MODE}</td>
                  <td className="px-3 py-2.5">
                    <div className="bg-slate-100 rounded h-1.5 w-[140px] overflow-hidden mb-1">
                      <div className="h-1.5 rounded" style={{ width: `${(v / MAX_PER_MODE) * 100}%`, background: m.color }} />
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: nb.bg, color: nb.color }}>{nb.label}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="grid grid-cols-2 gap-3 mt-3">
          <div className="rounded-lg border p-3" style={{ borderColor: MODES[dominant]?.color + '40', background: MODES[dominant]?.bg }}>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Mode Dominan</div>
            <div className="font-serif text-lg font-bold" style={{ color: MODES[dominant]?.color }}>{MODES[dominant]?.name}</div>
          </div>
          <div className="rounded-lg border border-slate-200 p-3">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Mode Sekunder</div>
            <div className="font-serif text-lg font-bold" style={{ color: MODES[secondary]?.color }}>{MODES[secondary]?.name}</div>
          </div>
        </div>
      </Section>

      {/* II. Interpretasi */}
      <Section num="II" title="Interpretasi Mode Konflik">
        <p className="text-[11px] text-slate-500 italic mb-3 leading-relaxed">
          Mode dominan mencerminkan kecenderungan alami dalam menghadapi konflik. Ini bukan penilaian baik atau buruk — setiap mode efektif dalam konteks yang tepat.
        </p>
        <div className="space-y-2.5">
          {sorted.map(([k, v]) => {
            const m = MODES[k];
            const isDom = k === dominant;
            return (
              <div key={k} className="rounded-lg overflow-hidden border-[1.5px]" style={{ borderColor: isDom ? m.color : m.color + '60' }}>
                <div className="px-3.5 py-2.5 text-white flex items-center justify-between" style={{ background: isDom ? m.color : m.color + 'CC' }}>
                  <span className="font-bold text-[13px]">{m.name} <span className="opacity-85 font-normal text-[11px]">({m.eng})</span></span>
                  {isDom
                    ? <span className="bg-white/25 text-[10px] font-bold px-2 py-0.5 rounded-full">★ Mode Dominan</span>
                    : <span className="text-[11px] opacity-85">Skor: {v}/{MAX_PER_MODE}</span>}
                </div>
                <div className="px-3.5 py-1 text-[11px] italic" style={{ background: m.bg, color: m.color }}>{m.tag}</div>
                <div className="px-3.5 py-3 text-[12.5px] leading-relaxed">
                  <p className="mb-1.5"><span className="font-bold mr-1">Deskripsi:</span>{m.desc}</p>
                  <p className="mb-1.5"><span className="font-bold mr-1">Kapan Efektif:</span>{m.when}</p>
                  <p className="m-0"><span className="font-bold mr-1">⚠️ Risiko Overuse:</span>{m.risk}</p>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-3">
          <RcrButtons section="dominan" label="⚖️ Penilaian HR — Mode Dominan untuk Posisi/Tim:" value={state['rcr_dominan']} onPick={(val) => updateState?.({ rcr_dominan: val })} />
        </div>
      </Section>

      {/* III. Matriks */}
      <Section num="III" title="Posisi dalam Matriks Konflik">
        <p className="text-[11px] text-slate-500 italic mb-2 leading-relaxed">
          Matriks Thomas-Kilmann memetakan lima mode pada dua sumbu: Tingkat Asertivitas (vertikal) dan Tingkat Kooperativitas (horizontal).
        </p>
        <div className="border border-slate-200 rounded-lg bg-slate-50 p-2.5 mb-3">
          <svg viewBox="0 0 320 210" xmlns="http://www.w3.org/2000/svg" className="w-full" style={{ maxHeight: 280 }}>
            <defs>
              <marker id="tki-arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                <path d="M2 1L8 5L2 9" fill="none" stroke="#9C9684" strokeWidth="1.5" />
              </marker>
            </defs>
            <line x1="160" y1="12" x2="160" y2="195" stroke="#E5E7EB" strokeWidth="1" strokeDasharray="4,4" />
            <line x1="20" y1="100" x2="302" y2="100" stroke="#E5E7EB" strokeWidth="1" strokeDasharray="4,4" />
            <line x1="160" y1="195" x2="160" y2="15" stroke="#CBD5E1" strokeWidth="1.5" markerEnd="url(#tki-arr)" />
            <line x1="20" y1="100" x2="300" y2="100" stroke="#CBD5E1" strokeWidth="1.5" markerEnd="url(#tki-arr)" />
            <text x="160" y="10" textAnchor="middle" fontSize="9" fill="#6E6A5E" fontFamily="Arial,sans-serif">ASERTIF TINGGI</text>
            <text x="160" y="206" textAnchor="middle" fontSize="9" fill="#6E6A5E" fontFamily="Arial,sans-serif">ASERTIF RENDAH</text>
            <text x="305" y="103" textAnchor="start" fontSize="9" fill="#6E6A5E" fontFamily="Arial,sans-serif">Kooperatif →</text>
            <text x="22" y="103" textAnchor="start" fontSize="9" fill="#6E6A5E" fontFamily="Arial,sans-serif">← Tidak Koop.</text>
            {MODE_KEYS.map((k) => {
              const pos = MATRIX_POS[k];
              const v = scores[k] ?? 0;
              const m = MODES[k];
              const isDom = k === dominant;
              const rad = Math.max(12, v * 2.5);
              return (
                <g key={k}>
                  <circle cx={pos.cx} cy={pos.cy} r={rad} fill={m.color + '33'} stroke={m.color} strokeWidth={isDom ? 3 : 1.5} />
                  <text x={pos.cx} y={pos.cy + 4} textAnchor="middle" fontSize={isDom ? 12 : 10} fontWeight={isDom ? 700 : 400} fill={m.color} fontFamily="Arial,sans-serif">{isDom ? '★ ' : ''}{v}</text>
                  <text x={pos.cx} y={pos.cy + 18} textAnchor="middle" fontSize="8" fill={m.color} fontFamily="Arial,sans-serif">{m.name.split(' ')[0]}</text>
                </g>
              );
            })}
          </svg>
          <p className="text-[10px] text-slate-400 text-center mt-1">Ukuran lingkaran = skor (maks. {MAX_PER_MODE}). Lingkaran tebal = mode dominan.</p>
        </div>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b-2 border-slate-200">
              <th className="text-left px-3 py-2 text-[10.5px] font-bold uppercase tracking-wider text-slate-500">Mode</th>
              <th className="text-left px-3 py-2 text-[10.5px] font-bold uppercase tracking-wider text-slate-500">Asertivitas</th>
              <th className="text-left px-3 py-2 text-[10.5px] font-bold uppercase tracking-wider text-slate-500">Kooperativitas</th>
              <th className="text-left px-3 py-2 text-[10.5px] font-bold uppercase tracking-wider text-slate-500">Posisi di Matriks</th>
            </tr>
          </thead>
          <tbody>
            {MODE_KEYS.map((k) => {
              const m = MODES[k];
              return (
                <tr key={k} className="border-b border-slate-100">
                  <td className="px-3 py-2.5"><strong style={{ color: m.color }}>{m.name} ({m.eng})</strong></td>
                  <td className="px-3 py-2.5" style={{ color: m.color }}>{m.axis.assertive}</td>
                  <td className="px-3 py-2.5" style={{ color: m.color }}>{m.axis.cooperative}</td>
                  <td className="px-3 py-2.5">{m.axis.pos}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Section>

      {/* IV. Panduan Situasional */}
      <Section num="IV" title="Panduan Situasional — Mode yang Tepat untuk Situasi Apa">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b-2 border-slate-200">
              <th className="text-left px-3 py-2 text-[10.5px] font-bold uppercase tracking-wider text-slate-500 w-[55%]">Situasi</th>
              <th className="text-left px-3 py-2 text-[10.5px] font-bold uppercase tracking-wider text-slate-500">Mode yang Direkomendasikan</th>
            </tr>
          </thead>
          <tbody>
            {SITUATIONS.map((s) => {
              const m = MODES[s.mode];
              return (
                <tr key={s.mode} className="border-b border-slate-100">
                  <td className="px-3 py-2.5">{s.situation}</td>
                  <td className="px-3 py-2.5 font-bold" style={{ color: m.color }}>{s.icon} {m.name} ({m.eng})</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="mt-3">
          <RcrButtons section="fleksibilitas" label="⚖️ Penilaian HR — Fleksibilitas Mode Peserta:" value={state['rcr_fleksibilitas']} onPick={(val) => updateState?.({ rcr_fleksibilitas: val })} />
        </div>
      </Section>

      {/* V. Saran Pengembangan */}
      <Section num="V" title="Saran Pengembangan per Mode">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b-2 border-slate-200">
              <th className="text-left px-3 py-2 text-[10.5px] font-bold uppercase tracking-wider text-slate-500 w-[35%]">Mode</th>
              <th className="text-left px-3 py-2 text-[10.5px] font-bold uppercase tracking-wider text-slate-500">Saran Pengembangan</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(([k]) => {
              const m = MODES[k];
              return (
                <tr key={k} className="border-b border-slate-100">
                  <td className="px-3 py-2.5 font-bold" style={{ color: m.color, background: m.bg }}>{m.name}</td>
                  <td className="px-3 py-2.5">{m.dev}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Section>

      {/* VI. Observasi HR */}
      <Section num="VI" title="Observasi Rekruter & Catatan Onboarding">
        <p className="text-[11px] text-slate-500 italic mb-3 leading-relaxed">
          Gunakan bagian ini untuk mencatat observasi saat debrief hasil Thomas-Kilmann bersama karyawan baru.
        </p>
        <div className="space-y-3">
          {[
            ['obs', 'Reaksi peserta terhadap hasil', 'Tulis observasi reaksi peserta saat melihat hasilnya…'],
            ['surprises', 'Mode yang mengejutkan peserta', 'Aspek mana yang membuat peserta refleksi…'],
            ['friction', 'Potensi gesekan dengan tim / atasan', 'Antisipasi gesekan gaya dengan profil tim…'],
            ['followup', 'Rencana tindak lanjut / pengembangan', 'Langkah konkret untuk coaching atau debrief lanjutan…'],
          ].map(([k, label, placeholder]) => (
            <div key={k}>
              <div className="text-xs font-semibold text-slate-600 mb-1">{label}</div>
              <textarea
                value={state[`note_${k}`] || ''}
                onChange={(e) => updateState?.({ [`note_${k}`]: e.target.value })}
                placeholder={placeholder}
                className="w-full min-h-[64px] border border-slate-200 rounded-lg p-2.5 text-[13px] outline-none focus:border-teal-500 resize-y"
              />
            </div>
          ))}
        </div>

        <div className="mt-4">
          <RcrButtons section="kesesuaian" label="📋 Rekomendasi HR — Kesesuaian Onboarding Keseluruhan:" value={state['rcr_kesesuaian']} onPick={(val) => updateState?.({ rcr_kesesuaian: val })} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mt-4">
          <SignBox role="Peserta" name={profile?.name} />
          <SignBox role="HR / Fasilitator" name={meta('asesor')} />
        </div>
        {meta('mengetahui') && (
          <div className="mt-3 max-w-[300px]"><SignBox role="Mengetahui" name={meta('mengetahui')} /></div>
        )}
      </Section>

      <div className="text-[10.5px] text-slate-400 text-center italic leading-relaxed border-t border-slate-200 pt-4 mt-4">
        Dokumen ini bersifat rahasia. Untuk keperluan onboarding internal. Hasil bukan penilaian baik/buruk — hanya gambaran preferensi gaya konflik.
        <br />Versi adaptasi Bahasa Indonesia oleh Myralix. © Myralix Assessment Platform 2026.
      </div>
    </div>
  );
}

// ── Helpers ──

function Section({ num, title, children }) {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-200 mb-4">
      <div className="flex items-center gap-3.5 px-5 py-3.5 bg-gradient-to-r from-teal-50 to-transparent">
        {num && (
          <div className="w-9 h-9 rounded-full grid place-items-center font-serif text-base font-bold flex-shrink-0 border-2 border-teal-600 text-teal-700">
            {num}
          </div>
        )}
        <div className="font-serif text-lg font-semibold">{title}</div>
      </div>
      <div className="px-5 pb-5 pt-1 overflow-x-auto">{children}</div>
    </div>
  );
}

function RcrButtons({ section, label, value, onPick }) {
  return (
    <div className="bg-teal-50/60 border border-teal-100 rounded-lg px-3.5 py-3 no-print">
      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">{label}</div>
      <div className="flex gap-2 flex-wrap">
        {RCR_OPTIONS[section].map((opt) => {
          const active = value === opt.val;
          return (
            <button
              key={opt.val}
              type="button"
              onClick={() => onPick(opt.val)}
              className={[
                'flex-1 min-w-[140px] border-[1.5px] rounded-lg px-3 py-2 text-[11.5px] font-bold transition-colors',
                active ? RCR_STYLE[opt.val] : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300',
              ].join(' ')}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SignBox({ role, name }) {
  return (
    <div className="border border-slate-200 rounded-lg p-3.5 min-h-[90px]">
      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">{role}</div>
      <div className="border-t border-slate-300 mt-14 pt-1 text-[10px] text-slate-500">
        Nama: {name || '_______________________'}
      </div>
    </div>
  );
}
