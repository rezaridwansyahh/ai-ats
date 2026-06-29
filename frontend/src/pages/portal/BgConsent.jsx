import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Loader2, AlertTriangle, CheckCircle2, Clock,
  ShieldCheck, Check,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import { getBgConsentByToken, signBgConsent } from '@/api/portal-bg.api';

const T = {
  brand:           'MYRALIX',
  brandSub:        'Portal Persetujuan Latar Belakang',
  loading:         'Memuat dokumen persetujuan…',
  reload:          'Muat ulang',
  genericError:    'Tidak dapat memuat. Coba muat ulang halaman.',
  // Expired
  expiredTitle:    'Tautan kedaluwarsa',
  expiredBody:     'Tautan persetujuan ini sudah kedaluwarsa. Silakan hubungi tim rekrutmen.',
  // Revoked
  revokedTitle:    'Persetujuan dicabut',
  revokedBody:     'Tautan persetujuan ini telah dicabut. Silakan hubungi tim rekrutmen.',
  // Signed
  signedTitle:     'Persetujuan sudah ditandatangani',
  signedBody:      'Anda sudah menandatangani persetujuan ini. Terima kasih.',
  // Consent form
  consentTitle:    'Surat Persetujuan Pemeriksaan Latar Belakang',
  agreeLabel:      'Saya telah membaca dan memahami dokumen ini, dan memberikan persetujuan saya.',
  submitButton:    'Tandatangani Persetujuan',
  submitting:      'Menyimpan…',
  // Submitted
  submittedTitle:  'Terima kasih!',
  submittedBody:   'Persetujuan Anda telah berhasil disimpan. Anda dapat menutup tab ini.',
};

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
      <div className="text-base font-bold tracking-widest text-primary">{T.brand}</div>
      <div className="text-[10px] tracking-wider uppercase text-muted-foreground">{T.brandSub}</div>
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

