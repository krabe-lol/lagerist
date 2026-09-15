import FormField from "@/components/FormField";
import { createTemplateAction, updateTemplateAction } from "@/app/templates/templateActions";

interface ExistingTemplate {
  id: string;
  name: string;
  dimensions: string | null;
  volume: string | null;
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
    <form action={action} className="flex max-w-md flex-col gap-4">
      {mode === "edit" && template && <input type="hidden" name="id" value={template.id} />}

      <FormField label="Name">
        <input
          type="text"
          name="name"
          required
          defaultValue={template?.name}
          placeholder="z. B. EzyStorage 18L"
          className="input input-bordered"
        />
      </FormField>

      <FormField label="Maße (B x T x H)">
        <input
          type="text"
          name="dimensions"
          defaultValue={template?.dimensions ?? ""}
          placeholder="z. B. 40 x 30 x 25 cm"
          className="input input-bordered"
        />
      </FormField>

      <FormField label="Volumen">
        <input
          type="text"
          name="volume"
          defaultValue={template?.volume ?? ""}
          placeholder="z. B. 18 L"
          className="input input-bordered"
        />
      </FormField>

      <button type="submit" className="btn btn-primary self-start">
        {mode === "new" ? "Vorlage anlegen" : "Speichern"}
      </button>
    </form>
  );
}
