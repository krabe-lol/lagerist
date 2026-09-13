import TemplateFieldsForm, { type TemplateOption } from "@/components/TemplateFieldsForm";
import { createContainerAction, updateContainerAction } from "@/app/containers/actions";
import type { TemplateFieldDef } from "@/lib/constants";

interface LocationOption {
  id: string;
  name: string;
}

interface ExistingContainer {
  id: string;
  name: string;
  description: string | null;
  locationId: string;
  templateId: string | null;
  customFields: unknown;
}

export default function ContainerForm({
  mode,
  container,
  locationOptions,
  templates,
  initialTags,
  initialLocationId,
}: {
  mode: "new" | "edit";
  container?: ExistingContainer;
  locationOptions: LocationOption[];
  templates: { id: string; name: string; fields: TemplateFieldDef[] }[];
  initialTags: string[];
  initialLocationId?: string;
}) {
  const action = mode === "new" ? createContainerAction : updateContainerAction;

  return (
    <form action={action} className="flex max-w-2xl flex-col gap-4">
      {mode === "edit" && container && <input type="hidden" name="id" value={container.id} />}

      <label className="form-control">
        <span className="label-text mb-1">Name</span>
        <input
          type="text"
          name="name"
          required
          defaultValue={container?.name}
          className="input input-bordered"
        />
      </label>

      <label className="form-control">
        <span className="label-text mb-1">Beschreibung</span>
        <textarea
          name="description"
          defaultValue={container?.description ?? ""}
          className="textarea textarea-bordered"
          rows={3}
        />
      </label>

      <label className="form-control">
        <span className="label-text mb-1">Location</span>
        <select
          name="locationId"
          required
          defaultValue={container?.locationId ?? initialLocationId ?? ""}
          className="select select-bordered"
        >
          <option value="" disabled>
            Bitte wählen …
          </option>
          {locationOptions.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.name}
            </option>
          ))}
        </select>
      </label>

      <label className="form-control">
        <span className="label-text mb-1">Tags (durch Komma getrennt)</span>
        <input
          type="text"
          name="tags"
          defaultValue={initialTags.join(", ")}
          placeholder="z. B. werkzeug, blau"
          className="input input-bordered"
        />
      </label>

      <TemplateFieldsForm
        templates={templates as TemplateOption[]}
        initialTemplateId={container?.templateId}
        initialCustomFields={container?.customFields as Record<string, string> | undefined}
      />

      <button type="submit" className="btn btn-primary self-start">
        {mode === "new" ? "Container anlegen" : "Speichern"}
      </button>
    </form>
  );
}
