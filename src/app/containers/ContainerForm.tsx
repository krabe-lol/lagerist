import FormField from "@/components/FormField";
import ContainerTemplateFields, {
  type ContainerTemplateOption,
} from "@/components/ContainerTemplateFields";
import UploadAttachmentForm from "@/components/UploadAttachmentForm";
import { updateContainerAction } from "@/app/containers/containerActions";

interface RoomOption {
  id: string;
  name: string;
}

interface ExistingContainer {
  id: string;
  number: number;
  name: string;
  description: string | null;
  locationId: string | null;
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
  onCancel,
}: {
  mode: "new" | "edit";
  container: ExistingContainer;
  roomOptions: RoomOption[];
  templates: ContainerTemplateOption[];
  initialRoomId?: string;
  onCancel?: () => void;
}) {
  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <form action={updateContainerAction} className="flex flex-col gap-4">
        <input type="hidden" name="id" value={container.id} />

        <p className="text-sm text-base-content/60">
          {mode === "new" ? "Wird angelegt als" : "Nummer"}{" "}
          <span className="font-semibold">#{container.number}</span>
        </p>

        <ContainerTemplateFields
          templates={templates}
          initialTemplateId={container.templateId}
          initialName={container.name}
          initialDimensions={container.dimensions}
          initialVolume={container.volume}
        />

        <FormField label="Beschreibung">
          <textarea
            name="description"
            defaultValue={container.description ?? ""}
            className="textarea textarea-bordered"
            rows={3}
          />
        </FormField>

        <FormField label="Raum">
          <select
            name="locationId"
            required
            defaultValue={container.locationId ?? initialRoomId ?? ""}
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

        <div className="flex items-center gap-3">
          <button type="submit" className="btn btn-primary self-start">
            {mode === "new" ? "Container anlegen" : "Speichern"}
          </button>
          {mode === "new" && onCancel && (
            <button type="button" onClick={onCancel} className="btn btn-ghost self-start">
              Abbrechen
            </button>
          )}
        </div>
      </form>

      <FormField label="Fotos & Dateien" as="div">
        <div className="flex items-center gap-2">
          <UploadAttachmentForm entityType="CONTAINER" entityId={container.id} kind="PHOTO" />
          <UploadAttachmentForm entityType="CONTAINER" entityId={container.id} kind="FILE" />
        </div>
      </FormField>
    </div>
  );
}
