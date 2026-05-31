import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Loader2, AlertTriangle, Mail, CheckCircle2, MessageSquare, Clock, Send,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  getQaSummary, verifyQaEmail, submitQa,
} from '@/api/portal-qa.api';
import { PORTAL_TOKEN_KEY } from '@/api/portal-axios';

/* ─── Bahasa Indonesia copy (kept in one place for easy editing) ─── */
const T = {
  brandSub:        'Portal Tanya Jawab',
  loadInvitation:  'Memuat tautan…',
  genericError:    'Tidak dapat memuat. Coba muat ulang halaman.',
  reload:          'Muat ulang',
  // Expired
  expiredTitle:    'Tautan kedaluwarsa',
  expiredBody:     (when) => `Tautan ini sudah kedaluwarsa pada ${when}. Silakan hubungi tim rekrutmen jika Anda memerlukan kesempatan lain.`,
  // Responded
  respondedTitle:  'Jawaban sudah terkirim',
  respondedBody:   'Anda sudah mengirim jawaban untuk pertanyaan ini. Terima kasih atas waktunya.',
  // Gate
  gateLabel:       'Verifikasi Email',
  gateForPosition: (job) => `Untuk posisi ${job || '—'}`,
  gateDeadline:    (when) => `Mohon diselesaikan sebelum ${when}.`,
  gateHelper:      'Masukkan email yang Anda gunakan saat melamar untuk membuka pertanyaan.',
  gateButton:      'Lanjutkan',
  gateVerifying:   'Memverifikasi…',
  gatePlaceholder: 'email@anda.com',
  gateMismatch:    'Email tidak sesuai. Silakan coba lagi.',
  gateHelpFooter:  'Ada kendala? Hubungi rekruter yang mengirim tautan ini.',
  // Form
  formLabel:       'Pertanyaan Tindak Lanjut',
  formForPosition: (job) => `Untuk posisi ${job || '—'}`,
  formDeadline:    (when) => `Mohon kirim sebelum ${when}.`,
  formIntro:       'Jawablah pertanyaan berikut sejujur dan sejelas mungkin. Anda dapat mengosongkan jawaban yang tidak relevan.',
  answerLabel:     'Jawaban Anda',
  answerPlaceholder: 'Tulis jawaban Anda di sini…',
  submitButton:    'Kirim Jawaban',
  submitting:      'Mengirim…',
  topicFallback:   'Pertanyaan',
  // Submitted
  submittedTitle:  'Terima kasih!',
  submittedBody:   'Jawaban Anda sudah terkirim. Anda dapat menutup tab ini.',
};

