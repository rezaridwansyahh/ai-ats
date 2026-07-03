// Dummy seed for Battery A (assessment_id = 1).
//
// One row per candidate → INSERT INTO core_applicant_assessment (status='completed').
// Battery A subtests: tk (GI + KA cognitive), bigfive, disc, holland.
//
// candidate_id: 2  →  Budi Santoso (applicant_id: 2, UI Engineer, Bandung)
//
// Summary shape mirrors CandidateCard.jsx calc3Pillar output:
//   pillars: { cognitive, personality, work_attitude, overall }
//   pillar_thresholds: { cognitive: 70, personality: 65, work_attitude: 70, overall: 70 }
//   tk_composite, holland_code3

export const BATTERY_A_COMPLETED_AT = '2026-06-10 09:30:00';

export const batteryAResults = [
  {
    candidate_id: 2,   // Budi Santoso
    assessment_id: 1,  // Battery A

    // ── by_subtest ──────────────────────────────────────────────────────
    results: {
      by_subtest: {
        tk: {
          date: '10 Juni 2026',
          tabSwitches: 0,
          subtests: {
            gi: {
              score: 34,
              max: 50,
              percent: 68,
              graded: [], // omitted for brevity — backend will use percent
            },
            ka: {
              score: 29,
              max: 40,
              percent: 72,
              graded: [],
            },
          },
          composite: 70,
        },

        bigfive: {
          date: '10 Juni 2026',
          tabSwitches: 0,
          traits: { E: 52, A: 61, C: 57, N: 45, O: 66 },
          counts: { E: 16, A: 16, C: 12, N: 8, O: 16 },
          avg:    { E: 3.25, A: 3.81, C: 3.56, N: 2.81, O: 4.13 },
        },

        disc: {
          date: '10 Juni 2026',
          tabSwitches: 0,
          most:  { D: 3, I: 9, S: 7, C: 5 },
          least: { D: 4, I: 4, S: 8, C: 8 },
          dominant: 'I',
        },

        holland: {
          date: '10 Juni 2026',
          tabSwitches: 0,
          counts:     { R: 6, I: 9, A: 16, S: 11, E: 13, C: 4 },
          code3:      'AES',
          consistency: 'moderate',
        },
      },
    },

    // ── summary (mirrors calc3Pillar output) ───────────────────────────
    summary: {
      pillars: {
        cognitive:     70,
        personality:   74,
        work_attitude: 68,
        overall:       71,
      },
      pillar_thresholds: {
        cognitive:     70,
        personality:   65,
        work_attitude: 70,
        overall:       70,
      },
      tk_composite:  70,
      holland_code3: 'AES',
    },
  },
];
