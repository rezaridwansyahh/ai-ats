import { useRef, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { commitEmployeeImport, previewEmployeeImport, validateEmployeeImport } from '@/api/employee-import';
import { Banner, ConfirmStep, IssuesStep, MappingStep, Stepper } from '@/components/import/ImportViews';
import { decisionPayload, duplicateFields, mappingPayload, unwrap } from '@/components/import/importUtils.js';

const MAX_MB = 5;
const msg = (err, fallback) => err?.response?.data?.message || err?.message || fallback;

export default function ImporExcel() {
  const navigate = useNavigate();
  const { role = 'hr' } = useOutletContext() ?? {};
  const inputRef = useRef(null);
  const reqRef = useRef(0); // ignores answers of outdated validate requests

  const [step, setStep] = useState(1); 
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [map, setMap] = useState({});         // header -> field key ('' = ignore)
  const [manual, setManual] = useState({});   // headers the user changed by hand
  const [decisions, setDecisions] = useState({}); // row -> 'skip' | 'merge'
  const [report, setReport] = useState(null);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState('');       // '' | preview | validate | commit
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);

  const dupes = duplicateFields(map);
  const namaMapped = Object.values(map).includes('nama');
  const labelOf = Object.fromEntries((preview?.fields ?? []).map((f) => [f.key, f.label]));

  const reset = () => {
    reqRef.current += 1;
    setStep(1); setFile(null); setPreview(null); setMap({}); setManual({});
    setDecisions({}); setReport(null); setResult(null); setBusy(''); setError('');
  };

  const choose = async (f) => {
    setError('');
    if (!f) return;
    if (!/\.(xlsx|csv)$/i.test(f.name)) { setError('Format harus .xlsx atau .csv'); return; }
    if (f.size > MAX_MB * 1024 * 1024) { setError(`Ukuran file maksimal ${MAX_MB} MB`); return; }
    setFile(f);
    setBusy('preview');
    try {
      const res = await previewEmployeeImport(f);
      const p = unwrap(res.data, 'mapping');
      if (!Array.isArray(p?.mapping)) throw new Error('Respons pratinjau tidak dikenali');
      setPreview(p);
      setMap(Object.fromEntries(p.mapping.map((m) => [m.header, m.field ?? ''])));
      setManual({});
      setStep(2);
    } catch (err) {
      setFile(null);
      setError(msg(err, 'Gagal membaca file'));
    } finally {
      setBusy('');
    }
  };

  const onMap = (header, field) => {
    setMap((m) => ({ ...m, [header]: field }));
    setManual((m) => ({ ...m, [header]: true }));
  };

  const runValidate = async (nextDecisions) => {
    const id = ++reqRef.current;
    setBusy('validate');
    setError('');
    try {
      const res = await validateEmployeeImport(file, mappingPayload(map), decisionPayload(nextDecisions));
      if (id !== reqRef.current) return false;
      setReport(unwrap(res.data, 'counts'));
      return true;
    } catch (err) {
      if (id === reqRef.current) setError(msg(err, 'Gagal memeriksa data'));
      return false;
    } finally {
      if (id === reqRef.current) setBusy('');
    }
  };

  const goValidate = async () => {
    setDecisions({});
    if (await runValidate({})) setStep(3);
  };

  const decide = (row, value) => {
    const next = { ...decisions };
    if (value === 'default') delete next[row]; else next[row] = value;
    setDecisions(next);
    runValidate(next);
  };

  const commit = async () => {
    setBusy('commit');
    setError('');
    try {
      const res = await commitEmployeeImport(file, mappingPayload(map), decisionPayload(decisions));
      setResult(unwrap(res.data, 'import_id'));
      setStep(5);
    } catch (err) {
      setError(msg(err, 'Gagal menyimpan impor'));
    } finally {
      setBusy('');
    }
  };

  const head = (
    <div className="mb-4">
      <div className="flex items-center gap-3">
        <span className="rounded-[5px] bg-[#11473d] px-[7px] py-0.5 text-[11.5px] text-white" style={{ fontFamily: "'JetBrains Mono', monospace" }}>M1-02</span>
        <h1 className="font-display text-[26px] font-bold leading-tight">Impor Excel</h1>
      </div>
      {step < 5 && <p className="mt-1 text-sm text-muted-foreground">Masukkan atau perbarui data karyawan dari file yang sudah ada</p>}
    </div>
  );

  if (role !== 'hr') return <div>{head}<Banner>Halaman ini hanya untuk HR Admin.</Banner></div>;

  if (step === 5) {
    const r = result ?? {};
    return (
      <div>
        {head}
        <Card className="gap-0 py-0 shadow-none">
          <CardContent className="p-5">
            <h3 className="text-base font-semibold">✓ Impor selesai{r.import_id != null && ` — batch #${r.import_id}`}</h3>
            <p className="mt-1 text-sm">
              {r.insert ?? 0} karyawan baru, {r.update ?? 0} diperbarui, {r.unchanged ?? 0} tidak berubah, {r.skip ?? 0} dilewati.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Beranda dan daftar karyawan sudah memakai data baru.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button onClick={() => navigate('/karyawan')}>Lihat daftar karyawan</Button>
              <Button variant="outline" onClick={() => navigate('/')}>Buka beranda</Button>
              <Button variant="outline" onClick={reset}>Impor file lain</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const changeCount = (report?.counts?.insert ?? 0) + (report?.counts?.update ?? 0);
  const mappingProblem = !namaMapped ? 'Petakan satu kolom ke Nama Lengkap' : dupes.size ? 'Ada field yang dipakai lebih dari satu kolom' : '';

  return (
    <div>
      {head}
      <Stepper step={step} />

      {step === 1 && (
        <div
          className={`rounded-xl border-2 border-dashed p-8 text-center ${dragging ? 'border-primary bg-accent' : 'border-[#b9d6cc] bg-[#fbfdfc]'}`}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); choose(e.dataTransfer.files?.[0]); }}
        >
          <div className="text-3xl">⇪</div>
          <p className="mt-2 text-sm"><b>Seret file Excel/CSV ke sini</b> atau pilih file. Maks. {MAX_MB} MB · 2.000 baris.</p>
          <p className="mt-1 text-xs text-muted-foreground">
            File template Myralix dikenali otomatis. File lain dipetakan dengan bantuan AI.
          </p>
          <input ref={inputRef} type="file" accept=".xlsx,.csv" className="hidden" onChange={(e) => { choose(e.target.files?.[0]); e.target.value = ''; }} />
          <Button className="mt-3" disabled={busy === 'preview'} onClick={() => inputRef.current?.click()}>
            {busy === 'preview' ? 'Membaca file…' : 'Pilih file'}
          </Button>
          {file && busy === 'preview' && <p className="mt-2 text-xs text-muted-foreground">{file.name}</p>}
        </div>
      )}

      {step === 2 && preview && <MappingStep preview={preview} map={map} manual={manual} dupes={dupes} onChange={onMap} />}
      {step === 3 && report && <IssuesStep report={report} decisions={decisions} busy={busy === 'validate'} onDecide={decide} />}
      {step === 4 && report && (
        <div className="space-y-3">
          <ConfirmStep report={report} labelOf={labelOf} />
          <Card className="gap-0 py-0 shadow-none">
            <CardContent className="p-4 text-sm">
              Kunci pencocokan: <b>NIK Internal</b>. Baris tanpa NIK dibuatkan NIK baru. Semua perubahan disimpan dalam satu transaksi.
            </CardContent>
          </Card>
        </div>
      )}

      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

      {step >= 2 && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button variant="outline" disabled={!!busy} onClick={() => (step === 2 ? reset() : setStep(step - 1))}>← Kembali</Button>
          <span className="flex-1" />
          {step === 2 && (
            <>
              {mappingProblem && <span className="text-xs text-destructive">{mappingProblem}</span>}
              <Button disabled={!!mappingProblem || !!busy} onClick={goValidate}>{busy === 'validate' ? 'Memeriksa…' : 'Periksa data →'}</Button>
            </>
          )}
          {step === 3 && <Button disabled={!!busy} onClick={() => setStep(4)}>Lanjut ke konfirmasi →</Button>}
          {step === 4 && (
            <Button disabled={!!busy || changeCount === 0} onClick={commit}>
              {busy === 'commit' ? 'Menyimpan…' : changeCount ? `Simpan ${changeCount} perubahan` : 'Tidak ada perubahan'}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}