import TemplateFieldsForm, { type TemplateOption } from "@/components/TemplateFieldsForm";
import { createLocationAction, updateLocationAction } from "@/app/locations/actions";
import type { TemplateFieldDef } from "@/lib/constants";

interface LocationOption {
  id: string;
  name: string;
}

interface ExistingLocation {
  id: string;
  name: string;
  description: string | null;
  parentId: string | null;
  templateId: string | null;
  customFields: unknown;
}

export default function LocationForm({
  mode,
  location,
  parentOptions,
  templates,
  initialTags,
  initialParentId,
}: {
  mode: "new" | "edit";
  location?: ExistingLocation;
  parentOptions: LocationOption[];
  templates: { id: string; name: string; fields: TemplateFieldDef[] }[];
  initialTags: string[];
  initialParentId?: string;
}) {
  const action = mode === "new" ? createLocationAction : updateLocationAction;

  return (
    <form action={action} className="flex max-w-2xl flex-col gap-4">
      {mode === "edit" && location && <input type="hidden" name="id" value={location.id} />}

      <label className="form-control">
        <span className="label-text mb-1">Name</span>
        <input
          type="text"
          name="name"
          required
          defaultValue={location?.name}
          className="input input-bordered"
        />
      </label>

      <label className="form-control">
        <span className="label-text mb-1">Beschreibung</span>
        <textarea
          name="description"
          defaultValue={location?.description ?? ""}
          className="textarea textarea-bordered"
          rows={3}
        />
      </label>

      <label className="form-control">
        <span className="label-text mb-1">Übergeordnete Location</span>
        <select
          name="parentId"
          defaultValue={location?.parentId ?? initialParentId ?? ""}
          className="select select-bordered"
        >
          <option value="">Keine (oberste Ebene)</option>
          {parentOptions.map((opt) => (
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
          placeholder="z. B. keller, elektro"
          className="input input-bordered"
        />
      </label>

      <TemplateFieldsForm
        templates={templates as TemplateOption[]}
        initialTemplateId={location?.templateId}
        initialCustomFields={location?.customFields as Record<string, string> | undefined}
      />

      <button type="submit" className="btn btn-primary self-start">
        {mode === "new" ? "Location anlegen" : "Speichern"}
      </button>
    </form>
  );
}
