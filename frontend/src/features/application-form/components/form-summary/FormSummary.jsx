export default function FormSummary({ schema }) {
  return (
    <div className="space-y-6">
      {schema.sections.map(section => (
        <section key={section.key}>
          <h3 className="font-semibold mb-2">{section.label}</h3>
          <ul className="divide-y rounded border">
            {section.fields.map(field => (
              <li key={field.key} className="flex justify-between px-4 py-2">
                <span>{field.label}</span>
                <span className="text-sm text-muted-foreground">Type: {field.type}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}