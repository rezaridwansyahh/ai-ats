import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';

import { getIQClass, getIQVerdict, getVerdict, getGrade } from '../../../shared/services/assessment-scoring/cognitive.scoring.js';
import { HOL_TYPES } from '../../../shared/services/assessment-scoring/data/holland.data.js';
import { STYLES as MSDT_STYLES } from '../../../shared/services/assessment-scoring/data/msdt.data.js';
import { ROLE_DIMS as PAPI_ROLE_DIMS, NEED_DIMS as PAPI_NEED_DIMS } from '../../../shared/services/assessment-scoring/papi.scoring.js';
import { FACTOR_ORDER as PF16_FACTOR_ORDER } from '../../../shared/services/assessment-scoring/pf16.scoring.js';
import { SCALE_ORDER as EPPS_SCALE_ORDER } from '../../../shared/services/assessment-scoring/epps.scoring.js';
import { COMPS_MAX_SCORE as SJT_MAX, lvlSJT } from '../../../shared/services/assessment-scoring/sjt.scoring.js';

const require = createRequire(import.meta.url);
const PdfPrinterMod = require('pdfmake');
const PdfPrinter = PdfPrinterMod.default || PdfPrinterMod;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FONTS_DIR = path.join(__dirname, '../../../shared/fonts/roboto');

const fonts = {
  Roboto: {
    normal: path.join(FONTS_DIR, 'Roboto-Regular.ttf'),
    bold: path.join(FONTS_DIR, 'Roboto-Medium.ttf'),
    italics: path.join(FONTS_DIR, 'Roboto-Italic.ttf'),
    bolditalics: path.join(FONTS_DIR, 'Roboto-MediumItalic.ttf'),
  },
};

const BATTERY_BY_ASSESSMENT_ID = { 1: 'A', 2: 'B', 3: 'C', 4: 'D', 5: 'I', 6: 'T' };

const FINAL_REC_LABELS = {
  direkomendasikan: 'Direkomendasikan (Advance)',
  evaluasi: 'Evaluasi Lanjutan (Hold)',
  tidak: 'Tidak Direkomendasikan (Reject)',
};

function fmtDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
}

// ── Label dictionaries not already ported to a backend scoring/data file ──
// (Holland and MSDT already have full data files reused directly above —
// these are the remaining instruments, kept minimal: just what a table
// row/header needs, not the full descriptive text from the web UI.)

const TK_SUB_META = {
  GI: { name: 'Kemampuan Umum', weight: '30%' },
  PV: { name: 'Penalaran Verbal', weight: '17.5%' },
  KN: { name: 'Kemampuan Numerik', weight: '17.5%' },
  PA: { name: 'Penalaran Abstrak', weight: '17.5%' },
  KA: { name: 'Kecepatan & Akurasi', weight: '17.5%' },
};

const BIGFIVE_TRAITS = {
  E: { name: 'Ekstraversion', color: '#0369A1' },
  A: { name: 'Agreeableness', color: '#059669' },
  C: { name: 'Conscientiousness', color: '#0891B2' },
  N: { name: 'Neurotisisme', color: '#DC2626' },
  O: { name: 'Openness', color: '#7C3AED' },
};
const TRAIT_ORDER = ['E', 'A', 'C', 'N', 'O'];

const DISC_PROFILES = {
  D: { name: 'Dominance', color: '#DC2626' },
  I: { name: 'Influence', color: '#D97706' },
  S: { name: 'Steadiness', color: '#16A34A' },
  C: { name: 'Compliance', color: '#2563EB' },
};

const EPPS_SCALES = {
  ach: 'Achievement', def: 'Deference', ord: 'Order', exh: 'Exhibition',
  aut: 'Autonomy', aff: 'Affiliation', int: 'Intraception', suc: 'Succorance',
  dom: 'Dominance', aba: 'Abasement', nur: 'Nurturance', chg: 'Change',
  end: 'Endurance', agg: 'Aggression', het: 'Heterosexuality',
};

