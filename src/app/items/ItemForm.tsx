import FormField from "@/components/FormField";
import PlaceOptions, { type PlaceRoomOption, type PlaceContainerOption } from "@/components/PlaceOptions";
import NewAttachmentFields from "@/components/NewAttachmentFields";
import { createItemAction, updateItemAction } from "@/app/items/itemActions";

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
}: {
  mode: "new" | "edit";
  item?: ExistingItem;
  roomOptions: PlaceRoomOption[];
  containerOptions: PlaceContainerOption[];
  initialTags: string[];
  initialRoomId?: string;
  initialContainerId?: string;
}) {
  const action = mode === "new" ? createItemAction : updateItemAction;

  const initialPlace = item?.locationId
    ? `room:${item.locationId}`
    : item?.containerId
      ? `container:${item.containerId}`
      : initialRoomId
        ? `room:${initialRoomId}`
        : initialContainerId
          ? `container:${initialContainerId}`
          : "";

  return (
    <form action={action} className="flex max-w-2xl flex-col gap-4">
      {mode === "edit" && item && <input type="hidden" name="id" value={item.id} />}

      <FormField label="Name">
        <input
          type="text"
          name="name"
          required
          defaultValue={item?.name}
          className="input input-bordered"
        />
      </FormField>

      <FormField label="Beschreibung">
        <textarea
          name="description"
          defaultValue={item?.description ?? ""}
          className="textarea textarea-bordered"
          rows={3}
        />
      </FormField>

      <FormField label="Menge" className="form-control max-w-32">
        <input
          type="number"
          name="quantity"
          min={1}
          defaultValue={item?.quantity ?? 1}
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

      {mode === "new" && <NewAttachmentFields />}

      <button type="submit" className="btn btn-primary self-start">
        {mode === "new" ? "Artikel anlegen" : "Speichern"}
      </button>
    </form>
  );
}
