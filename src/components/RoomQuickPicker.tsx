"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function RoomQuickPicker({
  id,
  currentRoomId,
  roomOptions,
  updateAction,
}: {
  id: string;
  currentRoomId?: string;
  roomOptions: { id: string; name: string }[];
  updateAction: (formData: FormData) => void | Promise<void>;
}) {
  return (
    <form action={updateAction} className="flex items-center gap-2">
      <input type="hidden" name="id" value={id} />
      <select
        name="locationId"
        defaultValue={currentRoomId ?? ""}
        className="select select-bordered select-sm"
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
      >
        {!currentRoomId && (
          <option value="" disabled>
            Raum wählen …
          </option>
        )}
        {roomOptions.map((l) => (
          <option key={l.id} value={l.id}>
            {l.name}
          </option>
        ))}
      </select>
      {currentRoomId && (
        <Link
          href={`/rooms/${currentRoomId}`}
          className="btn btn-outline btn-sm btn-square"
          aria-label="Zum Raum"
          title="Zum Raum"
        >
          <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </form>
  );
}
