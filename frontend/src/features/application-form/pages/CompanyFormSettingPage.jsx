import { useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { useCompanyForm } from '../hooks/use-company-form.js'
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import FormEditor from '../components/form-editor/FormEditor.jsx';
import FormPreviewModal from '../components/form-preview-modal/FormPreviewModal.jsx';

export default function CompanyFormSettingPage() {
  const { data, error, loading, saving, saveError, save } = useCompanyForm();

  if (loading || !data) return <p>Loading...</p>;
  if (error) return <p>Error...</p>;

  return <CompanyFormEditor initialSchema={data.schema} saving={saving} saveError={saveError} save={save} />;
}

function CompanyFormEditor({ initialSchema, saving, saveError, save }) {
  const [schema, setSchema] = useState(initialSchema);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    try {
      await save(schema);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      // saveError is surfaced below
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight font-serif">Application Form</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Pre-configured Application Form per Company
          </p>
        </div>
        <div className="flex items-center gap-2">
          {saved && (
            <Badge variant="outline" className="text-[10px] border-emerald-300 text-emerald-700 bg-emerald-50">
              <Check className="h-3 w-3 mr-1" /> Saved
            </Badge>
          )}
          <Button size="sm" variant="outline" onClick={() => setPreviewOpen(true)}>
            Preview
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Check className="h-3.5 w-3.5 mr-1.5" />}
            Save
          </Button>
        </div>
      </div>

      {saveError && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-red-200 bg-red-50 text-sm text-red-600">
          {saveError.response?.data?.message || saveError.message || 'Failed to save the form'}
        </div>
      )}

      <FormEditor schema={schema} onChange={setSchema} />

      <FormPreviewModal
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        schema={schema}
      />
    </div>
  );
}
