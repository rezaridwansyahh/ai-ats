import FieldRenderer from './FieldRenderer.jsx';

export default function FormRenderer({ schema, values = {}, onChange = () => {}, readOnly = false }) {
  return (
    <div className="space-y-8">
      {schema.sections.map((section) => (
        <section key={section.key}>
          <h3 className="text-lg font-semibold mb-4">{section.label}</h3>
          <div className="space-y-4">
            {section.fields.map((field) => (
              <FieldRenderer
                key={field.key}
                field={field}
                value={values[field.key]}
                onChange={onChange}
                readOnly={readOnly}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}