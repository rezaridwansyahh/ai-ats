const toUTC = (s) => new Date(`${s}T00:00:00Z`);

export const daysBetween = (a, b) => Math.round((toUTC(b) - toUTC(a)) / 864e5);

export const addMonths = (s, n) => {
  const [y, m, d] = s.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1 + n, 1));
  const lastDay = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth() + 1, 0)).getUTCDate();
  t.setUTCDate(Math.min(d, lastDay)); 
  return t.toISOString().slice(0, 10);
};

export const isRealDate = (v) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const d = toUTC(v);
  return !isNaN(d) && d.toISOString().slice(0, 10) === v;
};

export const today = () => new Date().toLocaleDateString('en-CA');