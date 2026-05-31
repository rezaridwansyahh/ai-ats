import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import {
  getVerdict,
  getGrade,
  s10ToLabel,
  getIQClass,
  fmtDateID,
  lvlSJT,
} from '../utils/scoring';
import { COMPS, COMP_ORDER, PROFILES } from '../data/sjt';
import { FACTORS, FACTOR_ORDER } from '../data/pf';
import { STYLES, STYLE_ORDER } from '../data/msdt';
import { DIMS, ROLE_DIMS, NEED_DIMS, getRange } from '../data/papil';
import ManagerView from './ManagerView';

const BATTERY = 'D';
const SUB_NAMES = { GI: 'Kemampuan Umum', PV: 'Penalaran Verbal', KN: 'Kemampuan Numerik', PA: 'Penalaran Abstrak' };
const SUB_WEIGHTS = { GI: '30%', PV: '17.5%', KN: '17.5%', PA: '17.5%' };

function pf16Level(std) {
  if (std >= 8) return { l: 'Tinggi', c: '#059669', bg: '#ECFDF5' };
  if (std >= 4) return { l: 'Rata-rata', c: '#D97706', bg: '#FFFBEB' };
  return { l: 'Rendah', c: '#DC2626', bg: '#FEF2F2' };
}

function rangeLbl(r) {
  return { HIGH: 'Tinggi', MIDDLE: 'Sedang', LOW: 'Rendah' }[r] || r;
}

function rangeColor(r) {
  return { HIGH: '#059669', MIDDLE: '#D97706', LOW: '#DC2626' }[r] || '#6E6A5E';
}

function rangeBg(r) {
  return { HIGH: '#ECFDF5', MIDDLE: '#FFFBEB', LOW: '#FEF2F2' }[r] || '#F9FAFB';
}

function getSJTVerdict(score, maxScore) {
  const pct = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  const label = lvlSJT(pct);

  if (pct >= 85) return { label, emoji: '🌟', bg: '#ECFDF5', br: '#059669' };
  if (pct >= 70) return { label, emoji: '⭐', bg: '#F0FDF4', br: '#16A34A' };
  if (pct >= 55) return { label, emoji: '✓', bg: '#FFFBEB', br: '#D97706' };
  if (pct >= 40) return { label, emoji: '→', bg: '#FEF2F2', br: '#DC2626' };
  return { label, emoji: '○', bg: '#F9FAFB', br: '#6E6A5E' };
}

/**
 * Read-only report view for candidates after completing Assessment D.
 * Shows Manager View (3-pillar + verdict) and detailed scores without edit capability.
 */
