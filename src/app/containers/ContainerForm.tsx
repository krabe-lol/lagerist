import FormField from "@/components/FormField";
import ContainerTemplateFields, {
  type ContainerTemplateOption,
} from "@/components/ContainerTemplateFields";
import NewAttachmentFields from "@/components/NewAttachmentFields";
import { createContainerAction, updateContainerAction } from "@/app/containers/containerActions";

interface RoomOption {
  id: string;
  name: string;
}

interface ExistingContainer {
  id: string;
  name: string;
  description: string | null;
  locationId: string;
  templateId: string | null;
  dimensions: string | null;
  volume: string | null;
}

export default function ContainerForm({
  mode,
  container,
  roomOptions,
  templates,
  initialRoomId,
  nextNumber,
}: {
  mode: "new" | "edit";
  container?: ExistingContainer;
  roomOptions: RoomOption[];
  templates: ContainerTemplateOption[];
  initialRoomId?: string;
  nextNumber?: number;
}) {
  const action = mode === "new" ? createContainerAction : updateContainerAction;

  return (
    <form action={action} className="flex max-w-2xl flex-col gap-4">
      {mode === "edit" && container && <input type="hidden" name="id" value={container.id} />}

      {mode === "new" && nextNumber !== undefined && (
        <p className="text-sm text-base-content/60">
          Wird angelegt als <span className="font-semibold">#{nextNumber}</span>
        </p>
      )}

      <ContainerTemplateFields
        templates={templates}
        initialTemplateId={container?.templateId}
        initialName={container?.name}
        initialDimensions={container?.dimensions}
        initialVolume={container?.volume}
      />

      <FormField label="Beschreibung">
        <textarea
          name="description"
          defaultValue={container?.description ?? ""}
          className="textarea textarea-bordered"
          rows={3}
        />
      </FormField>

      <FormField label="Raum">
        <select
          name="locationId"
          required
          defaultValue={container?.locationId ?? initialRoomId ?? ""}
          className="select select-bordered"
        >
          <option value="" disabled>
            Bitte wählen …
          </option>
          {roomOptions.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.name}
            </option>
          ))}
        </select>
      </FormField>

      {mode === "new" && <NewAttachmentFields />}

      <button type="submit" className="btn btn-primary self-start">
        {mode === "new" ? "Container anlegen" : "Speichern"}
      </button>
    </form>
  );
}
