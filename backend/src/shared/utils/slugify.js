// Turns a company name into a URL-safe slug for the public career page
// (/careers/:slug). Not guaranteed globally unique on its own — callers that
// insert against a UNIQUE column should retry with a numeric suffix on conflict.
export function slugify(input) {
  return (input || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
