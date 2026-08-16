import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Loader2, AlertTriangle, CheckCircle2, Clock,
  FileSignature, Check, Mail, Download, Upload, FileCheck2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import {
  getByToken as getContractSummary,
  verifyEmail as verifyContractEmail,
  getContract as getContractDetail,
  downloadDocument,
  uploadDocument,
  submit as submitContract,
} from '@/api/portal-contract.api';

function fmtDate(d) {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleString('id-ID', {
      day: '2-digit', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return '—'; }
}

const CONTENT_TYPE_EXT = {
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
};

function downloadBlobResponse(blobResponse, fallbackBaseName) {
  const disposition = blobResponse.headers?.['content-disposition'] || '';
  const match = disposition.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
  let filename = match?.[1];

  if (!filename) {
    const contentType = (blobResponse.headers?.['content-type'] || '').split(';')[0].trim();
    const ext = CONTENT_TYPE_EXT[contentType] || 'pdf';
    filename = `${fallbackBaseName}.${ext}`;
  }

  const url = window.URL.createObjectURL(new Blob([blobResponse.data]));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
}

function Header() {
  return (
    <div className="text-center mb-4">
      <div className="text-base font-bold tracking-widest text-primary">MYRALIX</div>
      <div className="text-[10px] tracking-wider uppercase text-muted-foreground">
        Portal Kontrak Kerja
      </div>
    </div>
  );
}

export default function ContractSendPage() {
  const { token } = useParams();
  const [view,     setView]     = useState('loading');
  const [summary,  setSummary]  = useState(null);
  const [contract, setContract] = useState(null);
  const [contractToken, setContractToken] = useState(null);
  const [error,    setError]    = useState(null);

  const [email,     setEmail]     = useState('');
  const [emailBusy, setEmailBusy] = useState(false);
  const [emailErr,  setEmailErr]  = useState(null);

  const [downloadingFormat, setDownloadingFormat] = useState(null); // 'docx' | 'pdf' | null
  const [downloadErr, setDownloadErr] = useState(null);

  const fileInputRef = useRef(null);
  const [selectedFileName, setSelectedFileName] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitErr,  setSubmitErr]  = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setView('loading');
      try {
        const res = await getContractSummary(token);
        if (cancelled) return;
        setSummary(res.data?.contract || null);
        setView('email_gate');
      } catch (err) {
        if (cancelled) return;
        const status = err.response?.status;
        const msg    = err.response?.data?.message || '';
        if (status === 409)                          { setView('submitted'); return; }
        if (status === 410 && msg.includes('revok')) { setView('revoked');   return; }
        if (status === 410)                          { setView('expired');   return; }
        setError(msg || 'Tidak dapat memuat tautan kontrak.');
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
      const res = await verifyContractEmail(token, email.trim());
      // Note: portal-contract's verifyEmail returns `contract_token`, not
      // `offer_token` — see portal-contract.service.js.
      setContractToken(res.data?.contract_token || null);
      setContract(res.data?.contract || null);
      setView('form');
    } catch (err) {
      setEmailErr(err.response?.data?.message || 'Email tidak cocok. Coba lagi.');
    } finally {
      setEmailBusy(false);
    }
  };

  const refreshContract = async () => {
    if (!contractToken) return;
    try {
      const res = await getContractDetail(token, contractToken);
      setContract(res.data?.contract || null);
    } catch { /* keep stale state, next action will surface any real error */ }
  };

  const handleDownload = async (format) => {
    if (downloadingFormat) return;
    setDownloadingFormat(format);
    setDownloadErr(null);
    try {
      const res = await downloadDocument(token, contractToken, format);
      downloadBlobResponse(res, `Contract_${contract?.candidate_name || 'candidate'}_${format}`);
    } catch (err) {
      const status = err.response?.status;
      if (status === 409) { setView('submitted'); return; }
      if (status === 410) { setView('expired');   return; }
      setDownloadErr(`Gagal mengunduh versi .${format}. Coba lagi.`);
    } finally {
      setDownloadingFormat(null);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file
    if (!file) return;
    setSelectedFileName(file.name);
    handleUpload(file);
  };

  const handleUpload = async (file) => {
    if (uploading) return;
    setUploading(true);
    setUploadErr(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      await uploadDocument(token, contractToken, formData);
      await refreshContract();
    } catch (err) {
      const status = err.response?.status;
      if (status === 409) { setView('submitted'); return; }
      if (status === 410) { setView('expired');   return; }
      setUploadErr(err.response?.data?.message || 'Gagal mengunggah berkas. Coba lagi.');
      setSelectedFileName(null);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (submitting || !contract?.candidate_uploaded_at) return;
    setSubmitting(true);
    setSubmitErr(null);
    try {
      await submitContract(token, contractToken);
      setView('submitted');
    } catch (err) {
      const status = err.response?.status;
      if (status === 409) { setView('submitted'); return; }
      if (status === 410) { setView('expired');   return; }
      setSubmitErr(err.response?.data?.message || 'Gagal mengirim. Coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  const hasUploaded = !!contract?.candidate_uploaded_at;

  return (
    <div className="min-h-screen bg-muted/30 flex items-start justify-center p-4 pt-10">
      <div className="w-full max-w-xl space-y-3">
        <Header />

        {view === 'loading' && (
          <Card>
            <CardContent className="py-10 text-center text-xs text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
              Memuat kontrak kerja…
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
                Tautan kontrak ini sudah kedaluwarsa. Silakan hubungi tim rekrutmen untuk
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
                Tautan kontrak ini telah dicabut. Silakan hubungi tim rekrutmen.
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
                Kontrak yang telah Anda tanda tangani berhasil dikirim. Tim rekrutmen akan
                segera menghubungi Anda untuk langkah berikutnya. Anda dapat menutup tab ini.
              </p>
              <p className="text-[10px] text-muted-foreground pt-2 border-t">
                Ada yang perlu diubah pada kontrak ini? Hubungi rekruter Anda langsung — perubahan
                tidak dapat dilakukan melalui portal ini.
              </p>
            </CardContent>
          </Card>
        )}

        {view === 'email_gate' && summary && (
          <Card>
            <CardContent className="p-6 space-y-5">
              <div>
                <p className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground mb-1">
                  Undangan Kontrak Kerja
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

        {view === 'form' && contract && (
          <>
            {/* Header card */}
            <Card>
              <CardContent className="p-5 space-y-1">
                <div className="flex items-center gap-2">
                  <FileSignature className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-xs font-semibold">
                    Kontrak Kerja
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {contract.company_name} · {contract.position_title || contract.job_title}
                  {contract.contract_type && <> · {contract.contract_type}</>}
                </p>
                {contract.token_expires_at && (
                  <p className="text-[10px] text-muted-foreground inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Berlaku hingga {fmtDate(contract.token_expires_at)}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="h-5 w-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center shrink-0">1</span>
                  <p className="text-xs font-semibold">Unduh kontrak</p>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Unduh kontrak kerja final Anda, tanda tangani, lalu unggah kembali pada langkah berikutnya.
                </p>

                {!contract.has_letter ? (
                  <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                    Kontrak belum tersedia — silakan hubungi tim rekrutmen.
                  </p>
                ) : (
                  <>
                    <div className="flex gap-2">
                      {(contract.letter_available_formats || []).map((fmt) => (
                        <Button
                          key={fmt}
                          variant="outline"
                          className="flex-1"
                          onClick={() => handleDownload(fmt)}
                          disabled={!!downloadingFormat}
                        >
                          {downloadingFormat === fmt
                            ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Mengunduh…</>
                            : <><Download className="h-4 w-4 mr-2" /> Unduh .{fmt.toUpperCase()}</>}
                        </Button>
                      ))}
                    </div>
                    {contract.letter_extension && contract.letter_available_formats?.length === 1 && (
                      <p className="text-[10px] text-muted-foreground">
                        Kontrak ini diunggah sebagai .{contract.letter_extension} — versi lain tidak tersedia.
                      </p>
                    )}
                    {downloadErr && (
                      <p className="text-[11px] text-rose-600 flex items-center gap-1">
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> {downloadErr}
                      </p>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <span className={`h-5 w-5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 ${
                    hasUploaded ? 'bg-emerald-500 text-white' : 'bg-primary text-primary-foreground'
                  }`}>
                    {hasUploaded ? <Check className="h-3 w-3" /> : '2'}
                  </span>
                  <p className="text-xs font-semibold">Unggah salinan yang telah ditandatangani</p>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Unggah kontrak yang sudah Anda tanda tangani (PDF atau DOCX maks. 10MB).
                </p>

                {hasUploaded && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-md border border-emerald-200 bg-emerald-50 text-[11px] text-emerald-700">
                    <FileCheck2 className="h-3.5 w-3.5 shrink-0" />
                    {selectedFileName || 'Berkas'} terunggah — {fmtDate(contract.candidate_uploaded_at)}
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx"
                  className="hidden"
                  onChange={handleFileSelect}
                />
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading
                    ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Mengunggah…</>
                    : <><Upload className="h-4 w-4 mr-2" /> {hasUploaded ? 'Ganti berkas' : 'Unggah berkas'}</>}
                </Button>
                {uploadErr && (
                  <p className="text-[11px] text-rose-600 flex items-center gap-1">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> {uploadErr}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="h-5 w-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center shrink-0">3</span>
                  <p className="text-xs font-semibold">Kirim</p>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Setelah mengunggah, klik Kirim untuk menyelesaikan proses. Pastikan berkas yang
                  diunggah sudah benar — langkah ini bersifat final.
                </p>

                {submitErr && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-md border border-rose-200 bg-rose-50 text-xs text-rose-600">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> {submitErr}
                  </div>
                )}

                <Button
                  className="w-full text-sm"
                  onClick={handleSubmit}
                  disabled={!hasUploaded || submitting}
                >
                  {submitting
                    ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Mengirim…</>
                    : <><Check className="h-3.5 w-3.5 mr-1.5" /> Kirim Kontrak</>}
                </Button>
                {!hasUploaded && (
                  <p className="text-[10px] text-muted-foreground text-center">
                    Unggah berkas Anda pada langkah 2 sebelum mengirim.
                  </p>
                )}
              </CardContent>
            </Card>

            <p className="text-[10px] text-muted-foreground text-center px-4">
              Ingin mengubah sesuatu pada kontrak ini? Hubungi rekruter Anda langsung melalui
              telepon, chat, atau email — perubahan tidak dapat dilakukan melalui portal ini.
            </p>
          </>
        )}

      </div>
    </div>
  );
}