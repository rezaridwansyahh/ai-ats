import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getQuestionsByAssessmentCode } from '@/api/question.api';
import { createParticipant } from '@/api/participant.api';
import { submitAssessment } from '@/api/assessment-battery-result.api';
import BatteryA from '@/components/assessment/BatteryA';

const ASSESSMENT_CODE = 'myralix_battery_a';
const ASSESSMENT_ID = 1;

export default function AssessmentPage() {
  const [phase, setPhase] = useState('start'); // start, quiz, done
  const [error, setError] = useState(null);

  const [questions, setQuestions] = useState(null);
  const [loadingQuestions, setLoadingQuestions] = useState(true);

  const [form, setForm] = useState({
    name: '', email: '', position: '',
    department: '', education: '', date_birth: '',
  });
  const [participantId, setParticipantId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const startedAtRef = useRef(null);
  const [result, setResult] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await getQuestionsByAssessmentCode(ASSESSMENT_CODE);
        setQuestions(data.questions || null);
      } catch {
        setError('Gagal memuat bank soal.');
      } finally {
        setLoadingQuestions(false);
      }
    })();
  }, []);

  const handleStartTest = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const { data } = await createParticipant(form);
      setParticipantId(data.participant.id);
      startedAtRef.current = new Date().toISOString();
      setPhase('quiz');
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal mendaftarkan peserta');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssessmentComplete = async (answers) => {
    setSubmitting(true);
    setError(null);
    try {
      const { data } = await submitAssessment({
        participant_id: participantId,
        assessment_id: ASSESSMENT_ID,
        answers,
        started_at: startedAtRef.current,
      });
      setResult(data.result);
      setPhase('done');
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal mengirim hasil');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingQuestions) return <div className="p-6">Memuat bank soal...</div>;

  const totalQuestions = questions
    ? Object.values(questions).reduce((s, arr) => s + (Array.isArray(arr) ? arr.length : 0), 0)
    : 0;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {phase === 'start' && (
        <>
          <div
            className="rounded-2xl p-8 text-white relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #0A2A22 0%, #065F46 50%, #0D9488 100%)',
              boxShadow: '0 8px 32px rgba(15,23,42,.12)',
            }}
          >
            <div
              className="text-xs font-bold uppercase tracking-wider mb-4 inline-block px-3 py-1.5 rounded-full"
              style={{ background: 'rgba(255,255,255,.15)', border: '1px solid rgba(255,255,255,.22)' }}
            >
              Assessment · Battery A
            </div>
            <h2 className="text-2xl font-semibold mb-2" style={{ fontFamily: 'Georgia, serif' }}>
              Selamat Datang!
              <br />
              <span className="italic opacity-80 text-base font-normal">Asesmen Profil Pengembangan</span>
            </h2>
            <p className="text-sm leading-relaxed opacity-90 max-w-xl">
              Asesmen ini membantu Anda dan tim memahami <strong>kemampuan kognitif, kepribadian, gaya kerja, dan minat karir</strong>.
            </p>
            <div className="flex flex-wrap gap-2 mt-4">
              {[`${totalQuestions} soal`, '4 sub-tes', '~25 menit'].map((label) => (
                <span
                  key={label}
                  className="text-xs font-semibold px-3 py-1.5 rounded-full"
                  style={{ background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.2)' }}
                >
                  {label}
                </span>
              ))}
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">Data Peserta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Nama Lengkap *" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
                <Field label="Email *" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Posisi *" value={form.position} onChange={(v) => setForm({ ...form, position: v })} />
                <Field label="Departemen *" value={form.department} onChange={(v) => setForm({ ...form, department: v })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold uppercase text-muted-foreground">Pendidikan *</label>
                  <select
                    className="w-full mt-1 px-3 py-2.5 rounded-lg border bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A6E5C]"
                    value={form.education}
                    onChange={(e) => setForm({ ...form, education: e.target.value })}
                  >
                    <option value="">— Pilih —</option>
                    {['SMA/SMK', 'D3', 'S1', 'S2', 'S3'].map((e) => <option key={e}>{e}</option>)}
                  </select>
                </div>
                <Field label="Tanggal Lahir *" type="date" value={form.date_birth} onChange={(v) => setForm({ ...form, date_birth: v })} />
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <button
                onClick={handleStartTest}
                disabled={submitting || !form.name || !form.email || !form.position || !form.department || !form.education || !form.date_birth}
                className="w-full mt-2 py-3 rounded-lg text-white font-semibold text-sm disabled:opacity-40 transition hover:-translate-y-0.5"
                style={{ background: 'linear-gradient(135deg, #064E3B, #0A6E5C)' }}
              >
                {submitting ? 'Memproses...' : 'Mulai Asesmen'}
              </button>
            </CardContent>
          </Card>
        </>
      )}

      {phase === 'quiz' && questions && (
        <>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <BatteryA questions={questions} onComplete={handleAssessmentComplete} submitting={submitting} />
        </>
      )}

      {phase === 'done' && result && <DoneScreen result={result} />}
    </div>
  );
}

