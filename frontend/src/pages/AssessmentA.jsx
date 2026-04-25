import { useState, useEffect, useRef } from 'react';

// Sample assessment data
const TESTS_CONFIG = [
  { id: 'tk-gi', name: 'Tes Kemampuan Kognitif (GI)', icon: '🧠', duration: '12 menit', items: '3 soal demo', color: '#0A6E5C', timer: 720 },
  { id: 'bigfive', name: 'Tes Kepribadian (Big Five)', icon: '🌟', duration: '~5 menit', items: '3 pernyataan demo', color: '#7C3AED', timer: null },
  { id: 'disc', name: 'Tes Gaya Kerja (DISC)', icon: '⚙️', duration: '~5 menit', items: '1 kelompok demo', color: '#0369A1', timer: null },
  { id: 'holland', name: 'Tes Minat Kerja (Holland)', icon: '🎯', duration: '~5 menit', items: '3 pernyataan demo', color: '#059669', timer: null }
];

const GI_QUESTIONS = [
  { n: 1, type: 'mc', text: 'Bulan terakhir di kuartal pertama tahun ini adalah', opts: ['1. Januari', '2. Februari', '3. Maret', '4. April', '5. Juni'] },
  { n: 2, type: 'mc', text: 'PANAS adalah lawan kata dari', opts: ['1. dingin', '2. hangat', '3. terik', '4. sejuk', '5. mendidih'] },
  { n: 3, type: 'mc', text: 'Sebagian besar hal di bawah ini serupa satu sama lain. Manakah salah satu di antaranya yang kurang serupa dengan yang lain?', opts: ['1. Ayam', '2. Bebek', '3. Elang', '4. Ikan', '5. Burung Hantu'] }
];

const BIGFIVE_QUESTIONS = [
  { n: 1, trait: 'E', text: 'Aktif Berbicara' },
  { n: 2, trait: 'A', text: 'Mencari Kelemahan Orang Lain' },
  { n: 3, trait: 'C', text: 'Mengerjakan Tugas dengan Serius' }
];

const DISC_GROUPS = [{
  no: 1,
  options: [
    'Petualang, suka mengambil resiko',
    'Mudah bergaul, ramah, mudah setuju',
    'Mempercayai, percaya pada orang lain',
    'Penuh toleransi, menghormati orang lain'
  ]
}];

const HOLLAND_QUESTIONS = [
  { n: 1, category: 'A', text: 'Senang menonton drama' },
  { n: 2, category: 'S', text: 'Senang Melatih Orang' },
  { n: 3, category: 'A', text: 'Mampu bermain dalam drama / berakting' }
];

