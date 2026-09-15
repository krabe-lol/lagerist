import FormField from "@/components/FormField";
import PlaceOptions, { type PlaceRoomOption, type PlaceContainerOption } from "@/components/PlaceOptions";
import UploadAttachmentForm from "@/components/UploadAttachmentForm";
import { updateItemAction } from "@/app/items/itemActions";

interface ExistingItem {
  id: string;
  name: string;
  description: string | null;
  quantity: number;
  locationId: string | null;
  containerId: string | null;
}

export default function ItemForm({
  mode,
  item,
  roomOptions,
  containerOptions,
  initialTags,
  initialRoomId,
  initialContainerId,
  onCancel,
}: {
  mode: "new" | "edit";
  item: ExistingItem;
  roomOptions: PlaceRoomOption[];
  containerOptions: PlaceContainerOption[];
  initialTags: string[];
  initialRoomId?: string;
  initialContainerId?: string;
  onCancel?: () => void;
}) {
  const initialPlace = item.locationId
    ? `room:${item.locationId}`
    : item.containerId
      ? `container:${item.containerId}`
      : initialRoomId
        ? `room:${initialRoomId}`
        : initialContainerId
          ? `container:${initialContainerId}`
          : "";

  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <form action={updateItemAction} className="flex flex-col gap-4">
        <input type="hidden" name="id" value={item.id} />

        <FormField label="Name">
          <input
            type="text"
            name="name"
            required
            defaultValue={item.name}
            className="input input-bordered"
          />
        </FormField>

        <FormField label="Beschreibung">
          <textarea
            name="description"
            defaultValue={item.description ?? ""}
            className="textarea textarea-bordered"
            rows={3}
          />
        </FormField>

        <FormField label="Menge" className="form-control max-w-32">
          <input
            type="number"
            name="quantity"
            min={1}
            defaultValue={item.quantity}
            className="input input-bordered"
          />
        </FormField>

        <FormField label="Lage">
          <select
            name="place"
            required
            defaultValue={initialPlace}
            className="select select-bordered"
          >
            <option value="" disabled>
              Bitte wählen …
            </option>
            <PlaceOptions rooms={roomOptions} containers={containerOptions} />
          </select>
        </FormField>

        <FormField label="Tags (durch Komma getrennt)">
          <input
            type="text"
            name="tags"
            defaultValue={initialTags.join(", ")}
            placeholder="z. B. elektronik, kabel"
            className="input input-bordered"
          />
        </FormField>

        <div className="flex items-center gap-3">
          <button type="submit" className="btn btn-primary self-start">
            {mode === "new" ? "Artikel anlegen" : "Speichern"}
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
          <UploadAttachmentForm entityType="ITEM" entityId={item.id} kind="PHOTO" />
          <UploadAttachmentForm entityType="ITEM" entityId={item.id} kind="FILE" />
        </div>
      </FormField>
    </div>
  );
}
