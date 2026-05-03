import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getQuestionsByAssessmentCode } from '@/api/question.api';
import { createParticipantByEmail } from '@/api/participant.api';
import { submitAssessment, getActiveProgress } from '@/api/assessment-battery-result.api';
import BatteryA from '@/components/assessment/BatteryA';

const ASSESSMENT_CODE = 'myralix_battery_a';
const ASSESSMENT_ID = 1;
const EMAIL_LS_KEY = 'assessment:lastEmail';

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
  const [completedSubtests, setCompletedSubtests] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const startedAtRef = useRef(null);

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

    const savedEmail = localStorage.getItem(EMAIL_LS_KEY);
    if (savedEmail) setForm((f) => ({ ...f, email: savedEmail }));
  }, []);

  const handleStartTest = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const { data } = await createParticipantByEmail(form);
      const participant = data.participant;
      setParticipantId(participant.id);
      localStorage.setItem(EMAIL_LS_KEY, participant.email);
      startedAtRef.current = new Date().toISOString();

      const { data: progressData } = await getActiveProgress(participant.id, ASSESSMENT_ID);
      const progress = progressData.progress || {};
      setCompletedSubtests(progress.completed_subtests || []);

      if (progress.status === 'completed') {
        setPhase('done');
      } else {
        setPhase('quiz');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal mendaftarkan peserta');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubtestComplete = async (_subtestKey, subtestAnswers) => {
    setSubmitting(true);
    setError(null);
    try {
      const { data } = await submitAssessment({
        participant_id: participantId,
        assessment_id: ASSESSMENT_ID,
        answers: subtestAnswers,
        started_at: startedAtRef.current,
      });
      const row = data.result;
      const newCompleted = Object.keys(row?.results?.by_subtest ?? {});
      setCompletedSubtests(newCompleted);

      if (row?.status === 'completed') {
        setPhase('done');
      }
      return row;
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal mengirim hasil');
      throw err;
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
          <BatteryA
            questions={questions}
            completedSubtests={completedSubtests}
            onSubtestComplete={handleSubtestComplete}
            submitting={submitting}
          />
        </>
      )}

      {phase === 'done' && <DoneScreen />}
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

function DoneScreen() {
  return (
    <div className="flex flex-col items-center pt-8">
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
        <h2 className="text-2xl font-bold mb-3" style={{ fontFamily: 'Georgia, serif' }}>
          Asesmen Selesai!
        </h2>
        <p className="text-sm opacity-90 leading-relaxed max-w-md mx-auto">
          Terima kasih telah menyelesaikan seluruh rangkaian asesmen.
          Hasil Anda telah tersimpan dan akan ditinjau oleh tim rekrutmen.
        </p>
        <p className="text-xs opacity-70 leading-relaxed max-w-md mx-auto mt-3">
          Tim akan menghubungi Anda untuk tahap selanjutnya. Anda dapat menutup halaman ini.
        </p>
      </div>
    </div>
  );
}
