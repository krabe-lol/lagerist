import TemplateFieldsEditor from "@/components/TemplateFieldsEditor";
import { createTemplateAction, updateTemplateAction } from "@/app/templates/actions";
import { ENTITY_LABELS, ENTITY_TYPES, type TemplateFieldDef } from "@/lib/constants";

interface ExistingTemplate {
  id: string;
  name: string;
  entityType: string;
  fields: unknown;
}

export default function TemplateForm({
  mode,
  template,
}: {
  mode: "new" | "edit";
  template?: ExistingTemplate;
}) {
  const action = mode === "new" ? createTemplateAction : updateTemplateAction;

  return (
    <form action={action} className="flex max-w-3xl flex-col gap-4">
      {mode === "edit" && template && <input type="hidden" name="id" value={template.id} />}

      <label className="form-control max-w-sm">
        <span className="label-text mb-1">Name der Vorlage</span>
        <input
          type="text"
          name="name"
          required
          defaultValue={template?.name}
          className="input input-bordered"
        />
      </label>

      <label className="form-control max-w-sm">
        <span className="label-text mb-1">Für Entity-Typ</span>
        <select
          name="entityType"
          required
          defaultValue={template?.entityType}
          className="select select-bordered"
        >
          <option value="" disabled>
            Bitte wählen …
          </option>
          {ENTITY_TYPES.map((t) => (
            <option key={t} value={t}>
              {ENTITY_LABELS[t]}
            </option>
          ))}
        </select>
      </label>

      <div>
        <span className="label-text mb-1 block">Felder</span>
        <TemplateFieldsEditor
          initialFields={(template?.fields as TemplateFieldDef[] | undefined) ?? []}
        />
      </div>

      <button type="submit" className="btn btn-primary self-start">
        {mode === "new" ? "Vorlage anlegen" : "Speichern"}
      </button>
    </form>
  );
}
