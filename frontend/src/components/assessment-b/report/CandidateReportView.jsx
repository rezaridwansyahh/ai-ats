import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, ChevronDown, ChevronUp, Printer, FileDown } from 'lucide-react';
import { calc3Pillar, pillarVerdict, deriveOverallVerdict, genManagerSummary, PILLAR_THRESHOLDS } from './report-utils';
import {
  getVerdict,
  getGrade,
  s10ToLabel,
  pctToScore10,
  levelColor,
  levelBg,
  rangeLbl,
  rangeColor,
  rangeBg,
  getPapiRange,
  getIQClass,
  fmtDateID,
} from '../utils/scoring';
import { SCALE_ORDER, SCALES } from '../data/epps';
import { HOL_TYPES } from '../data/holland';
import { ROLE_DIMS, NEED_DIMS, DIMS } from '../data/papi';

const PILL_CLS = {
  pass: 'bg-green-50 text-green-700 border-green-300',
  warn: 'bg-amber-50 text-amber-700 border-amber-300',
  fail: 'bg-red-50 text-red-700 border-red-300',
  empty: 'bg-slate-50 text-slate-500 border-slate-200',
};
const PILL_LABEL = { pass: '✓ Passed', warn: '⚠ Warn', fail: '✗ Failed', empty: '— Pending' };

const SUB_NAMES = { GI: 'Kemampuan Umum', PV: 'Penalaran Verbal', KN: 'Kemampuan Numerik', PA: 'Penalaran Abstrak', KA: 'Kecepatan & Akurasi' };
const SUB_WEIGHTS = { GI: '30%', PV: '17.5%', KN: '17.5%', PA: '17.5%', KA: '17.5%' };

