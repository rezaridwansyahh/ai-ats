export const FIELD_TYPES = [
  { value: 'text', label: 'Short text' },
  { value: 'textarea', label: 'Long text' },
  { value: 'date', label: 'Date' },
  { value: 'select', label: 'Single choice' },
  { value: 'multiselect', label: 'Multiple choice' },
];

// Types that need a predefined options list.
export const OPTIONS_FIELD_TYPES = new Set(['select', 'multiselect']);

export function fieldTypeLabel(value) {
  return FIELD_TYPES.find((t) => t.value === value)?.label || value;
}
