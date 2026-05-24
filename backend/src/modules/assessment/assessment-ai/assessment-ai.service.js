import OpenAI from 'openai';
import companyUsageService from '../../company-usage/company-usage.service.js';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const MODEL = 'gpt-4o-mini';

const PERSONA = `Kamu adalah psikolog industri-organisasi senior bersertifikat HIMPSI dengan 15+ tahun pengalaman menafsirkan asesmen psikologis untuk rekrutmen di Indonesia.

Audiens tulisanmu: rekruter HR (bukan psikolog). Hindari jargon teknis; jika harus pakai istilah seperti "neurotisisme" atau "konsistensi DISC", beri padanan singkat dalam tanda kurung.

Gaya: formal-profesional, ringkas, berbasis bukti dari skor, tidak menghakimi. Sebut implikasi praktis bagi peran kerja. Hindari kalimat berbunga-bunga.

Bahasa: Bahasa Indonesia baku. Sebut kandidat sebagai "kandidat" atau "subjek" — JANGAN sebut nama pribadi.`;

// ── Compact psychological glossaries (LLM-anchoring only; rich UI copy lives in frontend) ──

const BIGFIVE_DICT = {
  E: { name: 'Ekstraversion',     highMeans: 'energi sosial tinggi, asertif',     lowMeans: 'reflektif/introvert, tenang' },
  A: { name: 'Agreeableness',     highMeans: 'kooperatif, empatik',               lowMeans: 'kompetitif, skeptis' },
  C: { name: 'Conscientiousness', highMeans: 'terorganisir, disiplin',            lowMeans: 'fleksibel, spontan' },
  N: { name: 'Neuroticism',       highMeans: 'reaktif terhadap tekanan',          lowMeans: 'stabil secara emosi' },
  O: { name: 'Openness',          highMeans: 'kreatif, eksploratif, ingin tahu',  lowMeans: 'pragmatis, konvensional' },
};

const DISC_DICT = {
  D: { name: 'Dominance',   gist: 'tegas, hasil-oriented, suka tantangan' },
  I: { name: 'Influence',   gist: 'persuasif, sosial, optimis' },
  S: { name: 'Steadiness',  gist: 'sabar, suportif, stabil' },
  C: { name: 'Conscientiousness/Compliance', gist: 'analitis, teliti, taat aturan' },
};

const HOLLAND_DICT = {
  R: 'Realistik — praktis, motorik, mesin',
  I: 'Investigatif — analitis, ilmiah, observasional',
  A: 'Artistik — kreatif, ekspresif',
  S: 'Sosial — interpersonal, mengajar/membantu',
  E: 'Enterprising — persuasif, kepemimpinan, bisnis',
  C: 'Conventional — administratif, sistematis, teliti',
};

const EPPS_DICT = {
  ach: 'Achievement (pencapaian, ambisi)',
  def: 'Deference (kepatuhan, menghormati atasan)',
  ord: 'Order (keteraturan, sistematis)',
  exh: 'Exhibition (suka menonjol, eksposur)',
  aut: 'Autonomy (kemandirian, kebebasan)',
  aff: 'Affiliation (persahabatan, kedekatan)',
  int: 'Intraception (refleksi, memahami orang)',
  suc: 'Succorance (butuh dukungan/perhatian)',
  dom: 'Dominance (memimpin, mempengaruhi)',
  aba: 'Abasement (rendah hati, menerima kritik)',
  nur: 'Nurturance (mengasuh, membantu)',
  chg: 'Change (variasi, hal baru)',
  end: 'Endurance (ketekunan, fokus)',
  hetf: 'Heterosexuality (relasi lawan jenis — informatif)',
  agg: 'Aggression (asertif, konflik terbuka)',
};

