import { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, X, RefreshCw, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { uploadCv, getUploadHistory } from '@/api/sourcing.api';

import CvUploadWizard, { useCvUploadWizard } from '@/components/tours/CvUploadWizard';

// ── Status badge config ────────────────────────────────────────────────────
const STATUS_CONFIG = {
  Processing: {
    label: 'Processing',
    className: 'bg-blue-50 text-blue-600 border-blue-200',
    icon: <Loader2 className="h-3 w-3 animate-spin" />,
  },
  Done: {
    label: 'Done',
    className: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    icon: <CheckCircle className="h-3 w-3" />,
  },
  Failed: {
    label: 'Failed',
    className: 'bg-red-50 text-red-500 border-red-200',
    icon: <AlertCircle className="h-3 w-3" />,
  },
  Pending: {
    label: 'Pending',
    className: 'bg-orange-50 text-orange-500 border-orange-200',
    icon: <Loader2 className="h-3 w-3 animate-spin" />,
  },
};

const MAX_FILES = 15;
const MAX_SIZE = 100 * 1024 * 1024; // 100MB per file
const BATCH_CONCURRENCY = 3; // parallel AI-extraction calls in flight at once

const isZipFile = (f) => f.name.toLowerCase().endsWith('.zip');
const isPdfFile = (f) => f.name.toLowerCase().endsWith('.pdf');

const formatDate = (d) => {
  if (!d) return '—';
  const date = new Date(d);
  return date.toLocaleDateString([], { day: '2-digit', month: 'short' })
    + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export default function CvUploadCard() {
  // Pending selection, not yet submitted. A single ZIP or 1-15 PDFs.
  const [files, setFiles]         = useState([]);
  const [uploading, setUploading] = useState(false);
  const [fileError, setFileError] = useState(null);

  // Per-file live status while a multi-PDF batch is in flight — one row
  // per file, shown in place of the dropzone so long batches (each file is
  // its own AI-extraction call) don't look like a frozen button.
  const [batchProgress, setBatchProgress] = useState([]);

  // DB-backed history
  const [history, setHistory]         = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  // Success modal — successData persists (used by the wizard as "upload
  // succeeded" context), modalOpen controls the Dialog's visibility so we
  // can tell when the user has actually dismissed it and the history panel
  // underneath is visible again.
  const [successData, setSuccessData] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fileInputRef = useRef(null);

  const { run: wizardRun, setRun: setWizardRun, markSeen: markWizardSeen, restart: restartWizard } = useCvUploadWizard();

  // ── Fetch history from DB on mount ───────────────────────────────────────
  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const { data } = await getUploadHistory(50);
      setHistory(data.history || []);
    } catch {
      // silently ignore — table may not exist yet if DB not re-seeded
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  // ── File validation ───────────────────────────────────────────────────────
  // A selection is either exactly one ZIP (bulk, processed in the
  // background) or 1-15 PDFs (each parsed individually). Mixing the two, or
  // any other extension, is rejected with a specific message.
  const handleFilesSelect = (selectedFiles) => {
    const list = Array.from(selectedFiles || []);
    if (list.length === 0) return;

    const zips = list.filter(isZipFile);
    const pdfs = list.filter(isPdfFile);
    const other = list.length - zips.length - pdfs.length;

    if (other > 0) {
      setFileError('Only PDF or ZIP files are supported.');
      return;
    }
    if (zips.length > 0 && (zips.length > 1 || pdfs.length > 0)) {
      setFileError('A ZIP must be uploaded on its own, not alongside other files.');
      return;
    }

    const batch = zips.length === 1 ? zips : pdfs;

    if (batch.length > MAX_FILES) {
      setFileError(`You can upload up to ${MAX_FILES} PDF files at once (selected ${batch.length}).`);
      return;
    }
    const oversized = batch.filter((f) => f.size > MAX_SIZE);
    if (oversized.length > 0) {
      setFileError(
        oversized.length === 1
          ? `"${oversized[0].name}" exceeds the 100MB limit.`
          : `${oversized.length} files exceed the 100MB limit.`
      );
      return;
    }

    setFiles(batch);
    setFileError(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    handleFilesSelect(e.dataTransfer?.files);
  };

  const handleRemoveFile = (e, index) => {
    e.stopPropagation();
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setFileError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClearFiles = (e) => {
    e.stopPropagation();
    setFiles([]);
    setFileError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const uploadOne = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return uploadCv(formData);
  };

  const handleSubmit = async () => {
    if (files.length === 0 || uploading) return;

    setUploading(true);
    const capturedFiles = files;
    setFiles([]);
    setFileError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';

    // Single file (PDF or ZIP) — unchanged one-request flow, with the
    // existing per-candidate / queued-for-processing success message.
    if (capturedFiles.length === 1) {
      const single = capturedFiles[0];
      try {
        const { data } = await uploadOne(single);
        await fetchHistory();
        setSuccessData({
          name:          data.applicant?.name || null,
          last_position: data.applicant?.last_position || null,
          isZip:         isZipFile(single),
          filename:      single.name,
        });
        setModalOpen(true);
      } catch (err) {
        const msg = err.response?.data?.message || err.message || 'Upload failed.';
        setFileError(msg);
        await fetchHistory();
      } finally {
        setUploading(false);
      }
      return;
    }

    // Batch of 2-15 PDFs — upload with limited concurrency, tracking each
    // file's status live, then show a single summary once all settle.
    setBatchProgress(capturedFiles.map((f) => ({ name: f.name, status: 'pending' })));

    const results = new Array(capturedFiles.length);
    let nextIndex = 0;

    const worker = async () => {
      while (nextIndex < capturedFiles.length) {
        const i = nextIndex++;
        const file = capturedFiles[i];
        setBatchProgress((prev) => prev.map((p, idx) => (idx === i ? { ...p, status: 'uploading' } : p)));
        try {
          const { data } = await uploadOne(file);
          results[i] = { ok: true, name: data.applicant?.name || file.name };
          setBatchProgress((prev) => prev.map((p, idx) => (idx === i ? { ...p, status: 'done' } : p)));
        } catch (err) {
          const msg = err.response?.data?.message || err.message || 'Upload failed.';
          results[i] = { ok: false, name: file.name, error: msg };
          setBatchProgress((prev) => prev.map((p, idx) => (idx === i ? { ...p, status: 'failed', error: msg } : p)));
        }
      }
    };

    await Promise.all(
      Array.from({ length: Math.min(BATCH_CONCURRENCY, capturedFiles.length) }, worker)
    );

    await fetchHistory();

    const failed = results.filter((r) => !r.ok);
    setSuccessData({
      isBatch: true,
      total: capturedFiles.length,
      succeededCount: capturedFiles.length - failed.length,
      failed,
    });
    setModalOpen(true);
    setUploading(false);
    setBatchProgress([]);
  };

  // ── Modal actions ─────────────────────────────────────────────────────────
  const handleReload = () => window.location.reload();
  // Dismiss without reloading — history is already fresh from fetchHistory()
  // above, this just reveals it so the wizard's history step can be seen.
  const handleDismissModal = () => setModalOpen(false);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Success Modal ── */}
      <Dialog open={modalOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <div className="flex flex-col items-center gap-3 pt-2 pb-1">
              <div className="h-12 w-12 rounded-full bg-emerald-50 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-emerald-500" />
              </div>
              <DialogTitle className="text-center text-base">
                {successData?.isBatch ? 'Batch Upload Complete' : 'Upload Successful!'}
              </DialogTitle>
            </div>
          </DialogHeader>

          <div className="text-center space-y-1 pb-2">
            {successData?.isBatch ? (
              <>
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">
                    {successData.succeededCount} of {successData.total}
                  </span>
                  {' '}CVs added to the talent pool.
                </p>
                {successData.failed.length > 0 && (
                  <div className="mt-2 max-h-28 overflow-y-auto text-left rounded-md border border-red-100 bg-red-50 p-2">
                    {successData.failed.map((f, i) => (
                      <p key={i} className="text-[11px] text-red-500 truncate" title={f.error}>
                        {f.name} — {f.error}
                      </p>
                    ))}
                  </div>
                )}
              </>
            ) : successData?.isZip ? (
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{successData?.filename}</span>
                {' '}has been queued for processing.
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{successData?.name}</span>
                {successData?.last_position && <> &mdash; {successData.last_position}</>}
                {' '}has been added to the talent pool.
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Reload the page to see the updated talent pool table.
            </p>
          </div>

          <DialogFooter className="sm:justify-center gap-2">
            <Button size="sm" variant="outline" className="text-xs px-4" onClick={handleDismissModal}>
              Keep working
            </Button>
            <Button size="sm" className="text-xs px-6" onClick={handleReload}>
              Reload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Main Card ── */}
      <Card>
        <CardHeader className="border-b pb-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="text-sm flex items-center gap-2">
                <Upload className="h-4 w-4 text-primary" />
                Upload CV to Talent Pool
              </CardTitle>
              <p className="text-[11px] text-muted-foreground mt-1">
                PDF — AI extracts candidate info instantly, up to {MAX_FILES} at once.&nbsp;&nbsp;ZIP — bulk CVs processed in background.
              </p>
            </div>
            <Button variant="ghost" size="sm" className="text-xs shrink-0" onClick={restartWizard}>
              <HelpCircle className="h-3.5 w-3.5 mr-1" /> Take the tour
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          <div className="grid grid-cols-2 gap-5">

            {/* ── Left: drop zone + button ── */}
            <div className="flex flex-col gap-3">
              <div
                data-wizard="cv-dropzone"
                className={`
                  relative flex flex-col items-center justify-center border-2 border-dashed
                  rounded-lg p-6 cursor-pointer transition-colors min-h-[150px]
                  ${files.length > 0
                    ? 'border-primary/50 bg-primary/5'
                    : 'border-border bg-muted/30 hover:border-primary/40'}
                  ${uploading ? 'pointer-events-none opacity-60' : ''}
                `}
                onClick={() => !uploading && fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
              >
                {uploading && batchProgress.length > 0 ? (
                  <div className="w-full max-h-[130px] overflow-y-auto flex flex-col gap-1 px-1">
                    {batchProgress.map((p, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-[11px]">
                        {p.status === 'done' && <CheckCircle className="h-3 w-3 text-emerald-500 shrink-0" />}
                        {p.status === 'failed' && <AlertCircle className="h-3 w-3 text-red-500 shrink-0" />}
                        {(p.status === 'pending' || p.status === 'uploading') && (
                          <Loader2 className={`h-3 w-3 shrink-0 text-muted-foreground ${p.status === 'uploading' ? 'animate-spin' : ''}`} />
                        )}
                        <span className="truncate" title={p.name}>{p.name}</span>
                      </div>
                    ))}
                  </div>
                ) : files.length === 1 ? (
                  <>
                    <FileText className="h-6 w-6 text-primary mb-2 shrink-0" />
                    <p className="text-xs font-semibold text-center text-primary break-all px-4">
                      {files[0].name}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {(files[0].size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    <button
                      type="button"
                      onClick={(e) => handleRemoveFile(e, 0)}
                      className="absolute top-2 right-2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </>
                ) : files.length > 1 ? (
                  <>
                    <p className="text-[11px] font-semibold text-primary mb-1.5">
                      {files.length} PDF files selected
                    </p>
                    <div className="w-full max-h-[90px] overflow-y-auto flex flex-col gap-0.5 px-1">
                      {files.map((f, i) => (
                        <div key={i} className="flex items-center justify-between gap-1 text-[10px] text-muted-foreground">
                          <span className="truncate" title={f.name}>{f.name}</span>
                          <button
                            type="button"
                            onClick={(e) => handleRemoveFile(e, i)}
                            className="shrink-0 hover:text-foreground transition-colors"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={handleClearFiles}
                      className="absolute top-2 right-2 text-muted-foreground hover:text-foreground transition-colors"
                      title="Clear all"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </>
                ) : (
                  <>
                    <Upload className="h-5 w-5 mb-2 text-muted-foreground" />
                    <p className="text-xs font-semibold text-center">
                      Drag files here or click to browse
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1 text-center">
                      Up to {MAX_FILES} PDFs, or one ZIP — max 100MB each
                    </p>
                  </>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.zip"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFilesSelect(e.target.files)}
                />
              </div>

              {fileError && (
                <div className="flex items-start gap-1.5 text-[11px] text-red-500">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  {fileError}
                </div>
              )}

              <Button
                data-wizard="cv-upload-btn"
                size="sm"
                className="text-xs w-fit"
                disabled={files.length === 0 || uploading}
                onClick={handleSubmit}
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    Processing…
                  </>
                ) : (
                  <>
                    <Upload className="h-3.5 w-3.5 mr-1.5" />
                    {files.length > 1 ? `Upload & Parse ${files.length} CVs` : 'Upload & Parse CV'}
                  </>
                )}
              </Button>
            </div>

            {/* ── Right: persistent upload history from DB ── */}
            <div className="flex flex-col" data-wizard="cv-history">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] font-semibold text-muted-foreground">Upload History</p>
                <button
                  type="button"
                  onClick={fetchHistory}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  title="Refresh history"
                >
                  <RefreshCw className={`h-3 w-3 ${historyLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {historyLoading ? (
                <div className="flex-1 flex items-center justify-center min-h-[150px]">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              ) : history.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 min-h-[150px] gap-1.5">
                  <p className="text-[11px] text-muted-foreground">No uploads yet.</p>
                  <p className="text-[10px] text-muted-foreground">Upload a PDF or ZIP to see history here.</p>
                </div>
              ) : (
                <div className="rounded-lg border border-border overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/40">
                      <TableRow>
                        <TableHead className="text-[10px] font-bold uppercase py-2">File</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase py-2">Candidate</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase py-2">Status</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase py-2 whitespace-nowrap">Uploaded</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {history.map((row) => {
                        const cfg = STATUS_CONFIG[row.status] || STATUS_CONFIG.Pending;
                        return (
                          <TableRow key={row.id}>
                            <TableCell className="py-2">
                              <div className="flex items-center gap-1">
                                <span className={`text-[10px] font-bold uppercase px-1 py-0.5 rounded ${
                                  row.file_type === 'zip'
                                    ? 'bg-amber-50 text-amber-600'
                                    : 'bg-blue-50 text-blue-600'
                                }`}>
                                  {row.file_type}
                                </span>
                                <p className="text-[11px] truncate max-w-[80px]" title={row.filename}>
                                  {row.filename}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell className="py-2">
                              {row.status === 'Done' ? (
                                <div>
                                  <p className="text-[11px] font-medium leading-tight truncate max-w-[110px]" title={row.applicant_name}>
                                    {row.applicant_name || '—'}
                                  </p>
                                  {row.applicant_position && (
                                    <p className="text-[10px] text-muted-foreground truncate max-w-[110px]" title={row.applicant_position}>
                                      {row.applicant_position}
                                    </p>
                                  )}
                                </div>
                              ) : row.status === 'Failed' ? (
                                <p className="text-[11px] text-red-500 truncate max-w-[110px]" title={row.error_message}>
                                  {row.error_message || 'Error'}
                                </p>
                              ) : (
                                <p className="text-[11px] text-muted-foreground">Extracting…</p>
                              )}
                            </TableCell>
                            <TableCell className="py-2">
                              <Badge
                                variant="outline"
                                className={`text-[10px] px-1.5 py-0 flex items-center gap-1 w-fit ${cfg.className}`}
                              >
                                {cfg.icon}
                                {cfg.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="py-2 text-[10px] text-muted-foreground whitespace-nowrap">
                              {formatDate(row.created_at)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

          </div>
        </CardContent>
      </Card>

      <CvUploadWizard
        file={files.length > 0 ? files : null}
        successData={successData}
        historyVisible={!!successData && !modalOpen}
        run={wizardRun && !modalOpen}
        setRun={setWizardRun}
        markSeen={markWizardSeen}
      />
    </>
  );
}
