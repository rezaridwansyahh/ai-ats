import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Loader2, AlertTriangle, CheckCircle2, Clock,
  ShieldCheck, Check, Mail,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import {
  getBgConsentSummary,
  verifyBgConsentEmail,
  getBgConsent,
  signBgConsent,
} from '@/api/portal-bg.api';

function fmtDate(d) {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleString('id-ID', {
      day: '2-digit', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return '—'; }
}

function Header() {
  return (
    <div className="text-center mb-4">
      <div className="text-base font-bold tracking-widest text-primary">MYRALIX</div>
      <div className="text-[10px] tracking-wider uppercase text-muted-foreground">
        Portal Persetujuan Latar Belakang
      </div>
    </div>
  );
}

export default function BgConsentPage() {
  const { token } = useParams();
  const [view,    setView]    = useState('loading');
  const [summary, setSummary] = useState(null);   
  const [consent, setConsent] = useState(null);   
  const [error,   setError]   = useState(null);
  const [email,     setEmail]     = useState('');
  const [emailBusy, setEmailBusy] = useState(false);
  const [emailErr,  setEmailErr]  = useState(null);
  const [agreed, setAgreed] = useState(false);
  const [busy,   setBusy]   = useState(false);
  const [signErr, setSignErr] = useState(null);

  // Load public summary on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setView('loading');
      try {
        const res = await getBgConsentSummary(token);
        if (cancelled) return;
        setSummary(res.data?.consent || null);
        setView('email_gate');
      } catch (err) {
        if (cancelled) return;
        const status = err.response?.status;
        const msg    = err.response?.data?.message || '';
        if (status === 409)                        { setView('signed');  return; }
        if (status === 410 && msg.includes('revok')) { setView('revoked'); return; }
        if (status === 410)                        { setView('expired'); return; }
        setError(msg || 'Tidak dapat memuat tautan persetujuan.');
        setView('error');
      }
    })();
    return () => { cancelled = true; };
  }, [token]);

  const handleVerifyEmail = async () => {
    if (!email.trim()) return;
    setEmailBusy(true);
    setEmailErr(null);
    try {
      const res = await verifyBgConsentEmail(token, email.trim());
      setConsent(res.data?.consent || null);
      setView('form');
    } catch (err) {
      setEmailErr(err.response?.data?.message || 'Email tidak cocok. Coba lagi.');
    } finally {
      setEmailBusy(false);
    }
  };

  const handleSign = async () => {
    if (!agreed || busy) return;
    setBusy(true);
    setSignErr(null);
    try {
      await signBgConsent(token);
      setView('submitted');
    } catch (err) {
      const status = err.response?.status;
      if (status === 409) { setView('signed');  return; }
      if (status === 410) { setView('expired'); return; }
      setSignErr(err.response?.data?.message || 'Gagal menyimpan persetujuan. Coba lagi.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 flex items-start justify-center p-4 pt-10">
      <div className="w-full max-w-xl space-y-3">
        <Header />

        {view === 'loading' && (
          <Card>
            <CardContent className="py-10 text-center text-xs text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
              Memuat dokumen persetujuan…
            </CardContent>
          </Card>
        )}

        {view === 'error' && (
          <Card>
            <CardContent className="p-6 space-y-3 text-center">
              <AlertTriangle className="h-7 w-7 text-rose-500 mx-auto" />
              <p className="text-xs text-muted-foreground">{error || 'Tidak dapat memuat. Coba muat ulang halaman.'}</p>
              <Button variant="outline" size="sm" className="text-xs"
                onClick={() => window.location.reload()}>
                Muat ulang
              </Button>
            </CardContent>
          </Card>
        )}

        {view === 'expired' && (
          <Card>
            <CardContent className="p-6 space-y-2 text-center">
              <Clock className="h-8 w-8 text-rose-500 mx-auto" />
              <h2 className="text-sm font-bold">Tautan kedaluwarsa</h2>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Tautan persetujuan ini sudah kedaluwarsa. Silakan hubungi tim rekrutmen.
              </p>
            </CardContent>
          </Card>
        )}

        {view === 'revoked' && (
          <Card>
            <CardContent className="p-6 space-y-2 text-center">
              <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto" />
              <h2 className="text-sm font-bold">Persetujuan dicabut</h2>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Tautan persetujuan ini telah dicabut. Silakan hubungi tim rekrutmen.
              </p>
            </CardContent>
          </Card>
        )}

        {view === 'signed' && (
          <Card>
            <CardContent className="p-6 space-y-2 text-center">
              <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto" />
              <h2 className="text-sm font-bold">Persetujuan sudah ditandatangani</h2>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Anda sudah menandatangani persetujuan ini. Terima kasih.
              </p>
            </CardContent>
          </Card>
        )}

        {view === 'submitted' && (
          <Card>
            <CardContent className="p-6 space-y-2 text-center">
              <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto" />
              <h2 className="text-sm font-bold">Terima kasih!</h2>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Persetujuan Anda telah berhasil disimpan. Anda dapat menutup tab ini.
              </p>
            </CardContent>
          </Card>
        )}

        {view === 'email_gate' && summary && (
          <Card>
            <CardContent className="p-6 space-y-5">
              <div>
                <p className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground mb-1">
                  Undangan Persetujuan
                </p>
                <h2 className="text-base font-bold text-foreground">
                  {summary.company_name || 'Perusahaan'} · {summary.job_title}
                </h2>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Masukkan email Anda untuk mengonfirmasi bahwa undangan ini ditujukan untuk Anda.
                </p>
              </div>

              <div className="space-y-2">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setEmailErr(null); }}
                    onKeyDown={(e) => e.key === 'Enter' && handleVerifyEmail()}
                    placeholder="you@example.com"
                    className="pl-9"
                    autoFocus
                  />
                </div>
                {emailErr && (
                  <p className="text-[11px] text-rose-600 flex items-center gap-1">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> {emailErr}
                  </p>
                )}
              </div>

              <Button className="w-full" onClick={handleVerifyEmail} disabled={emailBusy || !email.trim()}>
                {emailBusy
                  ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Memverifikasi…</>
                  : 'Lanjutkan'}
              </Button>

              <p className="text-[10px] text-muted-foreground text-center">
                Kesulitan masuk?{' '}
                <span className="text-primary">Hubungi rekruter yang mengirimkan tautan ini.</span>
              </p>

              {summary.token_expires_at && (
                <p className="text-[10px] text-muted-foreground text-center flex items-center justify-center gap-1">
                  <Clock className="h-3 w-3" /> Berlaku hingga {fmtDate(summary.token_expires_at)}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {view === 'form' && consent && (
          <>
            {/* Header card */}
            <Card>
              <CardContent className="p-5 space-y-1">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-xs font-semibold">
                    Surat Persetujuan Pemeriksaan Latar Belakang
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {consent.company_name} · {consent.job_title}
                </p>
                {consent.token_expires_at && (
                  <p className="text-[10px] text-muted-foreground inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Berlaku hingga {fmtDate(consent.token_expires_at)}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Document body */}
            <Card>
              <CardContent className="p-0 overflow-hidden">
                {/* cd-head */}
                <div className="px-5 py-4 border-b bg-muted/20 text-center">
                  <p className="text-xs font-bold tracking-wide uppercase text-foreground">
                    SURAT PERSETUJUAN PEMERIKSAAN LATAR BELAKANG
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {consent.company_name || 'PT —'} · sesuai UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi
                  </p>
                </div>

                {/* cd-body */}
                <div className="px-5 py-4 space-y-3 text-[11px] leading-relaxed text-foreground">
                  <p>
                    Saya yang bertanda tangan di bawah ini,{' '}
                    <strong>{consent.candidate_name}</strong>,
                    dengan ini memberikan persetujuan tertulis kepada{' '}
                    <strong>{consent.document?.company_name || consent.company_name || 'perusahaan'}</strong>{' '}
                    untuk melakukan pemeriksaan latar belakang ("BG Check") sehubungan dengan
                    proses rekrutmen saya untuk posisi{' '}
                    <strong>{consent.document?.position || consent.job_title}</strong>.
                  </p>

                  {Array.isArray(consent.document?.lanes) && consent.document.lanes.length > 0 ? (
                    <>
                      <p>Pemeriksaan akan mencakup lajur-lajur (lanes) berikut:</p>
                      <ol className="space-y-1.5 pl-5 list-decimal">
                        {consent.document.lanes.map((lane, i) => (
                          <li key={i}>
                            <strong>{lane.label}</strong>
                            {lane.description && (
                              <span className="text-muted-foreground"> — {lane.description}</span>
                            )}
                          </li>
                        ))}
                      </ol>
                    </>
                  ) : (
                    <p className="text-muted-foreground italic">
                      Pemeriksaan latar belakang akan dilakukan sesuai dengan ketentuan yang berlaku.
                    </p>
                  )}

                  <p className="text-muted-foreground border-t pt-3">
                    Data yang terkumpul akan disimpan paling lama 24 bulan setelah keputusan akhir,
                    dan saya berhak mencabut persetujuan ini kapan saja sebelum keputusan akhir
                    (Verdict) ditetapkan, sesuai Pasal 9 UU 27/2022.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Agreement + submit */}
            <Card>
              <CardContent className="p-5 space-y-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <div
                    onClick={() => setAgreed((v) => !v)}
                    className={`mt-0.5 h-4 w-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                      agreed ? 'bg-primary border-primary' : 'border-muted-foreground bg-background'
                    }`}
                  >
                    {agreed && <Check className="h-3 w-3 text-primary-foreground" />}
                  </div>
                  <span className="text-xs leading-relaxed">
                    Saya telah membaca dan memahami dokumen ini, dan memberikan persetujuan saya.
                  </span>
                </label>

                {signErr && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-md border border-rose-200 bg-rose-50 text-xs text-rose-600">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> {signErr}
                  </div>
                )}

                <Button className="w-full text-sm" onClick={handleSign} disabled={!agreed || busy}>
                  {busy
                    ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Menyimpan…</>
                    : <><ShieldCheck className="h-3.5 w-3.5 mr-1.5" /> Tandatangani Persetujuan</>}
                </Button>
              </CardContent>
            </Card>
          </>
        )}

      </div>
    </div>
  );
}