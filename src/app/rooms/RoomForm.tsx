"use client";

import type { ReactNode } from "react";
import FormField from "@/components/FormField";
import VersionedForm from "@/components/VersionedForm";
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
  updatedAt: Date;
}

export default function RoomForm({
  mode,
  room,
  parentOptions,
  initialParentId,
  onCancel,
  attachments,
}: {
  mode: "new" | "edit";
  room: ExistingRoom;
  parentOptions: RoomOption[];
  initialParentId?: string;
  onCancel?: () => void;
  /** Replaces the bare upload buttons, e.g. with an AttachmentSection listing
   * what's already been uploaded to a resumed draft. */
  attachments?: ReactNode;
}) {
  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <VersionedForm
        action={updateRoomAction}
        entity="location"
        id={room.id}
        updatedAt={room.updatedAt}
        className="flex flex-col gap-4"
      >

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
      </VersionedForm>

      <FormField label="Fotos & Dateien" as="div">
        {attachments ?? (
          <div className="flex items-center gap-2">
            <UploadAttachmentForm entityType="LOCATION" entityId={room.id} kind="PHOTO" />
            <UploadAttachmentForm entityType="LOCATION" entityId={room.id} kind="FILE" />
          </div>
        )}
      </FormField>
    </div>
  );
}
