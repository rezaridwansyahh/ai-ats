import { useState, useEffect, useCallback, useRef } from 'react';
import { FileText, Upload, Loader2, AlertTriangle, Check, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import { getOfferTemplate, uploadOfferTemplate } from '@/api/offer-template.api';

const BANNER = {
  body: 'Your uploaded .docx is the exact document candidates receive — the app fills in the <<placeholders>> with each offer\'s data.',
};

function fmtDate(d) {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  } catch { return '—'; }
}

function fileNameFromPath(path) {
  if (!path) return '—';
  return path.split(/[\\/]/).pop();
}

export default function OfferTemplateSettings() {
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [banner, setBanner] = useState(null);
  const fileInputRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getOfferTemplate();
      setTemplate(res.data?.template || null);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load template');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleFileSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.docx')) {
      setError('Only .docx files are allowed');
      e.target.value = '';
      return;
    }

    setUploading(true);
    setError(null);
    try {
      const res = await uploadOfferTemplate(file);
      setTemplate(res.data?.template || null);
      setBanner({ ok: true, text: `Template uploaded — ${res.data?.template?.fields?.length || 0} field(s) detected.` });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to upload template');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const triggerFilePicker = () => fileInputRef.current?.click();

  return (
      <div className="space-y-4">
    <div>
      <h2 className="text-2xl font-bold tracking-tight font-serif">Offer Letter Template</h2>
      <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
        Upload your company's offer letter as a Word document with <code className="text-xs bg-muted px-1 py-0.5 rounded">{'<<field>>'}</code>{' '}
        placeholders (e.g. <code className="text-xs bg-muted px-1 py-0.5 rounded">{'<<name>>'}</code>,{' '}
        <code className="text-xs bg-muted px-1 py-0.5 rounded">{'<<basic_salary_>>'}</code>). Every field found in the
        document becomes an input recruiters fill in during Build.
      </p>
    </div>

    <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 px-4 py-3 text-sm text-emerald-900">
      <span className="font-semibold">{BANNER.title}</span>{' '}
      <span className="text-emerald-800">{BANNER.body}</span>
    </div>

    <Card className="bg-muted/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">
          Placeholder syntax
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1.5 text-xs text-muted-foreground">
        <p>Every placeholder needs <strong>double</strong> angle brackets on both sides:</p>
        <div className="flex items-center gap-4 font-mono">
          <span className="text-emerald-700">✓ &lt;&lt;name&gt;&gt;</span>
          <span className="text-rose-600">✗ &lt;name&gt;&gt;</span>
          <span className="text-rose-600">✗ &lt;&lt;name&gt;</span>
        </div>
      </CardContent>
    </Card>

    {/* NEW — this was missing entirely */}
    {error && (
      <div className="flex items-center gap-2 px-4 py-3 rounded-lg border border-red-200 bg-red-50 text-sm text-red-600">
        <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
        <button type="button" onClick={() => setError(null)} className="ml-auto">
          ×
        </button>
      </div>
    )}

    {banner && (
      <div className="flex items-center gap-2 px-4 py-3 rounded-lg border border-emerald-200 bg-emerald-50 text-sm text-emerald-700">
        <Check className="h-4 w-4 shrink-0" /> {banner.text}
      </div>
    )}

    <input
      ref={fileInputRef}
      type="file"
      accept=".docx"
      onChange={handleFileSelected}
      className="hidden"
    />

      {loading ? (
        <Card>
          <CardContent className="py-12 flex justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      ) : !template ? (
        <Card className="border-dashed">
          <CardContent className="py-10 flex flex-col items-center justify-center gap-3 text-center">
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
              <FileText className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-semibold">No template uploaded yet</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Recruiters can't build offer letters until a template is uploaded here.
              </p>
            </div>
            <Button size="sm" onClick={triggerFilePicker} disabled={uploading}>
              {uploading
                ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Uploading…</>
                : <><Upload className="h-3.5 w-3.5 mr-1.5" /> Upload template (.docx)</>}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary shrink-0" />
              <div className="min-w-0 flex-1">
                <CardTitle className="text-sm">{fileNameFromPath(template.file)}</CardTitle>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Uploaded {fmtDate(template.uploaded_at)}
                  {template.uploaded_by_name ? ` · by ${template.uploaded_by_name}` : ''}
                </p>
              </div>
              <Button size="sm" variant="outline" className="text-xs shrink-0" onClick={triggerFilePicker} disabled={uploading}>
                {uploading
                  ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  : <RefreshCw className="h-3.5 w-3.5 mr-1.5" />}
                Replace template
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Detected fields · {template.fields?.length || 0}
            </p>
            {template.fields?.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {template.fields.map((field) => (
                  <Badge key={field} variant="outline" className="text-[11px] font-mono">
                    {field}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">No fields detected.</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}