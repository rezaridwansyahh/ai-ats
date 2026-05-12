import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
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
import { DIMS, ROLE_DIMS, NEED_DIMS, ASPECTS, getRange } from '../data/papil';
import ManagerView from './ManagerView';

// Narrative slots (8 IDs, matching the Battery D mockup). Each is an editable Textarea
// whose contents persist via `updateState({edit_<id>: value})` (handled by AssessmentDetailDialog).
const NARR_LABELS = {
  'narr-tk':       '📝 Interpretasi — Kemampuan Kognitif',
  'narr-sjt':      '📝 Interpretasi — Penilaian Situasional Kepemimpinan',
  'narr-pf':       '📝 Interpretasi — Kepribadian 16PF',
  'narr-msdt':     '📝 Interpretasi — Gaya Kepemimpinan MSDT',
  'narr-papil':    '📝 Interpretasi — Preferensi Kepemimpinan PAPI-L',
  'narr-konsol':   '📊 Ringkasan Profil Terintegrasi',
  'narr-strength': '⚡ Kekuatan Utama Kandidat',
  'narr-rec':      '📋 Rekomendasi Rekruter',
};

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
  return { HIGH: '#059669', MIDDLE: '#D97706', LOW: '#DC2626' }[r] || '#64748B';
}

function rangeBg(r) {
  return { HIGH: '#ECFDF5', MIDDLE: '#FFFBEB', LOW: '#FEF2F2' }[r] || '#F9FAFB';
}

