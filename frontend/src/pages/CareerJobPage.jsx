import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, MapPin, AlertTriangle, UploadCloud, FileText, X, CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import ReCAPTCHA from 'react-google-recaptcha';
import { getJobDetail, submitApplication, getRecaptchaConfig } from '@/api/careers.api';

function CareerFonts() {
  return (
    <link
      rel="stylesheet"
      href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,500;0,9..144,600;1,9..144,500&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
    />
  );
}

const ALLOWED_EXT = /\.(pdf|docx?)$/i;
const MAX_SIZE = 10 * 1024 * 1024; // matches the shared upload middleware's real-world ceiling
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^(\+62|62|0)8\d{7,12}$/;

export default function CareerJobPage() {
  const { slug, jobId } = useParams();
  const [company, setCompany] = useState(null);
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState('detail'); // detail | apply | done
  const [reference, setReference] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await getJobDetail(slug, jobId);
        if (cancelled) return;
        setCompany(data.company);
        setJob(data.job);
      } catch (err) {
        if (!cancelled) setError(err.response?.status === 404 ? 'This position could not be found.' : 'Something went wrong loading this page.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [slug, jobId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F6FB] p-8 max-w-[1040px] mx-auto space-y-4 pt-10">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-[#F7F6FB] flex flex-col items-center justify-center gap-3 text-center px-6">
        <AlertTriangle className="h-10 w-10 text-amber-500" />
        <p className="text-[#1B2420] font-medium">{error}</p>
        <Link to={`/careers/${slug}`} className="text-[#640199] text-sm font-medium">← Back to all openings</Link>
      </div>
    );
  }

  const isOpen = job.status === 'Active';

  return (
    <div className="min-h-screen bg-[#F7F6FB] flex flex-col" style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      <CareerFonts />
      <header className="bg-white border-b border-[#E6E2D8]">
        <div className="max-w-[1040px] mx-auto px-5 h-16 flex items-center gap-3">
          {company.logo_url ? (
            <img src={company.logo_url} alt={company.name} className="h-9 w-9 rounded-lg object-contain" />
          ) : (
            <div className="h-9 w-9 rounded-lg bg-[#640199] text-white flex items-center justify-center font-bold">
              {company.name?.charAt(0)}
            </div>
          )}
          <div className="font-bold text-[#1B2420]">{company.name}</div>
        </div>
      </header>

      <main className="flex-1">
        {view === 'detail' && <JobDetail job={job} isOpen={isOpen} slug={slug} onApply={() => setView('apply')} />}
        {view === 'apply' && (
          <ApplyForm
            job={job}
            slug={slug}
            onBack={() => setView('detail')}
            onDone={(ref) => { setReference(ref); setView('done'); }}
          />
        )}
        {view === 'done' && <Done job={job} slug={slug} reference={reference} />}
      </main>

      <footer className="border-t border-[#E6E2D8] bg-white text-[#66706B] text-xs py-4 mt-6">
        <div className="max-w-[1040px] mx-auto px-5 flex items-center justify-between flex-wrap gap-2">
          <span>© {new Date().getFullYear()} {company.name}</span>
          <span>Powered by <b className="text-[#640199]">Myralix</b></span>
        </div>
      </footer>
    </div>
  );
}

function JobDetail({ job, isOpen, slug, onApply }) {
  return (
    <div className="max-w-[1040px] mx-auto px-5 py-7">
      <Link to={`/careers/${slug}`} className="inline-flex items-center gap-1.5 text-[#66706B] text-sm mb-5 hover:text-[#1B2420]">
        <ArrowLeft className="h-3.5 w-3.5" /> All openings
      </Link>
      <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-6">
        <div className="bg-white border border-[#E6E2D8] rounded-[14px] p-6">
          {!isOpen && (
            <div className="bg-[#FFF6E8] border border-[#F2D9AE] text-[#B26B00] rounded-[10px] px-3.5 py-3 mb-4 text-sm">
              This position is closed. Please check our other open roles.
            </div>
          )}
          <h2 style={{ fontFamily: "'Fraunces', serif", fontWeight: 500 }} className="text-[30px] text-[#1B2420] mb-2.5">
            {job.job_title}
          </h2>
          <div className="flex flex-wrap gap-2 text-sm text-[#66706B] mb-5">
            {job.job_location && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{job.job_location}</span>}
            {job.work_option && <span>· {job.work_option}</span>}
            {job.work_type && <span>· {job.work_type}</span>}
            {job.seniority_level && <span>· {job.seniority_level}</span>}
          </div>
          {job.job_desc && (
            <>
              <h4 className="font-semibold text-[#1B2420] mt-5 mb-1.5">About this role</h4>
              <p className="text-[#3D4742] whitespace-pre-line">{job.job_desc}</p>
            </>
          )}
          {job.qualifications && (
            <>
              <h4 className="font-semibold text-[#1B2420] mt-5 mb-1.5">Qualifications</h4>
              <p className="text-[#3D4742] whitespace-pre-line">{job.qualifications}</p>
            </>
          )}
        </div>
        <aside>
          <div className="bg-white border border-[#E6E2D8] rounded-[14px] p-6 sticky top-4">
            <Row label="Location" value={job.job_location} />
            <Row label="Work type" value={job.work_option} />
            <Row label="Employment" value={job.work_type} />
            <Row label="Pay" value={job.pay_min && job.pay_max ? `${job.currency} ${job.pay_min} – ${job.pay_max}` : 'Not disclosed'} last />
            <Button
              className="w-full mt-4 bg-[#640199] hover:bg-[#4F0179]"
              disabled={!isOpen}
              onClick={onApply}
            >
              {isOpen ? 'Apply now' : 'Closed'}
            </Button>
            <p className="text-center text-xs text-[#66706B] mt-2">Just your CV + contact info. ~2 minutes.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value, last }) {
  return (
    <div className={`flex justify-between py-2 text-sm ${last ? '' : 'border-b border-dashed border-[#E6E2D8]'}`}>
      <span className="text-[#66706B]">{label}</span>
      <span className="text-[#1B2420] font-medium">{value || '—'}</span>
    </div>
  );
}