const PAPI_LABELS = {
  G: 'Role of Hard Intense Worker', L: 'Leadership Role', I: 'Ease in Decision Making',
  T: 'Pace', V: 'Vigorous Type', S: 'Social Extension', R: 'Theoretical Type',
  D: 'Interest in Working with Details', C: 'Organized Type', E: 'Emotional Restraint',
  N: 'Need to Finish Task', A: 'Need to Achieve', P: 'Need to Control Others',
  X: 'Need to be Noticed', B: 'Need to Belong to Groups', O: 'Need for Closeness and Affection',
  Z: 'Need for Change', K: 'Need to be Forceful', F: 'Need to Support Authority',
  W: 'Need for Rules and Supervision',
};

const SJT_COMPS = {
  KK: { name: 'Kepemimpinan & Pengambilan Keputusan', color: '#6366F1' },
  KOM: { name: 'Komunikasi & Kolaborasi', color: '#0A6E5C' },
  MK: { name: 'Manajemen Konflik', color: '#D97706' },
  OH: { name: 'Orientasi Hasil', color: '#DC2626' },
  AD: { name: 'Adaptabilitas & Problem Solving', color: '#0891B2' },
  IE: { name: 'Integritas & Etika Kerja', color: '#7C3AED' },
};
const SJT_COMP_ORDER = ['KK', 'KOM', 'MK', 'OH', 'AD', 'IE'];

const SJT_PROFILES = {
  BJ: 'Pemimpin Bijaksana', EK: 'Pemimpin Eksekutor', KL: 'Pemimpin Kolaboratif',
  AE: 'Pemimpin Adaptif', BK: 'Pemimpin Berkembang',
};

const PF16_FACTORS = {
  A: { name: 'Kehangatan', low: 'Terpisah, Formal, Dingin', high: 'Hangat, Penuh Perhatian, Murah Hati' },
  B: { name: 'Penalaran', low: 'Penalaran Konkret', high: 'Penalaran Abstrak' },
  C: { name: 'Stabilitas Emosi', low: 'Reaktif, Emosional', high: 'Stabil, Adaptif, Matang' },
  E: { name: 'Dominansi', low: 'Kooperatif, Rendah Hati', high: 'Tegas, Agresif, Kompetitif' },
  F: { name: 'Keceriaan', low: 'Serius, Hati-hati, Pendiam', high: 'Bersemangat, Spontan, Antusias' },
  G: { name: 'Kepatuhan pada Aturan', low: 'Oportunistis, Fleksibel', high: 'Teliti, Rajin, Patuh' },
  H: { name: 'Keberanian Sosial', low: 'Pemalu, Sensitif, Ragu', high: 'Berani, Petualang, Tegas' },
  I: { name: 'Sensitivitas', low: 'Keras Hati, Mandiri', high: 'Sensitif, Estetis, Intuitif' },
  L: { name: 'Kewaspadaan', low: 'Percaya, Tidak Curiga', high: 'Waspada, Curiga, Skeptis' },
  M: { name: 'Abstraksi', low: 'Praktis, Membumi', high: 'Imajinatif, Abstrak, Idealistik' },
  N: { name: 'Privasi', low: 'Langsung, Terbuka, Jujur', high: 'Bijaksana, Diskret, Tertutup' },
  O: { name: 'Kekhawatiran', low: 'Percaya Diri, Tenang', high: 'Cemas, Khawatir, Tidak Aman' },
  Q1: { name: 'Keterbukaan terhadap Perubahan', low: 'Tradisional, Konservatif', high: 'Terbuka, Liberal, Analitis' },
  Q2: { name: 'Kemandirian', low: 'Bergantung Kelompok, Pengikut', high: 'Mandiri, Individualistis' },
  Q3: { name: 'Perfeksionisme', low: 'Fleksibel, Tidak Teratur', high: 'Perfeksionis, Terorganisir, Disiplin' },
  Q4: { name: 'Ketegangan', low: 'Rileks, Tenang, Sabar', high: 'Tegang, Gelisah, Overaktif' },
};

const MSDT_STYLE_ORDER = ['Ds', 'Mi', 'Au', 'Co', 'Bu', 'Dv', 'Ba', 'E'];

