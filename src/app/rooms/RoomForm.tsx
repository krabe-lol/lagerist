import FormField from "@/components/FormField";
import UploadAttachmentForm from "@/components/UploadAttachmentForm";
import { updateRoomAction } from "@/app/rooms/roomActions";

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
  onCancel,
}: {
  mode: "new" | "edit";
  room: ExistingRoom;
  parentOptions: RoomOption[];
  initialParentId?: string;
  onCancel?: () => void;
}) {
  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <form action={updateRoomAction} className="flex flex-col gap-4">
        <input type="hidden" name="id" value={room.id} />

        <FormField label="Name">
          <input
            type="text"
            name="name"
            required
            defaultValue={room.name}
            className="input input-bordered"
          />
        </FormField>

        <FormField label="Beschreibung">
          <textarea
            name="description"
            defaultValue={room.description ?? ""}
            className="textarea textarea-bordered"
            rows={3}
          />
        </FormField>

        <FormField label="Übergeordneter Raum">
          <select
            name="parentId"
            defaultValue={room.parentId ?? initialParentId ?? ""}
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

        <div className="flex items-center gap-3">
          <button type="submit" className="btn btn-primary self-start">
            {mode === "new" ? "Raum anlegen" : "Speichern"}
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
          <UploadAttachmentForm entityType="LOCATION" entityId={room.id} kind="PHOTO" />
          <UploadAttachmentForm entityType="LOCATION" entityId={room.id} kind="FILE" />
        </div>
      </FormField>
    </div>
  );
}