const PAPI_DICT = {
  // Roles
  L: 'Leadership Role (peran memimpin)',
  P: 'Need to Control Others',
  I: 'Ease in Decision Making',
  T: 'Pace (tempo kerja)',
  V: 'Vigorous Type (energi fisik)',
  S: 'Social Extension (keluasan sosial)',
  R: 'Theoretical Type (pemikir teoretis)',
  D: 'Interest in Working with Details',
  C: 'Organized Type',
  E: 'Emotional Resistance',
  // Needs
  N: 'Need to Finish Tasks',
  G: 'Hard Intense Work',
  A: 'Need for Achievement',
  Z: 'Need for Change',
  K: 'Need to be Forceful',
  F: 'Need to Support Authority',
  W: 'Need for Rules & Supervision',
  O: 'Need to be Noticed (ingin diperhatikan)',
  B: 'Need to Belong to Groups',
  X: 'Need to be Noticed (alternate code)',
};

const SJT_COMPS = {
  KK:  'Pengambilan Keputusan (Decision Making)',
  KOM: 'Komunikasi & Pengaruh',
  MK:  'Manajemen Konflik',
  OH:  'Orientasi Hasil',
  AD:  'Adaptabilitas & Resiliensi',
  IE:  'Integritas & Etika',
};

const PF16_DICT = {
  A:  'Warmth (kehangatan)',
  B:  'Reasoning (penalaran)',
  C:  'Emotional Stability',
  E:  'Dominance',
  F:  'Liveliness (kelincahan)',
  G:  'Rule-Consciousness',
  H:  'Social Boldness',
  I:  'Sensitivity',
  L:  'Vigilance (kewaspadaan)',
  M:  'Abstractedness',
  N:  'Privateness',
  O:  'Apprehension (kekhawatiran)',
  Q1: 'Openness to Change',
  Q2: 'Self-Reliance',
  Q3: 'Perfectionism',
  Q4: 'Tension',
};

const MSDT_DICT = {
  Ds: 'Deserter (kurang efektif, menarik diri)',
  Mi: 'Missionary (orientasi orang, kurang tugas)',
  Au: 'Autocrat (orientasi tugas, kurang relasi)',
  Co: 'Compromiser (mencoba seimbang, kurang kuat)',
  Bu: 'Bureaucrat (efektif via aturan)',
  Dv: 'Developer (efektif via pengembangan tim)',
  Ba: 'Benevolent Autocrat (efektif via direktif)',
  E:  'Executive (paling efektif — seimbang)',
};

const PAPIL_DICT = {
  // Roles (Peran)
  L: 'Leadership', P: 'Need to Control', I: 'Ease in Decisions', T: 'Pace',
  V: 'Vigorous', S: 'Social Extension', R: 'Theoretical', D: 'Detail Interest',
  C: 'Organized', E: 'Emotional Resistance',
  // Needs (Kebutuhan)
  N: 'Need to Finish Tasks', G: 'Hard Intense Work', A: 'Achievement',
  Z: 'Change', K: 'Forceful', F: 'Support Authority', W: 'Rules & Supervision',
  O: 'Noticed', B: 'Belong to Groups', X: 'Need to be Noticed',
};

// ── Section validity per battery ──

export const VALID_SECTIONS = {
  A: ['tk', 'bigfive', 'disc', 'holland'],
  B: ['tk', 'epps', 'hol', 'papi'],
  C: ['tk', 'epps', 'papi', 'sjt'],
  D: ['tk', 'sjt', 'pf', 'msdt', 'papil'],
};

export const SYNTHESIS_TAGS = {
  A: ['KONSOL', 'STRENGTH', 'DEV', 'FIT'],
  B: ['KONSOL', 'STRENGTH', 'DEV', 'FIT'],
  C: ['KONSOL', 'STRENGTH', 'DEV', 'FIT'],
  D: ['KONSOL', 'STRENGTH'],
};

const TAG_TO_NARR_ID = {
  KONSOL:   'narr-konsol',
  STRENGTH: 'narr-strength',
  DEV:      'narr-dev',
  FIT:      'narr-fit',
};
export { TAG_TO_NARR_ID };

// ── Prompt builders ──

