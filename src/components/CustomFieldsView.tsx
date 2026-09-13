import type { TemplateFieldDef } from "@/lib/constants";

export default function CustomFieldsView({
  customFields,
  fieldDefs,
}: {
  customFields: unknown;
  fieldDefs: TemplateFieldDef[];
}) {
  if (fieldDefs.length === 0) return null;
  const values = (customFields as Record<string, string>) ?? {};

  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
      {fieldDefs.map((def) => (
        <div key={def.key} className="flex justify-between border-b border-base-300 py-1 text-sm">
          <dt className="text-base-content/60">{def.label}</dt>
          <dd>
            {def.type === "BOOLEAN"
              ? values[def.key] === "true"
                ? "Ja"
                : "Nein"
              : values[def.key] || "—"}
          </dd>
        </div>
      ))}
    </dl>
  );
}
