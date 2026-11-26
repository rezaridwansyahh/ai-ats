import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  previewAttendanceImport, validateAttendanceImport, commitAttendanceImport, undoAttendanceImport,
} from '@/api/attendance-import';
import PageHead from '@/components/attendance/PageHead';
import { Stepper, StepUpload, StepMapping, StepCheck } from '@/components/attendance-import/ImportSteps';
import { StepConfirm, DoneCard } from '@/components/attendance-import/ImportResult';

const EMPTY_DECISIONS = { pins: {}, conflicts: {} };
const errMsg = (err) => err?.response?.data?.message || err?.message || 'Terjadi kesalahan';
const toMap = (mapping) => Object.fromEntries(mapping.map((m) => [m.header, m.field]));

export default function AttendanceImport() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [mapping, setMapping] = useState([]);
  const [decisions, setDecisions] = useState(EMPTY_DECISIONS);
  const [validation, setValidation] = useState(null);
  const [saved, setSaved] = useState(null);
  const [undone, setUndone] = useState(false);

  const reset = () => {
    setStep(1); setFile(null); setPreview(null); setMapping([]);
    setDecisions(EMPTY_DECISIONS); setValidation(null); setSaved(null); setUndone(false);
  };

  const run = async (fn) => {
    setBusy(true);
    try {
      return await fn();
    } catch (err) {
      toast.error(errMsg(err));
      return null;
    } finally {
      setBusy(false);
    }
  };

  const pickFile = async (picked) => {
    const res = await run(() => previewAttendanceImport(picked));
    if (!res) return;
    setFile(picked);
    setPreview(res.data);
    setMapping(res.data.mapping);
    setStep(2);
  };

  const changeField = (header, field) =>
    setMapping((prev) => prev.map((m) => {
      if (m.header === header) return { ...m, field, source: null };
      return field && m.field === field ? { ...m, field: null } : m;
    }));

  const check = async (nextDecisions) => {
    const res = await run(() => validateAttendanceImport(file, toMap(mapping), nextDecisions));
    if (!res) return false;
    setDecisions(nextDecisions);
    setValidation(res.data);
    return true;
  };

  const toCheck = async () => {
    if (await check(EMPTY_DECISIONS)) setStep(3);
  };

  const decide = (group, key, value) =>
    check({ ...decisions, [group]: { ...decisions[group], [key]: value } });

  const save = async () => {
    const res = await run(() => commitAttendanceImport(file, toMap(mapping), decisions));
    if (!res) return;
    setSaved(res.data);
    toast('Impor tersimpan');
  };

  const undo = async () => {
    const res = await run(() => undoAttendanceImport(saved.import_id));
    if (!res) return;
    setUndone(true);
    toast(`Impor dibatalkan (${res.data.removed} dihapus, ${res.data.restored} dikembalikan)`);
  };

  return (
    <div className="space-y-4">
      <PageHead
        code="M3-02"
        title="Impor mesin absensi"
        sub={saved ? '' : 'Ekspor dari mesin sidik jari/wajah → data kehadiran harian'}
      />

      {saved ? (
        <DoneCard
          result={saved}
          undone={undone}
          busy={busy}
          onUndo={undo}
          onDashboard={() => navigate('/attendance/dashboard')}
          onAgain={reset}
        />
      ) : (
        <>
          <Stepper step={step} />
          {step === 1 && <StepUpload busy={busy} onPick={pickFile} />}
          {step === 2 && (
            <StepMapping
              preview={preview}
              mapping={mapping}
              busy={busy}
              onChange={changeField}
              onBack={reset}
              onNext={toCheck}
            />
          )}
          {step === 3 && (
            <StepCheck
              result={validation}
              decisions={decisions}
              busy={busy}
              onDecide={decide}
              onBack={() => setStep(2)}
              onNext={() => setStep(4)}
            />
          )}
          {step === 4 && (
            <StepConfirm result={validation} busy={busy} onBack={() => setStep(3)} onSave={save} />
          )}
        </>
      )}
    </div>
  );
}