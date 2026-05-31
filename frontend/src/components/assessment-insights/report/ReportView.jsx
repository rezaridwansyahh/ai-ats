import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer } from 'lucide-react';
import { getProfile, getClarity } from '../utils/scoring';
import { COLOR_MAP } from '../data/insights';

const RCR_OPTIONS = {
  profil: [
    { val: 'sesuai', label: '✅ Sesuai Posisi' },
    { val: 'pertimbangkan', label: '⚠️ Perlu Dipertimbangkan' },
    { val: 'tidak', label: '❌ Tidak Sesuai' },
  ],
  komunikasi: [
    { val: 'sesuai', label: '✅ Selaras' },
    { val: 'pertimbangkan', label: '⚠️ Perlu Coaching' },
    { val: 'tidak', label: '❌ Berpotensi Friksi' },
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

const DIMS = [
  { key: 'Epct', a: 'Ekstraversi (E)', b: 'Introversi (I)', color: '#7C3AED' },
  { key: 'Tpct', a: 'Berpikir / Logika (T)', b: 'Perasaan / Empati (F)', color: '#0A6E5C' },
  { key: 'Spct', a: 'Konkret / Praktis (S)', b: 'Intuitif / Konseptual (N)', color: '#D97706' },
];

/**
 * Integrated HR psychological report (controlled-state).
 *
 * Props:
 *  - profile:    participant data (name, position, department, ...)
 *  - results:    { insights: <computeProfile output> }   ← ScoreDecideTab convention
 *                If `results.insights` is missing, the report renders an empty notice.
 *  - state:      flat HR-annotation state from unpackAssessorState
 *  - updateState({ [key]: value }):  patches state and marks dirty (parent auto-saves)
 *  - saveNow:    optional async fn to force an immediate save
 *  - onClose:    optional back-button handler (standalone use)
 */
export default function ReportView({ profile, results, state = {}, updateState, saveNow, onClose }) {
  const result = results?.insights;
  if (!result) {
    return (
      <div className="max-w-[700px] mx-auto px-4 py-10 text-center text-slate-500">
        Data tes tidak ditemukan.
        {onClose && <div className="mt-3"><Button variant="outline" onClick={onClose}>← Kembali</Button></div>}
      </div>
    );
  }

  const p = getProfile(result.profileId);
  const cm = COLOR_MAP[result.dominantColor] || COLOR_MAP.BLU;
  const clarity = getClarity(result.composite);

  const quadrants = [
    { key: 'RED', score: result.RED },
    { key: 'YEL', score: result.YEL },
    { key: 'GRN', score: result.GRN },
    { key: 'BLU', score: result.BLU },
  ].map((q) => ({ ...q, ...COLOR_MAP[q.key] })).sort((a, b) => b.score - a.score);

  const meta = (k) => state[`meta_${k}`] || '';
  const setMeta = (k, v) => updateState?.({ [`meta_${k}`]: v });

  return (
    <div className="max-w-[1100px] mx-auto px-4 py-5 pb-20">
      {/* Top actions */}
      <div className="flex flex-wrap items-center gap-2 mb-3 no-print">
        <Button size="sm" onClick={() => window.print()} className="bg-indigo-600 hover:bg-indigo-700 gap-1.5">
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
        style={{ background: 'linear-gradient(135deg,#1E1B4B,#4338CA 55%,#7C3AED)' }}
      >
        <div>
          <div className="font-serif text-2xl font-extrabold tracking-wide">MYRALIX</div>
          <div className="text-[10px] uppercase tracking-wider opacity-70 mb-1.5">Laporan Asesmen Onboarding · Pre-Day 1</div>
          <div className="text-sm font-bold">Insights-Discovery Assessment — 8 Profil · 3 Dimensi · 4 Warna</div>
          <div className="text-[11px] opacity-80">Laporan Profil Kepribadian Kerja</div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-[10px] font-bold text-yellow-100 tracking-wider mb-1">🔒 RAHASIA</div>
          <div className="text-2xl font-extrabold text-yellow-100">{result.composite}<span className="text-xs font-normal opacity-80"> / 10</span></div>
          <div className="text-[10px] text-white/70">Skor Kejelasan Profil</div>
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
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500"
              />
            </div>
          ))}
          <div className="md:col-span-2">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1 block">Mengetahui</label>
            <input
              value={meta('mengetahui')}
              onChange={(e) => setMeta('mengetahui', e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500"
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
              ['Departemen / Tim', meta('dept') || profile?.department],
              ['Pendidikan Terakhir', profile?.education],
              ['Tanggal Lahir', profile?.date_birth ? new Date(profile.date_birth).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : null],
              ['No. Kandidat / Pegawai', meta('nomer')],
              ['Tanggal Tes', result.date || profile?.date],
              ['Tanggal Laporan', meta('tgl') ? new Date(meta('tgl')).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : null],
              result.tabSwitches ? ['Tab Switch Terdeteksi', `${result.tabSwitches}×`] : null,
            ].filter(Boolean).map(([label, val]) => (
              <tr key={label} className="border-b border-slate-100">
                <td className="px-3 py-2 font-semibold text-slate-600 w-[38%]">{label}</td>
                <td className="px-3 py-2">{val || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      {/* I. Skor Dimensi & 4 Warna */}
      <Section num="I" title="Skor Dimensi & Distribusi Warna Energi">
        <p className="text-[11px] text-slate-500 italic mb-2 leading-relaxed">
          <strong>Instrumen:</strong> 72 pasang pernyataan pilihan paksa (24 E/I + 24 T/F + 24 S/N). <strong>Skor Kejelasan:</strong> ≥7 Jelas · 5–6 Campuran · &lt;5 Beragam.
        </p>
        <div className="flex items-center gap-3 rounded-lg px-3.5 py-2.5 mb-4 border" style={{ background: clarity.bg, borderColor: clarity.br }}>
          <div className="font-serif text-3xl font-bold" style={{ color: clarity.color }}>{result.composite}</div>
          <div>
            <div className="text-sm font-bold" style={{ color: clarity.color }}>{clarity.emoji} {clarity.label}</div>
            <div className="text-[11px] text-slate-600 mt-0.5">Profil dominan: <strong>{p?.name}</strong> ({cm.label})</div>
          </div>
        </div>

        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">Dimensi Kepribadian (3 Skala)</div>
        <div className="space-y-3 mb-4">
          {DIMS.map((d) => {
            const pct = result[d.key] ?? 0;
            const domPct = pct >= 50 ? pct : 100 - pct;
            const intensity = domPct >= 75 ? 'Kuat' : domPct >= 55 ? 'Moderat' : 'Seimbang';
            const domLabel = pct >= 50 ? d.a.split(' ')[0] : d.b.split(' ')[0];
            return (
              <div key={d.key}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-slate-600">{d.a.split('(')[0].trim()} / {d.b.split('(')[0].trim()}</span>
                  <span className="text-xs font-bold" style={{ color: d.color }}>{domLabel} ({domPct}%) · {intensity}</span>
                </div>
                <div className="relative bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div className="h-2 rounded-full" style={{ width: `${pct}%`, background: d.color }} />
                  <div className="absolute left-1/2 top-[-2px] w-px h-3 bg-slate-400" />
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">Distribusi 4 Warna Energi</div>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b-2 border-slate-200">
              <th className="text-left px-3 py-2 text-[10.5px] font-bold uppercase tracking-wider text-slate-500">Warna & Kuadran</th>
              <th className="text-center px-3 py-2 text-[10.5px] font-bold uppercase tracking-wider text-slate-500">Skor</th>
              <th className="text-left px-3 py-2 text-[10.5px] font-bold uppercase tracking-wider text-slate-500">Bar</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {quadrants.map((q, i) => (
              <tr key={q.key} className="border-b border-slate-100">
                <td className="px-3 py-2.5 font-bold" style={{ color: q.color }}>{q.icon} {q.name} — {q.label}</td>
                <td className="px-3 py-2.5 text-center font-serif text-base font-bold" style={{ color: q.color }}>{q.score}%</td>
                <td className="px-3 py-2.5">
                  <div className="bg-slate-100 rounded-full h-1.5 overflow-hidden min-w-[80px]">
                    <div className="h-1.5 rounded-full" style={{ width: `${q.score}%`, background: q.color }} />
                  </div>
                </td>
                <td className="px-3 py-2.5">
                  {i === 0 ? (
                    <span className="text-[10px] font-bold text-white px-2 py-0.5 rounded-full" style={{ background: q.color }}>★ Dominan</span>
                  ) : i === 1 ? (
                    <span className="text-[10px] font-bold text-slate-600 bg-slate-200 px-2 py-0.5 rounded-full">Sekunder</span>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      {/* II. Profil Dominan */}
      <Section num="II" title="Profil Kepribadian Kerja Dominan">
        <div className="rounded-lg overflow-hidden mb-3">
          <div className="px-4 py-3.5 text-white flex items-center gap-3" style={{ background: `linear-gradient(135deg,${cm.color}DD,${cm.color})` }}>
            <div className="text-3xl">{p?.icon || cm.icon}</div>
            <div>
              <div className="text-[10px] opacity-80 uppercase tracking-wider">Profil Dominan</div>
              <div className="text-lg font-extrabold">{p?.name}</div>
              <div className="text-[11px] opacity-85">{p?.tagline}</div>
            </div>
          </div>
          <div className="px-4 py-3.5 text-[13px] leading-relaxed border-[1.5px]" style={{ background: cm.bg, borderColor: cm.color + '30' }}>
            <p className="mb-2.5">{p?.desc}</p>
            <p className="m-0"><strong style={{ color: cm.color }}>Posisi yang Sesuai:</strong> {p?.positions}</p>
          </div>
        </div>
        <RcrButtons section="profil" label="⚖️ Penilaian HR — Profil Kepribadian:" value={state['rcr_profil']} onPick={(v) => updateState?.({ rcr_profil: v })} />
      </Section>

      {/* III. Kekuatan */}
      <Section num="III" title={`Kekuatan Utama — ${p?.name || ''}`}>
        <NoteTable rows={p?.strengths} numColor="#15803D" col2="Relevansi untuk Posisi (catatan HR)" placeholder="Relevansi untuk posisi ini…" />
      </Section>

      {/* IV. Area Pengembangan */}
      <Section num="IV" title="Area Pengembangan">
        <NoteTable rows={p?.areas} numColor="#D97706" col2="Rencana Tindak Lanjut" placeholder="Rencana tindak lanjut…" />
      </Section>

      {/* V. Kecenderungan */}
      <Section num="V" title="Kecenderungan Perilaku Kerja">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b-2 border-slate-200">
              <th className="text-left px-3 py-2 text-[10.5px] font-bold uppercase tracking-wider text-slate-500 w-[50%]">Kecenderungan Perilaku</th>
              <th className="text-left px-3 py-2 text-[10.5px] font-bold uppercase tracking-wider text-slate-500">Implikasi Praktis</th>
            </tr>
          </thead>
          <tbody>
            {(p?.tendencies || []).map((t, i) => (
              <tr key={i} className="border-b border-slate-100">
                <td className="px-3 py-2.5">{t}</td>
                <td className="px-3 py-2.5">
                  <input type="text" placeholder="Implikasi praktis…" className="w-full border-b border-slate-200 text-[12px] py-1 outline-none bg-transparent focus:border-indigo-500" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      {/* VI. Panduan 4 Warna */}
      <Section num="VI" title="Panduan 4 Warna Energi">
        <p className="text-[11px] text-slate-500 italic mb-2 leading-relaxed">
          Setiap orang memiliki keempat warna — yang membedakan adalah proporsinya. Pemahaman ini membantu komunikasi tim yang lebih efektif.
        </p>
        <table className="w-full text-sm border-collapse mb-3">
          <thead>
            <tr className="bg-slate-50 border-b-2 border-slate-200">
              <th className="text-left px-3 py-2 text-[10.5px] font-bold uppercase tracking-wider text-slate-500">Warna Energi</th>
              <th className="text-left px-3 py-2 text-[10.5px] font-bold uppercase tracking-wider text-slate-500">Cara Berkomunikasi Efektif</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {['RED', 'YEL', 'GRN', 'BLU'].map((k) => {
              const c = COLOR_MAP[k];
              return (
                <tr key={k} className="border-b border-slate-100">
                  <td className="px-3 py-2.5 font-bold" style={{ color: c.color, background: c.bg }}>{c.icon} {c.name}</td>
                  <td className="px-3 py-2.5">{c.howTo}</td>
                  <td className="px-3 py-2.5">
                    {result.dominantColor === k && (
                      <span className="text-[10px] font-bold text-white px-2 py-0.5 rounded-full" style={{ background: c.color }}>★ Profil Ini</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <RcrButtons section="komunikasi" label="⚖️ Penilaian HR — Cocok dengan Gaya Komunikasi Tim:" value={state['rcr_komunikasi']} onPick={(v) => updateState?.({ rcr_komunikasi: v })} />
      </Section>

      {/* VII. Observasi HR */}
      <Section num="VII" title="Observasi Tim & Catatan Onboarding">
        <div className="space-y-3">
          {[
            ['obs', 'Profil & warna dominan karyawan', 'Catatan ringkas profil dan warna dominan…'],
            ['team', 'Warna dominan di tim (hasil sebelumnya)', 'Distribusi warna tim yang akan diikuti…'],
            ['synergy', 'Potensi sinergi & gesekan gaya', 'Area sinergi dan area perhatian…'],
            ['followup', 'Rencana tindak lanjut debrief', 'Langkah selanjutnya untuk debrief & coaching…'],
          ].map(([k, label, placeholder]) => (
            <div key={k}>
              <div className="text-xs font-semibold text-slate-600 mb-1">{label}</div>
              <textarea
                value={state[`note_${k}`] || ''}
                onChange={(e) => updateState?.({ [`note_${k}`]: e.target.value })}
                placeholder={placeholder}
                className="w-full min-h-[64px] border border-slate-200 rounded-lg p-2.5 text-[13px] outline-none focus:border-indigo-500 resize-y"
              />
            </div>
          ))}
        </div>

        <div className="mt-4">
          <RcrButtons section="kesesuaian" label="📋 Rekomendasi HR — Kesesuaian Onboarding Keseluruhan:" value={state['rcr_kesesuaian']} onPick={(v) => updateState?.({ rcr_kesesuaian: v })} />
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
        Dokumen ini bersifat rahasia. Untuk keperluan onboarding internal. Profil kepribadian bukan penilaian baik/buruk — hanya gambaran gaya komunikasi dan preferensi kerja.
        <br />Versi adaptasi Bahasa Indonesia oleh Myralix. © Myralix Assessment Platform 2026.
      </div>
    </div>
  );
}

// ── Helpers ──

function Section({ num, title, children }) {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-200 mb-4">
      <div className="flex items-center gap-3.5 px-5 py-3.5 bg-gradient-to-r from-indigo-50 to-transparent">
        {num && (
          <div className="w-9 h-9 rounded-full grid place-items-center font-serif text-base font-bold flex-shrink-0 border-2 border-indigo-500 text-indigo-600">
            {num}
          </div>
        )}
        <div className="font-serif text-lg font-semibold">{title}</div>
      </div>
      <div className="px-5 pb-5 pt-1 overflow-x-auto">{children}</div>
    </div>
  );
}

function NoteTable({ rows, numColor, col2, placeholder }) {
  return (
    <table className="w-full text-sm border-collapse">
      <thead>
        <tr className="bg-slate-50 border-b-2 border-slate-200">
          <th className="text-center px-3 py-2 text-[10.5px] font-bold uppercase tracking-wider text-slate-500 w-[5%]">No.</th>
          <th className="text-left px-3 py-2 text-[10.5px] font-bold uppercase tracking-wider text-slate-500 w-[45%]">{col2 === 'Rencana Tindak Lanjut' ? 'Area Pengembangan' : 'Kekuatan Utama'}</th>
          <th className="text-left px-3 py-2 text-[10.5px] font-bold uppercase tracking-wider text-slate-500">{col2}</th>
        </tr>
      </thead>
      <tbody>
        {(rows || []).map((r, i) => (
          <tr key={i} className="border-b border-slate-100">
            <td className="px-3 py-2.5 text-center font-bold" style={{ color: numColor }}>{i + 1}</td>
            <td className="px-3 py-2.5">{r}</td>
            <td className="px-3 py-2.5">
              <input type="text" placeholder={placeholder} className="w-full border-b border-slate-200 text-[12px] py-1 outline-none bg-transparent focus:border-indigo-500" />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function RcrButtons({ section, label, value, onPick }) {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-3 no-print">
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
