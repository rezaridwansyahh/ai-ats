// Battery catalog — drives the Setup picker and the Take per-subtest table.
// Source of truth lives in the assessment definitions on the backend; this is the
// frontend-facing label/duration/test-sequence representation.
export const BATTERIES = {
  A: {
    code: 'A',
    label: 'Generalis',
    duration: '~60 min',
    test_count: 5,
    blurb: 'entry-level individual contributors. Cog ≥50, balanced personality.',
    tests: [
      { key: 'disc',      name: 'DISC',                detail: 'behavioural style inventory · ~10 min · self-report' },
      { key: 'big5',      name: 'OCEAN (Big Five)',    detail: 'personality trait inventory · ~10 min · norm-referenced' },
      { key: 'cog',       name: 'Cognitive Reasoning', detail: 'verbal + numeric + abstract · ~20 min · timed' },
      { key: 'kraepelin', name: 'Kraepelin',           detail: 'daya tahan, ketelitian, kecepatan · ~12 min · timed' },
      { key: 'work',      name: 'Work attitude',       detail: 'situational judgement · ~8 min · scenario-based' },
    ],
  },
  B: {
    code: 'B',
    label: 'Specialist',
    duration: '~75 min',
    test_count: 5,
    blurb: 'DISC, OCEAN, Kraepelin, Cognitive Reasoning. Mid-senior IC in technical roles.',
    tests: [
      { key: 'disc',      name: 'DISC',                detail: 'behavioural style inventory · ~12 min · self-report' },
      { key: 'big5',      name: 'OCEAN (Big Five)',    detail: 'personality trait inventory · ~12 min · norm-referenced' },
      { key: 'kraepelin', name: 'Kraepelin',           detail: 'daya tahan, ketelitian, kecepatan · ~25 min · timed' },
      { key: 'cog',       name: 'Cognitive Reasoning', detail: 'verbal + numeric + abstract · ~20 min · timed' },
      { key: 'work',      name: 'Work attitude',       detail: 'situational judgement · ~14 min · scenario-based' },
    ],
  },
  C: {
    code: 'C',
    label: 'Manajerial',
    duration: '~90 min',
    test_count: 6,
    blurb: 'first-line / mid managers. Adds leadership styles + decision-making instrument.',
    tests: [
      { key: 'disc',       name: 'DISC',                detail: 'behavioural style · ~12 min' },
      { key: 'big5',       name: 'OCEAN (Big Five)',    detail: 'personality trait inventory · ~12 min' },
      { key: 'kraepelin',  name: 'Kraepelin',           detail: '~20 min · timed' },
      { key: 'cog',        name: 'Cognitive Reasoning', detail: '~20 min · timed' },
      { key: 'leadership', name: 'Leadership Styles',   detail: 'situational leadership · ~15 min' },
      { key: 'decision',   name: 'Decision-Making',     detail: 'case-based reasoning · ~11 min' },
    ],
  },
  D: {
    code: 'D',
    label: 'Senior / Executive',
    duration: '~110 min',
    test_count: 7,
    blurb: 'senior managers and executives. Adds strategic reasoning + values inventory.',
    tests: [
      { key: 'disc',       name: 'DISC',                detail: 'behavioural style · ~12 min' },
      { key: 'big5',       name: 'OCEAN (Big Five)',    detail: 'personality trait inventory · ~12 min' },
      { key: 'kraepelin',  name: 'Kraepelin',           detail: '~20 min · timed' },
      { key: 'cog',        name: 'Cognitive Reasoning', detail: '~20 min · timed' },
      { key: 'leadership', name: 'Leadership Styles',   detail: 'situational leadership · ~15 min' },
      { key: 'strategic',  name: 'Strategic Reasoning', detail: 'business-case reasoning · ~18 min' },
      { key: 'values',     name: 'Values Inventory',    detail: 'org-fit values · ~13 min' },
    ],
  },
};

export function getInitials(name = '') {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}
