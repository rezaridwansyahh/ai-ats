import { useState, useEffect } from 'react';
import { Loader2, FileText, Trash2, X, AlertCircle, CheckCircle2, Clock, Upload, List } from 'lucide-react';
import { listSources, uploadSource, deleteSource } from '@/api/source.api';

const STATUS_CONFIG = {
  pending: { label: 'Pending', className: 'bg-gray-100 text-gray-700', icon: Clock },
  processing: { label: 'Processing', className: 'bg-blue-100 text-blue-700', icon: Loader2 },
  indexed: { label: 'Indexed', className: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  failed: { label: 'Failed', className: 'bg-red-100 text-red-700', icon: AlertCircle },
};

export default function OnboardingChatbotSources({ onClose }) {
  const [tab, setTab] = useState('upload'); // 'upload' | 'list'

  const [loading, setLoading] = useState(false);
  const [listFetched, setListFetched] = useState(false);
  const [error, setError] = useState(null);
  const [sources, setSources] = useState([]);

  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(null);

  const loadList = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await listSources();
      setSources(response.data.sources || []);
      setListFetched(true);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const openTab = (next) => {
    setTab(next);
    setError(null);
    if (next === 'list' && !listFetched) loadList();
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile) return;
    setUploading(true);
    setError(null);
    setUploadSuccess(null);
    try {
      await uploadSource(uploadFile);
      setUploadSuccess(uploadFile.name);
      setUploadFile(null);
      setListFetched(false); // list is now stale — refetch next time it's opened
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this document? The chatbot will no longer use it to answer questions.')) return;
    try {
      await deleteSource(id);
      setSources((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to delete document');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white z-10">
          <div>
            <h3 className="font-semibold text-lg">Chatbot Knowledge Base</h3>
            <p className="text-sm text-muted-foreground">Upload compliance and policy documents the chatbot can answer questions from.</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex gap-2 px-6 pt-4">
          <button
            onClick={() => openTab('upload')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border ${
              tab === 'upload' ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-muted/30'
            }`}
          >
            <Upload className="w-4 h-4" /> Upload document
          </button>
          <button
            onClick={() => openTab('list')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border ${
              tab === 'list' ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-muted/30'
            }`}
          >
            <List className="w-4 h-4" /> Document list
          </button>
        </div>

        <div className="px-6 py-4 space-y-4">
          {error && (
            <div className="border border-destructive/30 bg-destructive/10 text-destructive text-sm rounded-lg px-4 py-3 flex justify-between items-center">
              {error}
              <button onClick={() => setError(null)} className="text-destructive"><X className="w-4 h-4" /></button>
            </div>
          )}

          {tab === 'upload' && (
            <form onSubmit={handleUpload} className="space-y-4">
              {uploadSuccess && (
                <div className="border border-green-300 bg-green-50 text-green-700 text-sm rounded-lg px-4 py-3">
                  "{uploadSuccess}" uploaded — check the Document list tab for indexing status.
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">PDF file</label>

                <label
                  htmlFor="chatbot-source-file"
                  className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-lg py-8 px-4 cursor-pointer transition-colors ${
                    uploadFile ? 'border-primary/40 bg-primary/5' : 'border-muted-foreground/30 hover:border-primary/40 hover:bg-muted/30'
                  }`}
                >
                  <FileText className={`w-8 h-8 ${uploadFile ? 'text-primary' : 'text-muted-foreground'}`} />
                  {uploadFile ? (
                    <div className="text-center">
                      <div className="text-sm font-medium">{uploadFile.name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {(uploadFile.size / 1024 / 1024).toFixed(2)} MB · click to choose a different file
                      </div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="text-sm font-medium">Click to choose a PDF</div>
                      <div className="text-xs text-muted-foreground mt-0.5">or drag one here</div>
                    </div>
                  )}
                  <input
                    id="chatbot-source-file"
                    required
                    type="file"
                    accept=".pdf"
                    onChange={(e) => { setUploadFile(e.target.files?.[0] || null); setUploadSuccess(null); }}
                    className="sr-only"
                  />
                </label>

                <p className="text-xs text-muted-foreground pt-1">
                  The chatbot will only be able to answer using what's in this document — plain text PDFs work best.
                </p>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={uploading || !uploadFile}
                  className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground disabled:opacity-50"
                >
                  {uploading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </form>
          )}

          {tab === 'list' && (
            loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : sources.length === 0 ? (
              <div className="text-center py-12 border rounded-lg bg-card">
                <p className="text-muted-foreground">No documents uploaded yet — add a PDF to give the chatbot something to answer from.</p>
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden bg-card">
                <table className="w-full">
                  <thead className="bg-muted/50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium">Document</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Chunks</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Uploaded</th>
                      <th className="px-4 py-3 text-right text-sm font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sources.map((item) => {
                      const status = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
                      const StatusIcon = status.icon;
                      return (
                        <tr key={item.id} className="border-b hover:bg-muted/30">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-muted-foreground" />
                              <span className="font-medium">{item.file?.split(/[\\/]/).pop() || `Document #${item.id}`}</span>
                            </div>
                            {item.status === 'failed' && item.error_message && (
                              <div className="text-xs text-destructive mt-1">{item.error_message}</div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium ${status.className}`}>
                              <StatusIcon className={`w-3 h-3 ${item.status === 'processing' ? 'animate-spin' : ''}`} />
                              {status.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">
                            {item.chunk_count > 0 ? item.chunk_count : '—'}
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">
                            {new Date(item.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="text-sm text-destructive hover:underline inline-flex items-center gap-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Remove
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}