function profileLine(profile = {}) {
  const bits = [];
  if (profile.position)   bits.push(`Posisi yang dilamar: ${profile.position}`);
  if (profile.department) bits.push(`Departemen: ${profile.department}`);
  if (profile.education)  bits.push(`Pendidikan: ${profile.education}`);
  return bits.length ? bits.join('. ') + '.' : 'Konteks peran tidak disebutkan.';
}

const SECTION_LABEL = {
  'A:tk': 'Kemampuan Kognitif (TK Battery A — GI & KA)',
  'A:bigfive': 'Profil Kepribadian Big Five (OCEAN)',
  'A:disc': 'Gaya Kerja DISC',
  'A:holland': 'Minat Vokasional Holland RIASEC',
  'B:tk': 'Kemampuan Kognitif (TK Battery B)',
  'B:epps': 'Profil Kepribadian EPPS (15 skala)',
  'B:hol': 'Minat Vokasional Holland RIASEC',
  'B:papi': 'Preferensi & Perilaku Kerja (PAPI)',
  'C:tk': 'Kemampuan Kognitif (TK Battery C)',
  'C:epps': 'Profil Kepribadian EPPS (15 skala)',
  'C:papi': 'Preferensi & Perilaku Kerja (PAPI)',
  'C:sjt': 'Penilaian Situasional Kepemimpinan (SJT)',
  'D:tk': 'Kemampuan Kognitif (TK Battery D — GI/PV/KN/PA)',
  'D:sjt': 'Penilaian Situasional Kepemimpinan Senior (SJT)',
  'D:pf': 'Kepribadian Komprehensif 16PF (16 faktor)',
  'D:msdt': 'Gaya Kepemimpinan MSDT (Task/Relationship/Effectiveness)',
  'D:papil': 'Preferensi Kepemimpinan PAPI-L (10 Role + 10 Need)',
};

function dictionaryFor(battery, section) {
  const key = `${battery}:${section}`;
  switch (key) {
    case 'A:bigfive':                 return BIGFIVE_DICT;
    case 'A:disc':                    return DISC_DICT;
    case 'A:holland':
    case 'B:hol':                     return HOLLAND_DICT;
    case 'B:epps':
    case 'C:epps':                    return EPPS_DICT;
    case 'B:papi':
    case 'C:papi':                    return PAPI_DICT;
    case 'C:sjt':
    case 'D:sjt':                     return SJT_COMPS;
    case 'D:pf':                      return PF16_DICT;
    case 'D:msdt':                    return MSDT_DICT;
    case 'D:papil':                   return PAPIL_DICT;
    default:                          return null; // TK sections need no dictionary
  }
}

function buildSectionPrompt(battery, section, scores, profile) {
  const label = SECTION_LABEL[`${battery}:${section}`] || `${battery}:${section}`;
  const dict = dictionaryFor(battery, section);

  let p = PERSONA + '\n\n';
  p += `## Tugas\n`;
  p += `Tulis interpretasi psikologis untuk bagian: **${label}**.\n`;
  p += `${profileLine(profile)}\n\n`;

  if (dict) {
    p += `## Glosarium dimensi (anchor singkat — JANGAN salin verbatim)\n`;
    p += JSON.stringify(dict) + '\n\n';
  }

  p += `## Skor kandidat (data mentah dari instrumen)\n`;
  p += JSON.stringify(scores) + '\n\n';

  p += `## Aturan output\n`;
  p += `- Tulis SATU paragraf utuh, 120–180 kata, Bahasa Indonesia baku.\n`;
  p += `- JANGAN gunakan markdown, heading, bullet, atau penomoran.\n`;
  p += `- Buka dengan kesimpulan umum (level/profil dominan), lalu detail tinggi-rendah yang relevan, tutup dengan implikasi praktis bagi peran "${profile.position || 'kandidat'}".\n`;
  p += `- Tidak perlu menyebut nama instrumen lagi (sudah konteks).\n`;
  p += `- Tidak perlu disclaimer atau pengantar.`;

  return p;
}

