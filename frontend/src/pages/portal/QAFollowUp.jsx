import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Loader2, AlertTriangle, Mail, CheckCircle2, MessageSquare, Clock, Send,
  ClipboardList, Check,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
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
  formIntro:       'Lengkapi formulir lamaran dan jawab pertanyaan berikut. Field bertanda * wajib diisi, dan minimal satu pertanyaan harus dijawab.',
  answerLabel:     'Jawaban Anda',
  answerPlaceholder: 'Tulis jawaban Anda di sini…',
  submitButton:    'Kirim Jawaban',
  submitting:      'Mengirim…',
  topicFallback:   'Pertanyaan',
  // Tabs + application form
  tabForm:         'Formulir Lamaran',
  tabQuestions:    'Pertanyaan',
  requiredHint:    'Wajib diisi',
  selectPlaceholder: 'Pilih…',
  formMissingError: 'Lengkapi field wajib yang ditandai pada Formulir Lamaran.',
  needOneAnswer:   'Mohon jawab minimal satu pertanyaan.',
  citiesHint:      'Pilih satu atau lebih.',
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

/* ─── Application Form (Bahasa labels + client-side schema helpers) ─── */
// Schema field/section labels are English; localize known keys, fall back to the
// schema label for any unknown/custom field so future custom forms still render.
const FORM_FIELD_LABEL_ID = {
  full_name:         'Nama Lengkap',
  date_of_birth:     'Tanggal Lahir',
  national_id:       'KTP / NIK',
  education_level:   'Pendidikan (Gelar Tertinggi)',
  institution:       'Nama Institusi',
  last_employer:     'Perusahaan Terakhir',
  last_position:     'Posisi Terakhir',
  employment_period: 'Periode Kerja',
  preferred_cities:  'Preferensi Kota Penempatan',
};
const FORM_SECTION_LABEL_ID = {
  personal:   'Data Pribadi',
  education:  'Riwayat Pendidikan',
  experience: 'Pengalaman Kerja',
  placement:  'Preferensi Penempatan',
};
// Bahasa placeholders so every text field reads "like any other field".
const FORM_FIELD_PLACEHOLDER_ID = {
  full_name:         'Nama lengkap sesuai KTP',
  national_id:       '16 digit NIK',
  institution:       'Nama universitas / sekolah',
  last_employer:     'Nama perusahaan',
  last_position:     'Jabatan terakhir',
  employment_period: 'mis. Jan 2020 – Des 2023',
  preferred_cities:  'mis. Jakarta, Surabaya, atau terbuka untuk relokasi',
};
const labelFor = (field) => FORM_FIELD_LABEL_ID[field?.key] || field?.label || field?.key || '';
const sectionLabelFor = (section) => FORM_SECTION_LABEL_ID[section?.key] || section?.label || '';
const placeholderFor = (field) => FORM_FIELD_PLACEHOLDER_ID[field?.key] || '';

function flattenFields(schema) {
  const sections = Array.isArray(schema?.sections) ? schema.sections : [];
  return sections.flatMap((s) => (Array.isArray(s?.fields) ? s.fields : []));
}

// Seed every field by type, then merge any previously-saved values (re-opened row).
function buildInitialFormValues(schema, saved) {
  const src = saved && typeof saved === 'object' ? saved : {};
  const out = {};
  for (const f of flattenFields(schema)) {
    if (f.type === 'multiselect') {
      const opts = Array.isArray(f.options) ? f.options : [];
      const arr = Array.isArray(src[f.key]) ? src[f.key].filter((x) => opts.includes(x)) : [];
      out[f.key] = arr;
    } else {
      out[f.key] = typeof src[f.key] === 'string' ? src[f.key] : '';
    }
  }
  return out;
}

