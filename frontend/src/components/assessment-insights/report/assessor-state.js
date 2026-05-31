// Codec for Insights Discovery HR-annotation state.
//
// Flat ReportView state keys ↔ core_applicant_assessment.summary.assessor JSONB.
// Insights has no synthesis-narrative TEXT (no AI generation yet), so we don't write
// narrative_report / strengths / development_areas / recommended_roles. Annotations live
// entirely under summary.assessor:
//
//   summary.assessor = {
//     notes:   { obs, team, synergy, followup },     // 4 observation textareas
//     ratings: { profil, komunikasi, kesesuaian },   // 3 sesuai/pertimbangkan/tidak chips
//     meta:    { nomer, dept, tgl, asesor, mengetahui }
//   }

const NOTE_KEYS   = ['obs', 'team', 'synergy', 'followup'];
const RATING_KEYS = ['profil', 'komunikasi', 'kesesuaian'];
const META_KEYS   = ['nomer', 'dept', 'tgl', 'asesor', 'mengetahui'];

export function unpackAssessorState(row) {
  if (!row) return {};
  const a = row.summary?.assessor || {};
  const notes   = a.notes   || {};
  const ratings = a.ratings || {};
  const meta    = a.meta    || {};

  const state = {};
  for (const k of NOTE_KEYS)   if (notes[k]   != null) state[`note_${k}`]   = notes[k];
  for (const k of RATING_KEYS) if (ratings[k] != null) state[`rcr_${k}`]    = ratings[k];
  for (const k of META_KEYS)   if (meta[k]    != null) state[`meta_${k}`]   = meta[k];
  return state;
}

// Returns a body shape for PUT /assessment-battery-result/:id/report. The controller
// COALESCEs each top-level field, so omitting TEXT columns leaves them untouched. The
// summary is fully rebuilt (merged with existing) so non-assessor summary fields persist.
export function packAssessorState(state, existingSummary) {
  const notes = {};
  for (const k of NOTE_KEYS)   if (state[`note_${k}`]   !== undefined) notes[k]   = state[`note_${k}`];

  const ratings = {};
  for (const k of RATING_KEYS) if (state[`rcr_${k}`]    !== undefined) ratings[k] = state[`rcr_${k}`];

  const meta = {};
  for (const k of META_KEYS)   if (state[`meta_${k}`]   !== undefined) meta[k]    = state[`meta_${k}`];

  return {
    summary: {
      ...(existingSummary || {}),
      assessor: { notes, ratings, meta },
    },
  };
}
