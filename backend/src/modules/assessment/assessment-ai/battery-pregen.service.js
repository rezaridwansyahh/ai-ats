// Battery A/B/C/D - Pre-Generated, Evidence-Anchored AI Narrative
//
// Single file that owns the entire pre-generation pipeline for all 4 batteries:
//
//   1. Evidence extraction (pure JS over results.by_subtest + summary)
//   2. Benchmark / rubric reference per battery (constant prompt prefixes)
//   3. Prompt construction + LLM call + multi-mode citation validation
//   4. Persistence via AssessmentBatteryResult.updateAiReport
//
// Triggered fire-and-forget from assessment-battery-result.service.js#submit()
// the moment any battery's row flips to status='completed'. Also exposed as
// regenerateAiReport for auto-backfill on legacy rows + manual "Generate Ulang".

import crypto from 'crypto';
import OpenAI from 'openai';
import AssessmentBatteryResult from '../assessment-battery-result/assessment-battery-result.model.js';
import companyUsageService from '../../company-usage/company-usage.service.js';
import logger from '../../../shared/utils/logger.js';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const MODEL = 'gpt-4o-mini';

// ── Status resolver (pure helper) ─────────────────────────────────────────────

// Derives the effective AI-report status without mutating the DB.
// Existing pre-feature rows have ai_report_status IS NULL but status='completed' —
// we treat those as 'not_generated' so the frontend can auto-trigger backfill on
// first open. In-progress assessments return null (nothing to render yet).
export function resolveAiReportStatus(row) {
  if (!row) return null;
  if (row.ai_report_status) return row.ai_report_status;
  if (row.status === 'completed') return 'not_generated';
  return null;
}

export function withResolvedAiStatus(rowOrRows) {
  if (!rowOrRows) return rowOrRows;
  if (Array.isArray(rowOrRows)) return rowOrRows.map(withResolvedAiStatus);
  return { ...rowOrRows, ai_report_status: resolveAiReportStatus(rowOrRows) };
}

// ── Shared band logic ─────────────────────────────────────────────────────────

const PILLAR_THRESHOLDS = { cognitive: 70, personality: 65, work_attitude: 70, overall: 70 };

function bandForPct(pct) {
  if (pct == null || !Number.isFinite(pct)) return 'unknown';
  if (pct >= 85) return 'exceptional';
  if (pct >= 70) return 'strong';
  if (pct >= 60) return 'competent';
  return 'developing';
}

function bandForS10(s10) {
  if (s10 == null || !Number.isFinite(s10)) return 'unknown';
  return bandForPct(s10 * 10);
}

// ── Vocab maps (copied from assessment-ai.service.js so the on-demand path is
//    not coupled to the pre-gen path — both can evolve independently) ──

const BIGFIVE_NAMES = {
  E: 'Ekstraversion',
  A: 'Agreeableness',
  C: 'Conscientiousness',
  N: 'Neuroticism',
  O: 'Openness',
};

const DISC_NAMES = {
  D: 'Dominance',
  I: 'Influence',
  S: 'Steadiness',
  C: 'Conscientiousness/Compliance',
};

const HOLLAND_NAMES = {
  R: 'Realistik',
  I: 'Investigatif',
  A: 'Artistik',
  S: 'Sosial',
  E: 'Enterprising',
  C: 'Conventional',
};

const EPPS_NAMES = {
  ach:  'Achievement',
  def:  'Deference',
  ord:  'Order',
  exh:  'Exhibition',
  aut:  'Autonomy',
  aff:  'Affiliation',
  int:  'Intraception',
  suc:  'Succorance',
  dom:  'Dominance',
  aba:  'Abasement',
  nur:  'Nurturance',
  chg:  'Change',
  end:  'Endurance',
  hetf: 'Heterosexuality',
  agg:  'Aggression',
};

const PAPI_NAMES = {
  L: 'Leadership Role',
  P: 'Need to Control Others',
  I: 'Ease in Decision Making',
  T: 'Pace',
  V: 'Vigorous Type',
  S: 'Social Extension',
  R: 'Theoretical Type',
  D: 'Detail Interest',
  C: 'Organized Type',
  E: 'Emotional Resistance',
  N: 'Need to Finish Tasks',
  G: 'Hard Intense Work',
  A: 'Need for Achievement',
  Z: 'Need for Change',
  K: 'Need to be Forceful',
  F: 'Need to Support Authority',
  W: 'Need for Rules & Supervision',
  O: 'Need to be Noticed',
  B: 'Need to Belong to Groups',
  X: 'Need to be Noticed (alt)',
};

const SJT_COMP_NAMES = {
  KK:  'Pengambilan Keputusan',
  KOM: 'Komunikasi & Pengaruh',
  MK:  'Manajemen Konflik',
  OH:  'Orientasi Hasil',
  AD:  'Adaptabilitas & Resiliensi',
  IE:  'Integritas & Etika',
};

const SJT_PROFILE_NAMES = {
  BJ: 'Profil Efektivitas Tinggi',
  EK: 'Profil Eksekutor (KK/OH dominan)',
  KL: 'Profil Komunikator (KOM/MK dominan)',
  AE: 'Profil Adaptor',
  BK: 'Profil Butuh Pengembangan',
};

const PF_NAMES = {
  A:  'Warmth',
  B:  'Reasoning',
  C:  'Emotional Stability',
  E:  'Dominance',
  F:  'Liveliness',
  G:  'Rule-Consciousness',
  H:  'Social Boldness',
  I:  'Sensitivity',
  L:  'Vigilance',
  M:  'Abstractedness',
  N:  'Privateness',
  O:  'Apprehension',
  Q1: 'Openness to Change',
  Q2: 'Self-Reliance',
  Q3: 'Perfectionism',
  Q4: 'Tension',
};

const MSDT_NAMES = {
  Ds: 'Deserter',
  Mi: 'Missionary',
  Au: 'Autocrat',
  Co: 'Compromiser',
  Bu: 'Bureaucrat',
  Dv: 'Developer',
  Ba: 'Benevolent Autocrat',
  E:  'Executive',
};

const TK_SUB_NAMES = {
  GI: 'Kemampuan Umum (GI)',
  PV: 'Pemahaman Verbal (PV)',
  KN: 'Kemampuan Numerik (KN)',
  PA: 'Penalaran Analitis (PA)',
  KA: 'Kecepatan & Akurasi (KA)',
};

// ── Battery A extractors (unchanged from original Battery A pipeline) ────────