function buildSynthesisPrompt(battery, allScores, sectionInterpretations, profile) {
  const tags = SYNTHESIS_TAGS[battery];
  const isD = battery === 'D';

  let p = PERSONA + '\n\n';
  p += `## Tugas\n`;
  p += `Buat ringkasan terintegrasi seluruh asesmen Battery ${battery} untuk kandidat.\n`;
  p += `${profileLine(profile)}\n\n`;

  p += `## Skor kandidat per bagian (gabungan)\n`;
  p += JSON.stringify(allScores) + '\n\n';

  if (sectionInterpretations && Object.keys(sectionInterpretations).length) {
    p += `## Interpretasi per-bagian yang sudah ditulis asesor (referensi nada & konsistensi)\n`;
    p += JSON.stringify(sectionInterpretations) + '\n\n';
  }

  p += `## Aturan output — WAJIB pakai tag, tanpa teks di luar tag\n`;
  const blocks = isD
    ? `[KONSOL]ringkasan profil terintegrasi[/KONSOL][STRENGTH]kekuatan utama kandidat[/STRENGTH]`
    : `[KONSOL]ringkasan profil terintegrasi[/KONSOL][STRENGTH]kekuatan utama kandidat[/STRENGTH][DEV]area pengembangan & risiko[/DEV][FIT]analisis kesesuaian peran[/FIT]`;
  p += blocks + '\n\n';
  p += `Tiap blok = SATU paragraf, 90–150 kata, Bahasa Indonesia baku, tanpa markdown/bullet.\n`;
  p += `- KONSOL: sintesis lintas-bagian, bukan pengulangan per-bagian.\n`;
  p += `- STRENGTH: 3 kekuatan paling menonjol, dengan bukti skor singkat.\n`;
  if (!isD) {
    p += `- DEV: 2-3 area pengembangan atau risiko yang perlu diwaspadai rekruter.\n`;
    p += `- FIT: kesesuaian dengan peran "${profile.position || 'yang dilamar'}", sebut "Sangat Sesuai/Cukup Sesuai/Kurang Sesuai" beserta alasan singkat.\n`;
  }
  p += `Mulai langsung dengan tag pertama. JANGAN tulis apa pun sebelum [${tags[0]}] atau setelah [/${tags[tags.length - 1]}].`;

  return p;
}

// ── Service ──

class AssessmentAIService {
  async _logUsage({ context, operation, usage, request_id, metadata }) {
    if (!usage) return;
    return companyUsageService.log({
      context: context || {},
      model: MODEL,
      operation,
      usage,
      request_id: request_id || null,
      metadata: metadata || null,
    });
  }

  async *generateSection({ battery, section, scores, profile = {} }, context = {}) {
    const prompt = buildSectionPrompt(battery, section, scores, profile);
    const stream = await openai.chat.completions.create({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      stream: true,
      stream_options: { include_usage: true },
      temperature: 0.6,
    });

    let usage = null;
    let request_id = null;
    for await (const chunk of stream) {
      if (chunk.id && !request_id) request_id = chunk.id;
      if (chunk.usage) usage = chunk.usage;
      const text = chunk.choices?.[0]?.delta?.content;
      if (text) yield text;
    }

    await this._logUsage({
      context,
      operation: `assessment_interp_${battery}_${section}`,
      usage,
      request_id,
      metadata: { battery, section, position: profile?.position || null },
    });
  }

  async *generateSynthesis({ battery, allScores, sectionInterpretations, profile = {} }, context = {}) {
    const prompt = buildSynthesisPrompt(battery, allScores, sectionInterpretations, profile);
    const stream = await openai.chat.completions.create({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      stream: true,
      stream_options: { include_usage: true },
      temperature: 0.6,
    });

    let usage = null;
    let request_id = null;
    for await (const chunk of stream) {
      if (chunk.id && !request_id) request_id = chunk.id;
      if (chunk.usage) usage = chunk.usage;
      const text = chunk.choices?.[0]?.delta?.content;
      if (text) yield text;
    }

    await this._logUsage({
      context,
      operation: `assessment_synthesis_${battery}`,
      usage,
      request_id,
      metadata: { battery, position: profile?.position || null },
    });
  }
}

export default new AssessmentAIService();