export default function BgConsentPage() {
  const { token } = useParams();

  const [view,    setView]    = useState('loading');
  const [consent, setConsent] = useState(null);
  const [agreed,  setAgreed]  = useState(false);
  const [busy,    setBusy]    = useState(false);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setView('loading');
      try {
        const res = await getBgConsentByToken(token);
        if (cancelled) return;
        setConsent(res.data?.consent || null);
        setView('form');
      } catch (err) {
        if (cancelled) return;
        const status = err.response?.status;
        if (status === 409) { setView('signed');  return; }
        if (status === 410) {
          const msg = err.response?.data?.message || '';
          setView(msg.includes('revok') ? 'revoked' : 'expired');
          return;
        }
        setView('error');
      }
    })();
    return () => { cancelled = true; };
  }, [token]);

  const handleSign = async () => {
    if (!agreed || busy) return;
    setBusy(true);
    setError(null);
    try {
      await signBgConsent(token);
      setView('submitted');
    } catch (err) {
      const status = err.response?.status;
      if (status === 409) { setView('signed');  return; }
      if (status === 410) { setView('expired'); return; }
      setError(err.response?.data?.message || T.genericError);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 flex items-start justify-center p-4 pt-10">
      <div className="w-full max-w-xl space-y-3">
        <Header />

        {view === 'loading' && (
          <CenteredCard>
            <Loader2 className="h-4 w-4 animate-spin inline mr-2" />{T.loading}
          </CenteredCard>
        )}

        {view === 'error' && (
          <Card>
            <CardContent className="p-6 space-y-3 text-center">
              <AlertTriangle className="h-7 w-7 text-rose-500 mx-auto" />
              <p className="text-xs text-muted-foreground">{T.genericError}</p>
              <Button variant="outline" size="sm" className="text-xs"
                onClick={() => window.location.reload()}>
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
              <p className="text-[11px] text-muted-foreground leading-relaxed">{T.expiredBody}</p>
            </CardContent>
          </Card>
        )}

        {view === 'revoked' && (
          <Card>
            <CardContent className="p-6 space-y-2 text-center">
              <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto" />
              <h2 className="text-sm font-bold">{T.revokedTitle}</h2>
              <p className="text-[11px] text-muted-foreground leading-relaxed">{T.revokedBody}</p>
            </CardContent>
          </Card>
        )}

        {view === 'signed' && (
          <Card>
            <CardContent className="p-6 space-y-2 text-center">
              <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto" />
              <h2 className="text-sm font-bold">{T.signedTitle}</h2>
              <p className="text-[11px] text-muted-foreground leading-relaxed">{T.signedBody}</p>
            </CardContent>
          </Card>
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

        {view === 'form' && consent && (
          <>
            {/* Header card */}
            <Card>
              <CardContent className="p-5 space-y-1">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-xs font-semibold">{T.consentTitle}</span>
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
            {consent.document ? (
              <Card>
                <CardContent className="p-5 space-y-4">
                  {/* Greeting */}
                  <p className="text-sm leading-relaxed">
                    Saya yang bertanda tangan di bawah ini, <strong>{consent.candidate_name}</strong>,
                    dengan ini memberikan persetujuan tertulis kepada <strong>{consent.document.company_name || consent.company_name}</strong> untuk
                    melakukan pemeriksaan latar belakang sehubungan dengan proses rekrutmen saya
                    untuk posisi <strong>{consent.document.position || consent.job_title}</strong>.
                  </p>

                  {/* Lanes enumerated */}
                  {Array.isArray(consent.document.lanes) && consent.document.lanes.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold">Pemeriksaan akan mencakup lajur-lajur berikut:</p>
                      <ol className="space-y-1.5 pl-4">
                        {consent.document.lanes.map((lane, i) => (
                          <li key={i} className="text-xs leading-relaxed list-decimal">
                            <strong>{lane.label}</strong>
                            {lane.description && ` — ${lane.description}`}
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {/* Legal footer */}
                  <p className="text-[11px] text-muted-foreground leading-relaxed border-t pt-3">
                    Data yang terkumpul akan disimpan paling lama 24 bulan setelah keputusan akhir.
                    Saya berhak mencabut persetujuan ini kapan saja sebelum keputusan akhir (Verdict)
                    ditetapkan, sesuai Pasal 9 UU 27/2022 tentang Pelindungan Data Pribadi.
                  </p>
                </CardContent>
              </Card>
            ) : (
              /* No document snapshot yet — show a generic consent */
              <Card>
                <CardContent className="p-5 space-y-3">
                  <p className="text-sm leading-relaxed">
                    Saya yang bertanda tangan di bawah ini, <strong>{consent.candidate_name}</strong>,
                    dengan ini memberikan persetujuan kepada <strong>{consent.company_name}</strong> untuk
                    melakukan pemeriksaan latar belakang sehubungan dengan rekrutmen posisi{' '}
                    <strong>{consent.job_title}</strong>, sesuai UU No. 27 Tahun 2022.
                  </p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed border-t pt-3">
                    Data yang terkumpul akan disimpan paling lama 24 bulan setelah keputusan akhir.
                    Anda berhak mencabut persetujuan ini sebelum Verdict ditetapkan.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Agreement checkbox + submit */}
            <Card>
              <CardContent className="p-5 space-y-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <div
                    onClick={() => setAgreed((v) => !v)}
                    className={`mt-0.5 h-4 w-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                      agreed
                        ? 'bg-primary border-primary'
                        : 'border-muted-foreground bg-background'
                    }`}
                  >
                    {agreed && <Check className="h-3 w-3 text-primary-foreground" />}
                  </div>
                  <span className="text-xs leading-relaxed">{T.agreeLabel}</span>
                </label>

                {error && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-md border border-rose-200 bg-rose-50 text-xs text-rose-600">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> {error}
                  </div>
                )}

                <Button
                  className="w-full text-sm"
                  onClick={handleSign}
                  disabled={!agreed || busy}
                >
                  {busy
                    ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />{T.submitting}</>
                    : <><ShieldCheck className="h-3.5 w-3.5 mr-1.5" />{T.submitButton}</>}
                </Button>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}