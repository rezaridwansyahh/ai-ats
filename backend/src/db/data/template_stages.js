export const templateStages = [
  { id: 1, name: 'Template untuk Akuntan' },
  { id: 2, name: 'Template untuk IT Dev' },
];

// stage_type_id references recruitment_stage_category.id
export const templateStageRows = [
  // Template 1: Akuntan
  { id: 1, master_id: 1, stage_type_id: 2, name: 'AI CV Screening', stage_order: 1 },
  { id: 2, master_id: 1, stage_type_id: 4, name: 'Psikotes Online', stage_order: 2 },
  { id: 3, master_id: 1, stage_type_id: 3, name: 'Interview HR', stage_order: 3 },
  { id: 4, master_id: 1, stage_type_id: 3, name: 'Interview User', stage_order: 4 },
  { id: 5, master_id: 1, stage_type_id: 5, name: 'MCU / Medical', stage_order: 5 },
  // Template 2: IT Dev
  { id: 6,  master_id: 2, stage_type_id: 2, name: 'AI CV Screening',     stage_order: 1 },
  { id: 7,  master_id: 2, stage_type_id: 4, name: 'Assessment',          stage_order: 2 },
  { id: 8,  master_id: 2, stage_type_id: 3, name: 'Interview',           stage_order: 3 },
  { id: 9,  master_id: 2, stage_type_id: 5, name: 'Background Check',    stage_order: 4 },
  { id: 10, master_id: 2, stage_type_id: 6, name: 'Offering & Contract', stage_order: 5 },
  { id: 11, master_id: 2, stage_type_id: 7, name: 'Onboarding',          stage_order: 6 },
];
