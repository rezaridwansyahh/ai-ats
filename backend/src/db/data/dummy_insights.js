// Dummy seed for the Insights Discovery Assessment (assessment_id = 5).
//
// Two arrays:
//   - insightsParticipants → INSERT INTO participants  (test-taker identity)
//   - insightsResults      → INSERT INTO core_applicant_assessment  (1 row per participant, status='completed')
//
// To make these results show up in the Recruiter Report flow
// (Selection → Report → Candidate Detail → Score & Decide), each participant's email
// matches a seeded master_applicant.email — that's how
// getResultFromCandidate({candidate_id, battery:'I'}) resolves participant → row.
//
// Profile distribution covers all 4 colour quadrants plus S/N variants and one "warn"
// composite, so the recruiter UI shows variety.
//
// Notes on numeric shape (mirrors computeProfile output):
//   E + I = 24,  T + F = 24,  S + N = 24       (24 forced-choice items per scale)
//   Epct = round(E / 24 * 100), Ipct = 100 - Epct, ...
//   RED  = (Epct + Tpct) / 2
//   YEL  = (Epct + Fpct) / 2
//   GRN  = (Ipct + Fpct) / 2
//   BLU  = (Ipct + Tpct) / 2
//   composite = clamp(1..10, round((dominantColorScore - 40) / 25 * 9 + 1))
//   verdictV  = composite>=7 'pass' · 5–6 'warn' · <5 'fail'

const TS = '2026-06-07 10:00:00';

