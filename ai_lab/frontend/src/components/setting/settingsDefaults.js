import { REF_DATE } from '@/components/dashboard/dashboardMetrics.js';

export const DEFAULTS = {
  ref: REF_DATE,
  b1: '30',
  b2: '60',
  prob: '3',
  pkwtMax: '5',
  pensiun: 'jp',
  certWarn: '60',
};

export function validate(f) {
  const err = {};
  const rng = (k, lo, hi) => {
    const v = Number(f[k]);
    if (f[k] === '' || !Number.isInteger(v) || v < lo || v > hi) err[k] = `Isi angka ${lo}–${hi}`;
  };
  if (!f.ref) err.ref = 'Tanggal acuan wajib diisi';
  rng('b1', 1, 120);
  rng('b2', 2, 180);
  rng('prob', 1, 6);
  rng('certWarn', 7, 180);
  if (!err.b1 && !err.b2 && Number(f.b2) <= Number(f.b1)) err.b2 = 'Harus lebih besar dari batas 1';
  return err;
}

export const inputCls =
  'h-9 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring';