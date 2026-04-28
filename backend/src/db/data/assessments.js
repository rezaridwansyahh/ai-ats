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
];
