import TextField from './fields/TextField'
import TextareaField from './fields/TextareaField'
import SelectField from './fields/SelectField'
import MultiSelectField from './fields/MultiSelectField'

const FIELD_COMPONENTS = {
  text: TextField,
  date: TextField,
  textarea: TextareaField,
  select: SelectField,
  multiselect: MultiSelectField,
};

export default function FieldRenderer({ field, value, onChange, readOnly }) {
  const Component = FIELD_COMPONENTS[field.type];
  if (!Component) return <p>Unsupported field type: {field.type}</p>;
  return (
    <Component
      field={field}
      value={value}
      onChange={(v) => onChange(field.key, v)}
      readOnly={readOnly}
    />
  );
}