export default function AssessmentA() {
  const [screen, setScreen] = useState('setup'); // setup, overview, test, complete
  const [currentTest, setCurrentTest] = useState(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState(null);
  const [discMost, setDiscMost] = useState(null);
  const [discLeast, setDiscLeast] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const timerRef = useRef(null);

  const [profile, setProfile] = useState({
    fullName: '',
    position: '',
    gender: '',
    education: '',
    birthDate: ''
  });

  const [battery, setBattery] = useState(() => {
    const saved = localStorage.getItem('myx-bat-a-v8');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          profile: parsed.profile || null,
          completed: parsed.completed || [],
          results: parsed.results || {}
        };
      } catch (e) {
        return { profile: null, completed: [], results: {} };
      }
    }
    return { profile: null, completed: [], results: {} };
  });

  useEffect(() => {
    localStorage.setItem('myx-bat-a-v8', JSON.stringify(battery));
  }, [battery]);

  // Timer
  useEffect(() => {
    if (timeLeft !== null && timeLeft > 0) {
      timerRef.current = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timerRef.current);
    }
    if (timeLeft === 0) finishTest();
  }, [timeLeft]);

  const startTest = (testId) => {
    setCurrentTest(testId);
    setQuestionIndex(0);
    setAnswer(null);
    setDiscMost(null);
    setDiscLeast(null);
    const config = TESTS_CONFIG.find(t => t.id === testId);
    if (config?.timer) setTimeLeft(config.timer);
    setScreen('test');
  };

  const handleAnswer = (ans) => {
    setAnswer(ans);
    setTimeout(() => {
      setAnswer(null);
      const maxQ = currentTest === 'tk-gi' ? GI_QUESTIONS.length :
                   currentTest === 'bigfive' ? BIGFIVE_QUESTIONS.length :
                   currentTest === 'holland' ? HOLLAND_QUESTIONS.length : 1;
      if (questionIndex + 1 < maxQ) {
        setQuestionIndex(questionIndex + 1);
      } else {
        finishTest();
      }
    }, 300);
  };

  useEffect(() => {
    if (currentTest === 'disc' && discMost !== null && discLeast !== null && discMost !== discLeast) {
      setTimeout(() => {
        setDiscMost(null);
        setDiscLeast(null);
        if (questionIndex + 1 < DISC_GROUPS.length) {
          setQuestionIndex(questionIndex + 1);
        } else {
          finishTest();
        }
      }, 300);
    }
  }, [discMost, discLeast]);

  const finishTest = () => {
    if (timeLeft !== null) setTimeLeft(null);
    setBattery(prev => ({
      ...prev,
      completed: [...(prev.completed || []), currentTest]
    }));
    if ((battery.completed || []).length + 1 >= TESTS_CONFIG.length) {
      setScreen('complete');
    } else {
      setScreen('overview');
    }
    setCurrentTest(null);
    setQuestionIndex(0);
  };

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const s = {
    page: { minHeight: '100vh', background: '#FAFAF8', fontFamily: "'DM Sans', sans-serif", fontSize: '14px' },
    nav: { background: 'linear-gradient(135deg, #064E3B, #0A6E5C)', padding: '0 22px', position: 'sticky', top: 0, zIndex: 200, boxShadow: '0 2px 12px rgba(6,78,59,0.25)' },
    navInner: { maxWidth: '900px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '56px' },
    timer: { background: '#064E3B', padding: '0 22px', position: 'sticky', top: '56px', zIndex: 190, display: timeLeft !== null ? 'block' : 'none' },
    timerInner: { maxWidth: '900px', margin: '0 auto', padding: '8px 0', display: 'flex', alignItems: 'center', gap: '12px' },
    wrap: { maxWidth: '900px', margin: '0 auto', padding: '24px 18px 80px' },
    card: { background: '#fff', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '22px', boxShadow: '0 1px 4px rgba(15,23,42,0.07)', marginBottom: '16px' },
    hero: { background: 'linear-gradient(135deg, #0A2A22, #064E3B 45%, #0A6E5C)', borderRadius: '14px', padding: '32px', color: '#fff', marginBottom: '20px', position: 'relative', overflow: 'hidden', boxShadow: '0 8px 32px rgba(15,23,42,0.12)' },
    testItem: { background: '#fff', border: '1.5px solid #E2E8F0', borderRadius: '9px', padding: '16px', display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '10px', transition: '0.2s', cursor: 'pointer' },
    testDone: { borderColor: '#BBF7D0', background: '#ECFDF5', pointerEvents: 'none' },
    testActive: { borderColor: '#0A6E5C', background: '#EDF7F5' },
    btn: { background: 'linear-gradient(135deg, #064E3B, #0A6E5C)', color: '#fff', padding: '12px 24px', borderRadius: '9px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', border: 'none', width: '100%', marginTop: '8px' },
    choice: { display: 'flex', alignItems: 'flex-start', gap: '11px', padding: '11px 14px', borderRadius: '9px', border: '1.5px solid #E2E8F0', background: '#FAFAFA', cursor: 'pointer', transition: '0.14s', marginBottom: '8px' },
    choiceSel: { borderColor: '#0A6E5C', background: '#C7E8E3' }
  };

  return (
    <div style={s.page}>
      <nav style={s.nav}>
        <div style={s.navInner}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '16px', fontWeight: 700, color: '#fff', letterSpacing: '0.04em' }}>Myralix</span>
            <span style={{ background: 'rgba(255,255,255,0.18)', color: '#fff', padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 700 }}>Battery A</span>
          </div>
          <div style={{ display: 'flex', gap: '7px' }}>
            {TESTS_CONFIG.map(t => (
              <div key={t.id} style={{ width: '8px', height: '8px', borderRadius: '50%', background: (battery.completed || []).includes(t.id) ? '#fff' : 'rgba(255,255,255,0.3)', transition: '0.3s' }} />
            ))}
          </div>
        </div>
      </nav>

      {timeLeft !== null && (
        <div style={s.timer}>
          <div style={s.timerInner}>
            <span style={{ fontSize: '10px', fontWeight: 700, padding: '3px 9px', borderRadius: '20px', background: timeLeft <= 60 ? '#FCA5A5' : 'rgba(255,255,255,0.2)', color: '#fff' }}>TIMER</span>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '20px', fontWeight: 700, color: timeLeft <= 60 ? '#FCA5A5' : '#fff', minWidth: '60px' }}>{formatTime(timeLeft)}</div>
            <div style={{ flex: 1, background: 'rgba(255,255,255,0.2)', borderRadius: '99px', height: '5px', overflow: 'hidden' }}>
              <div style={{ height: '5px', borderRadius: '99px', background: timeLeft <= 60 ? '#FCA5A5' : '#fff', width: `${(timeLeft / 720) * 100}%`, transition: 'width 0.5s' }} />
            </div>
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.65)' }}>GI: 12 menit</span>
          </div>
        </div>
      )}

      <div style={s.wrap}>
        {screen === 'setup' && (
          <div>
            <div style={s.hero}>
              <div style={{ position: 'absolute', right: '-5px', top: '-15px', fontFamily: "'Playfair Display', serif", fontSize: '140px', fontWeight: 700, opacity: 0.06, lineHeight: 1 }}>A</div>
              <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '28px', fontWeight: 700, marginBottom: '8px' }}>Myralix Battery A</h1>
              <p style={{ fontSize: '14px', opacity: 0.9, lineHeight: 1.6, marginBottom: '12px' }}>Asesmen komprehensif untuk mengukur kemampuan kognitif dan kepribadian kandidat. Durasi total ±25 menit (demo).</p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {['🧠 Kognitif', '🌟 Kepribadian', '⚙️ Gaya Kerja', '🎯 Minat'].map(tag => (
                  <span key={tag} style={{ background: 'rgba(255,255,255,0.15)', padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 600 }}>{tag}</span>
                ))}
              </div>
            </div>
            <div style={s.card}>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '20px', marginBottom: '16px', color: '#334155' }}>Data Kandidat</h2>
              <form onSubmit={(e) => { e.preventDefault(); setBattery({ ...battery, profile }); setScreen('overview'); }}>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#64748B', marginBottom: '4px' }}>Nama Lengkap</label>
                  <input required value={profile.fullName} onChange={(e) => setProfile({ ...profile, fullName: e.target.value })} style={{ width: '100%', background: '#FAFAFA', border: '1.5px solid #E2E8F0', borderRadius: '9px', padding: '10px 13px', fontSize: '14px', outline: 'none' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#64748B', marginBottom: '4px' }}>Posisi</label>
                    <input required value={profile.position} onChange={(e) => setProfile({ ...profile, position: e.target.value })} style={{ width: '100%', background: '#FAFAFA', border: '1.5px solid #E2E8F0', borderRadius: '9px', padding: '10px 13px', fontSize: '14px', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#64748B', marginBottom: '4px' }}>Jenis Kelamin</label>
                    <select required value={profile.gender} onChange={(e) => setProfile({ ...profile, gender: e.target.value })} style={{ width: '100%', background: '#FAFAFA', border: '1.5px solid #E2E8F0', borderRadius: '9px', padding: '10px 13px', fontSize: '14px', outline: 'none' }}>
                      <option value="">Pilih</option>
                      <option value="Laki-laki">Laki-laki</option>
                      <option value="Perempuan">Perempuan</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#64748B', marginBottom: '4px' }}>Pendidikan</label>
                    <select required value={profile.education} onChange={(e) => setProfile({ ...profile, education: e.target.value })} style={{ width: '100%', background: '#FAFAFA', border: '1.5px solid #E2E8F0', borderRadius: '9px', padding: '10px 13px', fontSize: '14px', outline: 'none' }}>
                      <option value="">Pilih</option>
                      <option value="SMA">SMA</option>
                      <option value="D3">D3</option>
                      <option value="S1">S1</option>
                      <option value="S2">S2</option>
                      <option value="S3">S3</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#64748B', marginBottom: '4px' }}>Tanggal Lahir</label>
                    <input type="date" required value={profile.birthDate} onChange={(e) => setProfile({ ...profile, birthDate: e.target.value })} style={{ width: '100%', background: '#FAFAFA', border: '1.5px solid #E2E8F0', borderRadius: '9px', padding: '10px 13px', fontSize: '14px', outline: 'none' }} />
                  </div>
                </div>
                <button type="submit" style={s.btn}>Mulai Asesmen →</button>
              </form>
            </div>
          </div>
        )}

        {screen === 'overview' && (
          <div>
            <div style={s.card}>
              <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '24px', marginBottom: '8px', color: '#334155' }}>Selamat Datang, {battery.profile?.fullName}</h1>
              <p style={{ fontSize: '14px', color: '#64748B' }}>Lengkapi 4 tes di bawah ini secara berurutan.</p>
            </div>
            {TESTS_CONFIG.map((test, idx) => {
              const done = (battery.completed || []).includes(test.id);
              const avail = idx === 0 || (battery.completed || []).length >= idx;
              return (
                <div key={test.id} style={{ ...s.testItem, ...(done ? s.testDone : avail ? s.testActive : {}), opacity: avail ? 1 : 0.5, pointerEvents: avail && !done ? 'auto' : 'none' }} onClick={() => avail && !done && startTest(test.id)}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '50%', display: 'grid', placeItems: 'center', fontSize: '18px', background: done ? '#059669' : avail ? test.color : '#E2E8F0', color: '#fff', flexShrink: 0 }}>
                    {done ? '✓' : test.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '2px', color: '#334155' }}>{test.name}</div>
                    <div style={{ fontSize: '11px', color: '#64748B' }}>{test.duration} · {test.items}</div>
                  </div>
                  <div style={{ fontSize: '11px', color: done ? '#059669' : '#64748B', fontWeight: 700, flexShrink: 0 }}>
                    {done ? '✓ SELESAI' : avail ? 'MULAI →' : '🔒'}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {screen === 'test' && currentTest === 'tk-gi' && GI_QUESTIONS[questionIndex] && (
          <div style={s.card}>
            <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 700, marginBottom: '4px' }}>SOAL {questionIndex + 1} DARI {GI_QUESTIONS.length}</div>
              <div style={{ background: '#E2E8F0', borderRadius: '99px', height: '5px', overflow: 'hidden' }}>
                <div style={{ height: '5px', borderRadius: '99px', background: '#0A6E5C', width: `${((questionIndex + 1) / GI_QUESTIONS.length) * 100}%`, transition: 'width 0.4s' }} />
              </div>
            </div>
            <div style={{ fontSize: '15px', lineHeight: 1.7, color: '#334155', fontWeight: 500, marginBottom: '14px' }}>{GI_QUESTIONS[questionIndex].text}</div>
            <div>
              {GI_QUESTIONS[questionIndex].opts.map((opt, i) => {
                const sel = answer === i;
                return (
                  <div key={i} style={{ ...s.choice, ...(sel ? s.choiceSel : {}) }} onClick={() => handleAnswer(i)}>
                    <div style={{ width: '26px', height: '26px', borderRadius: '6px', border: '1.5px solid', borderColor: sel ? '#0A6E5C' : '#E2E8F0', background: sel ? '#0A6E5C' : '#fff', color: sel ? '#fff' : '#334155', display: 'grid', placeItems: 'center', fontSize: '11px', fontWeight: 800 }}>
                      {String.fromCharCode(65 + i)}
                    </div>
                    <div style={{ fontSize: '13px', lineHeight: 1.55, color: '#334155' }}>{opt}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {screen === 'test' && currentTest === 'bigfive' && BIGFIVE_QUESTIONS[questionIndex] && (
          <div style={s.card}>
            <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 700, marginBottom: '4px' }}>PERNYATAAN {questionIndex + 1} DARI {BIGFIVE_QUESTIONS.length}</div>
              <div style={{ background: '#E2E8F0', borderRadius: '99px', height: '5px', overflow: 'hidden' }}>
                <div style={{ height: '5px', borderRadius: '99px', background: '#7C3AED', width: `${((questionIndex + 1) / BIGFIVE_QUESTIONS.length) * 100}%`, transition: 'width 0.4s' }} />
              </div>
            </div>
            <div style={{ fontSize: '17px', fontWeight: 600, marginBottom: '24px', textAlign: 'center', color: '#334155' }}>{BIGFIVE_QUESTIONS[questionIndex].text}</div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '12px' }}>
              {[1, 2, 3, 4, 5].map(v => (
                <button key={v} onClick={() => handleAnswer(v)} style={{ width: '50px', height: '50px', borderRadius: '50%', border: '2px solid', borderColor: answer === v ? '#7C3AED' : '#E2E8F0', background: answer === v ? '#F5F3FF' : '#fff', cursor: 'pointer', fontSize: '16px', fontWeight: 700, color: answer === v ? '#7C3AED' : '#334155', transition: '0.2s' }}>{v}</button>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#94A3B8', textAlign: 'center', padding: '0 10px' }}>
              <span style={{ width: '50px' }}>Sangat<br/>Tidak<br/>Sesuai</span>
              <span style={{ width: '50px' }}>Sangat<br/>Sesuai</span>
            </div>
          </div>
        )}

        {screen === 'test' && currentTest === 'disc' && DISC_GROUPS[questionIndex] && (
          <div style={s.card}>
            <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 700, marginBottom: '4px' }}>KELOMPOK {questionIndex + 1} DARI {DISC_GROUPS.length}</div>
              <div style={{ background: '#E2E8F0', borderRadius: '99px', height: '5px', overflow: 'hidden' }}>
                <div style={{ height: '5px', borderRadius: '99px', background: '#0369A1', width: `${((questionIndex + 1) / DISC_GROUPS.length) * 100}%`, transition: 'width 0.4s' }} />
              </div>
            </div>
            <div style={{ fontSize: '13px', color: '#64748B', marginBottom: '16px', textAlign: 'center' }}>
              Pilih <strong style={{ color: '#0369A1' }}>M</strong> untuk yang <strong>PALING</strong> seperti Anda, dan <strong style={{ color: '#DC2626' }}>L</strong> untuk yang <strong>PALING TIDAK</strong> seperti Anda.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {DISC_GROUPS[questionIndex].options.map((opt, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: '#FAFAFA', border: '1.5px solid #E2E8F0', borderRadius: '9px' }}>
                  <button onClick={() => setDiscMost(i)} style={{ width: '32px', height: '32px', borderRadius: '6px', border: '2px solid', borderColor: discMost === i ? '#0369A1' : '#E2E8F0', background: discMost === i ? '#0369A1' : '#fff', color: discMost === i ? '#fff' : '#64748B', fontSize: '12px', fontWeight: 800, cursor: 'pointer', transition: '0.2s', flexShrink: 0 }}>M</button>
                  <div style={{ flex: 1, fontSize: '13px', color: '#334155', lineHeight: 1.5 }}>{opt}</div>
                  <button onClick={() => setDiscLeast(i)} style={{ width: '32px', height: '32px', borderRadius: '6px', border: '2px solid', borderColor: discLeast === i ? '#DC2626' : '#E2E8F0', background: discLeast === i ? '#DC2626' : '#fff', color: discLeast === i ? '#fff' : '#64748B', fontSize: '12px', fontWeight: 800, cursor: 'pointer', transition: '0.2s', flexShrink: 0 }}>L</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {screen === 'test' && currentTest === 'holland' && HOLLAND_QUESTIONS[questionIndex] && (
          <div style={s.card}>
            <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 700, marginBottom: '4px' }}>PERNYATAAN {questionIndex + 1} DARI {HOLLAND_QUESTIONS.length}</div>
              <div style={{ background: '#E2E8F0', borderRadius: '99px', height: '5px', overflow: 'hidden' }}>
                <div style={{ height: '5px', borderRadius: '99px', background: '#059669', width: `${((questionIndex + 1) / HOLLAND_QUESTIONS.length) * 100}%`, transition: 'width 0.4s' }} />
              </div>
            </div>
            <div style={{ fontSize: '17px', fontWeight: 600, marginBottom: '24px', textAlign: 'center', color: '#334155' }}>{HOLLAND_QUESTIONS[questionIndex].text}</div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
              {['YA', 'TIDAK'].map((ans, i) => (
                <button key={ans} onClick={() => handleAnswer(i)} style={{ flex: 1, maxWidth: '200px', padding: '16px 24px', borderRadius: '9px', border: '2px solid', borderColor: answer === i ? '#059669' : '#E2E8F0', background: answer === i ? '#ECFDF5' : '#fff', color: answer === i ? '#059669' : '#334155', fontSize: '16px', fontWeight: 700, cursor: 'pointer', transition: '0.2s' }}>{ans}</button>
              ))}
            </div>
          </div>
        )}

        {screen === 'complete' && (
          <div style={s.card}>
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{ fontSize: '60px', marginBottom: '20px' }}>✓</div>
              <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '28px', color: '#059669', marginBottom: '12px' }}>Asesmen Selesai!</h1>
              <p style={{ fontSize: '14px', color: '#64748B', lineHeight: 1.6 }}>Terima kasih <strong>{battery.profile?.fullName}</strong> telah menyelesaikan Myralix Battery A.<br/>Hasil asesmen Anda akan segera diproses oleh tim recruitment.</p>
              <div style={{ marginTop: '24px', padding: '16px', background: '#F0FDF4', borderRadius: '9px', border: '1px solid #BBF7D0' }}>
                <div style={{ fontSize: '11px', color: '#059669', fontWeight: 700, marginBottom: '4px' }}>4/4 TES SELESAI</div>
                <div style={{ fontSize: '12px', color: '#64748B' }}>Semua tes telah diselesaikan dengan baik.</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
