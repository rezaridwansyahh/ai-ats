import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  getVerdict,
  getGrade,
  s10ToLabel,
  levelColor,
  levelBg,
  getIQClass,
  fmtDateID,
} from '../utils/scoring';
import { TRAITS } from '../data/bigfive';
import { DISC_DIMS, DISC_PROFILES } from '../data/disc';
import { HOL_TYPES } from '../data/holland';
import ManagerView from './ManagerView';

const NARR_IDS = ['narr-tk', 'narr-bigfive', 'narr-disc', 'narr-holland', 'narr-konsol', 'narr-strength', 'narr-dev', 'narr-fit', 'narr-rec'];

const NARR_LABELS = {
  'narr-tk': '📝 Interpretasi — Kemampuan Kognitif',
  'narr-bigfive': '📝 Interpretasi — Profil Kepribadian Big Five',
  'narr-disc': '📝 Interpretasi — Gaya Kerja DISC',
  'narr-holland': '📝 Interpretasi — Minat & Kesesuaian Peran',
  'narr-konsol': '📊 Ringkasan Profil Terintegrasi',
  'narr-strength': '⚡ Kekuatan Utama Kandidat',
  'narr-dev': '⚠️ Area Pengembangan & Risiko',
  'narr-fit': '🎯 Analisis Kesesuaian Peran',
  'narr-rec': '📋 Rekomendasi Rekruter',
};

const SUB_NAMES = { GI: 'Kemampuan Umum', KA: 'Kecepatan & Akurasi' };
const SUB_WEIGHTS = { GI: '30%', KA: '17.5%' };
const TRAIT_ORDER = ['E', 'A', 'C', 'N', 'O'];
const DISC_ORDER = ['D', 'I', 'S', 'C'];

