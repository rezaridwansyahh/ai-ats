import { Card, CardContent } from '@/components/ui/card';
import { inputCls } from './settingsDefaults.js';

function Row({ label, error, children }) {
  return (
    <>
      <label className="text-sm">{label}</label>
      <div>
        <div className="flex items-center gap-2 text-sm">{children}</div>
        {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
      </div>
    </>
  );
}

export default function BatasCard({ form, errors, onChange }) {
  const set = (k) => (e) => onChange(k, e.target.value);
  const num = (k, lo, hi) => (
    <input type="number" min={lo} max={hi} value={form[k]} onChange={set(k)} className={`${inputCls} w-20`} />
  );

  return (
    <Card className="gap-0 py-0 shadow-none">
      <CardContent className="p-4">
        <h3 className="mb-3 text-sm font-semibold">Tanggal &amp; batas</h3>
        <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-[220px_minmax(0,1fr)]">
          <Row label="Tanggal acuan" error={errors.ref}>
            <input type="date" value={form.ref} onChange={set('ref')} className={inputCls} />
          </Row>
          <Row label="Batas peringatan 1 (Segera)" error={errors.b1}>{num('b1', 1, 120)} hari</Row>
          <Row label="Batas peringatan 2 (Perhatian)" error={errors.b2}>{num('b2', 2, 180)} hari</Row>
          <Row label="Lama masa percobaan (PKWTT)" error={errors.prob}>{num('prob', 1, 6)} bulan</Row>
          <Row label="Batas akumulasi PKWT">
            <select value={form.pkwtMax} onChange={set('pkwtMax')} className={`${inputCls} w-full`}>
              <option value="5">5 tahun — PP 35/2021 (berlaku sekarang)</option>
              <option value="4">4 tahun — jika aturan baru berlaku</option>
            </select>
          </Row>
          <Row label="Usia pensiun">
            <select value={form.pensiun} onChange={set('pensiun')} className={`${inputCls} w-full`}>
              <option value="jp">Ikut usia pensiun JP BPJS</option>
              {[55, 56, 57, 58, 60].map((a) => (
                <option key={a} value={String(a)}>{a} tahun (aturan perusahaan/PKB)</option>
              ))}
            </select>
          </Row>
          <Row label="Peringatan sertifikat" error={errors.certWarn}>
            {num('certWarn', 7, 180)} hari sebelum kedaluwarsa
          </Row>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Versi jadi: tanggal acuan default "hari ini", dan bisa dikunci ke tanggal tertentu untuk laporan.
          Cek teks resmi peraturan sebelum mengubah default masa percobaan, batas PKWT atau usia pensiun.
        </p>
      </CardContent>
    </Card>
  );
}