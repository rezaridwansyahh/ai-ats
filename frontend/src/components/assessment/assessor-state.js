// Maps the flat ReportView `state` shape (keys like edit_narr-tk, rcr_papi, finalRec, notes_final, …)
// to/from a core_applicant_assessment row.
//
// DB layout used:
//   - 4 free-text columns hold the four "Section V" narratives that have direct slots:
//       narrative_report     ← edit_narr-konsol
//       strengths            ← edit_narr-strength
//       development_areas    ← edit_narr-dev
//       recommended_roles    ← edit_narr-rec
//   - Everything else lives under summary.assessor JSONB:
//       narratives.{tk, epps, hol, papi, fit}
//       ratings.{tk, epps, papi}
//       finalRec
//       notes.{tk, epps, hol, papi, final}
//       meta.{nomerKandidat, asesor, mengetahui}

export function unpackAssessorState(row) {
  if (!row) return {};
  const a = row.summary?.assessor || {};
  const narratives = a.narratives || {};
  const ratings    = a.ratings    || {};
  const notes      = a.notes      || {};
  const meta       = a.meta       || {};

  const state = {};

  // Section V narratives → flat edit_narr-* keys (from TEXT columns)
  if (row.narrative_report  != null) state['edit_narr-konsol']   = row.narrative_report;
  if (row.strengths         != null) state['edit_narr-strength'] = row.strengths;
  if (row.development_areas != null) state['edit_narr-dev']      = row.development_areas;
  if (row.recommended_roles != null) state['edit_narr-rec']      = row.recommended_roles;

  // Per-section narratives → flat edit_narr-* keys (from JSONB)
  for (const k of ['tk', 'epps', 'hol', 'papi', 'fit']) {
    if (narratives[k] != null) state[`edit_narr-${k}`] = narratives[k];
  }

  // Recruiter ratings
  for (const k of ['tk', 'epps', 'papi']) {
    if (ratings[k] != null) state[`rcr_${k}`] = ratings[k];
  }

  // Final recommendation
  if (a.finalRec != null) state.finalRec = a.finalRec;

  // Assessor notes
  for (const k of ['tk', 'epps', 'hol', 'papi', 'final']) {
    if (notes[k] != null) state[`notes_${k}`] = notes[k];
  }

  // Header metadata
  if (meta.nomerKandidat != null) state.nomerKandidat = meta.nomerKandidat;
  if (meta.asesor        != null) state.asesor        = meta.asesor;
  if (meta.mengetahui    != null) state.mengetahui    = meta.mengetahui;

  return state;
}

// Returns a body shape for PUT /assessment-battery-result/:id/report — the controller COALESCEs each
// field, so omitted keys are left untouched. We always send a fully-rebuilt summary (merged with the
// existing one passed in) so partial saves don't blow away other summary fields.
export function packAssessorState(state, existingSummary) {
  const narratives = {};
  for (const k of ['tk', 'epps', 'hol', 'papi', 'fit']) {
    if (state[`edit_narr-${k}`] !== undefined) narratives[k] = state[`edit_narr-${k}`];
  }

  const ratings = {};
  for (const k of ['tk', 'epps', 'papi']) {
    if (state[`rcr_${k}`] !== undefined) ratings[k] = state[`rcr_${k}`];
  }

  const notes = {};
  for (const k of ['tk', 'epps', 'hol', 'papi', 'final']) {
    if (state[`notes_${k}`] !== undefined) notes[k] = state[`notes_${k}`];
  }

  const meta = {};
  if (state.nomerKandidat !== undefined) meta.nomerKandidat = state.nomerKandidat;
  if (state.asesor        !== undefined) meta.asesor        = state.asesor;
  if (state.mengetahui    !== undefined) meta.mengetahui    = state.mengetahui;

  const assessor = {
    narratives,
    ratings,
    notes,
    meta,
    finalRec: state.finalRec ?? null,
  };

  return {
    summary: { ...(existingSummary || {}), assessor },
    narrative_report:   state['edit_narr-konsol']   ?? null,
    strengths:          state['edit_narr-strength'] ?? null,
    development_areas:  state['edit_narr-dev']      ?? null,
    recommended_roles:  state['edit_narr-rec']      ?? null,
  };
}
