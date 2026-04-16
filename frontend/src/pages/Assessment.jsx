import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getQuestions } from '@/api/question.api';
import { createParticipant } from '@/api/participant.api';
import { createAssessmentResult } from '@/api/assessment-result.api';

export default function AssessmentPage(){

  const [phase, setPhase] = useState('start');        
  const [error, setError] = useState(null);

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading]    = useState(true);

  const [form, setForm] = useState({
    name: '', email: '', position: '',
    department: '', education: '', date_birth: '',
  });
  const [participantId, setParticipantId] = useState(null);

  const [currentIdx, setCurrentIdx]  = useState(0);
  const [answers, setAnswers]        = useState({}); 
  const [submitting, setSubmitting]  = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await getQuestions();
        setQuestions(data.questions || []);
      } catch (err) {
        setError('Failed to load questions');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

const handleStartTest = async () => {
  setError(null);
  setSubmitting(true);
  try {
    const { data } = await createParticipant(form);
    setParticipantId(data.participant.id);
    setPhase('quiz');
  } catch (err) {
    setError(err.response?.data?.message || 'Failed to register');
  } finally {
    setSubmitting(false);
  }
};

  const handleSubmitTest = async () => {
    const score = questions.reduce((sum, q) => {
      return answers[q.id] === q.correct ? sum + q.points : sum;
    }, 0);

    const answersArray = questions.map((q) => ({
      question_id: q.id,
      selected: answers[q.id] ?? null,
      correct: q.correct,
      is_correct: answers[q.id] === q.correct,
    }));

    setSubmitting(true);
    setError(null);
    try {
      await createAssessmentResult({
        participant_id: participantId,
        score,
        answers: answersArray,
      });
      setPhase('done');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  const maxScore = questions.reduce((sum, q) => sum + q.points, 0);
  const question = questions[currentIdx];
  const pct = questions.length > 0 ? Math.round((currentIdx / questions.length) * 100) : 0;

  if (loading) return <div className="p-6">Loading questions...</div>;

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
            <div className="text-xs font-bold uppercase tracking-wider mb-4 inline-block px-3 py-1.5 rounded-full"
                style={{ background: 'rgba(255,255,255,.15)', border: '1px solid rgba(255,255,255,.22)' }}>
              Assessment · Onboarding
            </div>
            <h2 className="text-2xl font-semibold mb-2" style={{ fontFamily: 'Georgia, serif' }}>
              Selamat Datang!
              <br />
              <span className="italic opacity-80 text-base font-normal">Asesmen Profil Pengembangan</span>
            </h2>
            <p className="text-sm leading-relaxed opacity-90 max-w-xl">
              Asesmen ini membantu Anda dan tim memahami <strong>gaya kerja dan kekuatan Anda</strong>.
              Tidak ada jawaban benar atau salah.
            </p>
            <div className="flex flex-wrap gap-2 mt-4">
              {[`${questions.length} pertanyaan`, `${maxScore} poin`, '~5 menit'].map((label) => (
                <span key={label} className="text-xs font-semibold px-3 py-1.5 rounded-full"
                      style={{ background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.2)' }}>
                  {label}
                </span>
              ))}
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">Data Karyawan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold uppercase text-muted-foreground">Nama Lengkap *</label>
                  <input className="w-full mt-1 px-3 py-2.5 rounded-lg border bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A6E5C]"
                        value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase text-muted-foreground">Email *</label>
                  <input className="w-full mt-1 px-3 py-2.5 rounded-lg border bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A6E5C]"
                        type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold uppercase text-muted-foreground">Posisi *</label>
                  <input className="w-full mt-1 px-3 py-2.5 rounded-lg border bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A6E5C]"
                        value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase text-muted-foreground">Departemen *</label>
                  <input className="w-full mt-1 px-3 py-2.5 rounded-lg border bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A6E5C]"
                        value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold uppercase text-muted-foreground">Pendidikan *</label>
                  <select className="w-full mt-1 px-3 py-2.5 rounded-lg border bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A6E5C]"
                          value={form.education} onChange={(e) => setForm({ ...form, education: e.target.value })}>
                    <option value="">— Pilih —</option>
                    {['SMA/SMK', 'D3', 'S1', 'S2', 'S3'].map((e) => <option key={e}>{e}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase text-muted-foreground">Tanggal Lahir *</label>
                  <input className="w-full mt-1 px-3 py-2.5 rounded-lg border bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A6E5C]"
                        type="date" value={form.date_birth} onChange={(e) => setForm({ ...form, date_birth: e.target.value })} />
                </div>
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
      {phase === 'quiz' && question && (
        <Card className="p-2">
          {/* progress bar */}
          <div className="px-6 pt-5 flex items-center gap-3">
            <span className="text-sm font-bold px-3 py-1.5 rounded-full whitespace-nowrap"
                  style={{ background: '#EDF7F5', color: '#0A6E5C' }}>
              {currentIdx + 1} / {questions.length}
            </span>
            <div className="flex-1 h-2 rounded-full bg-border overflow-hidden">
              <div className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${pct}%`, background: '#0A6E5C' }} />
            </div>
            <span className="text-sm text-muted-foreground">{pct}%</span>
          </div>

          <CardHeader className="pt-6 pb-4">
            <p className="text-base text-muted-foreground italic">{question.text}</p>
          </CardHeader>

          <CardContent className="space-y-5 pb-6">
            {/* A/B choice cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {question.options.map((opt, i) => {
                const selected = answers[question.id] === i;
                return (
                  <button
                    key={i}
                    onClick={() => setAnswers({ ...answers, [question.id]: i })}
                    className="text-left p-5 rounded-xl border-2 transition-all duration-150 hover:-translate-y-0.5"
                    style={{
                      borderColor: selected ? '#0A6E5C' : '#E2E8F0',
                      background:  selected ? '#EDF7F5' : '#FAFBFC',
                      boxShadow:   selected ? '0 0 0 3px rgba(10,110,92,.08)' : 'none',
                    }}
                  >
                    <div className="w-9 h-9 rounded-lg border-2 flex items-center justify-center text-sm font-bold mb-3 transition-all"
                        style={{
                          background:  selected ? '#0A6E5C' : '#fff',
                          borderColor: selected ? '#0A6E5C' : '#E2E8F0',
                          color:       selected ? '#fff' : '#64748B',
                        }}>
                      {String.fromCharCode(65 + i)}
                    </div>
                    <p className="text-sm leading-relaxed">{opt}</p>
                  </button>
                );
              })}
            </div>

            {/* nav footer */}
            <div className="flex items-center gap-3 pt-4 border-t">
              <button
                onClick={() => setCurrentIdx(currentIdx - 1)}
                disabled={currentIdx === 0}
                className="px-5 py-2.5 text-sm font-semibold border rounded-lg disabled:opacity-30 hover:border-[#0A6E5C] hover:text-[#0A6E5C] transition"
              >
                ← Kembali
              </button>

              {/* dot nav */}
              <div className="flex flex-wrap gap-1.5 flex-1 justify-center">
                {questions.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentIdx(i)}
                    className="w-3.5 h-3.5 rounded-sm transition-all"
                    style={{
                      background: i === currentIdx ? '#0A6E5C'
                                : answers[questions[i].id] !== undefined ? '#C7E8E3'
                                : '#E2E8F0',
                      border: i === currentIdx ? '1.5px solid #064E3B' : '1.5px solid transparent',
                    }}
                  />
                ))}
              </div>

              <button
                onClick={() => {
                  if (currentIdx + 1 < questions.length) {
                    setCurrentIdx(currentIdx + 1);
                  } else {
                    handleSubmitTest();
                  }
                }}
                disabled={answers[question.id] === undefined || submitting}
                className="px-6 py-2.5 text-sm font-bold rounded-lg text-white disabled:opacity-30 transition"
                style={{ background: answers[question.id] !== undefined ? '#0A6E5C' : '#94A3B8' }}
              >
                {submitting ? 'Mengirim...' : currentIdx + 1 === questions.length ? 'Selesai ✓' : 'Berikutnya →'}
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── DONE PHASE: show score ── */}
      {phase === 'done' && (
        <div className="flex flex-col items-center pt-8">
          <div
            className="rounded-2xl p-10 text-white text-center relative overflow-hidden w-full"
            style={{
              background: 'linear-gradient(135deg, #0A2A22 0%, #065F46 50%, #0D9488 100%)',
              boxShadow: '0 8px 32px rgba(15,23,42,.15)',
            }}
          >
            <div className="absolute right-[-60px] top-[-60px] w-[200px] h-[200px] rounded-full" style={{ background: 'rgba(255,255,255,.04)' }} />
            <div className="absolute left-[-40px] bottom-[-40px] w-[140px] h-[140px] rounded-full" style={{ background: 'rgba(255,255,255,.03)' }} />

            <div className="relative z-10">
              <div className="w-16 h-16 rounded-full mx-auto mb-5 flex items-center justify-center" style={{ background: 'rgba(255,255,255,.15)', border: '2px solid rgba(255,255,255,.25)' }}>
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>

              <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Georgia, serif' }}>
                Asesmen Selesai!
              </h2>
              <p className="text-sm opacity-80 leading-relaxed max-w-sm mx-auto mb-6">
                Terima kasih telah menyelesaikan asesmen. Hasil Anda telah tersimpan dan akan ditinjau oleh tim.
              </p>

              <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto">
                <div className="rounded-lg py-3 px-4" style={{ background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.15)' }}>
                  <p className="text-[10px] uppercase tracking-wider opacity-60 mb-0.5">Pertanyaan</p>
                  <p className="text-xl font-bold">{questions.length}</p>
                </div>
                <div className="rounded-lg py-3 px-4" style={{ background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.15)' }}>
                  <p className="text-[10px] uppercase tracking-wider opacity-60 mb-0.5">Dijawab</p>
                  <p className="text-xl font-bold">{Object.keys(answers).length}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-xl border bg-card p-5 w-full text-center" style={{ borderLeft: '3px solid #0A6E5C' }}>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Hasil asesmen Anda akan diproses oleh tim. Anda dapat menutup halaman ini.
            </p>
          </div>
        </div>
      )}
    </div>
  );

}