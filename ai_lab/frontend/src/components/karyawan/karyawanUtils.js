export const dec = (x, n = 1) => (x == null || isNaN(x) ? '—' : x.toFixed(n).replace('.', ','));
export const initials = (name = '') => name.split(' ').map((s) => s[0]).slice(0, 2).join('');
export const rowKey = (e) => String(e.id ?? e.nik);

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function filenameFromHeader(header) {
  const m = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(header ?? '');
  if (!m) return null;
  try { return decodeURIComponent(m[1]); } catch { return m[1]; }
}

export async function blobErrorMessage(err, fallback) {
  try {
    const text = await err.response?.data?.text?.();
    return JSON.parse(text).message || fallback;
  } catch {
    return err?.message || fallback;
  }
}