function extractCognitiveA(tk, points, anchors) {
  if (!tk) return null;
  const sub = tk.sub || {};
  const composite = Number(tk.composite ?? 0);

  function detailFor(code) {
    const s = sub[code];
    if (!s) return null;
    const pct = s.pct != null ? Number(s.pct)
              : (s.score10 != null ? Number(s.score10) * 10
              : (s.raw != null && s.max ? Math.round((s.raw / s.max) * 100) : null));
    const band = bandForPct(pct);
    return { code, pct, band, raw: s.raw ?? s.points ?? null, max: s.max ?? null };
  }

  const gi = detailFor('GI');
  const ka = detailFor('KA');
  const composite_band = bandForS10(composite);

  if (gi?.pct != null) {
    const label = labelForBand(gi.band);
    points.push(`Kemampuan umum (GI) ${label} pada ${gi.pct}%${gi.raw != null && gi.max ? ` (${gi.raw}/${gi.max})` : ''}`);
    anchors.add(`${gi.pct}%`);
  }
  if (ka?.pct != null) {
    const label = labelForBand(ka.band);
    points.push(`Kecepatan & akurasi klerikal (KA) ${label} pada ${ka.pct}%${ka.raw != null && ka.max ? ` (${ka.raw}/${ka.max})` : ''}`);
    anchors.add(`${ka.pct}%`);
  }
  if (Number.isFinite(composite)) {
    points.push(`Komposit kognitif TK ${composite.toFixed(1)}/10 (band ${composite_band})`);
    anchors.add(`${composite.toFixed(1)}/10`);
  }

  return { composite, composite_band, gi, ka };
}

function extractBigFive(bf, points, anchors) {
  if (!bf?.pct) return null;
  const pct = bf.pct;
  const traits = ['E', 'A', 'C', 'N', 'O'];
  const band_per_trait = {};
  const high = [], low = [], mid = [];
  for (const t of traits) {
    const v = Number(pct[t] ?? 0);
    const band = v >= 65 ? 'high' : v >= 35 ? 'mid' : 'low';
    band_per_trait[t] = band;
    if (band === 'high') high.push(t);
    else if (band === 'low') low.push(t);
    else mid.push(t);
    if (pct[t] != null) anchors.add(`${pct[t]}/100`);
  }

  const risks = [];
  if (band_per_trait.C === 'low')  risks.push('Conscientiousness rendah - risiko disiplin & ketuntasan tugas');
  if (band_per_trait.N === 'high') risks.push('Neuroticism tinggi - risiko stabilitas emosi di bawah tekanan');
  if (band_per_trait.A === 'low')  risks.push('Agreeableness rendah - risiko kerja sama tim');
  if (band_per_trait.E === 'low')  risks.push('Ekstraversion rendah - preferensi kerja independen');

  for (const t of high) {
    points.push(`${BIGFIVE_NAMES[t]} tinggi (${pct[t]}/100)`);
    anchors.add(BIGFIVE_NAMES[t]);
  }
  for (const t of low) {
    points.push(`${BIGFIVE_NAMES[t]} rendah (${pct[t]}/100)`);
    anchors.add(BIGFIVE_NAMES[t]);
  }

  return { scores_0_100: pct, band_per_trait, high_traits: high, low_traits: low, mid_traits: mid, risk_flags: risks };
}

function extractDISC(disc, points, anchors) {
  if (!disc) return null;
  const line3 = disc.scores?.line3 || { D: 0, I: 0, S: 0, C: 0 };
  const ranked = Object.entries(line3).sort((a, b) => b[1] - a[1]);
  const dominant  = disc.dominant  || ranked[0]?.[0] || null;
  const secondary = ranked[1]?.[0] || null;
  const adaptive  = disc.adaptive  || null;
  const natural   = disc.natural   || null;

  let fit_band = 'mid';
  if (dominant === 'S') fit_band = 'high';
  else if (dominant === 'C') fit_band = 'good';
  else if (dominant === 'D' || dominant === 'I') fit_band = 'low';

  if (dominant)  {
    points.push(`DISC dominan ${dominant} - ${DISC_NAMES[dominant] || dominant}`);
    anchors.add(DISC_NAMES[dominant] || dominant);
  }
  if (secondary && secondary !== dominant) {
    points.push(`DISC sekunder ${secondary} - ${DISC_NAMES[secondary] || secondary}`);
    anchors.add(DISC_NAMES[secondary] || secondary);
  }
  if (adaptive && natural && adaptive !== natural) {
    points.push(`Profil adaptif (${adaptive}) berbeda dari profil alami (${natural}) - sedang menyesuaikan diri`);
  }

  return { dominant, secondary, adaptive, natural, line3, fit_band };
}