// ── pdfmake content helpers ──

// Colored band used as every section's header — the same visual anchor each
// instrument card uses in the web UI (a solid accent strip + numbered title),
// just built from a 1x1 filled table cell instead of CSS.
function sectionHeader(num, title, color) {
  return {
    table: {
      widths: ['*'],
      body: [[{ text: `${num}.  ${title}`, fillColor: color, color: '#FFFFFF', bold: true, fontSize: 11, margin: [8, 5, 8, 5] }]],
    },
    layout: { hLineWidth: () => 0, vLineWidth: () => 0 },
    margin: [0, 10, 0, 6],
  };
}

// A single pass/warn/fail (or any {label,color,bg}-shaped) badge rendered as
// a filled table cell — the PDF equivalent of the web UI's rounded chip.
function chip(vd) {
  if (!vd) return { text: '—' };
  return { text: vd.label, fillColor: vd.bg || '#F4F1E8', color: vd.color || '#1A1A1A', bold: true, fontSize: 8, alignment: 'center', margin: [2, 2, 2, 2] };
}

function dataTable(headers, rows, widths) {
  return {
    table: {
      headerRows: 1,
      widths,
      dontBreakRows: true,
      body: [
        headers.map((h) => ({ text: h, bold: true, fontSize: 8.5, color: '#6E6A5E', fillColor: '#F4F1E8' })),
        ...rows,
      ],
    },
    layout: 'lightHorizontalLines',
    fontSize: 9,
    margin: [0, 0, 0, 10],
  };
}

// Per-subtest narrative text can come from two places: the auto-generated
// `ai_section_narratives` column (background "regenerate full report" flow),
// or `summary.assessor.narratives` (interactive per-section edits/generation
// in the workboard, which never touches `ai_section_narratives` — see
// assessment-battery-result.model.js:updateReport). The workboard itself
// already prefers the assessor's value over the AI one when both exist
// (assessor-state.js:unpackAssessorState) — mirror that precedence here so
// the PDF shows whatever the workboard actually displays, not just whichever
// of the two columns happens to be populated.
function resolveNarratives(result) {
  const merged = { ...(result.ai_section_narratives || {}) };
  const assessorNarratives = result.summary?.assessor?.narratives || {};
  for (const key of Object.keys(assessorNarratives)) {
    const value = assessorNarratives[key];
    if (value != null && value !== '') merged[key] = value;
  }
  return merged;
}

function narrativeParagraph(text) {
  return { text: text?.trim() || 'Interpretasi AI belum tersedia untuk bagian ini.', style: text?.trim() ? 'body' : 'bodyMuted', margin: [0, 2, 0, 14] };
}

function narrativeSection(title, text) {
  return [
    { text: title, style: 'sectionHeader' },
    { text: text?.trim() || 'Belum tersedia.', style: text?.trim() ? 'body' : 'bodyMuted', margin: [0, 0, 0, 12] },
  ];
}

// ── Per-instrument section builders ──
// Each returns a pdfmake content array: [header, scoreTable, narrative].
// `by_subtest` is `result.results.by_subtest`; `narr` is `result.ai_section_narratives`.

