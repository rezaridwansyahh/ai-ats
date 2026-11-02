import { useState } from 'react';
import { useCompanyForm } from '../hooks/use-company-form.js'
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import FormSummary from '../components/form-summary/FormSummary.jsx';
import FormPreviewModal from '../components/form-preview-modal/FormPreviewModal.jsx';

export default function CompanyFormSettingPage() {
  const { data, error, loading } = useCompanyForm();
  const [previewOpen, setPreviewOpen] = useState(false);

  if(loading) return <p>Loading...</p>
  if(error) return <p>Error...</p>

  return (
    <>
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight font-serif">Application Form</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Pre-configured Application Form per Company
          </p>
        </div>
        <Button size="sm" onClick={() => setPreviewOpen(true)}>
          Preview
        </Button>
      </div>

      <Card>
        <CardContent>
          <FormSummary schema={data.schema} />
        </CardContent>
      </Card>

      <FormPreviewModal
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        schema={data.schema}
      />
    </>
  )
}