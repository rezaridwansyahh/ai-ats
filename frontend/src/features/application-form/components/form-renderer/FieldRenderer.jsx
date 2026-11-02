import TextField from './fields/TextField'
import SelectField from './fields/SelectField'

const FIELD_COMPONENTS = {
  text: TextField,
  date: TextField,
  select: SelectField,
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