function ApplyForm({ job, slug, onBack, onDone }) {
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [fields, setFields] = useState({ name: '', email: '', phone: '', city: '', linkedin_url: '', salary_expectation: '' });
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [recaptchaConfig, setRecaptchaConfig] = useState({ enabled: false, siteKey: null });
  const [recaptchaToken, setRecaptchaToken] = useState(null);
  const fileInput = useRef(null);
  const honeypotRef = useRef(null);
  const recaptchaRef = useRef(null);

  useEffect(() => {
    getRecaptchaConfig()
      .then(({ data }) => setRecaptchaConfig(data))
      .catch(() => setRecaptchaConfig({ enabled: false, siteKey: null })); // fail open — never block applying over a config-fetch hiccup
  }, []);

  const setField = (k, v) => setFields((f) => ({ ...f, [k]: v }));

  const pickFile = (f) => {
    if (!f) return;
    const ok = ALLOWED_EXT.test(f.name) && f.size <= MAX_SIZE;
    setFile(ok ? f : null);
    setErrors((e) => ({ ...e, cv: !ok }));
  };

  const validate = () => {
    const next = {
      cv: !file,
      name: fields.name.trim().length < 2,
      email: !EMAIL_RE.test(fields.email.trim()),
      phone: !PHONE_RE.test(fields.phone.trim().replace(/[\s-]/g, '')),
      consent: !consent,
      recaptcha: recaptchaConfig.enabled && !recaptchaToken,
    };
    setErrors(next);
    return !Object.values(next).some(Boolean);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (honeypotRef.current?.value) return; // bot tripped the honeypot — fail silently
    if (!validate()) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      const params = new URLSearchParams(window.location.search);
      const formData = new FormData();
      formData.append('cv', file);
      formData.append('name', fields.name.trim());
      formData.append('email', fields.email.trim());
      formData.append('phone', fields.phone.trim());
      if (fields.city) formData.append('city', fields.city.trim());
      if (fields.linkedin_url) formData.append('linkedin_url', fields.linkedin_url.trim());
      if (fields.salary_expectation) formData.append('salary_expectation', fields.salary_expectation.trim());
      formData.append('source', params.get('src') === 'linkedin' ? 'linkedin' : 'career_site');
      if (recaptchaConfig.enabled) formData.append('recaptcha_token', recaptchaToken);

      const { data } = await submitApplication(slug, job.id, formData);
      onDone(data.reference);
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Failed to submit your application. Please try again.');
      // A reCAPTCHA token is single-use — reset the widget so a retry (e.g.
      // after a different validation error) can get a fresh one.
      recaptchaRef.current?.reset();
      setRecaptchaToken(null);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-[640px] mx-auto px-5 py-7">
      <button onClick={onBack} className="inline-flex items-center gap-1.5 text-[#66706B] text-sm mb-4 hover:text-[#1B2420]">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to job details
      </button>
      <div className="bg-white border border-[#E6E2D8] rounded-[14px] p-6">
        <span className="bg-[#F1EAF8] text-[#640199] rounded-full px-2.5 py-0.5 text-xs font-semibold">{job.job_location}</span>
        <h2 style={{ fontFamily: "'Fraunces', serif", fontWeight: 500 }} className="text-[26px] text-[#1B2420] mt-2 mb-1">
          Apply: {job.job_title}
        </h2>
        <p className="text-xs text-[#66706B] mb-5">Fields marked <span className="text-[#C0392B]">*</span> are required.</p>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {/* Honeypot — hidden from real users, bots that auto-fill every field trip it */}
          <input ref={honeypotRef} type="text" name="website" tabIndex={-1} autoComplete="off"
            style={{ position: 'absolute', left: '-9999px', width: 1, height: 1 }} aria-hidden="true" />

          <div>
            <label className="block text-sm font-semibold mb-1.5">CV / Resume <span className="text-[#C0392B]">*</span></label>
            {!file ? (
              <div
                onClick={() => fileInput.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setDragOver(false); pickFile(e.dataTransfer.files[0]); }}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                  dragOver ? 'bg-[#F1EAF8] border-[#4757EA]' : 'bg-[#FCFBFE] border-[#D3C7E3]'
                } ${errors.cv ? 'border-red-400' : ''}`}
              >
                <UploadCloud className="h-5 w-5 mx-auto mb-1.5 text-[#640199]" />
                <div className="font-semibold text-sm">Click or drag a file here</div>
                <div className="text-xs text-[#66706B] mt-0.5">PDF or DOCX, max 10MB</div>
                <input ref={fileInput} type="file" accept=".pdf,.doc,.docx" hidden onChange={(e) => pickFile(e.target.files[0])} />
              </div>
            ) : (
              <div className="flex items-center gap-2.5 bg-[#F1EAF8] rounded-[10px] px-3 py-2.5 text-sm">
                <FileText className="h-4 w-4 text-[#640199] shrink-0" />
                <span className="flex-1 truncate">{file.name} · {(file.size / 1024 / 1024).toFixed(2)} MB</span>
                <button type="button" onClick={() => setFile(null)} className="text-[#66706B]"><X className="h-4 w-4" /></button>
              </div>
            )}
            {errors.cv && <p className="text-xs text-[#C0392B] mt-1">Please upload a CV (PDF/DOCX, max 10MB).</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Full name" required error={errors.name && 'Name is required.'}>
              <Input value={fields.name} onChange={(e) => setField('name', e.target.value)} autoComplete="name" />
            </Field>
            <Field label="Email" required error={errors.email && 'Enter a valid email.'}>
              <Input type="email" value={fields.email} onChange={(e) => setField('email', e.target.value)} autoComplete="email" />
            </Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="WhatsApp number" required error={errors.phone && 'Enter a valid phone number.'}>
              <Input value={fields.phone} onChange={(e) => setField('phone', e.target.value)} placeholder="08xx or +628xx" inputMode="tel" />
            </Field>
            <Field label="Current city">
              <Input value={fields.city} onChange={(e) => setField('city', e.target.value)} placeholder="e.g. South Jakarta" />
            </Field>
          </div>
          <Field label="LinkedIn profile URL">
            <Input value={fields.linkedin_url} onChange={(e) => setField('linkedin_url', e.target.value)} placeholder="linkedin.com/in/your-name" />
          </Field>
          <Field label="Salary expectation (optional)">
            <Input value={fields.salary_expectation} onChange={(e) => setField('salary_expectation', e.target.value)} />
          </Field>

          <div className={`flex gap-2.5 items-start bg-[#FAF8F2] border rounded-[10px] p-3 text-sm text-[#3D4742] ${errors.consent ? 'border-red-400' : 'border-[#E6E2D8]'}`}>
            <Checkbox checked={consent} onCheckedChange={setConsent} className="mt-0.5" />
            <span>I consent to {job.job_title ? '' : ''}this company processing my personal data for recruitment purposes, including retention for up to 12 months for other relevant openings.</span>
          </div>
          {errors.consent && <p className="text-xs text-[#C0392B] -mt-3">Consent is required to continue.</p>}

          {recaptchaConfig.enabled && (
            <div>
              <ReCAPTCHA
                ref={recaptchaRef}
                sitekey={recaptchaConfig.siteKey}
                onChange={setRecaptchaToken}
                onExpired={() => setRecaptchaToken(null)}
              />
              {errors.recaptcha && <p className="text-xs text-[#C0392B] mt-1">Please verify you're not a robot.</p>}
            </div>
          )}

          {submitError && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 rounded-[10px] px-3.5 py-2.5 text-sm">
              <AlertTriangle className="h-4 w-4 shrink-0" /> {submitError}
            </div>
          )}

          <Button type="submit" disabled={submitting} className="w-full bg-[#640199] hover:bg-[#4F0179] py-5">
            {submitting ? 'Submitting…' : 'Submit application'}
          </Button>
        </form>
      </div>
    </div>
  );
}

function Field({ label, required, error, children }) {
  return (
    <div>
      <label className="block text-sm font-semibold mb-1.5">{label} {required && <span className="text-[#C0392B]">*</span>}</label>
      {children}
      {error && <p className="text-xs text-[#C0392B] mt-1">{error}</p>}
    </div>
  );
}

function Done({ job, slug, reference }) {
  return (
    <div className="max-w-[640px] mx-auto px-5 py-10">
      <div className="bg-white border border-[#E6E2D8] rounded-[14px] p-10 text-center">
        <div className="h-16 w-16 rounded-full bg-[#F1EAF8] text-[#640199] flex items-center justify-center mx-auto mb-3.5">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h2 style={{ fontFamily: "'Fraunces', serif", fontWeight: 500 }} className="text-[28px] text-[#1B2420] mb-2">
          Application submitted
        </h2>
        <p className="text-[#3D4742]">
          Thank you for applying to <b>{job.job_title}</b>. Reference: <b>{reference}</b>
        </p>
        <p className="text-xs text-[#66706B] mt-3">Our recruitment team will reach out if your profile is a good fit.</p>
        <Link to={`/careers/${slug}`}>
          <Button variant="outline" className="mt-5 border-[#640199] text-[#640199]">See other openings</Button>
        </Link>
      </div>
    </div>
  );
}
