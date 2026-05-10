import { useState, useEffect, useRef } from 'react';
import { SUBS, ORDER_A, GI_QUESTIONS, KA_QUESTIONS } from '@/constants/assessmentData';
import { createParticipantByEmail } from '@/api/participant.api';
import { submitAssessment } from '@/api/assessment-battery-result.api';

const STORAGE_KEY = 'myx-bat-a-v8';
const ASSESSMENT_ID_BATTERY_A = 1;

export default function AssessmentAPage() {
  const [screen, setScreen] = useState('setup'); // setup | overview | test | done
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    position: '',
    department: '',
    education: '',
    date_birth: '',
    participant_id: null,
  });
  const [activeSubtest, setActiveSubtest] = useState(null);
  const [answers, setAnswers] = useState({});
  const [completedTests, setCompletedTests] = useState([]);
  const [questionIdx, setQuestionIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(null);
  const [setupSubmitting, setSetupSubmitting] = useState(false);
  const [setupError, setSetupError] = useState(null);
  const [submitStatus, setSubmitStatus] = useState('idle'); // idle | submitting | success | error
  const [submitError, setSubmitError] = useState(null);
  const startedAtRef = useRef(null);
  const timerRef = useRef(null);

  // Load from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        if (data.profile) setProfile((p) => ({ ...p, ...data.profile }));
        if (data.answers) setAnswers(data.answers);
        if (data.completedTests) setCompletedTests(data.completedTests);
        if (data.startedAt) startedAtRef.current = data.startedAt;
      }
    } catch (e) {
      console.error('Load error:', e);
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        profile,
        answers,
        completedTests,
        startedAt: startedAtRef.current,
        timestamp: new Date().toISOString(),
      }));
    } catch (e) {
      console.error('Save error:', e);
    }
  }, [profile, answers, completedTests]);

  // Timer for GI/KA
  useEffect(() => {
    if (screen === 'test' && timeLeft !== null && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            handleFinishSubtest();
            return 0;
          }
          return t - 1;
        });
      }, 1000);
      return () => clearInterval(timerRef.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, timeLeft]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleStartAssessment = async () => {
    if (!profile.name || !profile.email || !profile.position || !profile.department || !profile.education || !profile.date_birth) {
      setSetupError('Mohon lengkapi semua data peserta.');
      return;
    }
    setSetupSubmitting(true);
    setSetupError(null);
    try {
      const { data } = await createParticipantByEmail({
        name: profile.name,
        email: profile.email,
        position: profile.position,
        department: profile.department,
        education: profile.education,
        date_birth: profile.date_birth,
      });
      setProfile((p) => ({ ...p, participant_id: data?.participant?.id ?? null }));
      if (!startedAtRef.current) startedAtRef.current = new Date().toISOString();
      setScreen('overview');
    } catch (e) {
      setSetupError(e?.response?.data?.message || e?.message || 'Gagal menyimpan data peserta.');
    } finally {
      setSetupSubmitting(false);
    }
  };

  const handleStartSubtest = (code) => {
    setActiveSubtest(code);
    setQuestionIdx(0);
    if (SUBS[code].time) setTimeLeft(SUBS[code].time);
    setScreen('test');
  };

  const handleAnswerChange = (value) => {
    setAnswers((prev) => ({
      ...prev,
      [activeSubtest]: { ...prev[activeSubtest], [questionIdx]: value },
    }));
  };

  const handleNext = () => {
    const currentTest = activeSubtest === 'GI' ? GI_QUESTIONS : KA_QUESTIONS;
    if (questionIdx < currentTest.length - 1) {
      setQuestionIdx(questionIdx + 1);
    } else {
      handleFinishSubtest();
    }
  };

  const handlePrev = () => {
    if (questionIdx > 0) setQuestionIdx(questionIdx - 1);
  };

  const handleFinishSubtest = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    const finishedSubtest = activeSubtest;
    const newCompleted = completedTests.includes(finishedSubtest)
      ? completedTests
      : [...completedTests, finishedSubtest];
    setCompletedTests(newCompleted);
    setActiveSubtest(null);
    setTimeLeft(null);

    if (newCompleted.length >= ORDER_A.length) {
      setScreen('done');
    } else {
      setScreen('overview');
    }
  };

  // Flatten the per-subtest answers state into the backend submission shape.
  const buildAnswerArray = () => {
    const flat = [];
    for (const subtest of Object.keys(answers)) {
      const perTest = answers[subtest] || {};
      for (const idxStr of Object.keys(perTest)) {
        flat.push({
          index: Number(idxStr),
          selected: perTest[idxStr],
          subtest,
        });
      }
    }
    return flat;
  };

  const submitToBackend = async () => {
    if (!profile.participant_id) {
      setSubmitStatus('error');
      setSubmitError('Participant ID belum tersedia. Silakan ulangi pengisian data peserta.');
      return;
    }
    setSubmitStatus('submitting');
    setSubmitError(null);
    try {
      await submitAssessment({
        participant_id: profile.participant_id,
        assessment_id: ASSESSMENT_ID_BATTERY_A,
        answers: buildAnswerArray(),
        started_at: startedAtRef.current,
      });
      setSubmitStatus('success');
    } catch (e) {
      setSubmitStatus('error');
      setSubmitError(e?.response?.data?.message || e?.message || 'Gagal mengirim hasil ke server.');
    }
  };

  // Auto-submit once when the candidate reaches the done screen.
  useEffect(() => {
    if (screen === 'done' && submitStatus === 'idle') {
      submitToBackend();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen]);

  // === RENDER SCREENS ===

  if (screen === 'setup') {
    return (
      <div className="min-h-screen bg-[#FAFAF8]">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="bg-gradient-to-br from-[#0A2A22] via-[#064E3B] to-[#0A6E5C] rounded-2xl p-10 text-white mb-6 shadow-2xl relative overflow-hidden">
            <div className="absolute right-[-20px] top-[-40px] text-[180px] font-bold opacity-[0.06] pointer-events-none" style={{ fontFamily: "'Playfair Display', serif" }}>A</div>
            <div className="bg-white/15 border border-white/25 inline-block px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
              Assessment · Battery A
            </div>
            <h1 className="text-4xl font-bold mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>Selamat Datang!</h1>
            <p className="text-lg opacity-90 italic mb-6">Asesmen Profil Pengembangan</p>
            <p className="text-sm leading-relaxed max-w-2xl opacity-90">
              Asesmen ini membantu Anda dan tim memahami <strong>kemampuan kognitif, kepribadian, gaya kerja, dan minat karir</strong>.
            </p>
            <div className="flex gap-3 mt-6 flex-wrap">
              <span className="bg-white/12 border border-white/20 px-4 py-2 rounded-full text-xs font-semibold">50 soal</span>
              <span className="bg-white/12 border border-white/20 px-4 py-2 rounded-full text-xs font-semibold">2 sub-tes</span>
              <span className="bg-white/12 border border-white/20 px-4 py-2 rounded-full text-xs font-semibold">~20 menit</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border p-8">
            <h2 className="text-sm uppercase tracking-wider text-slate-500 font-bold mb-6">Data Peserta</h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Nama Lengkap *</label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 focus:border-teal-600 focus:outline-none bg-slate-50 transition"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Email *</label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 focus:border-teal-600 focus:outline-none bg-slate-50 transition"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Posisi *</label>
                <input
                  type="text"
                  value={profile.position}
                  onChange={(e) => setProfile({ ...profile, position: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 focus:border-teal-600 focus:outline-none bg-slate-50 transition"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Departemen *</label>
                <input
                  type="text"
                  value={profile.department}
                  onChange={(e) => setProfile({ ...profile, department: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 focus:border-teal-600 focus:outline-none bg-slate-50 transition"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Pendidikan *</label>
                <select
                  value={profile.education}
                  onChange={(e) => setProfile({ ...profile, education: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 focus:border-teal-600 focus:outline-none bg-slate-50 transition"
                >
                  <option value="">— Pilih —</option>
                  <option value="SMA/SMK">SMA/SMK</option>
                  <option value="D3">D3</option>
                  <option value="S1">S1</option>
                  <option value="S2">S2</option>
                  <option value="S3">S3</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Tanggal Lahir *</label>
                <input
                  type="date"
                  value={profile.date_birth}
                  onChange={(e) => setProfile({ ...profile, date_birth: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 focus:border-teal-600 focus:outline-none bg-slate-50 transition"
                />
              </div>
            </div>

            {setupError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-700 mb-4">
                {setupError}
              </div>
            )}

            <button
              onClick={handleStartAssessment}
              disabled={setupSubmitting}
              className="w-full bg-gradient-to-r from-[#064E3B] to-[#0A6E5C] text-white py-4 rounded-lg font-bold text-sm uppercase tracking-wider hover:shadow-lg transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0"
            >
              {setupSubmitting ? 'Menyimpan…' : 'Mulai Asesmen'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (screen === 'overview') {
    return (
      <div className="min-h-screen bg-[#FAFAF8]">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <h2 className="text-2xl font-bold mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>Pilih Sub-Tes</h2>
          {ORDER_A.map((code) => {
            const sub = SUBS[code];
            const isDone = completedTests.includes(code);
            const isActive = !isDone;

            return (
              <div
                key={code}
                className={`mb-4 p-6 rounded-xl border-2 transition-all ${
                  isDone
                    ? 'bg-emerald-50 border-emerald-200'
                    : isActive
                    ? 'bg-white border-teal-600 shadow-lg cursor-pointer hover:shadow-xl'
                    : 'bg-slate-50 border-slate-200 opacity-50'
                }`}
                onClick={() => isActive && handleStartSubtest(code)}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl border-2 ${
                    isDone ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-teal-100 border-teal-600 text-teal-600'
                  }`}>
                    {isDone ? '✓' : sub.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-1">{sub.name}</h3>
                    <p className="text-sm text-slate-600">{sub.instruction}</p>
                    <div className="flex gap-3 mt-2">
                      <span className="text-xs bg-slate-100 px-3 py-1 rounded-full">{sub.items} soal</span>
                      {sub.time && <span className="text-xs bg-amber-100 px-3 py-1 rounded-full">{sub.time / 60} menit</span>}
                    </div>
                  </div>
                  <div className="text-center min-w-[80px]">
                    {isDone ? (
                      <>
                        <div className="text-2xl">✅</div>
                        <div className="text-xs font-bold text-emerald-600 uppercase mt-1">Selesai</div>
                      </>
                    ) : isActive ? (
                      <button className="bg-teal-600 text-white px-6 py-2 rounded-lg font-bold text-sm hover:bg-teal-700 transition">
                        Mulai
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (screen === 'test' && activeSubtest) {
    const currentTest = activeSubtest === 'GI' ? GI_QUESTIONS : KA_QUESTIONS;
    const currentQ = currentTest[questionIdx];
    const currentAnswer = answers[activeSubtest]?.[questionIdx];

    return (
      <div className="min-h-screen bg-[#FAFAF8]">
        {/* Timer Bar */}
        {timeLeft !== null && (
          <div className="bg-[#064E3B] px-6 py-3 sticky top-13 z-10">
            <div className="max-w-4xl mx-auto flex items-center gap-4">
              <span className="text-white font-bold text-2xl font-serif min-w-[70px]">{formatTime(timeLeft)}</span>
              <div className="flex-1 bg-white/20 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-2 rounded-full transition-all ${timeLeft < 60 ? 'bg-red-400 animate-pulse' : 'bg-white'}`}
                  style={{ width: `${(timeLeft / SUBS[activeSubtest].time) * 100}%` }}
                />
              </div>
              <span className="text-white/70 text-xs">{SUBS[activeSubtest].name}</span>
            </div>
          </div>
        )}

        {/* Progress Bar */}
        <div className="bg-white border-b px-6 py-3 sticky top-[104px] z-10 shadow-sm">
          <div className="max-w-4xl mx-auto flex items-center gap-4">
            <span className="text-xs font-bold text-teal-600 bg-teal-100 px-3 py-1 rounded-full">
              {questionIdx + 1} / {currentTest.length}
            </span>
            <div className="flex-1 bg-slate-200 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-1.5 bg-teal-600 rounded-full transition-all"
                style={{ width: `${((questionIdx + 1) / currentTest.length) * 100}%` }}
              />
            </div>
            <span className="text-xs text-slate-400">{Math.round(((questionIdx + 1) / currentTest.length) * 100)}%</span>
          </div>
        </div>

        {/* Question Content */}
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="bg-white rounded-2xl shadow-lg border p-8 mb-6">
            <div className="text-base leading-relaxed mb-6 whitespace-pre-wrap">{currentQ.text}</div>

            {currentQ.type === 'mc' && (
              <div className="space-y-3">
                {currentQ.opts.map((opt, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleAnswerChange(idx)}
                    className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      currentAnswer === idx
                        ? 'border-teal-600 bg-teal-50'
                        : 'border-slate-200 hover:border-teal-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-md border-2 flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      currentAnswer === idx ? 'bg-teal-600 border-teal-600 text-white' : 'border-slate-300'
                    }`}>
                      {String.fromCharCode(65 + idx)}
                    </div>
                    <span className="text-sm leading-relaxed">{opt}</span>
                  </div>
                ))}
              </div>
            )}

            {currentQ.type === 'input' && (
              <div>
                <input
                  type="text"
                  value={currentAnswer || ''}
                  onChange={(e) => handleAnswerChange(e.target.value)}
                  placeholder={currentQ.hint || 'Masukkan jawaban'}
                  className="w-full max-w-md px-4 py-3 rounded-lg border-2 border-slate-200 focus:border-teal-600 focus:outline-none"
                />
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrev}
              disabled={questionIdx === 0}
              className="px-6 py-3 rounded-lg border-2 border-slate-200 font-semibold text-sm hover:border-teal-600 hover:text-teal-600 disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              ← Sebelumnya
            </button>
            <button
              onClick={handleNext}
              className="flex-1 bg-teal-600 text-white px-6 py-3 rounded-lg font-bold text-sm hover:bg-teal-700 transition"
            >
              {questionIdx === currentTest.length - 1 ? 'Selesai' : 'Selanjutnya →'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (screen === 'done') {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center p-6">
        <div className="max-w-2xl w-full">
          <div className="bg-gradient-to-br from-[#0A2A22] via-[#064E3B] to-[#0D9488] rounded-2xl p-12 text-white text-center shadow-2xl">
            <div className="w-20 h-20 rounded-full bg-white/15 border-2 border-white/25 mx-auto mb-6 flex items-center justify-center">
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
              Asesmen Selesai!
            </h1>
            <p className="text-lg opacity-90 leading-relaxed max-w-lg mx-auto mb-4">
              Terima kasih telah menyelesaikan seluruh rangkaian asesmen Battery A.
              Hasil Anda telah tersimpan dan akan ditinjau oleh tim rekrutmen.
            </p>

            {submitStatus === 'submitting' && (
              <div className="mt-6 bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-xs">
                Menyimpan hasil ke server…
              </div>
            )}
            {submitStatus === 'success' && (
              <div className="mt-6 bg-emerald-500/20 border border-emerald-400/40 rounded-lg px-4 py-2.5 text-xs text-emerald-50">
                ✓ Hasil tersimpan
              </div>
            )}
            {submitStatus === 'error' && (
              <div className="mt-6 bg-red-500/20 border border-red-400/40 rounded-lg px-4 py-3 text-xs text-red-50">
                <p className="font-semibold mb-2">Gagal mengirim hasil:</p>
                <p className="opacity-90 mb-3">{submitError}</p>
                <button
                  onClick={submitToBackend}
                  className="bg-white/20 hover:bg-white/30 px-4 py-1.5 rounded text-[11px] font-bold uppercase tracking-wider"
                >
                  Coba Lagi
                </button>
              </div>
            )}

            <p className="text-sm opacity-70 leading-relaxed mt-4">
              Tim akan menghubungi Anda untuk tahap selanjutnya. Anda dapat menutup halaman ini.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
