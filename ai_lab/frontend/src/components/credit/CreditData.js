// MOCK: package, weights and log are sample data until a backend exists.
export const PKG = {
  name: 'Paket HR ≤50 karyawan',
  quota: 1000,
  period: '1–30 Nov 2026',
};

export const WEIGHTS = {
  ph_import: 'L3 · 5 / file',
  ph_ocr: 'L4 · 10 / halaman',
  ph_cls: 'L1 · 1 / batch',
  ph_insight: 'L2 · 2 / pembaruan',
  ph_ask: 'L3 · 5 / pertanyaan',
  ph_sum: 'L1 · 1 / ringkasan',
};

export const MOCK_LOG = [
  { t: '2026-11-03 09:10', act: 'ph_import', lbl: 'Pemetaan kolom impor', cr: 5, who: 'Rina' },
  { t: '2026-11-03 09:16', act: 'ph_cls', lbl: 'Normalisasi jabatan', cr: 1, who: 'Rina' },
  { t: '2026-11-04 08:02', act: 'ph_insight', lbl: 'Insight dashboard', cr: 2, who: 'Rina' },
  { t: '2026-11-05 13:40', act: 'ph_ask', lbl: 'Tanya Data', cr: 5, who: 'Slamet (Direksi)' },
  { t: '2026-11-05 13:44', act: 'ph_ask', lbl: 'Tanya Data', cr: 5, who: 'Slamet (Direksi)' },
  { t: '2026-11-06 10:21', act: 'ph_ocr', lbl: 'Scan dokumen (2 halaman)', cr: 20, who: 'Rina' },
  { t: '2026-11-09 08:05', act: 'ph_insight', lbl: 'Insight dashboard', cr: 2, who: 'Rina' },
  { t: '2026-11-10 15:30', act: 'ph_sum', lbl: 'Ringkasan pengingat untuk atasan', cr: 1, who: 'Rina' },
  { t: '2026-11-10 15:31', act: 'ph_sum', lbl: 'Ringkasan pengingat untuk atasan', cr: 1, who: 'Rina' },
];

export function summarise(log) {
  const used = log.reduce((a, l) => a + l.cr, 0);
  const by = {};
  log.forEach((l) => {
    const b = (by[l.act] = by[l.act] || { act: l.act, lbl: l.lbl.replace(/ \(.*\)/, ''), n: 0, c: 0 });
    b.n += 1;
    b.c += l.cr;
  });
  return {
    used,
    remaining: PKG.quota - used,
    byActivity: Object.values(by).sort((a, b) => b.c - a.c),
    recent: log.slice().reverse(),
  };
}

export const fmtNum = (n) => n.toLocaleString('id-ID');