export default function CandidateReportView({ profile, results, onClose }) {
  const [showDetail, setShowDetail] = useState(false);

  // Safety check
  if (!results || typeof results !== 'object') {
    return (
      <div className="max-w-[700px] mx-auto px-4 py-6 text-center">
        <div className="text-red-600">Error: Invalid results data</div>
        {onClose && <Button onClick={onClose} className="mt-4">Kembali</Button>}
      </div>
    );
  }

  const tk = results.tk;
  const sjt = results.sjt;
  const pf = results.pf;
  const msdt = results.msdt;
  const papil = results.papil;

  const sjtProfile = sjt?.profile ? PROFILES[sjt.profile] : null;
  const msdtStyle = msdt?.dominant ? STYLES[msdt.dominant] : null;
  const tkComp = tk?.composite ?? null;
  const tkVd = tkComp != null ? getVerdict(Math.round(tkComp)) : null;

  return (
    <div className="max-w-[1100px] mx-auto px-4 py-5 pb-20">
      {/* Report Hero */}
      <div
        className="rounded-xl text-white shadow-xl overflow-hidden mb-4"
        style={{ background: 'linear-gradient(135deg,#0A2A22 0%,#064E3B 45%,#0A6E5C 100%)' }}
      >
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-white/10 flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <span className="font-serif text-base font-bold tracking-widest">MYRALIX</span>
            <span className="w-px h-4 bg-white/25" />
            <span className="text-[11px] font-semibold tracking-wider uppercase opacity-65">Laporan Asesmen Battery D</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="bg-white/15 border border-white/20 rounded-full px-3 py-1 text-[11px] font-bold">
              Battery D · Senior Manajerial & Eksekutif
            </span>
          </div>
        </div>
        <div className="grid md:grid-cols-[1fr_auto] gap-5 px-6 py-5 items-start">
          <div>
            <div className="font-serif text-2xl md:text-3xl font-bold mb-1 leading-tight">{profile?.name}</div>
            <div className="text-sm opacity-80 mb-3.5">
              {profile?.position}
              {profile?.department ? ' · ' + profile.department : ''}
              {profile?.education ? ' · ' + profile.education : ''}
            </div>
            <div className="grid grid-cols-2 gap-x-3.5 gap-y-1.5 max-w-[420px]">
              {[
                ['Tanggal Lahir', profile?.date_birth ? new Date(profile.date_birth).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'],
                ['Tanggal Tes', profile?.date || fmtDateID()],
                ['Email', profile?.email || '—'],
              ].map(([lbl, val]) => (
                <div key={lbl} className="bg-white/10 rounded-lg px-3 py-1.5">
                  <div className="text-[9px] font-bold tracking-widest uppercase opacity-60 mb-0.5">{lbl}</div>
                  <div className="text-xs font-semibold">{val}</div>
                </div>
              ))}
            </div>
          </div>
          {tkComp != null && tkVd && (
            <div className="bg-white/10 border border-white/20 rounded-xl px-5 py-4 min-w-[130px] text-center">
              <div
                className="w-[72px] h-[72px] rounded-full border-4 mx-auto flex flex-col items-center justify-center"
                style={{ borderColor: tkVd.br }}
              >
                <div className="font-serif text-2xl font-bold" style={{ color: tkVd.br }}>{tkComp.toFixed(1)}</div>
                <div className="text-[9px] font-bold tracking-wider opacity-70 mt-0.5" style={{ color: tkVd.br }}>/10</div>
              </div>
              <div className="text-xs font-bold mt-2" style={{ color: tkVd.br }}>
                {tkVd.emoji} {tkVd.short}
              </div>
              <div className="text-[10px] opacity-65 mt-0.5">Komposit TK</div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2.5 text-xs text-blue-900 leading-relaxed mb-4">
        <strong>ℹ️ Catatan:</strong> Ini adalah laporan hasil asesmen Anda. Laporan lengkap dengan interpretasi dan rekomendasi
        hanya dapat diakses oleh rekruter dan tim HR.
      </div>

      {/* Quick Score Chips */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 mb-4">
        {tkComp != null ? (
          <ChipScore label="Komposit TK Kognitif" value={`${tkComp.toFixed(1)}`} sub="4 subtes tertimbang" verdict={tkVd} />
        ) : (
          <ChipEmpty label="Komposit TK" />
        )}
        {sjtProfile ? (
          <div
            className="rounded-xl border-[1.5px] p-3.5 px-4 relative overflow-hidden"
            style={{ background: sjtProfile.bg, borderColor: sjtProfile.color, color: sjtProfile.color }}
          >
            <div className="text-[10px] font-bold uppercase tracking-wider mb-1">Profil Kepemimpinan SJT</div>
            <div className="font-serif text-xl font-bold leading-none">{sjtProfile.name}</div>
            <div className="text-[10.5px] mt-1 opacity-75">{sjtProfile.emoji} {sjtProfile.short}</div>
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold mt-1 bg-white/30">
              ℹ️ Penilaian Situasional
            </div>
          </div>
        ) : (
          <ChipEmpty label="SJT Leadership" />
        )}
        {msdtStyle ? (
          <div
            className="rounded-xl border-[1.5px] p-3.5 px-4 relative overflow-hidden"
            style={{ background: msdtStyle.bg, borderColor: msdtStyle.color, color: msdtStyle.color }}
          >
            <div className="text-[10px] font-bold uppercase tracking-wider mb-1">Gaya Kepemimpinan MSDT</div>
            <div className="font-serif text-xl font-bold leading-none">{msdtStyle.name}</div>
            <div className="text-[10.5px] mt-1 opacity-75">{msdtStyle.emoji} {msdtStyle.tagline}</div>
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold mt-1 bg-white/30">
              ✓ Selesai
            </div>
          </div>
        ) : (
          <ChipEmpty label="MSDT Leadership" />
        )}
      </div>

      {/* Manager View (always visible) */}
      <ManagerView profile={profile} results={results} finalRec={null} onSetFinalRec={() => {}} />

      <details open={showDetail} onToggle={(e) => setShowDetail(e.currentTarget.open)} className="my-5">
        <summary className="cursor-pointer px-5 py-3.5 bg-white border border-slate-200 rounded-xl flex items-center gap-3 text-sm font-semibold list-none select-none hover:bg-teal-50 hover:border-teal-200 transition">
          <span className="text-teal-600 text-xs transition-transform" style={{ transform: showDetail ? 'rotate(90deg)' : 'rotate(0deg)' }}>▶</span>
          <span className="text-lg">📋</span>
          <span className="flex-1">Detail Skor Asesmen</span>
          <span className="text-[11.5px] font-medium text-slate-500">— Klik untuk membuka / menutup</span>
        </summary>

        <div className="pt-5 space-y-4">
          {/* SECTION I — TK */}
          <SectionCard num="I" title="Kemampuan Kognitif — TK Battery D" subtitle="4 Subtes: GI · PV · KN · PA" color="#0A6E5C" bg="#EDF7F5">
            {tk ? (
              <div className="space-y-3">
                <div className="bg-teal-50 border border-teal-200 rounded-lg p-3">
                  <div className="text-xs font-semibold text-teal-900 mb-1.5">Skor Komposit (Weighted)</div>
                  <div className="font-serif text-3xl font-bold text-teal-800">{tk.composite?.toFixed(1) ?? '—'}<span className="text-base text-slate-400 font-normal ml-1">/10</span></div>
                  {tkVd && <div className="text-xs text-teal-700 mt-1">{tkVd.emoji} {tkVd.label}</div>}
                </div>
                {tk.sub && Object.keys(tk.sub).map((code) => {
                  const s = tk.sub[code];
                  const vd = getVerdict(s.score10);
                  return (
                    <div key={code} className="border border-slate-200 rounded-lg p-3 bg-white">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="font-bold text-sm">{code}</div>
                        <div className="text-xs text-slate-500">{SUB_NAMES[code]}</div>
                        <div className="ml-auto text-xs text-slate-400">Bobot: {SUB_WEIGHTS[code]}</div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <div className="text-[10px] text-slate-400 mb-0.5">Skor 10</div>
                          <div className="font-bold text-teal-800">{s.score10}/10</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-400 mb-0.5">Persen</div>
                          <div className="font-bold">{s.pct}%</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-400 mb-0.5">IQ Estimasi</div>
                          <div className="font-bold">{s.iq || '—'}</div>
                        </div>
                      </div>
                      <div className={`inline-block mt-2 px-2 py-0.5 rounded-full text-[10px] font-bold`} style={{ background: vd.bg, color: vd.br }}>
                        {vd.emoji} {vd.short}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-4 text-slate-400">Belum dikerjakan</div>
            )}
          </SectionCard>

          {/* SECTION II — SJT */}
          <SectionCard num="II" title="Penilaian Situasional Kepemimpinan — SJT" subtitle="6 Kompetensi Senior Leadership" color="#6366F1" bg="#EEF2FF">
            {sjt?.comps ? (
              <div className="space-y-3">
                {sjtProfile && (
                  <div className="border-2 rounded-lg p-4" style={{ borderColor: sjtProfile.color, background: sjtProfile.bg }}>
                    <div className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: sjtProfile.color }}>Profil Kepemimpinan Dominan</div>
                    <div className="font-serif text-2xl font-bold leading-tight" style={{ color: sjtProfile.color }}>{sjtProfile.emoji} {sjtProfile.name}</div>
                    <div className="text-xs mt-1.5" style={{ color: sjtProfile.color, opacity: 0.85 }}>{sjtProfile.desc}</div>
                  </div>
                )}
                <div className="space-y-2">
                  {COMP_ORDER.map((cid) => {
                    const c = COMPS[cid];
                    const score = sjt.comps[cid] ?? 0;
                    const lvl = getSJTVerdict(score, c.maxScore);
                    return (
                      <div key={cid} className="border border-slate-200 rounded-lg p-3 bg-white">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-2 h-2 rounded-full" style={{ background: c.color }}></div>
                          <div className="font-bold text-sm">{c.name}</div>
                          <div className="ml-auto font-serif text-xl font-bold" style={{ color: c.color }}>{score}<span className="text-xs text-slate-400 font-normal">/{c.maxScore}</span></div>
                        </div>
                        <div className="text-[10.5px] text-slate-500 mb-2">{c.desc}</div>
                        <div className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold`} style={{ background: lvl.bg, color: lvl.br }}>
                          {lvl.emoji} {lvl.label}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-slate-400">Belum dikerjakan</div>
            )}
          </SectionCard>

          {/* SECTION III — 16PF */}
          <SectionCard num="III" title="Profil Kepribadian — 16PF" subtitle="16 Faktor Kepribadian · Sten 1-10" color="#7C3AED" bg="#F5F3FF">
            {pf?.std ? (
              <div className="space-y-2">
                {FACTOR_ORDER.map((fid) => {
                  const f = FACTORS[fid];
                  if (!f) return null;
                  const std = pf.std[fid] ?? 5;
                  const lvl = pf16Level(std);
                  // Get appropriate description based on sten level
                  const descText = typeof f.desc === 'object'
                    ? (std >= 8 ? f.desc.high : std >= 4 ? f.desc.mid : f.desc.low)
                    : (f.desc || '');
                  return (
                    <div key={fid} className="border border-slate-200 rounded-lg p-3 bg-white">
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ background: f.color }}></div>
                        <div className="font-bold text-sm">{f.nameID}</div>
                        <div className="ml-auto font-serif text-lg font-bold text-purple-800">{std}</div>
                      </div>
                      <div className="text-[10.5px] text-slate-500 mb-2">{descText}</div>
                      <div className="bg-slate-100 rounded-full h-1.5 overflow-hidden mb-2">
                        <div className="h-1.5 rounded-full transition-all" style={{ width: `${std * 10}%`, background: lvl.c }} />
                      </div>
                      <div className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold`} style={{ background: lvl.bg, color: lvl.c }}>
                        {lvl.l}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-4 text-slate-400">Belum dikerjakan</div>
            )}
          </SectionCard>

          {/* SECTION IV — MSDT */}
          <SectionCard num="IV" title="Gaya Kepemimpinan — MSDT" subtitle="8 Gaya · TO/RO/E Analysis" color="#DB2777" bg="#FDF2F8">
            {msdt ? (
              <div className="space-y-3">
                {msdtStyle && (
                  <div className="border-2 rounded-lg p-4" style={{ borderColor: msdtStyle.color, background: msdtStyle.bg }}>
                    <div className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: msdtStyle.color }}>Gaya Dominan</div>
                    <div className="font-serif text-2xl font-bold leading-tight" style={{ color: msdtStyle.color }}>{msdtStyle.emoji} {msdtStyle.name}</div>
                    <div className="text-xs mt-1.5" style={{ color: msdtStyle.color, opacity: 0.85 }}>{msdtStyle.tagline}</div>
                  </div>
                )}
                <div className="grid grid-cols-3 gap-2">
                  <div className="border border-slate-200 rounded-lg p-3 bg-white text-center">
                    <div className="text-[10px] text-slate-400 mb-1">Task Orientation</div>
                    <div className="font-serif text-2xl font-bold text-pink-700">{msdt.TO ?? '—'}</div>
                  </div>
                  <div className="border border-slate-200 rounded-lg p-3 bg-white text-center">
                    <div className="text-[10px] text-slate-400 mb-1">Relationship</div>
                    <div className="font-serif text-2xl font-bold text-pink-700">{msdt.RO ?? '—'}</div>
                  </div>
                  <div className="border border-slate-200 rounded-lg p-3 bg-white text-center">
                    <div className="text-[10px] text-slate-400 mb-1">Effectiveness</div>
                    <div className="font-serif text-2xl font-bold text-pink-700">{msdt.E ?? '—'}</div>
                  </div>
                </div>
                <div className="space-y-1.5">
                  {STYLE_ORDER.map((sid) => {
                    const st = STYLES[sid];
                    const raw = msdt.raw?.[sid] ?? 0;
                    return (
                      <div key={sid} className="border border-slate-200 rounded-lg p-2.5 bg-white flex items-center gap-3">
                        <div className="font-bold text-xs" style={{ color: st.color }}>{sid}</div>
                        <div className="flex-1">
                          <div className="text-xs font-semibold">{st.name}</div>
                        </div>
                        <div className="font-serif text-lg font-bold" style={{ color: st.color }}>{raw}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-slate-400">Belum dikerjakan</div>
            )}
          </SectionCard>

          {/* SECTION V — PAPI-L */}
          <SectionCard num="V" title="Preferensi Kepemimpinan — PAPI-L" subtitle="10 Role + 10 Need Dimensions" color="#0891B2" bg="#ECFEFF">
            {papil?.scores ? (
              <div className="space-y-3">
                <div>
                  <div className="text-xs font-bold text-cyan-900 mb-2">10 Role Dimensions</div>
                  <div className="space-y-2">
                    {ROLE_DIMS.map((k) => {
                      const d = DIMS[k];
                      if (!d) return null;
                      const raw = papil.scores[k] ?? 0;
                      const rg = getRange(k, raw);
                      return (
                        <div key={k} className="border border-slate-200 rounded-lg p-2.5 bg-white flex items-center gap-3">
                          <div className="font-bold text-sm text-cyan-800 w-6">{k}</div>
                          <div className="flex-1">
                            <div className="text-xs font-semibold">{d.label || k}</div>
                            <div className="text-[10px] text-slate-500">{d.desc || ''}</div>
                          </div>
                          <div className="font-serif text-xl font-bold text-cyan-800 w-8 text-right">{raw}</div>
                          <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold min-w-[60px] text-center`} style={{ background: rangeBg(rg), color: rangeColor(rg) }}>
                            {rangeLbl(rg)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-bold text-cyan-900 mb-2">10 Need Dimensions</div>
                  <div className="grid grid-cols-2 gap-2">
                    {NEED_DIMS.map((k) => {
                      const d = DIMS[k];
                      if (!d) return null;
                      const raw = papil.scores[k] ?? 0;
                      return (
                        <div key={k} className="border border-slate-200 rounded-lg p-2 bg-white flex items-center gap-2">
                          <div className="font-bold text-xs text-cyan-800 w-5">{k}</div>
                          <div className="flex-1 text-[10.5px] font-semibold truncate">{d.label || k}</div>
                          <div className="font-serif text-lg font-bold text-cyan-800">{raw}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-slate-400">Belum dikerjakan</div>
            )}
          </SectionCard>
        </div>
      </details>

      <div className="text-[11px] text-slate-400 text-center pt-4 mt-4 border-t border-slate-200">
        Myralix Assessment Platform · Battery D v10
      </div>

      <div className="flex flex-wrap items-center gap-2 mt-3">
        <Button variant="outline" size="sm" onClick={() => window.print()}>🖨 Cetak / Simpan PDF</Button>
        {onClose && (
          <Button variant="outline" size="sm" onClick={onClose} className="ml-auto gap-2">
            <ArrowLeft className="w-4 h-4" /> Kembali
          </Button>
        )}
      </div>
    </div>
  );
}

// ── Helper components ──

function ChipScore({ label, value, sub, verdict, badge }) {
  return (
    <div
      className="rounded-xl border-[1.5px] p-3.5 px-4 relative overflow-hidden"
      style={{ background: verdict.bg, borderColor: verdict.br, color: verdict.br }}
    >
      <div className="text-[10px] font-bold uppercase tracking-wider mb-1">{label}</div>
      <div className="font-serif text-3xl font-bold leading-none">{value}<span className="text-base text-slate-400 font-normal ml-1">/10</span></div>
      <div className="text-[10.5px] mt-1 opacity-75">{sub}</div>
      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold mt-1" style={{ background: verdict.br + '22' }}>
        {verdict.emoji} {verdict.short}
      </div>
      {badge && <div className="absolute top-2 right-2 bg-white/90 px-1.5 py-0.5 rounded text-[9px] font-bold">{badge}</div>}
    </div>
  );
}

function ChipEmpty({ label }) {
  return (
    <div className="rounded-xl border-[1.5px] border-slate-200 bg-slate-50 p-3.5 px-4 text-slate-400">
      <div className="text-[10px] font-bold uppercase tracking-wider mb-1">{label}</div>
      <div className="font-serif text-2xl font-bold leading-none">—</div>
      <div className="text-[10.5px] mt-1">Belum dikerjakan</div>
    </div>
  );
}

function SectionCard({ num, title, subtitle, color, bg, children }) {
  return (
    <div className="bg-white border-2 rounded-xl overflow-hidden" style={{ borderColor: color }}>
      <div className="px-5 py-3.5" style={{ background: bg }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full grid place-items-center font-serif text-sm font-bold" style={{ background: color, color: 'white' }}>
            {num}
          </div>
          <div className="flex-1">
            <div className="font-serif text-base font-bold leading-tight" style={{ color }}>{title}</div>
            <div className="text-[10.5px] text-slate-500 mt-0.5">{subtitle}</div>
          </div>
        </div>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}
