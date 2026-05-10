import questions from './questions.js';

export default [
  {
    id: 1,
    assessment_code: 'myralix_battery_a',
    name: 'Myralix Battery A - Cognitive + Personality',
    description: 'Tes komprehensif mencakup kemampuan kognitif (GI, KA) dan personality (Big Five, DISC, Holland)',
    duration_minutes: 110,
    options: {
      subtests: ['GI', 'KA', 'BigFive', 'DISC', 'Holland'],
      scoring: {
        GI:      { weight: 0.30,  items: 50, time_limit_seconds: 720 },
        KA:      { weight: 0.175, items: 40, time_limit_seconds: 480 },
        BigFive: { weight: 0.175, items: 44 },
        DISC:    { weight: 0.175, groups: 24 },
        Holland: { weight: 0.175, items: 108 },
      },
      questions,
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