function buildTk(num, by_subtest, narr, tkOrder) {
  const tk = by_subtest?.tk;
  if (!tk) return [sectionHeader(num, 'Kemampuan Kognitif (TK)', '#0A6E5C'), { text: 'Data TK tidak tersedia.', style: 'bodyMuted' }];

  const rows = tkOrder.map((code) => {
    const s = tk.sub?.[code];
    const meta = TK_SUB_META[code] || { name: code, weight: '—' };
    if (!s) return [{ text: code, bold: true }, meta.name, '—', '—', '—', chip(null)];
    const vd = code === 'GI' ? getIQVerdict(s.iq) : getVerdict(s.score10);
    const detail = code === 'GI' ? `IQ ≈ ${s.iq} (${s.iqCls?.label || getIQClass(s.iq).label})` : `${s.ok}/${s.items} benar`;
    return [
      { text: code, bold: true },
      meta.name,
      meta.weight,
      `${s.score10}/10`,
      detail,
      chip(vd),
    ];
  });

  if (tk.composite != null) {
    const compVd = getVerdict(Math.round(tk.composite));
    rows.push([
      { text: 'KOMPOSIT', bold: true, colSpan: 3 }, {}, {},
      { text: `${tk.composite}`, bold: true },
      { text: getGrade(Math.round(tk.composite) * 10).l, bold: true },
      chip(compVd),
    ]);
  }

  return [
    sectionHeader(num, 'Kemampuan Kognitif (TK)', '#0A6E5C'),
    dataTable(
      ['Subtes', 'Nama', 'Bobot', 'Skor/10', 'Detail', 'Verdict'],
      rows,
      ['auto', '*', 'auto', 'auto', '*', 'auto'],
    ),
    narrativeParagraph(narr?.tk),
  ];
}

function buildBigFive(num, by_subtest, narr) {
  const d = by_subtest?.bigfive;
  if (!d) return [sectionHeader(num, 'Profil Kepribadian — Big Five (OCEAN)', '#0369A1'), { text: 'Data tidak tersedia.', style: 'bodyMuted' }];
  const rows = TRAIT_ORDER.map((t) => {
    const meta = BIGFIVE_TRAITS[t];
    return [{ text: t, bold: true, color: meta.color }, meta.name, `${d.pct?.[t] ?? '—'}/100`, d.lvl?.[t] || '—'];
  });
  return [
    sectionHeader(num, 'Profil Kepribadian — Big Five (OCEAN)', '#0369A1'),
    dataTable(['Trait', 'Nama', 'Skor', 'Level'], rows, ['auto', '*', 'auto', 'auto']),
    narrativeParagraph(narr?.bigfive),
  ];
}

function buildDisc(num, by_subtest, narr) {
  const d = by_subtest?.disc;
  if (!d) return [sectionHeader(num, 'Gaya Kerja — DISC', '#7C3AED'), { text: 'Data tidak tersedia.', style: 'bodyMuted' }];
  const profile = DISC_PROFILES[d.dominant];
  const rows = [
    ['Gaya Dominan', profile ? `${d.dominant} — ${profile.name}` : d.dominant || '—'],
    ['Adaptive (M)', `${d.adaptive ?? '—'}`],
    ['Natural (L)', `${d.natural ?? '—'}`],
  ];
  return [
    sectionHeader(num, 'Gaya Kerja — DISC', '#7C3AED'),
    dataTable(['Dimensi', 'Nilai'], rows, ['auto', '*']),
    narrativeParagraph(narr?.disc),
  ];
}

function buildHolland(num, by_subtest, narr, narrKey = 'holland') {
  const d = by_subtest?.holland;
  if (!d) return [sectionHeader(num, 'Minat Vokasional — Holland RIASEC', '#4F46E5'), { text: 'Data tidak tersedia.', style: 'bodyMuted' }];
  const rows = Object.entries(d.scores || {})
    .sort((a, b) => b[1] - a[1])
    .map(([c, v]) => {
      const t = HOL_TYPES[c];
      return [{ text: c, bold: true, color: t?.color }, t?.nameID || t?.name || c, `${v}`];
    });
  return [
    sectionHeader(num, 'Minat Vokasional — Holland RIASEC', '#4F46E5'),
    { text: `Kode Dominan: ${d.code3 || '—'}   ·   Konsistensi: ${d.consistency || '—'}`, style: 'body', bold: true, margin: [0, 0, 0, 6] },
    dataTable(['Tipe', 'Nama', 'Skor'], rows, ['auto', '*', 'auto']),
    narrativeParagraph(narr?.[narrKey]),
  ];
}