export default function ReportView({ profile, results, state, updateState }) {
  const [showDetail, setShowDetail] = useState(false);

  const tk    = results.tk;
  const sjt   = results.sjt;
  const pf    = results.pf;
  const msdt  = results.msdt;
  const papil = results.papil;

  const sjtProfile = sjt?.profile ? PROFILES[sjt.profile] : null;
  const msdtStyle  = msdt?.dominant ? STYLES[msdt.dominant] : null;
  const tkComp = tk?.composite ?? null;
  const tkVd   = tkComp != null ? getVerdict(Math.round(tkComp)) : null;

  const finalRec = state.finalRec || null;
  const setNarr  = (id, value) => updateState({ ['edit_' + id]: value });
  const setNotes = (id, value) => updateState({ ['notes_' + id]: value });
  const setRcr   = (sec, value) => updateState({ ['rcr_' + sec]: value });
  const setFinalRec = (value) => updateState({ finalRec: value });

  return (
    <div className="max-w-[1100px] mx-auto px-4 py-5 pb-20">
      {/* Hero */}
      <div
        className="rounded-xl text-white shadow-xl overflow-hidden mb-4"
        style={{ background: 'linear-gradient(135deg,#0A2A22 0%,#064E3B 45%,#0A6E5C 100%)' }}
      >
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-white/10 flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <span className="font-serif text-base font-bold tracking-widest">MYRALIX</span>
            <span className="w-px h-4 bg-white/25" />
            <span className="text-[11px] font-semibold tracking-wider uppercase opacity-65">Laporan Psikologis Asesmen</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="bg-white/15 border border-white/20 rounded-full px-3 py-1 text-[11px] font-bold">
              Battery D · Senior Manajerial & Eksekutif
            </span>
            <span className="bg-white/15 border border-white/25 rounded-full px-3 py-1 text-[11px] font-bold">🔒 RAHASIA</span>
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
                ['No. Kandidat', state.nomerKandidat || '—'],
                ['Asesor', state.asesor || '—'],
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
                <div className="font-serif text-2xl font-bold" style={{ color: tkVd.br }}>{tkComp}</div>
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

      <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5 text-xs text-amber-900 leading-relaxed mb-4">
        <strong>⚠️ Catatan:</strong> Laporan ini merupakan alat bantu profesional. Interpretasi akhir tetap memerlukan penilaian
        psikolog atau rekruter berpengalaman. Narasi pada laporan ini dapat diedit langsung — semua perubahan tersimpan otomatis di
        browser ini. Dokumen bersifat <strong>rahasia</strong> dan hanya untuk keperluan seleksi internal.
      </div>

      {/* Quick Score Chips */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 mb-4">
        {tkComp != null ? (
          <ChipScore label="Komposit TK Kognitif" value={`${tkComp}`} sub="GI×30% + PV+KN+PA ×17.5%" verdict={tkVd} />
        ) : (
          <ChipEmpty label="Komposit TK" />
        )}
        {sjt && sjtProfile ? (
          <div
            className="rounded-xl border-[1.5px] p-3.5 px-4 relative overflow-hidden"
            style={{ background: sjtProfile.colorLt, borderColor: sjtProfile.color + '55', color: sjtProfile.color }}
          >
            <div className="text-[10px] font-bold uppercase tracking-wider mb-1">SJT — Profil Eksekutif</div>
            <div className="font-serif text-2xl font-bold tracking-wider leading-none">{sjt.profile}</div>
            <div className="text-[10.5px] mt-1 opacity-75">{sjtProfile.name}</div>
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold mt-1" style={{ background: sjtProfile.color + '20' }}>
              {sjt.overallPct}% · {lvlSJT(sjt.overallPct)}
            </div>
          </div>
        ) : (
          <ChipEmpty label="SJT" />
        )}
        {msdt && msdtStyle ? (
          <div
            className="rounded-xl border-[1.5px] p-3.5 px-4 relative overflow-hidden"
            style={{ background: msdtStyle.colorLt, borderColor: msdtStyle.color + '55', color: msdtStyle.color }}
          >
            <div className="text-[10px] font-bold uppercase tracking-wider mb-1">MSDT — Gaya Dominan</div>
            <div className="font-serif text-xl font-bold leading-tight">{msdtStyle.name}</div>
            <div className="text-[10.5px] mt-1 opacity-75">{msdtStyle.tagline}</div>
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold mt-1" style={{ background: msdtStyle.color + '20' }}>
              Efektivitas {msdt.effectPct}% · Skor {msdt.score10}/10
            </div>
          </div>
        ) : (
          <ChipEmpty label="MSDT" />
        )}
      </div>

      {/* Manager View */}
      <ManagerView profile={profile} results={results} finalRec={finalRec} onSetFinalRec={setFinalRec} />

      {/* Detail toggle */}
      <details open={showDetail} onToggle={(e) => setShowDetail(e.currentTarget.open)} className="my-5">
        <summary className="cursor-pointer px-5 py-3.5 bg-white border border-slate-200 rounded-xl flex items-center gap-3 text-sm font-semibold list-none select-none hover:bg-teal-50 hover:border-teal-200 transition">
          <span className="text-teal-600 text-xs transition-transform" style={{ transform: showDetail ? 'rotate(90deg)' : 'rotate(0deg)' }}>▶</span>
          <span className="text-lg">📋</span>
          <span className="flex-1">Detail Psikologis untuk HR / Psikolog</span>
          <span className="text-[11.5px] font-medium text-slate-500">— Klik untuk membuka / menutup</span>
        </summary>

        <div className="pt-5 space-y-4">
          {/* SECTION I — TK */}
          <SectionCard num="I" title="Kemampuan Kognitif — TK Battery D" subtitle="4 Subtes: GI · PV · KN · PA" color="#0A6E5C" bg="#EDF7F5">
            {tk ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse mb-3.5">
                  <thead>
                    <tr className="bg-slate-50 border-b-2 border-slate-200">
                      <th className="text-left px-3 py-2 text-[10.5px] font-bold uppercase tracking-wider text-slate-500">Subtes</th>
                      <th className="text-left px-3 py-2 text-[10.5px] font-bold uppercase tracking-wider text-slate-500">Benar</th>
                      <th className="text-center px-3 py-2 text-[10.5px] font-bold uppercase tracking-wider text-slate-500">Skor /10</th>
                      <th className="text-left px-3 py-2 text-[10.5px] font-bold uppercase tracking-wider text-slate-500">Kategori</th>
                      <th className="text-left px-3 py-2 text-[10.5px] font-bold uppercase tracking-wider text-slate-500">Verdict</th>
                    </tr>
                  </thead>
                  <tbody>
                    {['GI', 'PV', 'KN', 'PA'].map((c) => {
                      const s = tk.sub?.[c];
                      if (!s) {
                        return (
                          <tr key={c} className="border-b border-slate-100">
                            <td className="px-3 py-2.5 font-bold">{c}</td>
                            <td className="px-3 py-2.5 text-slate-300" colSpan={4}>Tidak tersedia</td>
                          </tr>
                        );
                      }
                      const vd = getVerdict(s.score10);
                      const gr = getGrade(s.pct || s.score10 * 10);
                      return (
                        <tr key={c} className="border-b border-slate-100">
                          <td className="px-3 py-2.5">
                            <strong>{c}</strong> <span className="text-[10px] text-slate-400">({SUB_WEIGHTS[c]})</span>
                            <br />
                            <span className="text-[11px] text-slate-500">{SUB_NAMES[c]}</span>
                            {c === 'GI' && s.iq && (
                              <>
                                <br />
                                <span className="text-[11px]" style={{ color: getIQClass(s.iq).color }}>
                                  IQ ≈ {s.iq} ({getIQClass(s.iq).label})
                                </span>
                              </>
                            )}
                          </td>
                          <td className="px-3 py-2.5">{s.ok != null ? `${s.ok}/${s.items}` : '—'}</td>
                          <td className="px-3 py-2.5 text-center">
                            <div className="w-9 h-9 rounded-full inline-flex items-center justify-center border-[2.5px] font-serif font-bold text-[15px]" style={{ borderColor: vd.br, color: vd.color }}>
                              {s.score10}
                            </div>
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="bg-slate-100 rounded-full h-1.5 overflow-hidden min-w-[80px] max-w-[120px] mb-1">
                              <div className="h-1.5 rounded-full bg-teal-700 transition-all" style={{ width: `${(s.score10 / 10) * 100}%` }} />
                            </div>
                            <span className="text-[11px]">{gr.l}</span>
                          </td>
                          <td className="px-3 py-2.5"><Chip vd={vd} /></td>
                        </tr>
                      );
                    })}
                    {tkComp != null && tkVd && (
                      <tr className="bg-gradient-to-r from-teal-50 to-transparent">
                        <td className="px-3 py-3" colSpan={2}>
                          <strong>KOMPOSIT TK</strong>
                          <span className="text-[11px] font-normal ml-1.5">(GI 30% + PV+KN+PA 17.5% each)</span>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <div className="w-11 h-11 rounded-full inline-flex items-center justify-center border-[2.5px] font-serif font-bold text-[18px]" style={{ borderColor: tkVd.br, color: tkVd.color }}>
                            {tkComp}
                          </div>
                        </td>
                        <td className="px-3 py-3 font-bold">{s10ToLabel(Math.round(tkComp))}</td>
                        <td className="px-3 py-3"><Chip vd={tkVd} /></td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-4 text-center text-slate-400">Data TK tidak tersedia</div>
            )}
            <NarrativeBlock id="narr-tk" state={state} setNarr={setNarr} />
            <RcrBlock section="tk" state={state} setRcr={setRcr} />
            <NotesBlock id="tk" state={state} setNotes={setNotes} placeholder="Catatan observasi kemampuan kognitif kandidat…" />
          </SectionCard>

          {/* SECTION II — SJT */}
          <SectionCard num="II" title="Penilaian Situasional Kepemimpinan — SJT" subtitle="22 Skenario · 6 Kompetensi · 30 menit timer" color="#6366F1" bg="#EEF2FF">
            {sjt ? (
              <>
                <div className="grid md:grid-cols-[1fr_auto] gap-4 mb-4">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 mb-2.5">Skor per Kompetensi</div>
                    {COMP_ORDER.map((code) => {
                      const comp = COMPS[code];
                      const pct = sjt.compPct?.[code] || 0;
                      return (
                        <div key={code} className="flex items-center gap-2.5 mb-1.5">
                          <div className="text-[12px] font-bold min-w-[180px]" style={{ color: comp.color }}>{code} — {comp.name}</div>
                          <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div className="h-2 rounded-full" style={{ width: pct + '%', background: comp.color }} />
                          </div>
                          <div className="text-[12px] font-bold min-w-[36px] text-right" style={{ color: comp.color }}>{pct}%</div>
                        </div>
                      );
                    })}
                  </div>
                  {sjtProfile && (
                    <div className="rounded-xl border-2 p-4 min-w-[200px] max-w-[230px]" style={{ background: sjtProfile.colorLt, borderColor: sjtProfile.color }}>
                      <div className="text-[10px] font-bold uppercase mb-1" style={{ color: sjtProfile.color }}>Profil Senior Leadership</div>
                      <div className="font-serif text-lg font-bold mb-0.5" style={{ color: sjtProfile.color }}>{sjtProfile.name}</div>
                      <div className="text-[11px] text-slate-500 mb-2.5">{sjtProfile.tagline}</div>
                      <div className="flex items-center gap-2">
                        <div className="font-serif text-2xl font-bold" style={{ color: sjtProfile.color }}>{sjt.score10}</div>
                        <div>
                          <div className="text-[10px] font-bold" style={{ color: sjtProfile.color }}>/10</div>
                          <div className="text-[10px] text-slate-500">{lvlSJT(sjt.overallPct)}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="py-4 text-center text-slate-400">Data SJT tidak tersedia</div>
            )}
            <NarrativeBlock id="narr-sjt" state={state} setNarr={setNarr} />
            <RcrBlock section="sjt" state={state} setRcr={setRcr} />
            <NotesBlock id="sjt" state={state} setNotes={setNotes} placeholder="Catatan kematangan penilaian situasional senior leadership…" />
          </SectionCard>

          {/* SECTION III — 16PF */}
          <SectionCard num="III" title="Kepribadian Komprehensif — 16PF" subtitle="16 Faktor Kepribadian · 105 Item · Sten 1–10" color="#7C3AED" bg="#F5F3FF">
            {pf?.std ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
                {FACTOR_ORDER.map((code) => {
                  const f = FACTORS[code];
                  const std = pf.std[code] || 1;
                  const lvl = pf16Level(std);
                  return (
                    <div key={code} className="rounded-lg border px-3 py-2 flex items-center gap-2.5" style={{ borderColor: f.bg, background: '#fff' }}>
                      <div className="w-9 h-9 rounded-md grid place-items-center font-serif font-bold text-sm flex-shrink-0" style={{ background: f.bg, color: f.color }}>
                        {code}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[12px] font-bold text-slate-700">{f.nameID}</div>
                        <div className="text-[10.5px] text-slate-500 truncate">{std >= 6 ? f.high : f.low}</div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="font-serif text-lg font-bold" style={{ color: lvl.c }}>{std}</div>
                        <div className="text-[9px] font-bold uppercase tracking-wider" style={{ color: lvl.c }}>{lvl.l}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-4 text-center text-slate-400">Data 16PF tidak tersedia</div>
            )}
            <NarrativeBlock id="narr-pf" state={state} setNarr={setNarr} />
            <RcrBlock section="pf" state={state} setRcr={setRcr} />
            <NotesBlock id="pf" state={state} setNotes={setNotes} placeholder="Catatan pola kepribadian eksekutif (C, E, H, Q3, Q4, dst)…" />
          </SectionCard>

          {/* SECTION IV — MSDT */}
          <SectionCard num="IV" title="Gaya Kepemimpinan — MSDT" subtitle="8 Gaya · 64 Pasang Item · Task / Relationship / Effectiveness" color="#DB2777" bg="#FDF2F8">
            {msdt ? (
              <>
                {msdtStyle && (
                  <div className="rounded-xl border-2 p-4 mb-3.5" style={{ background: msdtStyle.colorLt, borderColor: msdtStyle.color }}>
                    <div className="text-[10px] font-bold uppercase mb-1" style={{ color: msdtStyle.color }}>Gaya Dominan</div>
                    <div className="font-serif text-xl font-bold" style={{ color: msdtStyle.color }}>{msdtStyle.name}</div>
                    <div className="text-[12px] text-slate-600 mt-1">{msdtStyle.tagline}</div>
                    <div className="text-[12px] text-slate-700 mt-2 leading-relaxed">{msdtStyle.desc}</div>
                  </div>
                )}
                <div className="grid grid-cols-3 gap-2.5 mb-3.5">
                  {[
                    { label: 'Task Orientation', val: msdt.TO, color: '#DC2626' },
                    { label: 'Relationship Orientation', val: msdt.RO, color: '#0A6E5C' },
                    { label: 'Effectiveness', val: msdt.E, color: '#0369A1' },
                  ].map((g) => (
                    <div key={g.label} className="rounded-lg border border-slate-200 p-3 text-center bg-white">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">{g.label}</div>
                      <div className="font-serif text-2xl font-bold" style={{ color: g.color }}>{g.val}<span className="text-sm font-medium opacity-60">/100</span></div>
                      <div className="bg-slate-100 rounded-full h-1.5 overflow-hidden mt-1.5">
                        <div className="h-1.5 rounded-full" style={{ width: g.val + '%', background: g.color }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                  {STYLE_ORDER.map((code) => {
                    const s = STYLES[code];
                    const raw = msdt.raw?.[code] || 0;
                    const isDom = code === msdt.dominant;
                    return (
                      <div key={code} className="rounded-lg border px-3 py-2 flex items-center gap-2" style={{ borderColor: isDom ? s.color : '#E2E8F0', background: isDom ? s.colorLt : '#fff' }}>
                        <div className="w-7 h-7 rounded grid place-items-center font-serif font-bold text-xs" style={{ background: s.color, color: '#fff' }}>{code}</div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[11px] font-bold truncate" style={{ color: s.color }}>{s.name}</div>
                          <div className="text-[10px] text-slate-500">Raw {raw}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="py-4 text-center text-slate-400">Data MSDT tidak tersedia</div>
            )}
            <NarrativeBlock id="narr-msdt" state={state} setNarr={setNarr} />
            <RcrBlock section="msdt" state={state} setRcr={setRcr} />
            <NotesBlock id="msdt" state={state} setNotes={setNotes} placeholder="Catatan gaya kepemimpinan dominan & konteks ideal…" />
          </SectionCard>

          {/* SECTION V — PAPI-L */}
          <SectionCard num="V" title="Preferensi Kepemimpinan — PAPI-L" subtitle="10 Peran + 10 Kebutuhan · 90 Pasang Item" color="#0891B2" bg="#ECFEFF">
            {papil?.scores ? (
              <>
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">Peran ({papil.roleTotal || 0}/90) · Kebutuhan ({papil.needTotal || 0}/90)</div>
                {['ROLE', 'NEED'].map((groupType) => {
                  const dims = groupType === 'ROLE' ? ROLE_DIMS : NEED_DIMS;
                  return (
                    <div key={groupType} className="mb-3">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                        {groupType === 'ROLE' ? '👤 Dimensi Peran' : '🎯 Dimensi Kebutuhan'}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                        {dims.map((code) => {
                          const dim = DIMS[code];
                          const score = papil.scores[code] || 0;
                          const range = getRange(code, score);
                          return (
                            <div key={code} className="rounded-lg border px-3 py-1.5 flex items-center gap-2.5" style={{ borderColor: '#E2E8F0', background: '#FAFAFA' }}>
                              <div className="w-7 h-7 rounded grid place-items-center font-serif font-bold text-xs flex-shrink-0" style={{ background: dim.bg, color: dim.color }}>{code}</div>
                              <div className="flex-1 min-w-0">
                                <div className="text-[11.5px] font-bold text-slate-700 truncate">{dim.label}</div>
                                <div className="text-[10px] text-slate-500 truncate">{dim.aspect}</div>
                              </div>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: rangeBg(range), color: rangeColor(range) }}>
                                {score} · {rangeLbl(range)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5 mt-3">
                  {ASPECTS.map((a) => (
                    <div key={a.id} className="rounded-md px-2.5 py-1.5 text-center text-[10.5px]" style={{ background: a.color + '15', color: a.color }}>
                      <div className="font-bold">{a.nameID}</div>
                      <div className="opacity-70">{a.dims.join(' · ')}</div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="py-4 text-center text-slate-400">Data PAPI-L tidak tersedia</div>
            )}
            <NarrativeBlock id="narr-papil" state={state} setNarr={setNarr} />
            <RcrBlock section="papil" state={state} setRcr={setRcr} />
            <NotesBlock id="papil" state={state} setNotes={setNotes} placeholder="Catatan preferensi kepemimpinan (Role/Need utama)…" />
          </SectionCard>

          {/* SECTION VI — Synthesis */}
          <SectionCard num="VI" title="Sintesis & Rekomendasi" subtitle="Ringkasan terintegrasi · Kekuatan · Rekomendasi rekruter" color="#0A6E5C" bg="#EDF7F5">
            <NarrativeBlock id="narr-konsol"   state={state} setNarr={setNarr} />
            <NarrativeBlock id="narr-strength" state={state} setNarr={setNarr} />
            <NarrativeBlock id="narr-rec"      state={state} setNarr={setNarr} />

            <div className="mt-4">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">Keputusan Akhir Rekruter</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {[
                  { val: 'direkomendasikan', label: '✅ Direkomendasikan',  cls: 'border-green-600 bg-green-50 text-green-700' },
                  { val: 'pertimbangkan',    label: '⚠️ Perlu Dipertimbangkan', cls: 'border-amber-600 bg-amber-50 text-amber-700' },
                  { val: 'tidak',            label: '❌ Tidak Direkomendasikan', cls: 'border-red-600 bg-red-50 text-red-700' },
                ].map((opt) => (
                  <button
                    key={opt.val}
                    onClick={() => setFinalRec(opt.val)}
                    className={`rounded-lg border-2 px-4 py-3 text-sm font-bold transition ${opt.cls} ${finalRec === opt.val ? 'ring-2 ring-offset-1' : 'opacity-60 hover:opacity-100'}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <NotesBlock id="final" state={state} setNotes={setNotes} placeholder="Catatan akhir rekruter & saran tindak lanjut…" />
          </SectionCard>
        </div>
      </details>
    </div>
  );
}

// ───────── Small presentational helpers ─────────

function ChipScore({ label, value, sub, verdict, badge }) {
  return (
    <div className="rounded-xl border-[1.5px] p-3.5 px-4" style={{ background: verdict?.bg, borderColor: verdict?.br + '88', color: verdict?.color }}>
      <div className="text-[10px] font-bold uppercase tracking-wider mb-1 flex items-center justify-between">
        <span>{label}</span>
        {badge && <span className="px-1.5 py-0 rounded font-mono text-[10px]" style={{ background: verdict?.color + '20' }}>{badge}</span>}
      </div>
      <div className="font-serif text-2xl font-bold leading-none">{value}<span className="text-sm font-medium opacity-60"> /10</span></div>
      {sub && <div className="text-[10.5px] mt-1 opacity-75">{sub}</div>}
      {verdict && (
        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold mt-1.5" style={{ background: verdict.color + '20' }}>
          {verdict.emoji} {verdict.short}
        </div>
      )}
    </div>
  );
}

function ChipEmpty({ label }) {
  return (
    <div className="rounded-xl border-[1.5px] border-slate-200 bg-slate-50 p-3.5 px-4 text-slate-400">
      <div className="text-[10px] font-bold uppercase tracking-wider mb-1">{label}</div>
      <div className="font-serif text-lg">—</div>
      <div className="text-[10px] mt-1">Data tidak tersedia</div>
    </div>
  );
}

function Chip({ vd }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border" style={{ background: vd.bg, color: vd.color, borderColor: vd.br }}>
      {vd.emoji} {vd.label}
    </span>
  );
}

function SectionCard({ num, title, subtitle, color, bg, children }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      <div className="flex items-center gap-3.5 px-5 py-3.5" style={{ background: `linear-gradient(90deg, ${bg}, transparent)` }}>
        <div className="w-10 h-10 rounded-full grid place-items-center font-serif font-bold text-base flex-shrink-0 border-2" style={{ borderColor: color, color }}>
          {num}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-serif text-base md:text-lg font-semibold leading-tight">{title}</div>
          {subtitle && <div className="text-[11px] text-slate-500 mt-0.5 truncate">{subtitle}</div>}
        </div>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

function NarrativeBlock({ id, state, setNarr }) {
  const value = state['edit_' + id] || '';
  return (
    <div className="mt-3.5">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] font-bold tracking-wider uppercase text-teal-700">{NARR_LABELS[id] || id}</span>
        <span className="text-[10.5px] text-slate-400 italic">✏️ klik untuk mengedit</span>
      </div>
      <Textarea
        value={value}
        onChange={(e) => setNarr(id, e.target.value)}
        placeholder="Tulis interpretasi psikologis untuk bagian ini…"
        className="min-h-[90px] text-[13px] leading-relaxed bg-gradient-to-br from-teal-50/40 to-emerald-50/30 border-teal-200 focus:border-teal-500"
      />
    </div>
  );
}

function RcrBlock({ section, state, setRcr }) {
  const value = state['rcr_' + section] || null;
  const options = [
    { key: 'sesuai',         label: '✅ Sesuai',            cls: 'border-green-600 text-green-700 bg-green-50' },
    { key: 'pertimbangkan',  label: '⚠️ Perlu Pertimbangan', cls: 'border-amber-600 text-amber-700 bg-amber-50' },
    { key: 'tidak',          label: '❌ Tidak Sesuai',       cls: 'border-red-600 text-red-700 bg-red-50' },
  ];
  return (
    <div className="bg-slate-50 rounded-lg px-4 py-3 mt-3 border border-slate-200">
      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">⚖️ Penilaian Rekruter — Bagian Ini</div>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o.key}
            onClick={() => setRcr(section, o.key)}
            className={`px-3.5 py-1.5 rounded-md text-[12px] font-bold border-[1.5px] transition ${o.cls} ${value === o.key ? '' : 'opacity-50 hover:opacity-100'}`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function NotesBlock({ id, state, setNotes, placeholder }) {
  const value = state['notes_' + id] || '';
  return (
    <div className="mt-3">
      <div className="text-[11px] font-bold tracking-wider uppercase text-slate-500 mb-1.5">📌 Catatan Asesor</div>
      <Textarea
        value={value}
        onChange={(e) => setNotes(id, e.target.value)}
        placeholder={placeholder}
        className="min-h-[60px] text-[12.5px] bg-[#FAFAFA] border-slate-200"
      />
    </div>
  );
}