function Field({ label, type = 'text', value, onChange }) {
  return (
    <div>
      <label className="text-xs font-semibold uppercase text-muted-foreground">{label}</label>
      <input
        type={type}
        className="w-full mt-1 px-3 py-2.5 rounded-lg border bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A6E5C]"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function DoneScreen({ result }) {
  const summary = result.summary ?? {};
  const bySubtest = result.results?.by_subtest ?? {};
  return (
    <div className="flex flex-col items-center pt-8 space-y-5">
      <div
        className="rounded-2xl p-10 text-white text-center relative overflow-hidden w-full"
        style={{
          background: 'linear-gradient(135deg, #0A2A22 0%, #065F46 50%, #0D9488 100%)',
          boxShadow: '0 8px 32px rgba(15,23,42,.15)',
        }}
      >
        <div
          className="w-16 h-16 rounded-full mx-auto mb-5 flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,.15)', border: '2px solid rgba(255,255,255,.25)' }}
        >
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Georgia, serif' }}>
          Asesmen Selesai!
        </h2>
        <p className="text-sm opacity-80 leading-relaxed max-w-sm mx-auto mb-6">
          Terima kasih telah menyelesaikan asesmen. Berikut ringkasan hasil Anda.
        </p>

        <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
          <Stat label="Skor Kognitif" value={summary.overall_percent != null ? `${summary.overall_percent}%` : '-'} />
          <Stat
            label="Poin Kognitif"
            value={`${summary.cognitive_points ?? 0} / ${summary.cognitive_max ?? 0}`}
          />
          <Stat label="Profil DISC" value={summary.disc_dominant ?? '-'} />
          <Stat label="Holland Code" value={summary.holland_code3 ?? '-'} />
        </div>
      </div>

      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-sm">Rincian per Sub-Tes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {Object.entries(bySubtest).map(([k, v]) => (
            <div key={k} className="flex justify-between items-center text-sm py-1.5 border-b last:border-0">
              <span className="font-semibold">{k}</span>
              <span className="text-muted-foreground">{summarizeSubtest(k, v)}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-lg py-3 px-4" style={{ background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.15)' }}>
      <p className="text-[10px] uppercase tracking-wider opacity-60 mb-0.5">{label}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}

function summarizeSubtest(name, v) {
  if (!v) return '-';
  if (name === 'GI' || name === 'KA') return `${v.points}/${v.max} (${v.percent}%)`;
  if (name === 'BigFive')
    return Object.entries(v.avg ?? {}).map(([t, n]) => `${t}:${n}`).join(' · ');
  if (name === 'DISC') return `Dominant: ${v.dominant ?? '-'}`;
  if (name === 'Holland') return `Code: ${v.code3 ?? '-'}`;
  return JSON.stringify(v);
}