function buildEpps(num, by_subtest, narr) {
  const d = by_subtest?.epps;
  if (!d) return [sectionHeader(num, 'Profil Kepribadian — EPPS', '#0A6E5C'), { text: 'Data tidak tersedia.', style: 'bodyMuted' }];
  const rows = EPPS_SCALE_ORDER.map((code) => {
    const v = d.scores?.[code] ?? 0;
    const level = v >= 11 ? 'Tinggi' : v >= 6 ? 'Sedang' : 'Rendah';
    return [{ text: code.toUpperCase(), bold: true }, EPPS_SCALES[code] || code, `${v}/15`, level];
  });
  return [
    sectionHeader(num, 'Profil Kepribadian — EPPS', '#0A6E5C'),
    { text: `Konsistensi: ${d.conScore ?? '—'}/15`, style: 'body', bold: true, margin: [0, 0, 0, 6] },
    dataTable(['Skala', 'Nama', 'Skor', 'Level'], rows, ['auto', '*', 'auto', 'auto']),
    narrativeParagraph(narr?.epps),
  ];
}

function buildPapi(num, by_subtest, narr, { title = 'Preferensi & Perilaku Kerja — PAPI', color = '#0891B2', key = 'papi', narrKey = 'papi' } = {}) {
  const d = by_subtest?.[key];
  if (!d) return [sectionHeader(num, title, color), { text: 'Data tidak tersedia.', style: 'bodyMuted' }];
  const roleRows = PAPI_ROLE_DIMS.map((c) => [{ text: c, bold: true }, PAPI_LABELS[c] || c, `${d.scores?.[c] ?? '—'}`]);
  const needRows = PAPI_NEED_DIMS.map((c) => [{ text: c, bold: true }, PAPI_LABELS[c] || c, `${d.scores?.[c] ?? '—'}`]);
  return [
    sectionHeader(num, title, color),
    { text: 'Dimensi Peran (Role)', style: 'subHeader' },
    dataTable(['Kode', 'Nama', 'Skor'], roleRows, ['auto', '*', 'auto']),
    { text: 'Dimensi Kebutuhan (Need)', style: 'subHeader' },
    dataTable(['Kode', 'Nama', 'Skor'], needRows, ['auto', '*', 'auto']),
    narrativeParagraph(narr?.[narrKey]),
  ];
}

function buildSjt(num, by_subtest, narr) {
  const d = by_subtest?.sjt;
  if (!d) return [sectionHeader(num, 'Penilaian Situasional (SJT)', '#6366F1'), { text: 'Data tidak tersedia.', style: 'bodyMuted' }];
  const rows = SJT_COMP_ORDER.map((c) => {
    const meta = SJT_COMPS[c];
    const score = d.compScores?.[c] ?? 0;
    const max = SJT_MAX[c] || meta.maxScore || 0;
    return [{ text: c, bold: true, color: meta.color }, meta.name, `${score}/${max}`, `${d.compPct?.[c] ?? 0}%`];
  });
  return [
    sectionHeader(num, 'Penilaian Situasional (SJT)', '#6366F1'),
    {
      text: `Profil Kepemimpinan: ${d.profile || '—'} — ${SJT_PROFILES[d.profile] || ''}   ·   Total: ${d.totalScore ?? '—'}/66 (${d.overallPct ?? '—'}% — ${lvlSJT(d.overallPct || 0)})`,
      style: 'body', bold: true, margin: [0, 0, 0, 6],
    },
    dataTable(['Kompetensi', 'Nama', 'Skor', 'Persentase'], rows, ['auto', '*', 'auto', 'auto']),
    narrativeParagraph(narr?.sjt),
  ];
}

function buildPf16(num, by_subtest, narr) {
  const d = by_subtest?.pf;
  if (!d) return [sectionHeader(num, 'Kepribadian Komprehensif — 16PF', '#7C3AED'), { text: 'Data tidak tersedia.', style: 'bodyMuted' }];
  const rows = PF16_FACTOR_ORDER.map((c) => {
    const f = PF16_FACTORS[c];
    const std = d.std?.[c] ?? 5;
    const level = std >= 8 ? 'Tinggi' : std >= 4 ? 'Rata-rata' : 'Rendah';
    const descriptor = std >= 6 ? f.high : f.low;
    return [{ text: c, bold: true }, f.name, `${std}`, level, { text: descriptor, fontSize: 7.5 }];
  });
  return [
    sectionHeader(num, 'Kepribadian Komprehensif — 16PF', '#7C3AED'),
    dataTable(['Faktor', 'Nama', 'Sten', 'Level', 'Deskriptor'], rows, ['auto', 70, 'auto', 'auto', '*']),
    narrativeParagraph(narr?.pf),
  ];
}

