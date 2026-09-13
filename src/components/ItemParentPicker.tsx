"use client";

import { useState } from "react";

export interface ContainerOption {
  id: string;
  name: string;
  locationName: string;
}

export interface ItemOption {
  id: string;
  name: string;
}

export default function ItemParentPicker({
  containers,
  items,
  initialParentKind,
  initialContainerId,
  initialParentItemId,
}: {
  containers: ContainerOption[];
  items: ItemOption[];
  initialParentKind: "container" | "item";
  initialContainerId?: string;
  initialParentItemId?: string;
}) {
  const [kind, setKind] = useState<"container" | "item">(initialParentKind);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-4">
        <label className="label cursor-pointer gap-2">
          <input
            type="radio"
            name="parentKind"
            className="radio radio-sm"
            checked={kind === "container"}
            onChange={() => setKind("container")}
          />
          <span className="label-text">In Container</span>
        </label>
        <label className="label cursor-pointer gap-2">
          <input
            type="radio"
            name="parentKind"
            className="radio radio-sm"
            checked={kind === "item"}
            onChange={() => setKind("item")}
          />
          <span className="label-text">Als Unteritem von</span>
        </label>
      </div>

      <select
        name="containerId"
        disabled={kind !== "container"}
        required={kind === "container"}
        defaultValue={initialContainerId ?? ""}
        className="select select-bordered"
      >
        <option value="" disabled>
          Container wählen …
        </option>
        {containers.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name} ({c.locationName})
          </option>
        ))}
      </select>

      <select
        name="parentItemId"
        disabled={kind !== "item"}
        required={kind === "item"}
        defaultValue={initialParentItemId ?? ""}
        className="select select-bordered"
      >
        <option value="" disabled>
          Übergeordnetes Item wählen …
        </option>
        {items.map((i) => (
          <option key={i.id} value={i.id}>
            {i.name}
          </option>
        ))}
      </select>
    </div>
  );
}