export default function ReportView({ profile, results, state, updateState, onClose }) {
  const [showDetail, setShowDetail] = useState(false);

  const tk = results.tk;
  const bigfive = results.bigfive;
  const disc = results.disc;
  const hol = results.holland;
  const tkComp = tk?.composite ?? null;
  const tkVd = tkComp ? getVerdict(Math.round(tkComp)) : null;

  const finalRec = state.finalRec || null;

  const setNarr = (id, value) => updateState({ ['edit_' + id]: value });
  const setNotes = (id, value) => updateState({ ['notes_' + id]: value });
  const setRcr = (sec, value) => updateState({ ['rcr_' + sec]: value });
  const setFinalRec = (value) => updateState({ finalRec: value });

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
            <span className="text-[11px] font-semibold tracking-wider uppercase opacity-65">Laporan Psikologis Asesmen</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="bg-white/15 border border-white/20 rounded-full px-3 py-1 text-[11px] font-bold">
              Battery A · Operasional & Staf Umum
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
        {tkComp ? (
          <ChipScore label="Komposit TK Kognitif" value={`${tkComp}`} sub="GI×30% + KA×17.5%" verdict={tkVd} />
        ) : (
          <ChipEmpty label="Komposit TK" />
        )}
        {tk?.sub?.GI ? (
          <ChipScore
            label="GI — Kemampuan Umum"
            value={tk.sub.GI.score10}
            sub={`IQ ≈ ${tk.sub.GI.iq || '—'} · ${tk.sub.GI.iqCls?.label || getIQClass(tk.sub.GI.iq || 90).label}`}
            verdict={getVerdict(tk.sub.GI.score10)}
            badge={getGrade(tk.sub.GI.pct || 50).g}
          />
        ) : (
          <ChipEmpty label="GI Umum" />
        )}
        {hol ? (
          <div
            className="rounded-xl border-[1.5px] p-3.5 px-4 relative overflow-hidden"
            style={{ background: '#EEF2FF', borderColor: '#C7D2FE', color: '#4F46E5' }}
          >
            <div className="text-[10px] font-bold uppercase tracking-wider mb-1">Holland RIASEC</div>
            <div className="font-serif text-2xl font-bold tracking-widest leading-none">{hol.code3 || '—'}</div>
            <div className="text-[10.5px] mt-1 opacity-75">Konsistensi: {hol.consistency || '—'}</div>
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold mt-1 bg-indigo-200/40">
              ℹ️ Informatif
            </div>
          </div>
        ) : (
          <ChipEmpty label="Holland" />
        )}
      </div>

      {/* Manager View (always visible) */}
      <ManagerView profile={profile} results={results} finalRec={finalRec} onSetFinalRec={setFinalRec} />

      <details open={showDetail} onToggle={(e) => setShowDetail(e.currentTarget.open)} className="my-5">
        <summary className="cursor-pointer px-5 py-3.5 bg-white border border-slate-200 rounded-xl flex items-center gap-3 text-sm font-semibold list-none select-none hover:bg-teal-50 hover:border-teal-200 transition">
          <span className="text-teal-600 text-xs transition-transform" style={{ transform: showDetail ? 'rotate(90deg)' : 'rotate(0deg)' }}>▶</span>
          <span className="text-lg">📋</span>
          <span className="flex-1">Detail Psikologis untuk HR / Psikolog</span>
          <span className="text-[11.5px] font-medium text-slate-500">— Klik untuk membuka / menutup</span>
        </summary>

        <div className="pt-5 space-y-4">
          {/* SECTION I — TK */}
          <SectionCard num="I" title="Kemampuan Kognitif — TK Battery A" subtitle="2 Subtes: GI · KA" color="#0A6E5C" bg="#EDF7F5">
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
                    {['GI', 'KA'].map((c) => {
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
                            <div
                              className="w-9 h-9 rounded-full inline-flex items-center justify-center border-[2.5px] font-serif font-bold text-[15px]"
                              style={{ borderColor: vd.br, color: vd.color }}
                            >
                              {s.score10}
                            </div>
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="bg-slate-100 rounded-full h-1.5 overflow-hidden min-w-[80px] max-w-[120px] mb-1">
                              <div className="h-1.5 rounded-full bg-teal-700 transition-all" style={{ width: `${(s.score10 / 10) * 100}%` }} />
                            </div>
                            <span className="text-[11px]">{gr.l}</span>
                          </td>
                          <td className="px-3 py-2.5">
                            <Chip vd={vd} />
                          </td>
                        </tr>
                      );
                    })}
                    {tkComp != null && tkVd && (
                      <tr className="bg-gradient-to-r from-teal-50 to-transparent">
                        <td className="px-3 py-3" colSpan={2}>
                          <strong>KOMPOSIT TK</strong>
                          <span className="text-[11px] font-normal ml-1.5">(GI 30% + KA 17.5%)</span>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <div
                            className="w-11 h-11 rounded-full inline-flex items-center justify-center border-[2.5px] font-serif font-bold text-[18px]"
                            style={{ borderColor: tkVd.br, color: tkVd.color }}
                          >
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
            <RecruiterRating section="tk" current={state.rcr_tk} onSet={setRcr} />
            <AssessorNotes id="notes-tk" state={state} setNotes={setNotes} placeholder="Observasi tambahan terkait kemampuan kognitif..." />
          </SectionCard>

          {/* SECTION II — Big Five */}
          <SectionCard num="II" title="Profil Kepribadian — Big Five (OCEAN)" subtitle="5 Trait · 44 Pernyataan Likert" color="#0369A1" bg="#EFF6FF">
            {bigfive ? (
              <>
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2.5">Distribusi Skor 5 Trait</div>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-2 mb-3.5">
                  {TRAIT_ORDER.map((t) => {
                    const meta = TRAITS[t];
                    const pct = bigfive.pct?.[t] ?? 0;
                    const lvl = bigfive.lvl?.[t] || 'Sedang';
                    return (
                      <div key={t} className="rounded-md px-3 py-2.5 border border-slate-200" style={{ background: meta.bg }}>
                        <div className="text-[11px] font-bold" style={{ color: meta.color }}>{meta.nameID}</div>
                        <div className="text-[10px] text-slate-500 mb-1">({t})</div>
                        <div className="font-serif text-2xl font-bold leading-none" style={{ color: levelColor(lvl) }}>
                          {pct}
                          <span className="text-[10px] font-normal text-slate-400 ml-0.5">/100</span>
                        </div>
                        <div className="bg-slate-100 rounded-full h-1.5 overflow-hidden mt-1.5">
                          <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, background: levelColor(lvl) }} />
                        </div>
                        <span
                          className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold mt-1.5"
                          style={{ background: levelBg(lvl), color: levelColor(lvl) }}
                        >
                          {lvl}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="bg-sky-50 border-l-4 border-sky-500 rounded-r px-3.5 py-2.5 text-xs text-slate-600 mb-2">
                  <strong>Interpretasi singkat:</strong>{' '}
                  {TRAIT_ORDER.map((t) => {
                    const meta = TRAITS[t];
                    const lvl = bigfive.lvl?.[t] || 'Sedang';
                    const txt = lvl === 'Tinggi' ? meta.high : lvl === 'Rendah' ? meta.low : meta.mid;
                    return (
                      <span key={t} className="block mt-1">
                        <strong style={{ color: meta.color }}>{meta.nameID}:</strong> {txt}
                      </span>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="py-4 text-center text-slate-400">Data Big Five tidak tersedia</div>
            )}

            <NarrativeBlock id="narr-bigfive" state={state} setNarr={setNarr} />
            <RecruiterRating section="bigfive" current={state.rcr_bigfive} onSet={setRcr} />
            <AssessorNotes id="notes-bigfive" state={state} setNotes={setNotes} placeholder="Observasi tentang profil kepribadian..." />
          </SectionCard>

          {/* SECTION III — DISC */}
          <SectionCard num="III" title="Gaya Kerja — DISC" subtitle="4 Dimensi · 24 Kelompok Forced-Choice" color="#7C3AED" bg="#F5F3FF">
            {disc ? (
              <>
                <div className="flex items-start gap-5 flex-wrap mb-3.5">
                  <div className="min-w-[200px]">
                    <div className="text-[10px] font-bold tracking-wider uppercase text-purple-700 mb-1">Gaya Dominan</div>
                    <div className="font-serif text-4xl font-bold tracking-widest leading-none" style={{ color: DISC_DIMS[disc.dominant]?.color || '#7C3AED' }}>
                      {disc.dominant || '—'}
                    </div>
                    <div className="text-sm font-semibold mt-1" style={{ color: DISC_DIMS[disc.dominant]?.color || '#7C3AED' }}>
                      {DISC_PROFILES[disc.dominant]?.name}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                      {DISC_PROFILES[disc.dominant]?.tagline}
                    </div>
                    <div className="flex gap-1.5 mt-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-blue-100 text-blue-700">
                        Adaptive (M): {disc.adaptive}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-red-100 text-red-700">
                        Natural (L): {disc.natural}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-[260px]">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Skor per Dimensi (3 Garis)</div>
                    {[
                      { key: 'line1', label: 'Adaptive (M)', accent: '#2563EB' },
                      { key: 'line2', label: 'Natural (L)', accent: '#DC2626' },
                      { key: 'line3', label: 'Differential (M − L)', accent: '#7C3AED' },
                    ].map((row) => {
                      const obj = disc.scores?.[row.key] || {};
                      const max = Math.max(1, ...DISC_ORDER.map((d) => Math.abs(obj[d] || 0)));
                      return (
                        <div key={row.key} className="mb-2">
                          <div className="text-[11px] font-semibold mb-1" style={{ color: row.accent }}>{row.label}</div>
                          {DISC_ORDER.map((d) => {
                            const v = obj[d] ?? 0;
                            const pct = (Math.abs(v) / max) * 100;
                            const dimMeta = DISC_DIMS[d];
                            return (
                              <div key={d} className="flex items-center gap-2 mb-0.5">
                                <span className="w-5 font-extrabold text-xs" style={{ color: dimMeta.color }}>{d}</span>
                                <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                  <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, background: dimMeta.color }} />
                                </div>
                                <span className="text-xs font-semibold min-w-[28px] text-right" style={{ color: dimMeta.color }}>
                                  {v}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                </div>
                {disc.dominant && DISC_PROFILES[disc.dominant] && (
                  <div className="bg-purple-50 border-l-4 border-purple-500 rounded-r px-3.5 py-2.5 text-xs text-slate-600 leading-relaxed">
                    <strong>{DISC_PROFILES[disc.dominant].name}:</strong> {DISC_PROFILES[disc.dominant].short}
                  </div>
                )}
              </>
            ) : (
              <div className="py-4 text-center text-slate-400">Data DISC tidak tersedia</div>
            )}

            <NarrativeBlock id="narr-disc" state={state} setNarr={setNarr} />
            <RecruiterRating section="disc" current={state.rcr_disc} onSet={setRcr} />
            <AssessorNotes id="notes-disc" state={state} setNotes={setNotes} placeholder="Catatan tentang gaya kerja..." />
          </SectionCard>

          {/* SECTION IV — Holland */}
          <SectionCard num="IV" title="Minat Vokasional — Holland RIASEC" subtitle="108 Item · Informatif" color="#4F46E5" bg="#EEF2FF">
            {hol ? (
              <div className="flex items-start gap-5 flex-wrap mb-3.5">
                <div>
                  <div className="text-[10px] font-bold tracking-wider uppercase text-indigo-600 mb-1">Kode RIASEC Dominan</div>
                  <div className="font-serif text-4xl font-bold tracking-widest text-indigo-600 leading-none">{hol.code3}</div>
                  <div className="flex gap-1.5 mt-2 flex-wrap">
                    {(hol.code3 || '').split('').map((c) => (
                      <span
                        key={c}
                        className="px-2.5 py-0.5 rounded-full text-[11px] font-bold"
                        style={{ background: HOL_TYPES[c]?.bg || '#F9FAFB', color: HOL_TYPES[c]?.color || '#64748B' }}
                      >
                        {HOL_TYPES[c]?.nameID || c}
                      </span>
                    ))}
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-700">
                      Konsistensi: {hol.consistency || '—'}
                    </span>
                  </div>
                  {hol.comboInfo && (
                    <div className="mt-3 px-3 py-2 rounded-lg bg-indigo-50 border border-indigo-200 text-xs text-slate-600 max-w-[400px]">
                      <div className="font-semibold text-indigo-700 mb-0.5">{hol.comboInfo.title}</div>
                      <div className="leading-relaxed">{hol.comboInfo.jobs}</div>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-[200px]">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Skor per Tipe</div>
                  {Object.entries(hol.scores)
                    .sort((a, b) => b[1] - a[1])
                    .map(([c, v]) => {
                      const tc = HOL_TYPES[c] || { color: '#64748B', nameID: c };
                      const max = Math.max(...Object.values(hol.scores), 1);
                      return (
                        <div key={c} className="flex items-center gap-2 mb-1">
                          <span className="w-5 font-extrabold text-xs" style={{ color: tc.color }}>{c}</span>
                          <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div className="h-1.5 rounded-full" style={{ width: `${(v / max) * 100}%`, background: tc.color }} />
                          </div>
                          <span className="text-xs font-semibold min-w-[20px] text-right" style={{ color: tc.color }}>
                            {v}
                          </span>
                          <span className="text-[10px] text-slate-400 min-w-[64px]">{tc.nameID}</span>
                        </div>
                      );
                    })}
                </div>
              </div>
            ) : (
              <div className="py-4 text-center text-slate-400">Data Holland tidak tersedia</div>
            )}

            <NarrativeBlock id="narr-holland" state={state} setNarr={setNarr} />
            <AssessorNotes id="notes-holland" state={state} setNotes={setNotes} placeholder="Catatan kesesuaian minat vokasional..." />
          </SectionCard>

          {/* SECTION V — Summary */}
          <SectionCard num="V" title="Ringkasan & Rekomendasi Akhir" subtitle="Konsolidasi seluruh asesmen Battery A" color="#064E3B" bg="#EDF7F5" emphasized>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-3">D. Narasi Psikologis Terintegrasi</div>
            {NARR_IDS.slice(4).map((id) => (
              <div key={id} className="mb-3">
                <div className="text-[11px] font-bold uppercase tracking-wider text-teal-800 mb-1.5">{NARR_LABELS[id]}</div>
                <Textarea
                  value={state['edit_' + id] || ''}
                  onChange={(e) => setNarr(id, e.target.value)}
                  placeholder="Tuliskan interpretasi di sini..."
                  className="min-h-[90px] bg-gradient-to-br from-emerald-50/50 to-teal-50/30 border-teal-200 focus-visible:ring-teal-500"
                />
              </div>
            ))}

            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mt-5 mb-2.5">E. Kesimpulan & Catatan Asesor</div>
            <Textarea
              value={state.notes_final || ''}
              onChange={(e) => setNotes('final', e.target.value)}
              placeholder="Tuliskan kesimpulan akhir, catatan pengembangan, saran onboarding..."
              className="min-h-[100px]"
            />
          </SectionCard>
        </div>
      </details>

      {/* Signature + Footer */}
      <div className="grid md:grid-cols-2 gap-7 mt-5 px-5 py-5 border border-slate-200 rounded-xl bg-slate-50">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Asesor / Rekruter</div>
          <div className="h-px bg-slate-300 my-9 mx-0" />
          <div className="text-xs text-slate-500">Nama: {state.asesor || '_______________________'}</div>
          <div className="text-xs text-slate-500 mt-1">Tanggal: _______________</div>
        </div>
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Mengetahui</div>
          <div className="h-px bg-slate-300 my-9 mx-0" />
          <div className="text-xs text-slate-500">Nama: {state.mengetahui || '_______________________'}</div>
          <div className="text-xs text-slate-500 mt-1">Jabatan: _______________</div>
        </div>
      </div>

      <div className="text-[11px] text-slate-400 text-center pt-4 mt-4 border-t border-slate-200">
        Myralix Assessment Platform · Laporan Psikologis Battery A v10 · RAHASIA — Hanya untuk penggunaan internal
      </div>

      <div className="flex flex-wrap gap-2 mt-3">
        <Button variant="outline" size="sm" onClick={() => window.print()}>🖨 Cetak / Simpan PDF</Button>
        {onClose && (
          <Button variant="outline" size="sm" onClick={onClose} className="ml-auto">
            Tutup
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
      style={{ background: verdict.bg, borderColor: verdict.br, color: verdict.color }}
    >
      <div className="text-[10px] font-bold uppercase tracking-wider mb-1">{label}</div>
      <div className="font-serif text-2xl font-bold leading-none">
        {value}
        <span className="text-sm font-medium"> /10</span>
      </div>
      <div className="text-[10.5px] mt-1 opacity-75">{sub}</div>
      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold mt-1" style={{ background: verdict.color + '20', color: verdict.color }}>
        {badge ? badge : `${verdict.emoji} ${verdict.label}`}
      </div>
    </div>
  );
}

function ChipEmpty({ label }) {
  return (
    <div className="rounded-xl border-[1.5px] border-slate-200 bg-slate-50 p-3.5 px-4 text-slate-400">
      <div className="text-[10px] font-bold uppercase tracking-wider mb-1">{label}</div>
      <div className="font-serif text-base">—</div>
      <div className="text-[10.5px]">Data tidak lengkap</div>
    </div>
  );
}

function Chip({ vd }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border"
      style={{ background: vd.bg, borderColor: vd.br, color: vd.color }}
    >
      {vd.emoji} {vd.label}
    </span>
  );
}

function SectionCard({ num, title, subtitle, color, bg, emphasized, children }) {
  return (
    <div className={`bg-white rounded-xl shadow-sm overflow-hidden ${emphasized ? 'border-2 border-teal-200' : 'border border-slate-200'}`}>
      <div className="flex items-center gap-3.5 px-5 py-4" style={{ background: `linear-gradient(90deg, ${bg}, transparent)` }}>
        <div
          className="w-10 h-10 rounded-full grid place-items-center font-serif text-[17px] font-bold flex-shrink-0 border-2"
          style={{
            borderColor: color,
            color: emphasized ? '#fff' : color,
            background: emphasized ? color : 'transparent',
          }}
        >
          {num}
        </div>
        <div className="flex-1">
          <div className="font-serif text-lg font-semibold leading-tight" style={{ color: emphasized ? color : 'inherit' }}>
            {title}
          </div>
          <div className="text-[11px] font-medium opacity-70 mt-0.5">{subtitle}</div>
        </div>
      </div>
      <div className="px-5 pb-5">{children}</div>
    </div>
  );
}

function NarrativeBlock({ id, state, setNarr }) {
  return (
    <div className="mt-3.5">
      <div className="text-[11px] font-bold uppercase tracking-wider text-teal-800 mb-1.5">{NARR_LABELS[id]}</div>
      <Textarea
        value={state['edit_' + id] || ''}
        onChange={(e) => setNarr(id, e.target.value)}
        placeholder="Tuliskan interpretasi psikologis di sini..."
        className="min-h-[90px] bg-gradient-to-br from-emerald-50/50 to-teal-50/30 border-teal-200 focus-visible:ring-teal-500"
      />
    </div>
  );
}

function RecruiterRating({ section, current, onSet }) {
  const opts = [
    { val: 'sesuai', label: '✅ Sesuai', cls: 'bg-green-50 border-green-500 text-green-700' },
    { val: 'pertimbangkan', label: '⚠️ Perlu Dipertimbangkan', cls: 'bg-amber-50 border-amber-500 text-amber-700' },
    { val: 'tidak', label: '❌ Tidak Sesuai', cls: 'bg-red-50 border-red-500 text-red-700' },
  ];
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-md px-4 py-3 mt-3">
      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">⚖️ Penilaian Rekruter:</div>
      <div className="flex gap-2 flex-wrap">
        {opts.map((o) => {
          const active = current === o.val;
          return (
            <button
              key={o.val}
              onClick={() => onSet(section, o.val)}
              className={[
                'px-3.5 py-1.5 rounded-md text-xs font-bold border-[1.5px] transition',
                active ? o.cls : 'bg-white border-slate-200 text-slate-600 hover:border-teal-400',
              ].join(' ')}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function AssessorNotes({ id, state, setNotes, placeholder }) {
  const key = id.replace(/^notes-/, '');
  return (
    <div className="mt-2.5">
      <div className="text-[11px] font-bold text-slate-500 mb-1.5">📌 Catatan Asesor:</div>
      <Textarea
        value={state['notes_' + key] || ''}
        onChange={(e) => setNotes(key, e.target.value)}
        placeholder={placeholder}
        className="min-h-[70px] bg-slate-50/50 text-sm"
      />
    </div>
  );
}
