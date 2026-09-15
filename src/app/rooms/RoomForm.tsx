import FormField from "@/components/FormField";
import { createRoomAction, updateRoomAction } from "@/app/rooms/roomActions";

interface RoomOption {
  id: string;
  name: string;
}

interface ExistingRoom {
  id: string;
  name: string;
  description: string | null;
  parentId: string | null;
}

export default function RoomForm({
  mode,
  room,
  parentOptions,
  initialParentId,
}: {
  mode: "new" | "edit";
  room?: ExistingRoom;
  parentOptions: RoomOption[];
  initialParentId?: string;
}) {
  const action = mode === "new" ? createRoomAction : updateRoomAction;

  return (
    <form action={action} className="flex max-w-2xl flex-col gap-4">
      {mode === "edit" && room && <input type="hidden" name="id" value={room.id} />}

      <FormField label="Name">
        <input
          type="text"
          name="name"
          required
          defaultValue={room?.name}
          className="input input-bordered"
        />
      </FormField>

      <FormField label="Beschreibung">
        <textarea
          name="description"
          defaultValue={room?.description ?? ""}
          className="textarea textarea-bordered"
          rows={3}
        />
      </FormField>

      <FormField label="Übergeordneter Raum">
        <select
          name="parentId"
          defaultValue={room?.parentId ?? initialParentId ?? ""}
          className="select select-bordered"
        >
          <option value="">Keine (oberste Ebene)</option>
          {parentOptions.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.name}
            </option>
          ))}
        </select>
      </FormField>

      <button type="submit" className="btn btn-primary self-start">
        {mode === "new" ? "Raum anlegen" : "Speichern"}
      </button>
    </form>
  );
}
