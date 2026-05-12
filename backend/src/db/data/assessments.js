export default [
  {
    id: 1,
    assessment_code: 'myralix_battery_a',
    name: 'Myralix Battery A - Operasional & Staf Umum',
    description: '4 sub-tes: TK Kognitif (GI + KA), Big Five, DISC, Holland — frontend pre-scores dan mengirim results+summary.',
    duration_minutes: 60,
    options: {
      subtests: ['tk', 'bigfive', 'disc', 'holland'],
      scoring: {
        tk:      { weight: 0.40, sub: ['GI', 'KA'] },
        bigfive: { weight: 0.20, traits: 5, items: 44 },
        disc:    { weight: 0.20, groups: 24 },
        holland: { weight: 0.20, items: 108 },
      },
      // No questions bank — frontend owns Battery A questions and scoring (same pattern as Battery B).
    },
    is_active: true,
  },
  {
    id: 2,
    assessment_code: 'myralix_battery_b',
    name: 'Myralix Battery B - Profesional & Individual Contributor',
    description: '4 sub-tes: TK Kognitif (5 subtest), Kepribadian EPPS, Minat Holland, Preferensi Kerja PAPI',
    duration_minutes: 140,
    options: {
      // Stored shape uses lowercase keys; the frontend pre-computes and submits results/summary directly.
      subtests: ['tk', 'epps', 'holland', 'papi'],
      scoring: {
        tk:      { weight: 0.40, sub: ['GI', 'PV', 'KN', 'PA', 'KA'] },
        epps:    { weight: 0.20, scales: 15, items: 225 },
        holland: { weight: 0.20, items: 108 },
        papi:    { weight: 0.20, dims: 20, items: 90 },
      },
      // No questions bank — frontend owns Battery B questions and scoring.
    },
    is_active: true,
  },
  {
    id: 3,
    assessment_code: 'myralix_battery_c',
    name: 'Myralix Battery C - Supervisori & Manajerial',
    description: '4 sub-tes: TK Kognitif, EPPS, PAPI, SJT — frontend pre-scores dan mengirim results+summary.',
    duration_minutes: 125,
    options: {
      // Top-level test keys match the frontend's submitted results.by_subtest.
      subtests: ['tk', 'epps', 'papi', 'sjt'],
      scoring: {
        tk:   { weight: 0.40, sub: ['GI', 'PV', 'KN', 'PA', 'KA'] },
        epps: { weight: 0.20, scales: 15, items: 225 },
        papi: { weight: 0.20, dims: 20, items: 90 },
        sjt:  { weight: 0.20, scenarios: 22, comps: ['KK', 'KOM', 'MK', 'OH', 'AD', 'IE'] },
      },
      // No questions bank — frontend owns Battery C questions and scoring (same pattern as A/B).
    },
    is_active: true,
  },
  {
    id: 4,
    assessment_code: 'myralix_battery_d',
    name: 'Myralix Battery D - Senior Manajerial & Eksekutif',
    description: '5 sub-tes: TK Kognitif (4 subtes), SJT, 16PF, MSDT Gaya Kepemimpinan, PAPI-L Preferensi Kepemimpinan — frontend pre-scores dan mengirim results+summary.',
    duration_minutes: 165,
    options: {
      subtests: ['tk', 'sjt', 'pf', 'msdt', 'papil'],
      scoring: {
        tk:    { weight: 0.30, sub: ['GI', 'PV', 'KN', 'PA'] },
        sjt:   { weight: 0.20, scenarios: 22, comps: ['KK', 'KOM', 'MK', 'OH', 'AD', 'IE'] },
        pf:    { weight: 0.20, factors: 16, items: 105 },
        msdt:  { weight: 0.15, styles: 8, items: 64 },
        papil: { weight: 0.15, dims: 20, items: 90 },
      },
      // No questions bank — frontend owns Battery D questions and scoring (same pattern as A/B/C).
    },
    is_active: true,
  },
];
