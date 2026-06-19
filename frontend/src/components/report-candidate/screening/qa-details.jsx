import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { Mail, ClipboardList } from 'lucide-react';

export default function QaDetails({ data }) {
  function fmt(d) {
    if (!d) return '—';
    try { return new Date(d).toISOString().slice(0, 10); } catch { return '—'; }
  }

  return (
    <div className="flex gap-3">
      <Card className="w-1/3 h-fit py-4 gap-3">
        <CardHeader className="flex items-center">
          <CardTitle className="text-sm flex items-center gap-2">
            <ClipboardList className="h-3.5 w-3.5 text-primary" /> Submitted application form
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            
            <SubmittedApplicationForm
              schema={data.application_form_schema}
              values={data.application_form}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="w-2/3 py-4 gap-3">
        <CardHeader className="flex items-center">
          <CardTitle className="text-sm flex items-center gap-2">
            <Mail className="h-3.5 w-3.5 text-primary" /> Responds
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(Array.isArray(data.answers) ? data.answers : []).map((a, i) => (
              <div key={i} className="rounded-lg border bg-background p-3 space-y-1.5">
                <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {a.topic || data.questions?.[i]?.topic || `Question ${i + 1}`}
                </div>
                <div className="text-xs font-medium">{a.question || data.questions?.[i]?.text}</div>
                <div className="text-[11px] text-muted-foreground italic px-3 py-2 rounded-md bg-muted/30 border">
                  {a.answer ? `“${a.answer}”` : <span className="not-italic">No answer provided.</span>}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function flattenFields(schema) {
  const sections = Array.isArray(schema?.sections) ? schema.sections : [];
  return sections.flatMap((s) => (Array.isArray(s?.fields) ? s.fields : []));
}

function SubmittedApplicationForm({ schema, values, awaiting }) {
  if (!schema) return null;
  const fields = flattenFields(schema);
  if (fields.length === 0) return null;
  const v = values && typeof values === 'object' ? values : {};

  const display = (f) => {
    const raw = v[f.key];
    if (Array.isArray(raw)) return raw.length ? raw.join(', ') : '—';
    return raw != null && String(raw).trim() !== '' ? String(raw) : '—';
  };

  return (
    <>
      {fields.map((field) => {
        return(
          <FacetRow label={`${field.label}`}>
            <div className="text-xs">{display(field)}</div>
          </FacetRow>
        )
      })}
    </>
    
  );
}

function FacetRow({ label, children }) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-3 items-start">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground pt-0.5">{label}</div>
      <div className="text-xs">{children}</div>
    </div>
  );
}