// Battery catalog — drives the Setup picker and the Take per-subtest table.
// Test keys here MUST match the keys submitted by each CandidateCard
// (components/assessment-{a,b,c,d}/CandidateCard.jsx) and `master_assessment.options.subtests`
// in the backend seed — otherwise per-subtest status lookups against `results.by_subtest`
// JSONB will miss every key.
export const BATTERIES = {
  A: {
    code: 'A',
    label: 'Generalis',
    duration: '~60 min',
    test_count: 4,
    blurb: 'entry-level individual contributors. Cog ≥50, balanced personality.',
    tests: [
      { key: 'tk',      name: 'TK Kognitif',             detail: 'GI (Kemampuan Umum) + KA (Kecepatan & Akurasi) · timed' },
      { key: 'bigfive', name: 'OCEAN (Big Five)',        detail: 'personality trait inventory · 44 items · Likert' },
      { key: 'disc',    name: 'DISC',                    detail: 'behavioural style inventory · 24 groups · self-report' },
      { key: 'holland', name: 'Holland RIASEC',          detail: 'vocational interest · 108 items · informatif' },
    ],
  },
  B: {
    code: 'B',
    label: 'Specialist',
    duration: '~140 min',
    test_count: 4,
    blurb: 'mid-senior individual contributor in technical/specialist roles.',
    tests: [
      { key: 'tk',      name: 'TK Kognitif',             detail: '5 subtes: GI · PV · KN · PA · KA · timed' },
      { key: 'epps',    name: 'EPPS',                    detail: 'profil kepribadian · 15 skala · 225 pasang' },
      { key: 'holland', name: 'Holland RIASEC',          detail: 'minat vokasional · 108 items · informatif' },
      { key: 'papi',    name: 'PAPI Standard',           detail: 'preferensi kerja · 20 dim · 90 pasang' },
    ],
  },
  C: {
    code: 'C',
    label: 'Manajerial',
    duration: '~125 min',
    test_count: 4,
    blurb: 'first-line / mid managers. Adds situational-judgement scenarios.',
    tests: [
      { key: 'tk',   name: 'TK Kognitif',                detail: '5 subtes: GI · PV · KN · PA · KA · timed' },
      { key: 'epps', name: 'EPPS',                       detail: 'profil kepribadian · 15 skala · 225 pasang' },
      { key: 'papi', name: 'PAPI Standard',              detail: 'preferensi kerja · 20 dim · 90 pasang' },
      { key: 'sjt',  name: 'SJT — Leadership',           detail: 'situational judgement · 22 skenario · 6 kompetensi' },
    ],
  },
  D: {
    code: 'D',
    label: 'Senior / Executive',
    duration: '~165 min',
    test_count: 5,
    blurb: 'senior managers and executives. Adds 16PF + MSDT + PAPI-L.',
    tests: [
      { key: 'tk',    name: 'TK Kognitif',               detail: '4 subtes: GI · PV · KN · PA · timed' },
      { key: 'sjt',   name: 'SJT — Senior Leadership',   detail: 'situational judgement · 22 skenario · 6 kompetensi' },
      { key: 'pf',    name: '16PF',                      detail: '16 faktor kepribadian · 105 items' },
      { key: 'msdt',  name: 'MSDT — Gaya Kepemimpinan',  detail: '8 gaya · TO/RO/E · 64 items' },
      { key: 'papil', name: 'PAPI-L Kepemimpinan',       detail: 'preferensi kepemimpinan · 20 dim · 90 pasang' },
    ],
  },
};

export function getInitials(name = '') {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}
