import FormField from "@/components/FormField";
import { createItemAction, updateItemAction } from "@/app/items/itemActions";

interface RoomOption {
  id: string;
  name: string;
}

interface ExistingItem {
  id: string;
  name: string;
  description: string | null;
  quantity: number;
  locationId: string | null;
}

export default function ItemForm({
  mode,
  item,
  roomOptions,
  initialTags,
  initialRoomId,
}: {
  mode: "new" | "edit";
  item?: ExistingItem;
  roomOptions: RoomOption[];
  initialTags: string[];
  initialRoomId?: string;
}) {
  const action = mode === "new" ? createItemAction : updateItemAction;

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

      <FormField label="Raum">
        <select
          name="locationId"
          required
          defaultValue={item?.locationId ?? initialRoomId ?? ""}
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

      <FormField label="Tags (durch Komma getrennt)">
        <input
          type="text"
          name="tags"
          defaultValue={initialTags.join(", ")}
          placeholder="z. B. elektronik, kabel"
          className="input input-bordered"
        />
      </FormField>

      <button type="submit" className="btn btn-primary self-start">
        {mode === "new" ? "Artikel anlegen" : "Speichern"}
      </button>
    </form>
  );
}