function extractHolland(hol, points, anchors) {
  if (!hol) return null;
  const scores = hol.scores || { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const code3 = hol.code3 || ranked.slice(0, 3).map(([k]) => k).join('');
  const high_categories = ranked.slice(0, 3).map(([k]) => k);
  const low_categories  = ranked.slice(-2).map(([k]) => k);

  let fit_band = 'mid';
  if (code3.includes('C') || code3.includes('S')) fit_band = 'high';
  else if (code3.includes('R')) fit_band = 'good';
  else fit_band = 'low';

  points.push(`Holland code ${code3} - minat dominan ${high_categories.map((k) => HOLLAND_NAMES[k]).join(', ')}`);
  anchors.add(code3);
  for (const k of high_categories) anchors.add(HOLLAND_NAMES[k]);
  if (hol.consistency) {
    points.push(`Konsistensi minat: ${hol.consistency}`);
    anchors.add(hol.consistency);
  }

  return { code3, high_categories, low_categories, fit_band, consistency: hol.consistency || null };
}

// ── Battery B/C/D extractors (new) ───────────────────────────────────────────

function labelForBand(band) {
  return band === 'developing' ? 'lemah'
       : band === 'competent'  ? 'memadai'
       : band === 'strong'     ? 'kuat'
       : band === 'exceptional' ? 'sangat kuat'
       : '—';
}

// TK for B/C (5 subs) and D (4 subs). Subs present in `tk.sub` vary; iterate
// whatever the frontend submitted.
function extractCognitiveBCD(tk, points, anchors) {
  if (!tk) return null;
  const sub = tk.sub || {};
  const composite = Number(tk.composite ?? 0);
  const composite_band = bandForS10(composite);

  const subDetails = {};
  for (const code of Object.keys(sub)) {
    const s = sub[code];
    if (!s) continue;
    const pct = s.pct != null ? Number(s.pct)
              : (s.score10 != null ? Number(s.score10) * 10
              : (s.raw != null && s.max ? Math.round((s.raw / s.max) * 100) : null));
    if (pct == null) continue;
    const band = bandForPct(pct);
    subDetails[code] = { code, pct, band, raw: s.raw ?? s.points ?? null, max: s.max ?? null };
    const label = labelForBand(band);
    const name  = TK_SUB_NAMES[code] || code;
    points.push(`${name} ${label} pada ${pct}%`);
    anchors.add(`${pct}%`);
  }

  if (Number.isFinite(composite)) {
    points.push(`Komposit kognitif TK ${composite.toFixed(1)}/10 (band ${composite_band})`);
    anchors.add(`${composite.toFixed(1)}/10`);
  }

  return { composite, composite_band, subs: subDetails };
}

// EPPS — 15 scales (raw 0-N each), plus conScore (consistency 0-15).
// Top-3 and bottom-3 are the most informative anchors.
function extractEPPS(epps, points, anchors) {
  if (!epps?.scores) return null;
  const scores = epps.scores;
  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const top3 = ranked.slice(0, 3);
  const bottom3 = ranked.slice(-3).reverse();

  for (const [code, val] of top3) {
    const name = EPPS_NAMES[code] || code;
    points.push(`EPPS top: ${name} (${val})`);
    anchors.add(name);
  }
  for (const [code, val] of bottom3) {
    const name = EPPS_NAMES[code] || code;
    points.push(`EPPS bawah: ${name} (${val})`);
    anchors.add(name);
  }

  const conScore = Number(epps.conScore ?? 0);
  const conPct = Math.min(100, Math.max(0, Math.round(70 + (conScore / 15 - 0.5) * 40)));
  points.push(`Skor konsistensi EPPS ${conScore}/15`);
  anchors.add(`${conScore}/15`);

  return {
    scores,
    top3: top3.map(([k, v]) => ({ code: k, name: EPPS_NAMES[k] || k, raw: v })),
    bottom3: bottom3.map(([k, v]) => ({ code: k, name: EPPS_NAMES[k] || k, raw: v })),
    conScore,
    conPct,
  };
}

// PAPI / PAPI-L — 20 dims (0-10 each, 10 Roles + 10 Needs).
// High (≥7) and low (≤3) are the most actionable anchors. Leadership cluster
// (L, I, K, F) is called out separately because the pillar formulas reference it.
function extractPAPI(papi, points, anchors) {
  if (!papi?.scores) return null;
  const scores = papi.scores;
  const high = [];
  const low  = [];
  for (const [code, val] of Object.entries(scores)) {
    const v = Number(val ?? 0);
    if (v >= 7) high.push({ code, name: PAPI_NAMES[code] || code, score: v });
    else if (v <= 3) low.push({ code, name: PAPI_NAMES[code] || code, score: v });
  }
  for (const h of high) {
    points.push(`PAPI tinggi: ${h.name} (${h.score}/10)`);
    anchors.add(h.name);
  }
  for (const l of low) {
    points.push(`PAPI rendah: ${l.name} (${l.score}/10)`);
    anchors.add(l.name);
  }

  // Leadership cluster snapshot — useful for managerial/exec batteries.
  const leadership = {
    L: scores.L ?? 0,
    I: scores.I ?? 0,
    K: scores.K ?? 0,
    F: scores.F ?? 0,
  };
  if (leadership.L >= 5 && leadership.I >= 5) {
    points.push(`Klaster kepemimpinan PAPI kuat (L=${leadership.L}/10, I=${leadership.I}/10)`);
    anchors.add('Leadership Role');
    anchors.add('Ease in Decision Making');
  }

  const roleTotal = Number(papi.roleTotal ?? 0);
  const needTotal = Number(papi.needTotal ?? 0);

  return { scores, high_dims: high, low_dims: low, leadership, roleTotal, needTotal };
}

// SJT — 6 competencies (compPct 0-100 each), overallPct, score10, verdict, profile.
function extractSJT(sjt, points, anchors) {
  if (!sjt) return null;
  const compPct = sjt.compPct || {};
  const overallPct = Number(sjt.overallPct ?? 0);
  const score10 = Number(sjt.score10 ?? 0);
  const verdict = sjt.verdict || null;
  const profile = sjt.profile || null;

  for (const [code, pct] of Object.entries(compPct)) {
    const name = SJT_COMP_NAMES[code] || code;
    points.push(`SJT ${name}: ${pct}%`);
    anchors.add(`${pct}%`);
  }

  if (profile) {
    const profileName = SJT_PROFILE_NAMES[profile] || profile;
    points.push(`Profil SJT: ${profile} (${profileName})`);
    anchors.add(profile);
  }
  if (verdict) {
    points.push(`SJT verdict: ${verdict} (overall ${overallPct}%)`);
    anchors.add(`${overallPct}%`);
  }

  return { compPct, overallPct, score10, verdict, profile, profile_name: SJT_PROFILE_NAMES[profile] || null };
}

// 16PF — 16 factors sten 1-10. High (≥7) and low (≤4) factors get anchors.
function extractPF(pf, points, anchors) {
  if (!pf?.std) return null;
  const std = pf.std;
  const high = [];
  const low  = [];
  for (const [code, sten] of Object.entries(std)) {
    const v = Number(sten ?? 0);
    const name = PF_NAMES[code] || code;
    if (v >= 7) high.push({ code, name, sten: v });
    else if (v <= 4) low.push({ code, name, sten: v });
  }
  for (const h of high) {
    points.push(`16PF tinggi: ${h.code} ${h.name} (sten ${h.sten})`);
    anchors.add(h.name);
  }
  for (const l of low) {
    points.push(`16PF rendah: ${l.code} ${l.name} (sten ${l.sten})`);
    anchors.add(l.name);
  }

  // Executive cluster (high C/Q3/E/H + low Q4/O) — key for senior roles.
  const exec = {
    C:  std.C  ?? 0,
    Q3: std.Q3 ?? 0,
    E:  std.E  ?? 0,
    H:  std.H  ?? 0,
    Q4: std.Q4 ?? 0,
    O:  std.O  ?? 0,
  };
  const execStrong = exec.C >= 7 && exec.Q3 >= 7 && exec.Q4 <= 4 && exec.O <= 4;
  if (execStrong) {
    points.push(`Klaster eksekutif 16PF kuat (C=${exec.C}, Q3=${exec.Q3}, Q4=${exec.Q4}, O=${exec.O})`);
  }

  return { std, high_factors: high, low_factors: low, executive_cluster_strong: execStrong };
}

// MSDT — leadership styles. dominant style + TO/RO/E percentages.
function extractMSDT(msdt, points, anchors) {
  if (!msdt) return null;
  const dominant = msdt.dominant || null;
  const TO = Number(msdt.TO ?? 0);
  const RO = Number(msdt.RO ?? 0);
  const E  = Number(msdt.E  ?? 0);
  const effectPct = Number(msdt.effectPct ?? Math.round((TO + RO) / 2));
  const verdict = msdt.verdict || null;

  if (dominant) {
    const name = MSDT_NAMES[dominant] || dominant;
    points.push(`Gaya MSDT dominan: ${dominant} - ${name}`);
    anchors.add(name);
    anchors.add(dominant);
  }
  points.push(`Task-Orientation ${TO}%, Relationship-Orientation ${RO}%, Effectiveness ${E}%`);
  anchors.add(`${TO}%`);
  anchors.add(`${RO}%`);
  anchors.add(`${E}%`);
  if (effectPct) {
    points.push(`MSDT effectiveness ${effectPct}%`);
    anchors.add(`${effectPct}%`);
  }
  if (verdict) {
    points.push(`MSDT verdict: ${verdict}`);
  }

  return { dominant, dominant_name: MSDT_NAMES[dominant] || null, TO, RO, E, effectPct, verdict };
}

// ── Pillar helper (shared across batteries) ──────────────────────────────────

function extractPillars(summary) {
  const p = summary?.pillars || {};
  return {
    cognitive:     p.cognitive     ?? null,
    personality:   p.personality   ?? null,
    work_attitude: p.work_attitude ?? null,
    overall:       p.overall       ?? null,
    bands: {
      cognitive:     bandForPct(p.cognitive),
      personality:   bandForPct(p.personality),
      work_attitude: bandForPct(p.work_attitude),
      overall:       bandForPct(p.overall),
    },
    thresholds: summary?.pillar_thresholds || PILLAR_THRESHOLDS,
  };
}

// ── Per-battery section dispatch ─────────────────────────────────────────────
//
// Section name (used in ai_section_narratives + frontend assessor-state) and
// subtest key (the actual key inside results.by_subtest) may differ — e.g.
// Battery B section 'hol' reads by_subtest.holland. Per-battery extractor
// also may differ — e.g. Battery A's TK has 2 subs, B/C/D's TK has 4-5.

const SECTION_DISPATCH = {
  // Battery A — operational/staff
  'A:tk':      { subtestKey: 'tk',      extractor: extractCognitiveA },
  'A:bigfive': { subtestKey: 'bigfive', extractor: extractBigFive },
  'A:disc':    { subtestKey: 'disc',    extractor: extractDISC },
  'A:holland': { subtestKey: 'holland', extractor: extractHolland },

  // Battery B — professional/IC
  'B:tk':      { subtestKey: 'tk',      extractor: extractCognitiveBCD },
  'B:epps':    { subtestKey: 'epps',    extractor: extractEPPS },
  'B:hol':     { subtestKey: 'holland', extractor: extractHolland },
  'B:papi':    { subtestKey: 'papi',    extractor: extractPAPI },

  // Battery C — supervisor/manager
  'C:tk':      { subtestKey: 'tk',      extractor: extractCognitiveBCD },
  'C:epps':    { subtestKey: 'epps',    extractor: extractEPPS },
  'C:papi':    { subtestKey: 'papi',    extractor: extractPAPI },
  'C:sjt':     { subtestKey: 'sjt',     extractor: extractSJT },

  // Battery D — senior/executive
  'D:tk':      { subtestKey: 'tk',      extractor: extractCognitiveBCD },
  'D:sjt':     { subtestKey: 'sjt',     extractor: extractSJT },
  'D:pf':      { subtestKey: 'pf',      extractor: extractPF },
  'D:msdt':    { subtestKey: 'msdt',    extractor: extractMSDT },
  'D:papil':   { subtestKey: 'papil',   extractor: extractPAPI },
};

// ── Benchmark / rubric prompts (constant per battery) ────────────────────────
//
// Locks vocabulary (band names, glossaries), defines what each band means in
// workplace terms, and enforces the citation rule. Keeping these constant
// across candidates is half of the consistency story; the other half is the
// deterministic evidence bundle.

const BENCHMARK_HEADER = `## Band level (selalu pakai kosakata ini, jangan kata kasar seperti "buruk")
- developing  (<60)    : perlu pengembangan signifikan, belum siap untuk peran target
- competent   (60-69)  : memadai untuk peran rutin terstruktur, masih ada celah
- strong      (70-84)  : siap untuk peran target, kekuatan jelas terlihat
- exceptional (>=85)   : potensial untuk peran lebih kompleks, jauh di atas rata-rata`;

const BENCHMARK_RULES = `## ATURAN PENULISAN (WAJIB)

1. Citation rule - setiap paragraf WAJIB memuat minimal SATU substring verbatim dari
   "evidence_points" atau "citation_anchors" yang diberikan untuk kandidat ini. Salin persis.
2. Bahasa Indonesia baku, formal-profesional, ringkas. Hindari jargon teknis tanpa padanan.
3. Sebut implikasi praktis bagi peran kerja, bukan label kasar tentang orangnya.
4. Audiens: rekruter HR (bukan psikolog). Jika pakai istilah teknis (mis. "neurotisisme"),
   beri padanan singkat dalam tanda kurung.
5. JANGAN sebut nama kandidat. Pakai "kandidat" atau "subjek".
6. JANGAN tulis disclaimer, pengantar, atau penutup di luar isi paragraf.`;

const BATTERY_A_BENCHMARK = `# BENCHMARK BATTERY A - Operasional & Staf Umum

${BENCHMARK_HEADER}

## Subtes & maknanya

### TK (kognitif) - GI + KA
GI (Kemampuan Umum)        : kecepatan belajar, penalaran lintas domain (verbal/numerik/logis/spasial).
KA (Kecepatan & Akurasi)   : ketelitian klerikal - penting untuk peran administratif/data entry.
Komposit TK skala 1-10     : >=7 lolos, 5-6 pertimbangkan, <5 tidak lolos.

### Big Five (OCEAN, skor 0-100, ambang: <35 rendah, 35-64 sedang, >=65 tinggi)
- E Ekstraversion     - tinggi: energi sosial, asertif | rendah: reflektif, tenang
- A Agreeableness     - tinggi: kooperatif, empatik    | rendah: kompetitif, skeptis
- C Conscientiousness - tinggi: terorganisir, disiplin | rendah: fleksibel, kurang fokus
- N Neuroticism       - tinggi: reaktif terhadap tekanan (RISIKO untuk peran tekanan tinggi)
                      - rendah: stabil secara emosi
- O Openness          - tinggi: kreatif, eksploratif   | rendah: pragmatis, konvensional

Untuk peran operasional/staf umum: C tinggi + N rendah + A sedang-tinggi = profil ideal.

### DISC
- D Dominance                - tegas, hasil-oriented (kurang ideal untuk peran rutin)
- I Influence                - persuasif, sosial      (kurang ideal untuk peran detail)
- S Steadiness               - sabar, suportif, stabil (IDEAL untuk peran operasional)
- C Conscientiousness/Compliance - analitis, teliti, taat aturan (IDEAL untuk peran administratif)

Bila adaptive != natural: kandidat sedang menyesuaikan diri - sebut sebagai observasi, bukan kelemahan.

### Holland RIASEC
- R Realistik     - praktis, motorik, mesin
- I Investigatif  - analitis, ilmiah
- A Artistik      - kreatif, ekspresif (kurang ideal untuk peran rutin)
- S Sosial        - interpersonal, membantu
- E Enterprising  - persuasif, kepemimpinan, bisnis
- C Conventional  - administratif, sistematis, teliti (IDEAL untuk peran administratif)

Code 3-huruf: dua huruf pertama paling kuat. Konsistensi minat ("Tinggi"/"Sedang"/"Rendah")
menunjukkan stabilitas preferensi karier.

${BENCHMARK_RULES}`;

const BATTERY_B_BENCHMARK = `# BENCHMARK BATTERY B - Profesional & Individual Contributor

${BENCHMARK_HEADER}

## Subtes & maknanya

### TK (kognitif) - GI + PV + KN + PA + KA (5 subtes)
GI Kemampuan Umum         : penalaran lintas-domain.
PV Pemahaman Verbal       : kosa kata, pemahaman bacaan profesional.
KN Kemampuan Numerik      : aritmatika, pemahaman tabel/grafik.
PA Penalaran Analitis     : silogisme, pola, deduksi.
KA Kecepatan & Akurasi    : ketelitian klerikal.
Komposit TK skala 1-10    : >=7 kuat, 5-6 perlu pertimbangan, <5 lemah.

### EPPS (15 skala kebutuhan, skor 0-N per skala; conScore 0-15)
- ach Achievement (pencapaian, ambisi)
- def Deference (kepatuhan, menghormati atasan)
- ord Order (keteraturan, sistematis)
- exh Exhibition (suka menonjol, eksposur)
- aut Autonomy (kemandirian, kebebasan)
- aff Affiliation (persahabatan, kedekatan)
- int Intraception (refleksi, memahami orang)
- suc Succorance (butuh dukungan/perhatian)
- dom Dominance (memimpin, mempengaruhi)
- aba Abasement (rendah hati, menerima kritik)
- nur Nurturance (mengasuh, membantu)
- chg Change (variasi, hal baru)
- end Endurance (ketekunan, fokus)
- hetf Heterosexuality (informatif, jangan dijadikan acuan rekrutmen)
- agg Aggression (asertif, konflik terbuka)

conScore <8 indikasi inkonsistensi - tafsiran kepribadian perlu ekstra hati-hati.
Untuk peran profesional/IC: ach + end + ord tinggi = profil produktif & terstruktur.

### Holland RIASEC
- R Realistik, I Investigatif, A Artistik, S Sosial, E Enterprising, C Conventional
Untuk IC profesional: I (Investigatif) sering jadi penanda fit untuk peran analitis/teknis.

### PAPI (20 dimensi: 10 Roles + 10 Needs, skor 0-10 per dimensi)
Roles (peran): L Leadership, P Need to Control, I Ease in Decisions, T Pace, V Vigorous,
S Social Extension, R Theoretical, D Detail Interest, C Organized, E Emotional Resistance.
Needs (kebutuhan): N Need to Finish, G Hard Work, A Achievement, Z Change, K Forceful,
F Support Authority, W Rules & Supervision, O Noticed, B Belong to Groups, X Noticed (alt).

Untuk peran IC profesional: C + T tinggi (terorganisir + tempo cepat) = produktivitas IC.
W tinggi tanpa A = preferensi rutin, kurang inisiatif - perhatikan untuk peran yang menuntut otonomi.

${BENCHMARK_RULES}`;

const BATTERY_C_BENCHMARK = `# BENCHMARK BATTERY C - Supervisori & Manajerial

${BENCHMARK_HEADER}

## Subtes & maknanya

### TK (kognitif) - GI + PV + KN + PA + KA
Sama dengan Battery B. Untuk peran supervisor/manajer, komposit >=7 ideal.

### EPPS
Sama dengan Battery B. Untuk peran manajerial: dom + ach + ord = profil manajer eksekutor.

### PAPI
Sama dengan Battery B. Untuk peran manajerial:
- L tinggi (Leadership Role) - WAJIB untuk peran formal manajer.
- I tinggi (Ease in Decisions) - mampu memutuskan di bawah tekanan.
- Kombinasi L+I tinggi = kandidat siap memimpin tim.
- K (Forceful) + F (Support Authority) tinggi = pemimpin direktif/loyal (cocok organisasi hierarkis).

### SJT (Situational Judgment Test - 6 kompetensi, skor 0-100% per kompetensi)
- KK  Pengambilan Keputusan
- KOM Komunikasi & Pengaruh
- MK  Manajemen Konflik
- OH  Orientasi Hasil
- AD  Adaptabilitas & Resiliensi
- IE  Integritas & Etika

Profil agregat (berdasar overallPct):
- BJ Profil Efektivitas Tinggi  (>=78%)
- EK Profil Eksekutor           (58-77%, KK/OH dominan)
- KL Profil Komunikator         (58-77%, KOM/MK dominan)
- AE Profil Adaptor             (58-77%, lainnya dominan)
- BK Profil Butuh Pengembangan  (<58%)

Untuk peran first-line manager: cari minimal EK/KL profile + IE tinggi (integritas non-negotiable).

${BENCHMARK_RULES}`;

const BATTERY_D_BENCHMARK = `# BENCHMARK BATTERY D - Senior Manajerial & Executive

${BENCHMARK_HEADER}

## Subtes & maknanya

### TK (kognitif) - GI + PV + KN + PA (4 subtes, tanpa KA)
Senior executives diuji 4 subtes kognitif (KA tidak relevan di level eksekutif).
Komposit >=7 wajib untuk peran VP/C-level.

### SJT (sama 6 kompetensi seperti Battery C)
Untuk peran senior: cari BJ/EK profile. Skor KOM/MK rendah = risiko stakeholder management.

### 16PF (16 faktor kepribadian Cattell, skor sten 1-10)
- A Warmth, B Reasoning, C Emotional Stability, E Dominance, F Liveliness,
- G Rule-Consciousness, H Social Boldness, I Sensitivity, L Vigilance, M Abstractedness,
- N Privateness, O Apprehension, Q1 Openness to Change, Q2 Self-Reliance,
- Q3 Perfectionism, Q4 Tension

**Klaster Eksekutif 16PF (kunci penilaian Battery D):**
Tinggi C + tinggi Q3 + tinggi E + tinggi H + rendah Q4 + rendah O = profil eksekutif efektif
(stabil emosi, perfeksionis, dominan, berani sosial, tidak tegang, tidak khawatir).

### MSDT (Management Style Diagnostic Test - 8 gaya kepemimpinan)
- Ds Deserter (kurang efektif, menarik diri)
- Mi Missionary (orientasi orang, kurang tugas)
- Au Autocrat (orientasi tugas, kurang relasi)
- Co Compromiser (mencoba seimbang, kurang kuat)
- Bu Bureaucrat (efektif via aturan)
- Dv Developer (efektif via pengembangan tim)
- Ba Benevolent Autocrat (efektif via direktif)
- E  Executive (paling efektif - seimbang)

TO = Task-Orientation, RO = Relationship-Orientation, E = Effectiveness (0-100% masing-masing).
Effectiveness >=70% = layak untuk peran senior; <50% = pertimbangkan ulang.

### PAPI-L (sama struktur 10 Role + 10 Need seperti Battery C PAPI)
Untuk eksekutif: L (Leadership) + I (Ease in Decisions) tinggi WAJIB.

## SINTESIS - HANYA 2 BLOK untuk Battery D
Battery D hanya menghasilkan KONSOL (ringkasan terintegrasi) dan STRENGTH (kekuatan utama).
JANGAN tulis blok DEV atau FIT untuk Battery D - tidak diperlukan untuk laporan eksekutif.

${BENCHMARK_RULES}`;

// ── Section labels (used in prompt body for human-readable section names) ────

const SECTION_LABELS = {
  'A:tk':      'Kemampuan Kognitif (TK - GI & KA)',
  'A:bigfive': 'Profil Kepribadian Big Five (OCEAN)',
  'A:disc':    'Gaya Kerja DISC',
  'A:holland': 'Minat Vokasional Holland RIASEC',
  'B:tk':      'Kemampuan Kognitif (TK Battery B - 5 subtes)',
  'B:epps':    'Profil Kepribadian EPPS (15 skala)',
  'B:hol':     'Minat Vokasional Holland RIASEC',
  'B:papi':    'Preferensi & Perilaku Kerja (PAPI)',
  'C:tk':      'Kemampuan Kognitif (TK Battery C - 5 subtes)',
  'C:epps':    'Profil Kepribadian EPPS (15 skala)',
  'C:papi':    'Preferensi & Perilaku Kerja (PAPI)',
  'C:sjt':     'Penilaian Situasional Kepemimpinan (SJT)',
  'D:tk':      'Kemampuan Kognitif (TK Battery D - 4 subtes)',
  'D:sjt':     'Penilaian Situasional Kepemimpinan Senior (SJT)',
  'D:pf':      'Kepribadian Komprehensif 16PF',
  'D:msdt':    'Gaya Kepemimpinan MSDT',
  'D:papil':   'Preferensi Kepemimpinan PAPI-L',
};

// ── Battery config ───────────────────────────────────────────────────────────

const BATTERY_CONFIG = {
  A: { id: 1, name: 'Battery A - Operasional & Staf Umum',         sections: ['tk', 'bigfive', 'disc', 'holland'],  synthesisBlocks: ['konsol', 'strength', 'dev', 'fit'], benchmark: BATTERY_A_BENCHMARK },
  B: { id: 2, name: 'Battery B - Profesional & Individual Contributor', sections: ['tk', 'epps', 'hol', 'papi'],     synthesisBlocks: ['konsol', 'strength', 'dev', 'fit'], benchmark: BATTERY_B_BENCHMARK },
  C: { id: 3, name: 'Battery C - Supervisori & Manajerial',        sections: ['tk', 'epps', 'papi', 'sjt'],          synthesisBlocks: ['konsol', 'strength', 'dev', 'fit'], benchmark: BATTERY_C_BENCHMARK },
  D: { id: 4, name: 'Battery D - Senior Manajerial & Executive',   sections: ['tk', 'sjt', 'pf', 'msdt', 'papil'],   synthesisBlocks: ['konsol', 'strength'],               benchmark: BATTERY_D_BENCHMARK },
};

const BATTERY_BY_ASSESSMENT_ID = { 1: 'A', 2: 'B', 3: 'C', 4: 'D' };

// ── Evidence aggregator ──────────────────────────────────────────────────────

function extractEvidence(battery, row) {
  const cfg = BATTERY_CONFIG[battery];
  if (!cfg) return null;

  const by_subtest = row?.results?.by_subtest || {};
  const summary    = row?.summary || {};
  const evidence_points = [];
  const anchors = new Set();
  const sectionData = {};

  for (const section of cfg.sections) {
    const dispatch = SECTION_DISPATCH[`${battery}:${section}`];
    if (!dispatch) {
      logger.warn(`extractEvidence: no dispatch for ${battery}:${section}`);
      continue;
    }
    const data = by_subtest[dispatch.subtestKey];
    const result = dispatch.extractor(data, evidence_points, anchors);
    if (result != null) sectionData[section] = result;
  }

  const pillars = extractPillars(summary);
  if (pillars.overall       != null) { evidence_points.push(`Pillar overall ${pillars.overall}/100 (band ${pillars.bands.overall})`); anchors.add(`${pillars.overall}/100`); }
  if (pillars.cognitive     != null) { evidence_points.push(`Pillar kognitif ${pillars.cognitive}/100 (band ${pillars.bands.cognitive})`); anchors.add(`${pillars.cognitive}/100`); }
  if (pillars.personality   != null) { evidence_points.push(`Pillar kepribadian ${pillars.personality}/100 (band ${pillars.bands.personality})`); anchors.add(`${pillars.personality}/100`); }
  if (pillars.work_attitude != null) { evidence_points.push(`Pillar sikap kerja ${pillars.work_attitude}/100 (band ${pillars.bands.work_attitude})`); anchors.add(`${pillars.work_attitude}/100`); }

  return {
    battery,
    pillars,
    sections: sectionData,
    evidence_points,
    citation_anchors: Array.from(anchors).filter(Boolean),
  };
}

// ── Prompt builder ───────────────────────────────────────────────────────────

const PERSONA = `Kamu adalah psikolog industri-organisasi senior bersertifikat HIMPSI dengan 15+ tahun pengalaman menafsirkan asesmen psikologis untuk rekrutmen di Indonesia.

Audiens tulisanmu: rekruter HR (bukan psikolog). Hindari jargon teknis; jika harus pakai istilah seperti "neurotisisme" atau "konsistensi DISC", beri padanan singkat dalam tanda kurung.

Gaya: formal-profesional, ringkas, berbasis bukti dari skor, tidak menghakimi. Sebut implikasi praktis bagi peran kerja. Hindari kalimat berbunga-bunga.

Bahasa: Bahasa Indonesia baku. Sebut kandidat sebagai "kandidat" atau "subjek" - JANGAN sebut nama pribadi.`;

function buildPrompt(battery, bundle, profile, { citationReminder = false } = {}) {
  const cfg = BATTERY_CONFIG[battery];

  const profileBits = [];
  if (profile?.position)   profileBits.push(`Posisi yang dilamar: ${profile.position}`);
  if (profile?.department) profileBits.push(`Departemen: ${profile.department}`);
  if (profile?.education)  profileBits.push(`Pendidikan: ${profile.education}`);
  const profileLine = profileBits.length ? profileBits.join('. ') + '.' : 'Konteks peran tidak disebutkan.';

  const sectionsList = cfg.sections
    .map((k) => `- ${k}: ${SECTION_LABELS[`${battery}:${k}`] || k}`)
    .join('\n');

  const synthesisDescriptions = {
    konsol:   'Ringkasan profil terintegrasi lintas bagian',
    strength: '3 kekuatan utama dengan bukti skor singkat',
    dev:      '2-3 area pengembangan atau risiko',
    fit:      `Analisis kesesuaian dengan peran "${profile?.position || 'yang dilamar'}", sebut "Sangat Sesuai/Cukup Sesuai/Kurang Sesuai" + alasan`,
  };
  const synthesisList = cfg.synthesisBlocks
    .map((k) => `- ${k.padEnd(8)} : ${synthesisDescriptions[k] || k}`)
    .join('\n');

  const sectionsJsonShape = cfg.sections.map((k) => `"${k}": "..."`).join(', ');
  const synthesisJsonShape = cfg.synthesisBlocks.map((k) => `"${k}": "..."`).join(', ');
  const totalParagraphs = cfg.sections.length + cfg.synthesisBlocks.length;

  let p = PERSONA + '\n\n' + cfg.benchmark + '\n\n';
  p += `## Konteks kandidat\n${profileLine}\n\n`;
  p += `## Evidence bundle (skor & anchor - DARI SINI ASAL DATA)\n`;
  p += JSON.stringify(bundle, null, 2) + '\n\n';
  p += `## Tugas\nTulis interpretasi untuk SEMUA bagian ${cfg.name} dan sintesis terintegrasi.\n\n`;
  p += `Bagian:\n${sectionsList}\n\n`;
  p += `Sintesis (${cfg.synthesisBlocks.length} blok):\n${synthesisList}\n\n`;
  p += `## Output JSON (WAJIB strict JSON, tanpa markdown di luar string)\n`;
  p += `{\n`;
  p += `  "sections":  { ${sectionsJsonShape} },\n`;
  p += `  "synthesis": { ${synthesisJsonShape} }\n`;
  p += `}\n\n`;
  p += `Tiap nilai = SATU paragraf utuh, 110-170 kata, Bahasa Indonesia baku, tanpa markdown/bullet/heading.\n`;

  if (citationReminder) {
    p += `\n## PENGINGAT KRITIS - VALIDASI GAGAL DI PERCOBAAN PERTAMA\n`;
    p += `Setiap dari ${totalParagraphs} paragraf WAJIB memuat MINIMAL SATU substring VERBATIM (salin persis) dari evidence_points ATAU citation_anchors di atas. `;
    p += `Jika kamu tidak menyalin minimal satu anchor per paragraf, output ditolak. `;
    p += `Pilih anchor yang paling relevan untuk tiap bagian dan salin persis ke dalam paragraf.`;
  } else {
    p += `\nSetiap paragraf WAJIB memuat minimal SATU substring verbatim (salin persis) dari evidence_points atau citation_anchors. Salin, jangan parafrase.`;
  }

  return p;
}

// ── Validation ───────────────────────────────────────────────────────────────

function normalize(s) {
  if (typeof s !== 'string') return '';
  return s
    .replace(/[—–]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function findUncited(text, evidencePoints, citationAnchors) {
  if (typeof text !== 'string' || !text.trim()) return 'paragraph empty';
  const norm = normalize(text);
  for (const ep of evidencePoints) {
    if (typeof ep !== 'string' || !ep.length) continue;
    if (norm.includes(normalize(ep))) return null;
  }
  for (const anchor of citationAnchors || []) {
    if (typeof anchor !== 'string' || !anchor.length) continue;
    if (norm.includes(normalize(anchor))) return null;
  }
  return 'no evidence_point or anchor cited';
}

function validatePayload(payload, evidencePoints, citationAnchors, cfg) {
  if (!payload || typeof payload !== 'object') {
    return { failures: ['payload not an object'], passCount: 0, totalCount: 0 };
  }
  const sections  = payload.sections  || {};
  const synthesis = payload.synthesis || {};
  const failures  = [];
  let passCount   = 0;
  let totalCount  = 0;

  for (const k of cfg.sections) {
    totalCount += 1;
    const reason = findUncited(sections[k], evidencePoints, citationAnchors);
    if (reason) failures.push(`sections.${k}: ${reason}`);
    else passCount += 1;
  }
  for (const k of cfg.synthesisBlocks) {
    totalCount += 1;
    const reason = findUncited(synthesis[k], evidencePoints, citationAnchors);
    if (reason) failures.push(`synthesis.${k}: ${reason}`);
    else passCount += 1;
  }
  return { failures, passCount, totalCount };
}

const MIN_PASS_RATIO = 0.75;

// ── OpenAI call ──────────────────────────────────────────────────────────────

function stableSeed(participantId, battery) {
  const h = crypto.createHash('sha256').update(`${participantId}:${battery}`).digest('hex');
  return parseInt(h.slice(0, 8), 16) % 2147483647;
}

async function callLLM({ battery, bundle, profile, participantId, citationReminder, context }) {
  const prompt = buildPrompt(battery, bundle, profile, { citationReminder });
  const response = await openai.chat.completions.create({
    model: MODEL,
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    temperature: 0.2,
    seed: stableSeed(participantId, battery),
  });

  const operation = `pregen_battery_${battery.toLowerCase()}`;
  companyUsageService
    .log({
      context: context || {},
      model: MODEL,
      operation,
      usage: response.usage,
      request_id: response.id,
      metadata: { battery, position: profile?.position || null, retry: !!citationReminder },
    })
    .catch(() => {});

  const raw = response.choices?.[0]?.message?.content || '{}';
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error('LLM returned non-JSON');
  }
}

// ── Main entry ───────────────────────────────────────────────────────────────

// Returns the updated row, or null on failure. Never throws — failures land as
// ai_report_status='failed' so the frontend can show a "Generate Ulang" button.
export async function generateBatteryReport(battery, resultId, { context } = {}) {
  const tag = `pregen_battery_${battery ? battery.toLowerCase() : '?'}`;

  if (!battery || !BATTERY_CONFIG[battery]) {
    logger.warn(`${tag}: unknown battery '${battery}'`);
    return null;
  }
  if (!resultId) {
    logger.warn(`${tag}: missing resultId`);
    return null;
  }

  const cfg = BATTERY_CONFIG[battery];

  let row;
  try {
    row = await AssessmentBatteryResult.getById(resultId);
  } catch (err) {
    logger.error(`${tag}: load failed for id=${resultId}: ${err.message}`);
    return null;
  }

  if (!row) {
    logger.warn(`${tag}: row not found for id=${resultId}`);
    return null;
  }
  if (row.assessment_id !== cfg.id) {
    logger.warn(`${tag}: row id=${resultId} assessment_id=${row.assessment_id} mismatches battery ${battery} (expected ${cfg.id})`);
    return null;
  }
  if (row.status !== 'completed') {
    logger.warn(`${tag}: row id=${resultId} not completed (status=${row.status})`);
    return null;
  }

  // Canary write — if this fails, the schema is wrong (likely a missing column
  // because setup.sql wasn't re-applied after a code update). Bail BEFORE
  // burning OpenAI tokens.
  try {
    await AssessmentBatteryResult.updateAiReport(resultId, { ai_report_status: 'generating' });
  } catch (err) {
    logger.error(`${tag}: ABORT id=${resultId} - status flip failed (likely schema drift, re-run node src/db/run-script.js): ${err.message}`);
    return null;
  }

  const profile = {
    position:   row.participant_position   || null,
    department: row.participant_department || null,
    education:  row.participant_education  || null,
  };

  const bundle = extractEvidence(battery, row);
  if (!bundle?.evidence_points?.length) {
    logger.warn(`${tag}: empty evidence_points for id=${resultId}`);
    await AssessmentBatteryResult.updateAiReport(resultId, {
      ai_report_status: 'failed',
      ai_evidence_bundle: bundle,
      ai_report_error: 'empty evidence_points (results summary missing scores)',
    }).catch((err) => logger.error(`${tag}: failure persist (empty bundle) errored for id=${resultId}: ${err.message}`));
    return null;
  }

  let payload;
  try {
    payload = await callLLM({
      battery,
      bundle,
      profile,
      participantId: row.participant_id,
      citationReminder: false,
      context,
    });
  } catch (err) {
    logger.warn(`${tag}: first LLM call failed for id=${resultId}: ${err.message}`);
    await AssessmentBatteryResult.updateAiReport(resultId, {
      ai_report_status: 'failed',
      ai_evidence_bundle: bundle,
      ai_report_error: `OpenAI call failed: ${err.message}`.slice(0, 500),
    }).catch((persistErr) => logger.error(`${tag}: failure persist (LLM error) errored for id=${resultId}: ${persistErr.message}`));
    return null;
  }

  let { failures, passCount, totalCount } = validatePayload(
    payload,
    bundle.evidence_points,
    bundle.citation_anchors,
    cfg,
  );
  let passRatio = totalCount ? passCount / totalCount : 0;

  if (passRatio < MIN_PASS_RATIO) {
    logger.info(`${tag}: id=${resultId} retrying — pass ratio ${passCount}/${totalCount}: ${failures.join('; ')}`);
    try {
      payload = await callLLM({
        battery,
        bundle,
        profile,
        participantId: row.participant_id,
        citationReminder: true,
        context,
      });
      const retry = validatePayload(payload, bundle.evidence_points, bundle.citation_anchors, cfg);
      failures   = retry.failures;
      passCount  = retry.passCount;
      totalCount = retry.totalCount;
      passRatio  = totalCount ? passCount / totalCount : 0;
    } catch (err) {
      logger.warn(`${tag}: retry LLM call failed for id=${resultId}: ${err.message}`);
    }
  }

  const accepted = passRatio >= MIN_PASS_RATIO;
  const status   = accepted ? 'completed' : 'failed';

  // Empty string clears a previous error (the model uses COALESCE — null would
  // preserve the stale value).
  const errorMsg = accepted
    ? (failures.length ? `Accepted with warnings (${passCount}/${totalCount}): ${failures.join('; ')}`.slice(0, 500) : '')
    : `Below acceptance threshold (${passCount}/${totalCount}): ${failures.join('; ')}`.slice(0, 500);

  const synthesis = payload.synthesis || {};

  try {
    const persisted = await AssessmentBatteryResult.updateAiReport(resultId, {
      ai_section_narratives: payload.sections || null,
      ai_evidence_bundle: bundle,
      ai_report_status: status,
      ai_report_generated_at: accepted ? new Date() : null,
      ai_report_error: errorMsg,
      narrative_report:  synthesis.konsol   ?? null,
      strengths:         synthesis.strength ?? null,
      // dev + fit only exist for A/B/C (not D). Pass null for batteries that
      // don't produce them — COALESCE in the model preserves prior values, so
      // explicitly null doesn't clobber, but the LLM didn't write them either.
      development_areas: synthesis.dev      ?? null,
      recommended_roles: synthesis.fit      ?? null,
    });
    logger[accepted ? 'info' : 'warn'](
      `${tag}: ${status} id=${resultId} (${passCount}/${totalCount} cited)`,
    );
    return persisted;
  } catch (err) {
    logger.error(`${tag}: persist failed for id=${resultId}: ${err.message}`);
    return null;
  }
}

// Re-export the assessment_id → battery letter map for the submit hook.
export { BATTERY_BY_ASSESSMENT_ID };

export default {
  generateBatteryReport,
  resolveAiReportStatus,
  withResolvedAiStatus,
  BATTERY_BY_ASSESSMENT_ID,
};
