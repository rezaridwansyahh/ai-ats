export function joinArrayFields(obj, separator = ' | ') {
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    result[key] = Array.isArray(value) ? value.join(separator) : value ?? null;
  }
  return result;
}
