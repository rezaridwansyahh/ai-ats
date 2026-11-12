import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SectionEditor from './SectionEditor';

export default function FormEditor({ schema, onChange }) {
  const sections = schema.sections || [];

  const setSections = (sections) => onChange({ ...schema, sections });

  const addSection = () => {
    setSections([
      ...sections,
      { key: `section_${Date.now()}`, label: 'New section', fields: [] },
    ]);
  };

  const updateSection = (idx, section) => {
    setSections(sections.map((s, i) => (i === idx ? section : s)));
  };

  const removeSection = (idx) => {
    setSections(sections.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-4">
      {sections.length === 0 ? (
        <p className="text-xs text-muted-foreground italic py-2">
          No sections yet — add one to start building the application form.
        </p>
      ) : (
        sections.map((section, idx) => (
          <SectionEditor
            key={section.key}
            section={section}
            onChange={(s) => updateSection(idx, s)}
            onRemove={() => removeSection(idx)}
          />
        ))
      )}

      <Button size="sm" variant="outline" onClick={addSection}>
        <Plus className="h-4 w-4 mr-1.5" /> Add section
      </Button>
    </div>
  );
}
