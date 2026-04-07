export const templateStages = [
  { id: 1, name: 'Template untuk Akuntan' },
  { id: 2, name: 'Template untuk IT Dev' },
];

// stage_type_id references recruitment_stage_category.id
export const templateStageRows = [
  // Template 1: Akuntan
  { master_id: 1, stage_type_id: 2, name: 'AI CV Screening', stage_order: 1 },
  { master_id: 1, stage_type_id: 4, name: 'Psikotes Online', stage_order: 2 },
  { master_id: 1, stage_type_id: 3, name: 'Interview HR', stage_order: 3 },
  { master_id: 1, stage_type_id: 3, name: 'Interview User', stage_order: 4 },
  { master_id: 1, stage_type_id: 5, name: 'MCU / Medical', stage_order: 5 },
  // Template 2: IT Dev
  { master_id: 2, stage_type_id: 2, name: 'AI CV Screening', stage_order: 1 },
  { master_id: 2, stage_type_id: 4, name: 'Technical Assessment', stage_order: 2 },
  { master_id: 2, stage_type_id: 3, name: 'Interview HR', stage_order: 3 },
  { master_id: 2, stage_type_id: 3, name: 'Interview Tech Lead', stage_order: 4 },
  { master_id: 2, stage_type_id: 5, name: 'Background Check', stage_order: 5 },
  { master_id: 2, stage_type_id: 6, name: 'Offer Letter', stage_order: 6 },
];
