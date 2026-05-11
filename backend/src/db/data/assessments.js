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
];
