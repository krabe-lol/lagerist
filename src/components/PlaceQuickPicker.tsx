"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import PlaceOptions, { type PlaceRoomOption, type PlaceContainerOption } from "@/components/PlaceOptions";

export default function PlaceQuickPicker({
  id,
  currentValue,
  currentHref,
  rooms,
  containers,
  updateAction,
}: {
  id: string;
  currentValue?: string;
  currentHref?: string;
  rooms: PlaceRoomOption[];
  containers: PlaceContainerOption[];
  updateAction: (formData: FormData) => void | Promise<void>;
}) {
  return (
    <form action={updateAction} className="flex items-center gap-2">
      <input type="hidden" name="id" value={id} />
      <select
        name="place"
        defaultValue={currentValue ?? ""}
        className="select select-bordered select-sm"
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
      >
        {!currentValue && (
          <option value="" disabled>
            Lage wählen …
          </option>
        )}
        <PlaceOptions rooms={rooms} containers={containers} />
      </select>
      {currentHref && (
        <Link
          href={currentHref}
          className="btn btn-outline btn-sm btn-square"
          aria-label="Zur Lage"
          title="Zur Lage"
        >
          <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </form>
  );
}