// One row per participant. assessment_id = 5 (Insights, per assessments.js seed).
export const insightsResults = [
  // ── BLU_S Analis · pass ──  (high I, high T, mild S)
  // E=10, I=14, T=16, F=8, S=14, N=10  →  Epct=42, Tpct=67, Spct=58
  // RED=55, YEL=38, GRN=46, BLU=63  →  dominant=BLU(63), composite=9
  {
    candidate_id: 1, assessment_id: 5,
    raw:     { E:10, I:14, T:16, F:8,  S:14, N:10, Epct:42, Ipct:58, Tpct:67, Fpct:33, Spct:58, Npct:42 },
    colors:  { RED:55, YEL:38, GRN:46, BLU:63 },
    profile: { dominantColor:'BLU', variant:'S', profileId:'BLU_S', profile_name:'Analis', composite:9, verdictV:'pass' },
    assessor: {
      notes: {
        obs: 'Profil Analis (Biru-S) konsisten dengan peran Frontend Engineer — sangat teliti, methodical, perhatian pada detail UI.',
        team: 'Tim Engineering saat ini didominasi Hijau (Pendukung) — Ayu akan jadi penyeimbang pada review kode.',
        synergy: 'Sinergi kuat dengan Pendukung dan Pengarah; potensi friksi dengan Penggerak (cepat-iterate-tanpa-spec).',
        followup: 'Onboarding standar. Pasangkan dengan code-review buddy yang lebih spontan untuk seimbangkan perfeksionisme.',
      },
      ratings: { profil: 'sesuai', komunikasi: 'sesuai', kesesuaian: 'sesuai' },
      meta:    { nomer: 'K-2026-001', dept: 'Engineering', tgl: '2026-06-07', asesor: 'Sari Putri, M.Psi', mengetahui: 'Andi Wibowo (HR Lead)' },
    },
  },

  // ── YEL_N Pemotivasi · pass ──  (mild E, mild F, mild N)
  // E=14, I=10, T=10, F=14, S=10, N=14  →  Epct=58, Tpct=42, Spct=42
  // RED=50, YEL=58, GRN=50, BLU=42  →  dominant=YEL(58), composite=7
  {
    candidate_id: 2, assessment_id: 5,
    raw:     { E:14, I:10, T:10, F:14, S:10, N:14, Epct:58, Ipct:42, Tpct:42, Fpct:58, Spct:42, Npct:58 },
    colors:  { RED:50, YEL:58, GRN:50, BLU:42 },
    profile: { dominantColor:'YEL', variant:'N', profileId:'YEL_N', profile_name:'Pemotivasi', composite:7, verdictV:'pass' },
    assessor: {
      notes: {
        obs: 'Profil Pemotivasi (Kuning-N) sangat ekspresif dan kreatif. Cocok dengan kerja UI yang menggabungkan craft + komunikasi.',
        team: 'Tim Engineering perlu energi positif — Budi bisa jadi morale-booster.',
        synergy: 'Sinergi tinggi dengan Penghubung & Pengarah; perlu support struktur dari Analis untuk delivery konsisten.',
        followup: 'Onboarding standar + coaching ringan untuk follow-through dokumentasi.',
      },
      ratings: { profil: 'sesuai', komunikasi: 'sesuai', kesesuaian: 'sesuai' },
      meta:    { nomer: 'K-2026-002', dept: 'Engineering', tgl: '2026-06-07', asesor: 'Sari Putri, M.Psi', mengetahui: 'Andi Wibowo (HR Lead)' },
    },
  },

  // ── BLU_N Ahli Strategi · pass ──  (mild I, mild T, mild N)
  // E=10, I=14, T=16, F=8, S=10, N=14  →  Epct=42, Tpct=67, Spct=42
  // RED=55, YEL=38, GRN=46, BLU=63  →  dominant=BLU(63), composite=9
  {
    candidate_id: 3, assessment_id: 5,
    raw:     { E:10, I:14, T:16, F:8,  S:10, N:14, Epct:42, Ipct:58, Tpct:67, Fpct:33, Spct:42, Npct:58 },
    colors:  { RED:55, YEL:38, GRN:46, BLU:63 },
    profile: { dominantColor:'BLU', variant:'N', profileId:'BLU_N', profile_name:'Ahli Strategi', composite:9, verdictV:'pass' },
    assessor: {
      notes: {
        obs: 'Profil Ahli Strategi (Biru-N) ideal untuk Senior Product Designer — visi sistem, abstraksi tinggi, prefer mendalam.',
        team: 'Tim Design kurang Strategi konseptual — Citra akan mengisi gap perencanaan jangka panjang.',
        synergy: 'Sinergi kuat dengan Analis dan Pemikir Empatik; potensi friksi dengan Pengarah (Citra butuh waktu mendalam).',
        followup: 'Onboarding standar. Pastikan ada ruang untuk deep-work & strategi.',
      },
      ratings: { profil: 'sesuai', komunikasi: 'pertimbangkan', kesesuaian: 'sesuai' },
      meta:    { nomer: 'K-2026-003', dept: 'Design', tgl: '2026-06-07', asesor: 'Sari Putri, M.Psi', mengetahui: 'Andi Wibowo (HR Lead)' },
    },
  },

  // ── GRN_S Pendukung · pass ──  (mild I, mild F, mild S)
  // E=10, I=14, T=8, F=16, S=14, N=10  →  Epct=42, Tpct=33, Spct=58
  // RED=38, YEL=55, GRN=63, BLU=46  →  dominant=GRN(63), composite=9
  {
    candidate_id: 4, assessment_id: 5,
    raw:     { E:10, I:14, T:8,  F:16, S:14, N:10, Epct:42, Ipct:58, Tpct:33, Fpct:67, Spct:58, Npct:42 },
    colors:  { RED:38, YEL:55, GRN:63, BLU:46 },
    profile: { dominantColor:'GRN', variant:'S', profileId:'GRN_S', profile_name:'Pendukung', composite:9, verdictV:'pass' },
    assessor: {
      notes: {
        obs: 'Profil Pendukung (Hijau-S) — dapat diandalkan, sabar, konsisten. Cocok jadi tulang punggung tim Frontend.',
        team: 'Tim Engineering Frontend dominan Biru — Dewi akan jadi penghubung interpersonal.',
        synergy: 'Sinergi kuat dengan Penghubung & Pemotivasi; potensi terbebani jika tim banyak Pengarah agresif.',
        followup: 'Onboarding standar + pastikan ekspektasi delivery jelas (Pendukung sulit berkata tidak).',
      },
      ratings: { profil: 'sesuai', komunikasi: 'sesuai', kesesuaian: 'sesuai' },
      meta:    { nomer: 'K-2026-004', dept: 'Engineering', tgl: '2026-06-07', asesor: 'Sari Putri, M.Psi', mengetahui: 'Andi Wibowo (HR Lead)' },
    },
  },

  // ── RED_S Pengarah · pass ──  (mild E, mild T, mild S)
  // E=14, I=10, T=16, F=8, S=14, N=10  →  Epct=58, Tpct=67, Spct=58
  // RED=63, YEL=46, GRN=38, BLU=55  →  dominant=RED(63), composite=9
  {
    candidate_id: 5, assessment_id: 5,
    raw:     { E:14, I:10, T:16, F:8,  S:14, N:10, Epct:58, Ipct:42, Tpct:67, Fpct:33, Spct:58, Npct:42 },
    colors:  { RED:63, YEL:46, GRN:38, BLU:55 },
    profile: { dominantColor:'RED', variant:'S', profileId:'RED_S', profile_name:'Pengarah', composite:9, verdictV:'pass' },
    assessor: {
      notes: {
        obs: 'Profil Pengarah (Merah-S) — tegas, terstruktur, berorientasi hasil. Cocok jadi technical lead.',
        team: 'Tim Backend butuh decision-maker yang cepat — Gilang akan mempercepat sprint resolution.',
        synergy: 'Sinergi tinggi dengan Analis; potensi friksi dengan Pendukung & Pemikir Empatik (terlalu langsung).',
        followup: 'Onboarding + coaching empati & soft-skill untuk peran lead di masa depan.',
      },
      ratings: { profil: 'sesuai', komunikasi: 'pertimbangkan', kesesuaian: 'sesuai' },
      meta:    { nomer: 'K-2026-005', dept: 'Engineering', tgl: '2026-06-07', asesor: 'Sari Putri, M.Psi', mengetahui: 'Andi Wibowo (HR Lead)' },
    },
  },

  // ── RED_N Penggerak · pass ──  (mild E, mild T, mild N)
  // E=14, I=10, T=14, F=10, S=10, N=14  →  Epct=58, Tpct=58, Spct=42
  // RED=58, YEL=50, GRN=42, BLU=50  →  dominant=RED(58), composite=7
  {
    candidate_id: 6, assessment_id: 5,
    raw:     { E:14, I:10, T:14, F:10, S:10, N:14, Epct:58, Ipct:42, Tpct:58, Fpct:42, Spct:42, Npct:58 },
    colors:  { RED:58, YEL:50, GRN:42, BLU:50 },
    profile: { dominantColor:'RED', variant:'N', profileId:'RED_N', profile_name:'Penggerak', composite:7, verdictV:'pass' },
    assessor: {
      notes: {
        obs: 'Profil Penggerak (Merah-N) — visioner, suka tantangan baru. Tepat untuk peran lintas-stack yang dinamis.',
        team: '',
        synergy: '',
        followup: '',
      },
      ratings: { profil: 'sesuai', komunikasi: 'sesuai', kesesuaian: 'pertimbangkan' },
      meta:    { nomer: 'K-2026-006', dept: 'Engineering', tgl: '2026-06-07', asesor: 'Sari Putri, M.Psi', mengetahui: '' },
    },
  },

  // ── RED_S Pengarah · WARN (PROFIL CAMPURAN) ──  (skor seimbang)
  // E=12, I=12, T=13, F=11, S=12, N=12  →  Epct=50, Tpct=54, Spct=50
  // RED=52, YEL=48, GRN=48, BLU=52  →  dominant=RED(52, tied with BLU; RED wins via insertion order), composite=5
  {
    candidate_id: 7, assessment_id: 5,
    raw:     { E:12, I:12, T:13, F:11, S:12, N:12, Epct:50, Ipct:50, Tpct:54, Fpct:46, Spct:50, Npct:50 },
    colors:  { RED:52, YEL:48, GRN:48, BLU:52 },
    profile: { dominantColor:'RED', variant:'S', profileId:'RED_S', profile_name:'Pengarah', composite:5, verdictV:'warn' },
    assessor: {
      notes: {
        obs: 'Skor sangat seimbang antar warna — profil Campuran (kejelasan 5). Bukan tipe yang tegas pada satu mode.',
        team: '',
        synergy: 'Fleksibel: bisa beradaptasi dengan banyak gaya, tapi belum punya "default" yang kuat.',
        followup: 'Eksplorasi 1-on-1 untuk identifikasi situasi mana Kevin paling natural — bantu dia memilih mode kerja yang sesuai.',
      },
      ratings: { profil: 'pertimbangkan', komunikasi: 'sesuai', kesesuaian: 'pertimbangkan' },
      meta:    { nomer: 'K-2026-007', dept: 'Engineering', tgl: '2026-06-07', asesor: 'Sari Putri, M.Psi', mengetahui: 'Andi Wibowo (HR Lead)' },
    },
  },
];

// Helper used by seed.js to assemble the JSONB columns. Keeping the shape construction
// here (out of seed.js) so it's obvious what's stored — mirrors CandidateCard.submitResults.
export function buildResultsJSON(r) {
  return {
    by_subtest: {
      insights: {
        ...r.raw,
        ...r.colors,
        ...r.profile,
        date: '07 Juni 2026',
        tabSwitches: 0,
      },
    },
  };
}

export function buildSummaryJSON(r) {
  return {
    profile_id:     r.profile.profileId,
    profile_name:   r.profile.profile_name,
    dominant_color: r.profile.dominantColor,
    variant:        r.profile.variant,
    composite:      r.profile.composite,
    verdict:        r.profile.verdictV,
    dimensions:     { Epct: r.raw.Epct, Tpct: r.raw.Tpct, Spct: r.raw.Spct },
    colors:         r.colors,
    assessor:       r.assessor,
  };
}

export const INSIGHTS_COMPLETED_AT = TS;