/* Indonesian-friendly absolute date+time. Falls back to '—' if invalid. */
function fmtDate(d) {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleString('id-ID', {
      day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

function isExpired(summary) {
  if (!summary) return false;
  if (summary.status === 'expired') return true;
  if (!summary.expired_at) return false;
  return new Date(summary.expired_at).getTime() < Date.now();
}

export default function QAFollowUpPage() {
  const { token } = useParams();

  const [view, setView]       = useState('loading'); // 'loading' | 'error' | 'expired' | 'responded' | 'gate' | 'form' | 'submitted'
  const [summary, setSummary] = useState(null);      // GET /:token result
  const [qa, setQa]           = useState(null);      // after verify-email
  const [answers, setAnswers] = useState([]);        // string[] aligned with qa.questions
  const [email, setEmail]     = useState('');
  const [busy, setBusy]       = useState(false);     // shared button-spinner flag
  const [error, setError]     = useState(null);      // inline form error
  const [pageError, setPageError] = useState(null);  // for the 'error' view

  /* Initial load — pick a view based on the public summary. */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setView('loading');
      try {
        const res = await getQaSummary(token);
        if (cancelled) return;
        const sum = res.data?.qa ?? res.data ?? null;
        setSummary(sum);

        if (!sum) { setView('error'); return; }
        if (sum.status === 'responded') { setView('responded'); return; }
        if (isExpired(sum))            { setView('expired'); return; }
        if (sum.status === 'sent')     { setView('gate'); return; }
        // 'draft' or anything unexpected — the link isn't usable.
        setPageError(T.genericError);
        setView('error');
      } catch (err) {
        if (cancelled) return;
        const status = err.response?.status;
        if (status === 410) { setView('expired'); return; }
        if (status === 409) { setView('responded'); return; }
        setPageError(err.response?.data?.message || T.genericError);
        setView('error');
      }
    })();
    return () => { cancelled = true; };
  }, [token]);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await verifyQaEmail(token, email);
      const fresh = res.data?.qa ?? null;
      if (!fresh) {
        setError(T.gateMismatch);
        return;
      }
      if (fresh.status === 'responded') { setView('responded'); return; }
      if (isExpired(fresh))             { setView('expired'); return; }
      setQa(fresh);
      const qs = Array.isArray(fresh.questions) ? fresh.questions : [];
      setAnswers(qs.map(() => ''));
      setView('form');
    } catch (err) {
      const status = err.response?.status;
      if (status === 410) { setView('expired'); return; }
      if (status === 409) { setView('responded'); return; }
      setError(err.response?.data?.message || T.gateMismatch);
    } finally {
      setBusy(false);
    }
  };

  const setAnswerAt = (i, val) =>
    setAnswers((cur) => cur.map((a, idx) => (idx === i ? val : a)));

  const handleSubmit = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await submitQa(token, answers);
      localStorage.removeItem(PORTAL_TOKEN_KEY);
      setView('submitted');
    } catch (err) {
      const status = err.response?.status;
      if (status === 410) { setView('expired'); return; }
      if (status === 409) { setView('responded'); return; }
      setError(err.response?.data?.message || T.genericError);
    } finally {
      setBusy(false);
    }
  };

  const wide = view === 'form';

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <div className={`w-full ${wide ? 'max-w-2xl' : 'max-w-md'}`}>
        <Header />

        {view === 'loading' && (
          <CenteredCard>
            <Loader2 className="h-4 w-4 animate-spin inline mr-2" />{T.loadInvitation}
          </CenteredCard>
        )}

        {view === 'error' && (
          <Card>
            <CardContent className="p-6 space-y-3 text-center">
              <AlertTriangle className="h-7 w-7 text-rose-500 mx-auto" />
              <p className="text-xs text-muted-foreground">{pageError || T.genericError}</p>
              <Button variant="outline" size="sm" className="text-xs" onClick={() => window.location.reload()}>
                {T.reload}
              </Button>
            </CardContent>
          </Card>
        )}

        {view === 'expired' && (
          <Card>
            <CardContent className="p-6 space-y-2 text-center">
              <Clock className="h-8 w-8 text-rose-500 mx-auto" />
              <h2 className="text-sm font-bold">{T.expiredTitle}</h2>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {T.expiredBody(fmtDate(summary?.expired_at))}
              </p>
            </CardContent>
          </Card>
        )}

        {view === 'responded' && (
          <Card>
            <CardContent className="p-6 space-y-2 text-center">
              <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto" />
              <h2 className="text-sm font-bold">{T.respondedTitle}</h2>
              <p className="text-[11px] text-muted-foreground leading-relaxed">{T.respondedBody}</p>
            </CardContent>
          </Card>
        )}

        {view === 'gate' && (
          <Card>
            <CardContent className="p-6 space-y-4">
              <div>
                <div className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">
                  {T.gateLabel}
                </div>
                <h1 className="text-base font-bold mt-1 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  {T.gateForPosition(summary?.job_title)}
                </h1>
                {summary?.expired_at && (
                  <p className="text-[11px] text-muted-foreground mt-1 inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {T.gateDeadline(fmtDate(summary.expired_at))}
                  </p>
                )}
                <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">
                  {T.gateHelper}
                </p>
              </div>

              <form onSubmit={handleVerify} className="space-y-3">
                <div className="relative">
                  <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    type="email"
                    required
                    autoFocus
                    placeholder={T.gatePlaceholder}
                    className="pl-8 h-9 text-sm"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                {error && (
                  <div className="text-[11px] text-rose-600 flex items-center gap-1.5">
                    <AlertTriangle className="h-3 w-3" />
                    {error}
                  </div>
                )}

                <Button type="submit" disabled={busy || !email.trim()} className="w-full h-9 text-sm">
                  {busy
                    ? <><Loader2 className="h-3.5 w-3.5 animate-spin inline mr-1.5" />{T.gateVerifying}</>
                    : T.gateButton}
                </Button>
              </form>

              <p className="text-[10px] text-muted-foreground text-center">
                {T.gateHelpFooter}
              </p>
            </CardContent>
          </Card>
        )}

        {view === 'form' && qa && (
          <div className="space-y-3">
            <Card>
              <CardContent className="p-5 space-y-1.5">
                <div className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">
                  {T.formLabel}
                </div>
                <h1 className="text-base font-bold flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  {T.formForPosition(qa.job_title || summary?.job_title)}
                </h1>
                {qa.expired_at && (
                  <p className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {T.formDeadline(fmtDate(qa.expired_at))}
                  </p>
                )}
                <p className="text-[11px] text-muted-foreground leading-relaxed pt-1">
                  {T.formIntro}
                </p>
              </CardContent>
            </Card>

            {(Array.isArray(qa.questions) ? qa.questions : []).map((q, i) => (
              <Card key={i}>
                <CardContent className="p-5 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-semibold shrink-0">
                      {i + 1}
                    </span>
                    {q.topic && (
                      <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
                        {q.topic}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm leading-relaxed">{q.text || T.topicFallback}</p>
                  <div>
                    <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {T.answerLabel}
                    </label>
                    <Textarea
                      value={answers[i] ?? ''}
                      onChange={(e) => setAnswerAt(i, e.target.value)}
                      placeholder={T.answerPlaceholder}
                      rows={5}
                      className="text-sm mt-1"
                    />
                  </div>
                </CardContent>
              </Card>
            ))}

            {error && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-md border border-rose-200 bg-rose-50 text-xs text-rose-600">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> {error}
              </div>
            )}

            <div className="flex justify-end pt-1">
              <Button onClick={handleSubmit} disabled={busy} className="text-sm">
                {busy
                  ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />{T.submitting}</>
                  : <><Send className="h-3.5 w-3.5 mr-1.5" />{T.submitButton}</>}
              </Button>
            </div>
          </div>
        )}

        {view === 'submitted' && (
          <Card>
            <CardContent className="p-6 space-y-2 text-center">
              <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto" />
              <h2 className="text-sm font-bold">{T.submittedTitle}</h2>
              <p className="text-[11px] text-muted-foreground leading-relaxed">{T.submittedBody}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function Header() {
  return (
    <div className="text-center mb-4">
      <div className="text-base font-bold tracking-widest text-primary">MYRALIX</div>
      <div className="text-[10px] tracking-wider uppercase text-muted-foreground">
        {T.brandSub}
      </div>
    </div>
  );
}

function CenteredCard({ children }) {
  return (
    <Card>
      <CardContent className="p-6 text-center text-xs text-muted-foreground">
        {children}
      </CardContent>
    </Card>
  );
}
