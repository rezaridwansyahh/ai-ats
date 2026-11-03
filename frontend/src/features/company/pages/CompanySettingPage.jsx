import { useState, useEffect } from 'react';
import { Loader2, AlertTriangle, Check, Pencil, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useCompany } from '../context/CompanyProvider';
import { useUpdateCompany } from "../hooks/use-update-company.js"

export default function GeneralSettings() {
  const { company, loading } = useCompany();
  const { save, saving, error } = useUpdateCompany();

  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft]     = useState({});

  const startEdit = (field) => {
    setDraft({ name: company.name, description: company.description ?? '', email: company.email ?? '', website: company.website ?? '', logo_url: company.logo_url ?? '' })
    setIsEditing(true);
  };

  const cancelEdit = () => setIsEditing(false);

  const handleSave = async () => {
    try {
      await save(draft);
      setIsEditing(false);
    } catch {
      // error is shown below; stay in edit mode so nothing typed is lost
    }
  };

  const setField = (key) => (e) => setDraft((d) => ({ ...d, [key]: e.target.value }));

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold tracking-tight">General</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Workspace configuration · team access · roles · workflows · compliance · billing.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-2 flex justify-between items-center">
          <div>
            <CardTitle className="text-sm">Organization</CardTitle>
            <p className="text-xs text-muted-foreground">Company profile used on job posts and candidate communication.</p>
          </div>
          <Button onClick={() => startEdit(company)}>
            <Pencil />
            Edit
          </Button>
        </CardHeader>
        <CardContent className="space-y-0 divide-y">
          {loading ? 
            <p>Loading....</p>
            : <>
              <SettingRow
                label="Company Name"
                field="name"
                value={isEditing ? draft.name : company.name}
                isEditing={isEditing}
                onCancel={cancelEdit}
                setField={setField}
              />
              <SettingRow
                label="Website"
                field="website"
                value={isEditing ? draft.website : company.website}
                isEditing={isEditing}
                onCancel={cancelEdit}
                setField={setField}
              />
              <SettingRow
                label="Email"
                field="email"
                value={isEditing ? draft.email : company.email}
                isEditing={isEditing}
                onCancel={cancelEdit}
                setField={setField}
              />
              <SettingRow
                label="Description"
                field="description"
                value={isEditing ? draft.description : company.description}
                isEditing={isEditing}
                onCancel={cancelEdit}
                setField={setField}
              />
              <SettingRow
                label="Logo URL"
                field="logo_url"
                value={isEditing ? draft.logo_url : company.logo_url}
                isEditing={isEditing}
                onCancel={cancelEdit}
                setField={setField}
              />
            </>
          }
          { isEditing && 
            <div className='flex justify-end items-end'>
              <Button onClick={() => handleSave()}>
                Save
              </Button>
              <Button onClick={() => cancelEdit()}>
                Cancel
              </Button>
            </div>
          }
        </CardContent>
      </Card>
    </div>
  );
}

function SettingRow({ label, field, value, isEditing, onCancel, setField }) {
  return (
    <div className="py-3 flex items-center justify-between gap-4">
      <div className="min-w-0 flex-1">
        <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>
        {isEditing ?
          <Input
            value={value ? value : ''}
            onChange={setField(field)}
            className="mt-1 h-8 text-sm max-w-sm"
          />
          : <>
          <div className="text-sm font-medium mt-0.5">{value || <span className="text-muted-foreground italic">Not set</span>}</div>
          </>
        }
      </div>
    </div>
  );
}