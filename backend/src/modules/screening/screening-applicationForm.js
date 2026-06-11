export const APPLICATION_FORM_TEMPLATE = {
  id: 'standard',
  version: 'std-v1',
  sections: [
    {
      key: 'personal',
      label: 'Personal Information',
      fields: [
        { key: 'full_name',     label: 'Full Name',          type: 'text', required: true,
          maps_to: ['offer_letter'] },
        { key: 'date_of_birth', label: 'Date of Birth',      type: 'date', required: true,
          maps_to: ['contract', 'onboarding'] },
        { key: 'national_id',   label: 'KTP / National ID',  type: 'text', required: true,
          maps_to: ['offer_letter', 'contract', 'onboarding'] },
      ],
    },
    {
      key: 'education',
      label: 'Education History',
      fields: [
        { key: 'education_level', label: 'Education (Highest Degree)', type: 'select', required: true,
          options: ['S1', 'S2', 'D3'], maps_to: ['bgc_education'] },
        { key: 'institution',     label: 'Institution Name',          type: 'text',   required: true,
          maps_to: ['bgc_education'] },
      ],
    },
    {
      key: 'experience',
      label: 'Work Experience',
      fields: [
        { key: 'last_employer',     label: 'Last Employer',        type: 'text', required: false,
          maps_to: ['bgc_experience'] },
        { key: 'last_position',     label: 'Last Position Title',  type: 'text', required: false,
          maps_to: ['bgc_experience'] },
        { key: 'employment_period', label: 'Employment Period',    type: 'text', required: false,
          maps_to: ['bgc_experience'] },
      ],
    },
    {
      key: 'placement',
      label: 'Placement Preference',
      fields: [
        { key: 'preferred_cities', label: 'Preferred Placement City / Location', type: 'text',
          required: true,
          maps_to: ['ai_matching', 'offer_letter', 'onboarding'] },
      ],
    },
  ],
};

// Deep clone so callers never mutate the live constant.
export function getApplicationFormTemplate() {
  return JSON.parse(JSON.stringify(APPLICATION_FORM_TEMPLATE));
}

// Flat field list across all sections. Tolerant of null / missing sections.
export function flattenFields(schema) {
  const sections = Array.isArray(schema?.sections) ? schema.sections : [];
  return sections.flatMap((s) => (Array.isArray(s?.fields) ? s.fields : []));
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function normalizeApplicationForm(schema, values) {
  const out = {};
  const src = values && typeof values === 'object' ? values : {};
  for (const field of flattenFields(schema)) {
    const raw = src[field.key];
    switch (field.type) {
      case 'multiselect': {
        const arr = Array.isArray(raw) ? raw : [];
        const opts = Array.isArray(field.options) ? field.options : [];
        out[field.key] = [...new Set(arr.filter((v) => opts.includes(v)))];
        break;
      }
      case 'select': {
        const v = typeof raw === 'string' ? raw.trim() : '';
        out[field.key] = (Array.isArray(field.options) && field.options.includes(v)) ? v : '';
        break;
      }
      case 'date': {
        const v = typeof raw === 'string' ? raw.trim() : '';
        out[field.key] = ISO_DATE.test(v) ? v : '';
        break;
      }
      default: { // text
        out[field.key] = typeof raw === 'string' ? raw.trim() : '';
      }
    }
  }
  return out;
}

export function findMissingRequired(schema, normalizedValues) {
  const v = normalizedValues || {};
  return flattenFields(schema)
    .filter((f) => f.required)
    .filter((f) => {
      const val = v[f.key];
      if (Array.isArray(val)) return val.length === 0;
      return val == null || String(val).trim() === '';
    })
    .map((f) => ({ key: f.key, label: f.label }));
}
