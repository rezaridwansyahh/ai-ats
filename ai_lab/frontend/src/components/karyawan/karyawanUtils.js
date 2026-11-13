export const dec = (x, n = 1) => (x == null || isNaN(x) ? '—' : x.toFixed(n).replace('.', ','));
export const initials = (name = '') => name.split(' ').map((s) => s[0]).slice(0, 2).join('');
export const rowKey = (e) => String(e.id ?? e.nik);