function buildMsdt(num, by_subtest, narr) {
  const d = by_subtest?.msdt;
  if (!d) return [sectionHeader(num, 'Gaya Kepemimpinan — MSDT', '#DB2777'), { text: 'Data tidak tersedia.', style: 'bodyMuted' }];
  const dominant = MSDT_STYLES[d.dominant];
  const metricRows = [
    ['Task Orientation (TO)', `${d.TO ?? '—'}`],
    ['Relationship Orientation (RO)', `${d.RO ?? '—'}`],
    ['Effectiveness (E)', `${d.E ?? '—'}`],
  ];
  const styleRows = MSDT_STYLE_ORDER.map((c) => {
    const meta = MSDT_STYLES[c];
    return [{ text: c, bold: true, color: meta?.color }, meta?.name || c, `${d.raw?.[c] ?? 0}`];
  });
  return [
    sectionHeader(num, 'Gaya Kepemimpinan — MSDT', '#DB2777'),
    { text: `Gaya Dominan: ${d.dominant || '—'} — ${dominant?.name || ''}${dominant?.tagline ? ` (${dominant.tagline})` : ''}`, style: 'body', bold: true, margin: [0, 0, 0, 6] },
    dataTable(['Metrik', 'Nilai'], metricRows, ['*', 'auto']),
    dataTable(['Gaya', 'Nama', 'Jumlah Terpilih'], styleRows, ['auto', '*', 'auto']),
    narrativeParagraph(narr?.msdt),
  ];
}

// ── Battery dispatch — ordered section list per battery ──

const BATTERY_SECTIONS = {
  A: [
    { key: 'tk', builder: (by_subtest, narr) => buildTk(1, by_subtest, narr, ['GI', 'KA']) },
    { key: 'bigfive', builder: (by_subtest, narr) => buildBigFive(2, by_subtest, narr) },
    { key: 'disc', builder: (by_subtest, narr) => buildDisc(3, by_subtest, narr) },
    { key: 'holland', builder: (by_subtest, narr) => buildHolland(4, by_subtest, narr, 'holland') },
  ],
  B: [
    { key: 'tk', builder: (by_subtest, narr) => buildTk(1, by_subtest, narr, ['GI', 'PV', 'KN', 'PA', 'KA']) },
    { key: 'epps', builder: (by_subtest, narr) => buildEpps(2, by_subtest, narr) },
    { key: 'holland', builder: (by_subtest, narr) => buildHolland(3, by_subtest, narr, 'hol') },
    { key: 'papi', builder: (by_subtest, narr) => buildPapi(4, by_subtest, narr, { title: 'Preferensi & Perilaku Kerja — PAPI', color: '#0891B2', key: 'papi', narrKey: 'papi' }) },
  ],
  C: [
    { key: 'tk', builder: (by_subtest, narr) => buildTk(1, by_subtest, narr, ['GI', 'PV', 'KN', 'PA', 'KA']) },
    { key: 'epps', builder: (by_subtest, narr) => buildEpps(2, by_subtest, narr) },
    { key: 'papi', builder: (by_subtest, narr) => buildPapi(3, by_subtest, narr, { title: 'Preferensi & Perilaku Kerja — PAPI', color: '#0891B2', key: 'papi', narrKey: 'papi' }) },
    { key: 'sjt', builder: (by_subtest, narr) => buildSjt(4, by_subtest, narr) },
  ],
  D: [
    { key: 'tk', builder: (by_subtest, narr) => buildTk(1, by_subtest, narr, ['GI', 'PV', 'KN', 'PA']) },
    { key: 'pf', builder: (by_subtest, narr) => buildPf16(2, by_subtest, narr) },
    { key: 'msdt', builder: (by_subtest, narr) => buildMsdt(3, by_subtest, narr) },
    { key: 'papil', builder: (by_subtest, narr) => buildPapi(4, by_subtest, narr, { title: 'Preferensi Kepemimpinan — PAPI-L', color: '#0891B2', key: 'papil', narrKey: 'papil' }) },
    { key: 'sjt', builder: (by_subtest, narr) => buildSjt(5, by_subtest, narr) },
  ],
};