export default function CandidateReportView({ profile, results, onClose }) {
  const [showDetail, setShowDetail] = useState(false);

  const tk = results.tk;
  const epps = results.epps;
  const hol = results.holland;
  const papi = results.papi;
  const tkComp = tk?.composite ?? null;
  const tkVd = tkComp ? getVerdict(Math.round(tkComp)) : null;

  const pillar = calc3Pillar(results);
  const verdict = deriveOverallVerdict(results, null); // No finalRec for candidate view
  const summary = genManagerSummary(results, verdict, profile);

  const pv = {
    cognitive: pillarVerdict(pillar.cognitive, PILLAR_THRESHOLDS.cognitive),
    personality: pillarVerdict(pillar.personality, PILLAR_THRESHOLDS.personality),
    workAttitude: pillarVerdict(pillar.workAttitude, PILLAR_THRESHOLDS.workAttitude),
    overall: pillarVerdict(pillar.overall, PILLAR_THRESHOLDS.overall),
  };

  const heroBg = {
    pass: 'bg-gradient-to-br from-green-50 to-green-100 border-green-300 text-green-800',
    warn: 'bg-gradient-to-br from-amber-50 to-amber-100 border-amber-300 text-amber-800',
    fail: 'bg-gradient-to-br from-red-50 to-red-100 border-red-300 text-red-800',
    empty: 'bg-slate-50 border-slate-200 text-slate-500',
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-[1100px] mx-auto px-4 py-5 pb-20">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-slate-200 -mx-4 px-4 py-2.5 mb-4 flex items-center justify-between print:hidden">
        <div>
          <div className="font-serif text-base font-bold text-teal-900">Laporan Hasil Asesmen · Battery B</div>
          <div className="text-[10.5px] text-slate-500 mt-0.5">{profile?.name} · {profile?.position}</div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1.5">
            <Printer className="w-3.5 h-3.5" /> Cetak
          </Button>
          <Button variant="outline" size="sm" onClick={onClose} className="gap-1.5">
            <X className="w-3.5 h-3.5" /> Tutup
          </Button>
        </div>
      </div>

      {/* Report Hero */}
      <div className="bg-white border-2 border-teal-700 rounded-xl p-6 mb-4">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-full border-4 border-teal-600 bg-gradient-to-br from-teal-700 to-teal-500 grid place-items-center font-serif font-bold text-white text-2xl flex-shrink-0">
            {profile?.name?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-serif text-2xl font-bold text-slate-900">{profile?.name}</div>
            <div className="text-slate-600 mt-0.5">{profile?.position}</div>
            <div className="text-xs text-slate-500 mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5">
              <span>📧 {profile?.email}</span>
              <span>📅 {tk?.date || 'Tanggal tidak tersedia'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Manager View Section */}
      <section className="space-y-3.5 my-5">
        {/* 3-Pillar Bar */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-[10.5px] font-bold tracking-widest uppercase text-slate-500 mb-3 flex items-center gap-2">
            📊 Skor 3-Pilar · Format Platform Myralix
            <div className="flex-1 h-px bg-slate-200" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 border-[1.5px] border-slate-200 rounded-lg overflow-hidden">
            {[
              { key: 'cognitive', icon: '🧠', name: 'Cognitive', score: pillar.cognitive, threshold: PILLAR_THRESHOLDS.cognitive, verdict: pv.cognitive },
              { key: 'personality', icon: '🎭', name: 'Personality', score: pillar.personality, threshold: PILLAR_THRESHOLDS.personality, verdict: pv.personality },
              { key: 'workAttitude', icon: '💼', name: 'Work Attitude', score: pillar.workAttitude, threshold: PILLAR_THRESHOLDS.workAttitude, verdict: pv.workAttitude },
              { key: 'overall', icon: '🏆', name: 'Overall', score: pillar.overall, threshold: PILLAR_THRESHOLDS.overall, verdict: pv.overall, isOverall: true },
            ].map((p, i, arr) => (
              <div
                key={p.key}
                className={[
                  'p-4 text-center border-r border-slate-200 last:border-r-0 bg-white',
                  p.isOverall && 'bg-gradient-to-b from-teal-50 to-white',
                  i < arr.length - 2 && 'border-b md:border-b-0',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <div className="text-lg mb-1 opacity-80">{p.icon}</div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">{p.name}</div>
                <div className={`font-serif font-bold leading-none mb-1 ${p.isOverall ? 'text-3xl text-teal-800' : 'text-2xl'}`}>
                  {p.score ?? '—'}
                  <span className="text-xs text-slate-400 font-normal ml-0.5">/100</span>
                </div>
                <div className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${PILL_CLS[p.verdict]}`}>
                  {PILL_LABEL[p.verdict]}
                </div>
                <div className="text-[9.5px] text-slate-400 mt-1">Min {p.threshold}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Hero Verdict */}
        <div className={`border-2 rounded-xl p-6 ${heroBg[verdict.kind]}`}>
          <div className="text-[11px] font-bold tracking-[.18em] uppercase opacity-85">Rekomendasi Asesmen</div>
          <div className="font-serif text-2xl md:text-3xl font-bold mt-1.5 leading-tight">{verdict.label}</div>
          <div className="text-sm mt-2.5 text-slate-600 max-w-[780px]">{verdict.sub}</div>
        </div>

        {/* Summary for Candidate */}
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h3 className="font-serif text-lg text-teal-800 font-bold flex items-center gap-2 mb-3">
            <span className="w-1 h-4 bg-teal-600 rounded-sm" /> 📘 Ringkasan Hasil Asesmen
          </h3>

          {[
            { icon: '🧠', title: 'Kemampuan Berpikir & Analisis', desc: 'Kapasitas belajar, pemecahan masalah, akurasi', score: pillar.cognitive, verdict: pv.cognitive, passLbl: '✅ Memadai', failLbl: '❌ Belum Memadai' },
            { icon: '🌟', title: 'Kesesuaian Kepribadian', desc: 'Karakter bawaan kandidat vs tuntutan peran', score: pillar.personality, verdict: pv.personality, passLbl: '✅ Sesuai', failLbl: '❌ Tidak Sesuai' },
            { icon: '💼', title: 'Kesesuaian Sikap & Gaya Kerja', desc: 'Orientasi kerja, minat, dan preferensi posisi', score: pillar.workAttitude, verdict: pv.workAttitude, passLbl: '✅ Selaras', failLbl: '❌ Tidak Selaras' },
          ].map((row) => (
            <div key={row.title} className="flex items-center gap-3.5 py-3 border-b last:border-b-0 border-slate-100 flex-wrap">
              <div className="text-xl w-9 text-center opacity-85">{row.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold">{row.title}</div>
                <div className="text-xs text-slate-500 mt-0.5">{row.desc}</div>
              </div>
              <div className="font-serif text-xl font-bold text-teal-800 text-right min-w-[56px]">
                {row.score ?? '—'}
                <span className="text-xs text-slate-400 font-normal">/100</span>
              </div>
              <div className={`px-3 py-1 rounded-full text-[11px] font-bold border min-w-[110px] text-center ${PILL_CLS[row.verdict]}`}>
                {row.verdict === 'pass' ? row.passLbl : row.verdict === 'warn' ? '⚠️ Pertimbangkan' : row.verdict === 'fail' ? row.failLbl : '— Pending'}
              </div>
            </div>
          ))}

          <div
            className="mt-4 pl-4 pr-4.5 py-3 bg-teal-50 border-l-4 border-teal-600 rounded-r-md text-sm text-slate-600 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: summary }}
          />
        </div>
      </section>

      {/* Detail Toggle */}
      <div className="my-4">
        <Button
          variant="outline"
          onClick={() => setShowDetail(!showDetail)}
          className="w-full justify-between h-auto py-3 border-2 border-teal-600 hover:bg-teal-50"
        >
          <span className="font-semibold text-teal-900">
            {showDetail ? '🔼 Sembunyikan Detail Lengkap' : '🔽 Lihat Detail Lengkap Setiap Tes'}
          </span>
          {showDetail ? <ChevronUp className="w-5 h-5 text-teal-700" /> : <ChevronDown className="w-5 h-5 text-teal-700" />}
        </Button>
      </div>

      {/* Detailed Sections */}
      {showDetail && (
        <div className="space-y-4">
          {/* TK Section */}
          <section className="bg-white border-2 border-slate-200 rounded-xl p-5">
            <h2 className="font-serif text-lg font-bold text-slate-900 flex items-center gap-2 mb-4">
              <span className="w-1 h-5 bg-teal-600 rounded-sm" />
              🧠 Tes Kemampuan Kognitif (TK)
            </h2>
            {tk ? (
              <>
                <div className="bg-gradient-to-r from-teal-50 to-white border-2 border-teal-600 rounded-lg p-4 mb-4">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Composite Score</div>
                  <div className="flex items-end gap-3">
                    <div className="font-serif text-4xl font-bold text-teal-900">{tkComp?.toFixed(1) ?? '—'}</div>
                    <div className="text-sm text-slate-600 mb-1">
                      <span className={`font-bold ${levelColor(tkVd)}`}>{tkVd || '—'}</span>
                      {tkComp && <span className="ml-2 text-slate-400">IQ: {getIQClass(Math.round(tkComp))}</span>}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                  {Object.entries(tk).filter(([k]) => k !== 'composite' && k !== 'date' && k !== 'tabSwitches').map(([sub, val]) => {
                    const name = SUB_NAMES[sub] || sub;
                    const score = val?.pct ?? null;
                    const grade = score != null ? getGrade(score) : null;
                    return (
                      <div key={sub} className="border border-slate-200 rounded-lg p-3 text-center">
                        <div className="text-[10px] font-bold uppercase text-slate-500 mb-1.5">{name}</div>
                        <div className="font-serif text-2xl font-bold text-slate-900 mb-1">{score?.toFixed(0) ?? '—'}</div>
                        <div className={`text-xs font-bold ${levelColor(grade)}`}>{grade || '—'}</div>
                        <div className="text-[9px] text-slate-400 mt-1">Bobot {SUB_WEIGHTS[sub]}</div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="text-center text-slate-400 py-6">Data TK tidak tersedia</div>
            )}
          </section>

          {/* EPPS Section */}
          <section className="bg-white border-2 border-slate-200 rounded-xl p-5">
            <h2 className="font-serif text-lg font-bold text-slate-900 flex items-center gap-2 mb-4">
              <span className="w-1 h-5 bg-amber-600 rounded-sm" />
              🌟 Tes Kepribadian (EPPS)
            </h2>
            {epps ? (
              <>
                <div className="mb-4 flex items-center gap-4 flex-wrap">
                  <div className="bg-amber-50 border border-amber-300 rounded-lg px-3 py-2">
                    <div className="text-[9px] font-bold uppercase text-slate-500">Consistency</div>
                    <div className="font-serif text-xl font-bold text-amber-900">{epps.consistency || '—'}</div>
                  </div>
                  <div className="bg-amber-50 border border-amber-300 rounded-lg px-3 py-2">
                    <div className="text-[9px] font-bold uppercase text-slate-500">Coherence</div>
                    <div className="font-serif text-xl font-bold text-amber-900">{epps.conScore || '—'}/15</div>
                  </div>
                </div>

                <div className="space-y-2">
                  {SCALE_ORDER.map((scaleKey) => {
                    const scale = SCALES[scaleKey];
                    const raw = epps.rawScores?.[scaleKey] ?? null;
                    const norm = epps.normScores?.[scaleKey] ?? null;
                    const lbl = norm != null ? s10ToLabel(norm) : null;
                    return (
                      <div key={scaleKey} className="flex items-center gap-3 border-b border-slate-100 py-2 last:border-b-0">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-slate-900">{scale.label}</div>
                          <div className="text-xs text-slate-500 mt-0.5">{scale.desc}</div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="font-serif text-xl font-bold text-slate-900">{norm ?? '—'}</div>
                          <div className={`text-[10px] font-bold ${levelColor(lbl)}`}>{lbl || '—'}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="text-center text-slate-400 py-6">Data EPPS tidak tersedia</div>
            )}
          </section>

          {/* Holland Section */}
          <section className="bg-white border-2 border-slate-200 rounded-xl p-5">
            <h2 className="font-serif text-lg font-bold text-slate-900 flex items-center gap-2 mb-4">
              <span className="w-1 h-5 bg-indigo-600 rounded-sm" />
              🗺️ Tes Minat Kerja (Holland)
            </h2>
            {hol ? (
              <>
                <div className="bg-indigo-50 border-2 border-indigo-600 rounded-lg p-4 mb-4">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Holland Code</div>
                  <div className="font-mono text-3xl font-bold text-indigo-900">{hol.code3 || '—'}</div>
                  <div className="text-xs text-slate-600 mt-1">Consistency: {hol.consistency != null ? hol.consistency.toFixed(2) : '—'}</div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.keys(HOL_TYPES).map((typeKey) => {
                    const type = HOL_TYPES[typeKey];
                    const raw = hol.rawScores?.[typeKey] ?? null;
                    const norm = hol.normScores?.[typeKey] ?? null;
                    return (
                      <div key={typeKey} className="border border-slate-200 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="text-xl">{type.icon}</div>
                          <div className="text-sm font-bold text-slate-900">{type.label}</div>
                        </div>
                        <div className="font-serif text-2xl font-bold text-slate-900">{norm ?? '—'}</div>
                        <div className="text-[10px] text-slate-500 mt-1">Raw: {raw ?? '—'}</div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="text-center text-slate-400 py-6">Data Holland tidak tersedia</div>
            )}
          </section>

          {/* PAPI Section */}
          <section className="bg-white border-2 border-slate-200 rounded-xl p-5">
            <h2 className="font-serif text-lg font-bold text-slate-900 flex items-center gap-2 mb-4">
              <span className="w-1 h-5 bg-cyan-600 rounded-sm" />
              ⚙️ Tes Preferensi Kerja (PAPI)
            </h2>
            {papi ? (
              <>
                <div className="space-y-4">
                  <div>
                    <div className="text-xs font-bold uppercase text-slate-500 mb-2">Role Dimensions</div>
                    <div className="space-y-2">
                      {ROLE_DIMS.map((d) => {
                        const score = papi.scores?.[d] ?? null;
                        const range = score != null ? getPapiRange(score) : null;
                        return (
                          <div key={d} className="flex items-center gap-3 border-b border-slate-100 py-2">
                            <div className="w-8 text-center font-mono text-sm font-bold text-cyan-900">{d}</div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-semibold text-slate-900">{DIMS[d]?.label || d}</div>
                              <div className="text-xs text-slate-500">{DIMS[d]?.desc || ''}</div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <div className="font-serif text-xl font-bold text-slate-900">{score ?? '—'}</div>
                              <div className={`text-[10px] font-bold ${rangeColor(range)}`}>{rangeLbl(range)}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-bold uppercase text-slate-500 mb-2">Need Dimensions</div>
                    <div className="space-y-2">
                      {NEED_DIMS.map((d) => {
                        const score = papi.scores?.[d] ?? null;
                        const range = score != null ? getPapiRange(score) : null;
                        return (
                          <div key={d} className="flex items-center gap-3 border-b border-slate-100 py-2">
                            <div className="w-8 text-center font-mono text-sm font-bold text-cyan-900">{d}</div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-semibold text-slate-900">{DIMS[d]?.label || d}</div>
                              <div className="text-xs text-slate-500">{DIMS[d]?.desc || ''}</div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <div className="font-serif text-xl font-bold text-slate-900">{score ?? '—'}</div>
                              <div className={`text-[10px] font-bold ${rangeColor(range)}`}>{rangeLbl(range)}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center text-slate-400 py-6">Data PAPI tidak tersedia</div>
            )}
          </section>
        </div>
      )}

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-slate-200 text-center text-xs text-slate-400">
        Laporan ini dibuat otomatis oleh sistem ATS · Battery B v10 · © {new Date().getFullYear()} Myralix Platform
      </div>
    </div>
  );
}
