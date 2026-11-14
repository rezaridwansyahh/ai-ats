import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createEmployee, getEmployees, scanEmployeeDocument } from '@/api/employees.api';
import { Tag } from '@/components/karyawan/EmployeeTags';
import { DATE_KEYS, ENUMS, LOW, buildPayload, normalizeScan, rowsOf, validate } from '@/components/scan/scanUtils.js';

const TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
const MAX_MB = 10;
const isLow = (f) => f.conf != null && f.conf < LOW && !f.ok && f.value.trim() !== '';
const msg = (err, fallback) => err?.response?.data?.message || err?.message || fallback;

function Banner({ warn, children }) {
  return (
    <div className={`rounded-[10px] border px-3 py-2.5 text-[13px] ${warn ? 'border-[#f1d3a3] bg-warning/15' : 'border-border bg-muted/50'}`}>
      {children}
    </div>
  );
}

function Preview({ file, url }) {
  if (!file) return null;
  return file.type === 'application/pdf'
    ? <iframe title="Dokumen asli" src={url} className="h-[560px] w-full rounded-lg border border-border bg-white" />
    : <img src={url} alt="Dokumen asli" className="max-h-[640px] w-full rounded-lg border border-border bg-white object-contain" />;
}

export default function ScanDokumen() {
  const navigate = useNavigate();
  const { role = 'hr' } = useOutletContext() ?? {};
  const uploadRef = useRef(null);
  const urlRef = useRef(null);

  const [stage, setStage] = useState('pick'); 
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [fields, setFields] = useState([]);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(null);
  const [match, setMatch] = useState(null); 
  const [dragging, setDragging] = useState(false);

  useEffect(() => () => { if (urlRef.current) URL.revokeObjectURL(urlRef.current); }, []);

  const choose = (f) => {
    setError('');
    if (!f) return;
    if (!TYPES.includes(f.type)) { setError('Format harus JPG, PNG, atau PDF'); return; }
    if (f.size > MAX_MB * 1024 * 1024) { setError(`Ukuran file maksimal ${MAX_MB} MB`); return; }
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = URL.createObjectURL(f);
    setFile(f);
    setPreviewUrl(urlRef.current);
  };

  const reset = () => {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = null;
    setStage('pick'); setFile(null); setPreviewUrl(null); setFields([]);
    setErrors({}); setError(''); setSaved(null); setMatch(null);
  };

  const scan = async () => {
    setStage('scanning');
    setError('');
    try {
      const res = await scanEmployeeDocument(file);
      setFields(normalizeScan(res.data));
      setErrors({});
      setMatch(null);
      setStage('verify');
    } catch (err) {
      setError(msg(err, 'Gagal membaca dokumen'));
      setStage('pick');
    }
  };

  const setValue = (key, value) => setFields((fs) => fs.map((f) => (f.key === key ? { ...f, value, ok: true } : f)));
  const accept = (key) => setFields((fs) => fs.map((f) => (f.key === key ? { ...f, ok: true } : f)));
  const values = () => Object.fromEntries(fields.map((f) => [f.key, f.value.trim()]));
  const nLow = fields.filter(isLow).length;

  const checkMatch = async () => {
    setError('');
    try {
      const v = values();
      const rows = rowsOf((await getEmployees()).data);
      setMatch(rows.filter((e) =>
        (v.nama && (e.nama ?? '').toLowerCase() === v.nama.toLowerCase()) ||
        (v.email && (e.email ?? '').toLowerCase() === v.email.toLowerCase())));
    } catch (err) {
      setError(msg(err, 'Gagal memeriksa karyawan yang ada'));
    }
  };

  const save = async () => {
    const v = values();
    const errs = validate(v);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving(true);
    setError('');
    try {
      const res = await createEmployee({ aktif: 'Aktif', ...buildPayload(v) });
      const emp = res.data?.employee ?? res.data;
      setSaved({ id: emp?.id ?? null, nik: emp?.nik ?? '', nama: emp?.nama ?? v.nama });
      setStage('done');
    } catch (err) {
      setError(msg(err, 'Gagal menyimpan karyawan'));
    } finally {
      setSaving(false);
    }
  };

  const head = (title, sub) => (
    <div className="mb-4">
      <div className="flex items-center gap-3">
        <span className="rounded-[5px] bg-[#11473d] px-[7px] py-0.5 text-[11.5px] text-white" style={{ fontFamily: "'JetBrains Mono', monospace" }}>M1-03</span>
        <h1 className="font-display text-[26px] font-bold leading-tight">{title}</h1>
      </div>
      {sub && <p className="mt-1 text-sm text-muted-foreground">{sub}</p>}
    </div>
  );

  if (role !== 'hr') {
    return <div>{head('Scan dokumen')}<Banner>Halaman ini hanya untuk HR Admin.</Banner></div>;
  }

  if (stage === 'done') {
    return (
      <div>
        {head('Scan dokumen')}
        <Card className="gap-0 py-0 shadow-none">
          <CardContent className="p-5">
            <h3 className="text-base font-semibold">✓ Tersimpan sebagai karyawan baru</h3>
            <p className="mt-1 text-sm">{saved.nama}{saved.nik && ` (${saved.nik})`} ditambahkan.</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Level dan atasan tidak dibaca dari formulir; lengkapi lewat tombol Ubah data di profilnya.
            </p>
            <div className="mt-4 flex gap-2">
              <Button onClick={() => navigate(saved.id ? `/karyawan/${saved.id}` : '/karyawan')}>Buka profil</Button>
              <Button variant="outline" onClick={reset}>Scan dokumen lain</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (stage === 'verify') {
    return (
      <div>
        {head('Kotak Verifikasi', 'Periksa hasil baca AI berdampingan dengan dokumen asli.')}
        <Banner warn={nLow > 0}>
          {nLow > 0
            ? <>⚠ <b>{nLow} field berkeyakinan rendah</b> (&lt; {Math.round(LOW * 100)}%) harus dikonfirmasi sebelum bisa disimpan.</>
            : '✓ Semua field sudah diperiksa. Siap disimpan.'}
        </Banner>

        <div className="mt-4 grid items-start gap-4 lg:grid-cols-2">
          <Preview file={file} url={previewUrl} />

          <Card className="gap-0 py-0 shadow-none">
            <CardContent className="p-4">
              <h3 className="mb-2 flex items-center gap-2 text-base font-semibold">Hasil baca AI <Tag tone="ai">Saran AI</Tag></h3>

              {fields.map((f) => {
                const low = isLow(f);
                return (
                  <div
                    key={f.key}
                    className={`grid grid-cols-[150px_minmax(0,1fr)_64px] items-center gap-2 rounded-lg border px-2 py-1.5 ${
                      low ? 'border-[#f0cf98] bg-warning/15' : f.ok ? 'border-transparent bg-emerald-50' : 'border-transparent'
                    }`}
                  >
                    <label htmlFor={`sc-${f.key}`} className="text-[12.5px] text-muted-foreground">
                      {f.label}
                      {f.raw && <span className="block text-[11px]">Tertulis: {f.raw}</span>}
                      {f.note && <span className="block text-[11px]">{f.note}</span>}
                    </label>
                    <div className="min-w-0">
                      {ENUMS[f.key] ? (
                        <select
                          id={`sc-${f.key}`}
                          className="h-8 w-full rounded-lg border border-input bg-card px-2 text-sm"
                          value={f.value}
                          onChange={(e) => setValue(f.key, e.target.value)}
                        >
                          <option value="">—</option>
                          {ENUMS[f.key].map((o) => <option key={o} value={o}>{o}</option>)}
                        </select>
                      ) : (
                        <Input
                          id={`sc-${f.key}`}
                          type={DATE_KEYS.includes(f.key) ? 'date' : 'text'}
                          className="h-8 text-sm"
                          value={f.value}
                          onChange={(e) => setValue(f.key, e.target.value)}
                        />
                      )}
                      {errors[f.key] && <p className="mt-0.5 text-xs text-destructive">{errors[f.key]}</p>}
                    </div>
                    <div className="text-right">
                      {f.ok ? <Tag tone="ok">✓</Tag>
                        : low ? <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => accept(f.key)}>OK</Button>
                        : <span className="font-mono text-[11.5px]">{f.value && f.conf != null ? `${Math.round(f.conf * 100)}%` : '—'}</span>}
                    </div>
                  </div>
                );
              })}

              {match && (
                <div className="mt-3">
                  <Banner>
                    {match.length
                      ? <>Mirip dengan: {match.map((m, i) => (
                          <span key={m.id ?? m.nik}>{i > 0 && ', '}<Link className="text-primary underline underline-offset-2" to={`/karyawan/${m.id ?? m.nik}`}>{m.nama} ({m.nik})</Link></span>
                        ))}. Periksa dulu agar tidak terjadi data ganda.</>
                      : 'Tidak ada karyawan serupa (cek nama dan email).'}
                  </Banner>
                </div>
              )}
              {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Button variant="outline" onClick={reset} disabled={saving}>Batal</Button>
                <span className="flex-1" />
                <Button variant="outline" onClick={checkMatch} disabled={saving}>Cocokkan ke karyawan yang ada</Button>
                <Button onClick={save} disabled={nLow > 0 || saving}>{saving ? 'Menyimpan…' : 'Simpan sebagai karyawan baru'}</Button>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Setelah disimpan, NIK internal dibuat otomatis. No. HP dan nomor identitas (KTP, NPWP, BPJS) sengaja tidak dibaca oleh scan.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const scanning = stage === 'scanning';
  return (
    <div>
      {head('Scan dokumen', 'Unggah formulir data karyawan; AI membaca isinya, Anda memeriksa')}
      <Banner warn>
        🔒 <b>Perhatian data pribadi:</b> berbeda dari fitur lain, scan mengirim <b>gambar</b> dokumen ke layanan AI vision.
        Fitur ini aktif setelah persetujuan perusahaan (sekali).
      </Banner>

      <div
        className={`mt-4 rounded-xl border-2 border-dashed p-8 text-center ${dragging ? 'border-primary bg-accent' : 'border-[#b9d6cc] bg-[#fbfdfc]'}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); choose(e.dataTransfer.files?.[0]); }}
      >
        <p className="mt-2 text-sm"><b>Unggah formulir</b> JPG/PNG/PDF atau seret file ke sini · maks. {MAX_MB} MB</p>
        <input ref={uploadRef} type="file" accept={TYPES.join(',')} className="hidden" onChange={(e) => { choose(e.target.files?.[0]); e.target.value = ''; }} />
        <div className="mt-3 flex justify-center">
          <Button variant="outline" disabled={scanning} onClick={() => uploadRef.current?.click()}>⇪ Unggah file</Button>
        </div>

        {file && (
          <div className="mt-5">
            <p className="text-sm">{file.name} <span className="text-xs text-muted-foreground">({(file.size / 1024 / 1024).toFixed(2)} MB)</span></p>
            <Button className="mt-2" disabled={scanning} onClick={scan}>{scanning ? 'Membaca dokumen…' : 'Pindai'}</Button>
          </div>
        )}
      </div>

      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
      {file && <div className="mt-4"><Preview file={file} url={previewUrl} /></div>}
    </div>
  );
}