// Builds a formal PDF report: header/meta/recommendation, then a detailed,
// per-instrument breakdown (score table + that section's own AI-written
// interpretation) matching what the app's "Detail Psikologis untuk HR /
// Psikolog" panel shows on screen, then the integrated synthesis narratives.
export async function buildAssessmentReportPdf(result) {
  const battery = BATTERY_BY_ASSESSMENT_ID[result.assessment_id] || '—';
  const finalRec = result.summary?.assessor?.finalRec;
  const by_subtest = result.results?.by_subtest || {};
  const narr = resolveNarratives(result);
  const sections = BATTERY_SECTIONS[battery] || [];

  const detailContent = sections.flatMap(({ builder }) => builder(by_subtest, narr));

  const docDefinition = {
    pageMargins: [40, 60, 40, 60],
    defaultStyle: { font: 'Roboto', fontSize: 10, lineHeight: 1.3 },
    content: [
      { text: 'LAPORAN HASIL ASESMEN', style: 'title' },
      {
        columns: [
          [
            { text: `Nama: ${result.candidate_name || '—'}`, style: 'meta' },
            { text: `Email: ${result.candidate_email || '—'}`, style: 'meta' },
            { text: `Pendidikan: ${result.candidate_education || '—'}`, style: 'meta' },
          ],
          [
            { text: `Battery: ${battery}`, style: 'meta', alignment: 'right' },
            { text: `Tanggal Asesmen: ${fmtDate(result.assessment_date)}`, style: 'meta', alignment: 'right' },
            { text: `Status: ${result.status || '—'}`, style: 'meta', alignment: 'right' },
          ],
        ],
        margin: [0, 0, 0, 16],
      },
      {
        text: `Rekomendasi: ${FINAL_REC_LABELS[finalRec] || 'Belum ditentukan'}`,
        style: 'recommendation',
        margin: [0, 0, 0, 10],
      },
      { text: 'DETAIL HASIL PER SUBTES', style: 'title', fontSize: 13, margin: [0, 6, 0, 2] },
      { text: 'Skor dan interpretasi AI untuk setiap instrumen psikometri — ditujukan untuk HR/Psikolog.', style: 'bodyMuted', margin: [0, 0, 0, 4] },
      ...detailContent,
      { text: 'RINGKASAN TERINTEGRASI', style: 'title', fontSize: 13, margin: [0, 10, 0, 2] },
      ...narrativeSection('Ringkasan', result.narrative_report),
      ...narrativeSection('Kekuatan', result.strengths),
      ...narrativeSection('Area Pengembangan', result.development_areas),
      ...narrativeSection('Rekomendasi Peran', result.recommended_roles),
    ],
    styles: {
      title: { fontSize: 16, bold: true, margin: [0, 0, 0, 16] },
      meta: { fontSize: 9, color: '#444444' },
      recommendation: { fontSize: 12, bold: true, color: '#0A6E5C' },
      sectionHeader: { fontSize: 11, bold: true, margin: [0, 8, 0, 4] },
      subHeader: { fontSize: 9.5, bold: true, color: '#6E6A5E', margin: [0, 4, 0, 3] },
      body: { fontSize: 10, color: '#1A1A1A' },
      bodyMuted: { fontSize: 10, color: '#9C9684', italics: true },
    },
  };

  const printer = new PdfPrinter(fonts);
  const pdfDoc = printer.createPdfKitDocument(docDefinition);

  return new Promise((resolve, reject) => {
    const chunks = [];
    pdfDoc.on('data', (chunk) => chunks.push(chunk));
    pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
    pdfDoc.on('error', reject);
    pdfDoc.end();
  });
}