// Mirror of the backend findMissingRequired — keeps the user from hitting a server 400.
function findMissingRequiredClient(schema, values) {
  const v = values || {};
  return flattenFields(schema)
    .filter((f) => f.required)
    .filter((f) => {
      const val = v[f.key];
      if (Array.isArray(val)) return val.length === 0;
      return val == null || String(val).trim() === '';
    })
    .map((f) => ({ key: f.key, label: labelFor(f) }));
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

  // Application Form (filled alongside the questions)
  const [formValues, setFormValues] = useState({});  // keyed by schema field key
  const [fieldErrors, setFieldErrors] = useState({});// key -> true when required + empty
  const [portalTab, setPortalTab] = useState('form');// 'form' | 'questions' — form first (required)

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
      setFormValues(buildInitialFormValues(fresh.application_form_schema, fresh.application_form));
      setFieldErrors({});
      setPortalTab('form');
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

  // Set a single form field value and clear its error.
  const setFormField = (key, val) => {
    setFormValues((cur) => ({ ...cur, [key]: val }));
    setFieldErrors((cur) => (cur[key] ? { ...cur, [key]: false } : cur));
  };

  // Toggle one option of a multiselect field.
  const toggleFormOption = (key, opt) => {
    setFormValues((cur) => {
      const arr = Array.isArray(cur[key]) ? cur[key] : [];
      return { ...cur, [key]: arr.includes(opt) ? arr.filter((x) => x !== opt) : [...arr, opt] };
    });
    setFieldErrors((cur) => (cur[key] ? { ...cur, [key]: false } : cur));
  };

  const handleSubmit = async () => {
    if (busy) return;
    setError(null);

    // 1) Application Form required fields (matches server order — no un-preventable 400).
    const schema = qa?.application_form_schema;
    const missing = schema ? findMissingRequiredClient(schema, formValues) : [];
    if (missing.length) {
      setFieldErrors(Object.fromEntries(missing.map((m) => [m.key, true])));
      setPortalTab('form');
      setError(T.formMissingError);
      return;
    }

    // 2) At least one answer when questions exist.
    const questions = Array.isArray(qa?.questions) ? qa.questions : [];
    if (questions.length > 0 && !answers.some((a) => (a || '').trim().length > 0)) {
      setPortalTab('questions');
      setError(T.needOneAnswer);
      return;
    }

    setBusy(true);
    try {
      await submitQa(token, answers, schema ? formValues : null);
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
    <div className={`min-h-screen bg-muted/30 flex justify-center p-4 ${wide ? 'items-start' : 'items-center'}`}>
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

        {view === 'form' && qa && (() => {
          const schema = qa.application_form_schema;
          const questions = Array.isArray(qa.questions) ? qa.questions : [];
          const formComplete = schema ? findMissingRequiredClient(schema, formValues).length === 0 : true;
          const answeredCount = answers.filter((a) => (a || '').trim().length > 0).length;

          return (
            <div className="space-y-3 pb-20">
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

              {/* Tab bar — Application Form first (required), Questions second */}
              <div className="flex w-full gap-1 rounded-lg border bg-muted p-1">
                <button
                  type="button"
                  onClick={() => setPortalTab('form')}
                  className={`flex-1 rounded-md px-3 py-2 text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors ${
                    portalTab === 'form' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <ClipboardList className="h-3.5 w-3.5" />
                  {T.tabForm}
                  {schema && (
                    formComplete
                      ? <Check className="h-3.5 w-3.5 text-emerald-500" />
                      : <span className="h-2 w-2 rounded-full bg-amber-500 inline-block" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setPortalTab('questions')}
                  className={`flex-1 rounded-md px-3 py-2 text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors ${
                    portalTab === 'questions' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  {T.tabQuestions}
                  {questions.length > 0 && (
                    <span className="text-[10px] font-normal opacity-80">{answeredCount}/{questions.length}</span>
                  )}
                </button>
              </div>

              {portalTab === 'form' ? (
                schema ? (
                  <PortalApplicationForm
                    schema={schema}
                    values={formValues}
                    errors={fieldErrors}
                    onField={setFormField}
                    onToggle={toggleFormOption}
                  />
                ) : (
                  <Card><CardContent className="p-5 text-center text-[11px] text-muted-foreground italic">
                    Tidak ada formulir lamaran untuk tautan ini.
                  </CardContent></Card>
                )
              ) : (
                questions.length === 0 ? (
                  <Card><CardContent className="p-5 text-center text-[11px] text-muted-foreground italic">
                    Tidak ada pertanyaan tambahan.
                  </CardContent></Card>
                ) : (
                  questions.map((q, i) => (
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
                  ))
                )
              )}

              {error && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-md border border-rose-200 bg-rose-50 text-xs text-rose-600">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> {error}
                </div>
              )}

              {/* One submit, sticky + visible from both tabs */}
              <div className="sticky bottom-3 pt-1">
                <div className="rounded-lg border bg-background shadow-lg p-2">
                  <Button onClick={handleSubmit} disabled={busy} className="w-full text-sm">
                    {busy
                      ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />{T.submitting}</>
                      : <><Send className="h-3.5 w-3.5 mr-1.5" />{T.submitButton}</>}
                  </Button>
                </div>
              </div>
            </div>
          );
        })()}

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

/* ─── Candidate-editable Application Form, rendered from the schema snapshot ─── */
function PortalApplicationForm({ schema, values, errors, onField, onToggle }) {
  const sections = Array.isArray(schema?.sections) ? schema.sections : [];
  return (
    <div className="space-y-3">
      {sections.map((section) => (
        <Card key={section.key}>
          <CardContent className="p-5 space-y-3">
            <div className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">
              {sectionLabelFor(section)}
            </div>
            {(Array.isArray(section.fields) ? section.fields : []).map((field) => (
              <PortalFormField
                key={field.key}
                field={field}
                value={values[field.key]}
                invalid={!!errors[field.key]}
                onField={onField}
                onToggle={onToggle}
              />
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function PortalFormField({ field, value, invalid, onField, onToggle }) {
  const errCls = invalid ? 'border-rose-400 focus-visible:ring-rose-300' : '';
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {labelFor(field)}
        {field.required && <span className="text-rose-500 ml-0.5">*</span>}
      </label>

      {field.type === 'select' ? (
        <Select value={value || undefined} onValueChange={(v) => onField(field.key, v)}>
          <SelectTrigger aria-invalid={invalid} className={`h-9 text-sm ${errCls}`}>
            <SelectValue placeholder={T.selectPlaceholder} />
          </SelectTrigger>
          <SelectContent>
            {(Array.isArray(field.options) ? field.options : []).map((o) => (
              <SelectItem key={o} value={o} className="text-sm">{o}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : field.type === 'multiselect' ? (
        <>
          <div className="flex flex-wrap gap-1.5">
            {(Array.isArray(field.options) ? field.options : []).map((o) => {
              const sel = Array.isArray(value) && value.includes(o);
              return (
                <button
                  key={o}
                  type="button"
                  onClick={() => onToggle(field.key, o)}
                  className={`px-3 py-1.5 rounded-md border text-xs font-medium transition-colors ${
                    sel ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-foreground hover:bg-muted'
                  }`}
                >
                  {o}
                </button>
              );
            })}
          </div>
          <p className="text-[10px] text-muted-foreground">{T.citiesHint}</p>
        </>
      ) : (
        <Input
          type={field.type === 'date' ? 'date' : 'text'}
          value={value ?? ''}
          onChange={(e) => onField(field.key, e.target.value)}
          placeholder={placeholderFor(field)}
          aria-invalid={invalid}
          className={`h-9 text-sm ${errCls}`}
        />
      )}

      {invalid && <p className="text-[10px] text-rose-600">{T.requiredHint}</p>}
    </div>
  );
}
