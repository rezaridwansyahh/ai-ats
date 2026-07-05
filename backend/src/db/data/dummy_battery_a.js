// Dummy seed for Battery A (assessment_id = 1).
//
// One row per candidate → INSERT INTO core_applicant_assessment (status='completed').
// Battery A subtests: tk (GI + KA cognitive), bigfive, disc, holland.
//
// candidate_id: 2  →  Budi Santoso (applicant_id: 2, UI Engineer, Bandung)
//
// Data shape matches AssessmentDetailDialog.jsx which reads result.results.by_subtest
// and passes it directly as `results` to ReportView / CandidateReportView:
//
//   tk:       { composite (1-10), sub: { GI: { score10, iq, iqCls, pct, ok, items }, KA: {...} } }
//   bigfive:  { pct: { E,A,C,N,O } (0-100), lvl: { E,A,C,N,O } ('Tinggi'/'Sedang'/'Rendah'), raw, counts }
//   disc:     { dominant, adaptive, natural, scores: { line1, line2, line3 } }
//   holland:  { code3, consistency, comboInfo, scores: { R,I,A,S,E,C }, ranked }
//
// calc3Pillar derivation:
//   cognitive    = round(7 * 10)                        = 70
//   personality  = round(65*0.4 + (100-44)*0.3 + 70*0.3) = 64
//   workAttitude = round(55*0.5 + 55*0.5)              = 55   (dominant=I → 55; AES no C/S/R → 55)
//   overall      = round((70+64+55)/3)                  = 63

export const BATTERY_A_COMPLETED_AT = '2026-06-10 09:30:00';

export const batteryAResults = [
  {
    candidate_id: 2,   // Budi Santoso
    assessment_id: 1,  // Battery A

    // ── by_subtest ──────────────────────────────────────────────────────────
    results: {
      by_subtest: {
        tk: {
          composite: 7,          // 1-10 scale; calc3Pillar does composite × 10 = 70
          sub: {
            GI: {
              // 34/50 correct → rawToPercentile(34,50): r=68% → pct=75 → score10=8
              // IQ_TABLE[34] = 126 → 'Superior'
              score10: 8,
              pct:     75,
              iq:      126,
              iqCls:   { min: 120, label: 'Superior', color: '#0369A1' },
              ok:      34,
              items:   50,
            },
            KA: {
              // 29/40 correct → rawToPercentile(29,40): r=72.5% → pct=75 → score10=8
              score10: 8,
              pct:     75,
              ok:      29,
              items:   40,
            },
          },
          date: '10 Juni 2026',
          tabSwitches: 0,
        },

        bigfive: {
          // scoreBigFive formula: pct = round((raw - items) / (items × 4) × 100)
          // E: raw=52, counts=16 → pct=56 → Sedang
          // A: raw=61, counts=16 → pct=70 → Tinggi
          // C: raw=43, counts=12 → pct=65 → Tinggi
          // N: raw=22, counts=8  → pct=44 → Sedang
          // O: raw=66, counts=16 → pct=78 → Tinggi
          pct:    { E: 56, A: 70, C: 65, N: 44, O: 78 },
          lvl:    { E: 'Sedang', A: 'Tinggi', C: 'Tinggi', N: 'Sedang', O: 'Tinggi' },
          raw:    { E: 52, A: 61, C: 43, N: 22, O: 66 },
          counts: { E: 16, A: 16, C: 12, N: 8,  O: 16 },
          date: '10 Juni 2026',
          tabSwitches: 0,
        },

        disc: {
          // line1 (Adaptive/Most): D=3, I=9, S=7, C=5
          // line2 (Natural/Least): D=4, I=4, S=8, C=8
          // line3 (Differential):  D=-1, I=5, S=-1, C=-3
          // dominant = argmax(line3) = I
          // adaptive = argmax(line1) = I
          // natural  = argmax(line2) = S (S and C tie at 8; S wins by insertion order)
          dominant: 'I',
          adaptive: 'I',
          natural:  'S',
          scores: {
            line1: { D: 3, I: 9, S: 7, C: 5 },
            line2: { D: 4, I: 4, S: 8, C: 8 },
            line3: { D: -1, I: 5, S: -1, C: -3 },
          },
          date: '10 Juni 2026',
          tabSwitches: 0,
        },

        holland: {
          // scores: { R:6, I:9, A:16, S:11, E:13, C:4 }
          // ranked desc: A=16, E=13, S=11, I=9, R=6, C=4
          // code3='AES'; AES has no C/S/R in top 3 → holFit=55
          code3:       'AES',
          consistency: 'Sedang',
          comboInfo:   null,
          scores:  { R: 6, I: 9, A: 16, S: 11, E: 13, C: 4 },
          ranked:  [['A', 16], ['E', 13], ['S', 11], ['I', 9], ['R', 6], ['C', 4]],
          top1:    'A',
          top2:    'E',
          combo2:  'AE',
          date: '10 Juni 2026',
          tabSwitches: 0,
        },
      },
    },

    // ── summary ─────────────────────────────────────────────────────────────
    summary: {
      pillars: {
        cognitive:     70,   // round(7 × 10)
        personality:   64,   // round(65×0.4 + 56×0.3 + 70×0.3)
        work_attitude: 55,   // round(55×0.5 + 55×0.5)
        overall:       63,   // round((70+64+55)/3)
      },
      pillar_thresholds: {
        cognitive:     70,
        personality:   65,
        work_attitude: 70,
        overall:       70,
      },
      tk_composite:  7,
      holland_code3: 'AES',
    },
  },
];
