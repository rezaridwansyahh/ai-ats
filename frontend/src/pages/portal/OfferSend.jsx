import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Loader2, AlertTriangle, CheckCircle2, Clock,
  FileText, Check, Mail,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import {
  getByToken as getOfferSummary,
  verifyEmail as verifyOfferEmail,
  getOffer as getOfferDocument,
  sign as signOffer,
} from '@/api/portal-offer.api';

function fmtDate(d) {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleString('id-ID', {
      day: '2-digit', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return '—'; }
}

function fmtCurrency(value) {
  if (value == null) return null;
  try {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0,
    }).format(value);
  } catch { return null; }
}

function Header() {
  return (
    <div className="text-center mb-4">
      <div className="text-base font-bold tracking-widest text-primary">MYRALIX</div>
      <div className="text-[10px] tracking-wider uppercase text-muted-foreground">
        Portal Surat Penawaran
      </div>
    </div>
  );
}

export default function OfferSendPage() {
  const { token } = useParams();
  const [view,    setView]    = useState('loading');
  const [summary, setSummary] = useState(null);
  const [offer,   setOffer]   = useState(null);
  const [offerToken, setOfferToken] = useState(null);
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
        const res = await getOfferSummary(token);
        if (cancelled) return;
        setSummary(res.data?.offer || null);
        setView('email_gate');
      } catch (err) {
        if (cancelled) return;
        const status = err.response?.status;
        const msg    = err.response?.data?.message || '';
        if (status === 409)                          { setView('signed');  return; }
        if (status === 410 && msg.includes('revok')) { setView('revoked'); return; }
        if (status === 410)                          { setView('expired'); return; }
        setError(msg || 'Tidak dapat memuat tautan penawaran.');
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
      const res = await verifyOfferEmail(token, email.trim());
      setOfferToken(res.data?.offer_token || null);
      setOffer(res.data?.offer || null);
      setView('form');
    } catch (err) {
      setEmailErr(err.response?.data?.message || 'Email tidak cocok. Coba lagi.');
    } finally {
      setEmailBusy(false);
    }
  };

  const handleSign = async () => {
    if (!agreed || busy || !offerToken) return;
    setBusy(true);
    setSignErr(null);
    try {
      await signOffer(token, offerToken);
      setView('submitted');
    } catch (err) {
      const status = err.response?.status;
      if (status === 409) { setView('signed');  return; }
      if (status === 410) { setView('expired'); return; }
      setSignErr(err.response?.data?.message || 'Gagal menyimpan tanda tangan. Coba lagi.');
    } finally {
      setBusy(false);
    }
  };

  const doc = offer?.document || {};
  const netSalaryLabel = fmtCurrency(doc.net_salary ?? doc.compensation?.net_salary);

  return (
    <div className="min-h-screen bg-muted/30 flex items-start justify-center p-4 pt-10">
      <div className="w-full max-w-xl space-y-3">
        <Header />

        {view === 'loading' && (
          <Card>
            <CardContent className="py-10 text-center text-xs text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
              Memuat surat penawaran…
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
                Tautan surat penawaran ini sudah kedaluwarsa. Silakan hubungi tim rekrutmen untuk
                meminta tautan baru.
              </p>
            </CardContent>
          </Card>
        )}

        {view === 'revoked' && (
          <Card>
            <CardContent className="p-6 space-y-2 text-center">
              <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto" />
              <h2 className="text-sm font-bold">Tautan dicabut</h2>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Tautan surat penawaran ini telah dicabut. Silakan hubungi tim rekrutmen.
              </p>
            </CardContent>
          </Card>
        )}

        {view === 'signed' && (
          <Card>
            <CardContent className="p-6 space-y-2 text-center">
              <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto" />
              <h2 className="text-sm font-bold">Surat penawaran sudah ditandatangani</h2>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Anda sudah menandatangani surat penawaran ini. Terima kasih.
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
                Tanda tangan Anda telah berhasil disimpan. Tim rekrutmen akan segera menghubungi
                Anda untuk langkah berikutnya. Anda dapat menutup tab ini.
              </p>
            </CardContent>
          </Card>
        )}

        {view === 'email_gate' && summary && (
          <Card>
            <CardContent className="p-6 space-y-5">
              <div>
                <p className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground mb-1">
                  Undangan Surat Penawaran
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

        {view === 'form' && offer && (
          <>
            {/* Header card */}
            <Card>
              <CardContent className="p-5 space-y-1">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-xs font-semibold">
                    Surat Penawaran Kerja
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {offer.company_name} · {offer.position_title || offer.job_title}
                </p>
                {offer.token_expires_at && (
                  <p className="text-[10px] text-muted-foreground inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Berlaku hingga {fmtDate(offer.token_expires_at)}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Document body */}
            <Card>
              <CardContent className="p-0 overflow-hidden">
                <div className="px-5 py-4 border-b bg-muted/20 text-center">
                  <p className="text-xs font-bold tracking-wide uppercase text-foreground">
                    SURAT PENAWARAN KERJA
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {offer.company_name || 'PT —'}
                  </p>
                </div>

                <div className="px-5 py-4 space-y-3 text-[11px] leading-relaxed text-foreground">
                  <p>
                    Saya yang bertanda tangan di bawah ini,{' '}
                    <strong>{offer.candidate_name}</strong>,
                    dengan ini menerima dan menandatangani surat penawaran kerja dari{' '}
                    <strong>{offer.company_name || 'perusahaan'}</strong>{' '}
                    untuk posisi <strong>{offer.position_title || offer.job_title}</strong>
                    {offer.contract_type && <> dengan jenis kontrak <strong>{offer.contract_type}</strong></>}.
                  </p>

                  {netSalaryLabel && (
                    <div className="rounded-md border bg-muted/10 px-3 py-2 flex items-center justify-between">
                      <span className="text-muted-foreground">Gaji bersih (net) / bulan</span>
                      <span className="font-semibold font-mono">{netSalaryLabel}</span>
                    </div>
                  )}

                  {doc.start_date && (
                    <div className="rounded-md border bg-muted/10 px-3 py-2 flex items-center justify-between">
                      <span className="text-muted-foreground">Tanggal mulai</span>
                      <span className="font-semibold">{fmtDate(doc.start_date)}</span>
                    </div>
                  )}

                  {!netSalaryLabel && !doc.start_date && (
                    <p className="text-muted-foreground italic">
                      Detail kompensasi lengkap akan dikonfirmasi oleh tim rekrutmen sebelum tanggal mulai.
                    </p>
                  )}

                  <p className="text-muted-foreground border-t pt-3">
                    Dengan menandatangani surat ini secara elektronik, saya menyatakan telah membaca,
                    memahami, dan menyetujui seluruh syarat dan ketentuan yang tercantum dalam
                    penawaran ini.
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
                    Saya telah membaca dan memahami surat penawaran ini, dan menyetujui untuk
                    menandatanganinya.
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
                    : <><FileText className="h-3.5 w-3.5 mr-1.5" /> Tandatangani Penawaran</>}
                </Button>
              </CardContent>
            </Card>
          </>
        )}

      </div>
    </div>
  );
}