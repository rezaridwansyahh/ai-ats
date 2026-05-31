const NARR_KEYS   = ['tk', 'epps', 'hol', 'papi', 'fit', 'bigfive', 'disc', 'holland', 'sjt', 'pf', 'msdt', 'papil'];
const RATING_KEYS = ['tk', 'epps', 'papi', 'bigfive', 'disc', 'sjt', 'pf', 'msdt', 'papil'];
const NOTE_KEYS   = ['tk', 'epps', 'hol', 'papi', 'final', 'bigfive', 'disc', 'holland', 'sjt', 'pf', 'msdt', 'papil'];

export function unpackAssessorState(row) {
  if (!row) return {};
  const a = row.summary?.assessor || {};
  const narratives = a.narratives || {};
  const ratings    = a.ratings    || {};
  const notes      = a.notes      || {};
  const meta       = a.meta       || {};

  const aiSections = row.ai_section_narratives || {};

  const state = {};

  // Synthesis narratives → flat edit_narr-* keys (from TEXT columns)
  if (row.narrative_report  != null) state['edit_narr-konsol']   = row.narrative_report;
  if (row.strengths         != null) state['edit_narr-strength'] = row.strengths;
  if (row.development_areas != null) state['edit_narr-dev']      = row.development_areas;
  if (row.recommended_roles != null) state['edit_narr-fit']      = row.recommended_roles;

  for (const k of NARR_KEYS) {
    const assessorVal = narratives[k];
    const aiVal       = aiSections[k];
    if (assessorVal != null && assessorVal !== '') {
      state[`edit_narr-${k}`] = assessorVal;
    } else if (aiVal != null && aiVal !== '') {
      state[`edit_narr-${k}`] = aiVal;
    }
  }

  // Recruiter ratings
  for (const k of RATING_KEYS) {
    if (ratings[k] != null) state[`rcr_${k}`] = ratings[k];
  }

  // Final recommendation
  if (a.finalRec != null) state.finalRec = a.finalRec;

  // Assessor notes
  for (const k of NOTE_KEYS) {
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
  for (const k of NARR_KEYS) {
    if (state[`edit_narr-${k}`] !== undefined) narratives[k] = state[`edit_narr-${k}`];
  }

  const ratings = {};
  for (const k of RATING_KEYS) {
    if (state[`rcr_${k}`] !== undefined) ratings[k] = state[`rcr_${k}`];
  }

  const notes = {};
  for (const k of NOTE_KEYS) {
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
    recommended_roles:  state['edit_narr-fit']      ?? null,
  };
}
