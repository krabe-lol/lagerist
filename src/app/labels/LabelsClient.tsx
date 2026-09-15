"use client";

import { useEffect, useMemo, useState } from "react";

interface EntityRow {
  id: string;
  name: string;
  typeLabel: string;
  segment: string;
  subtitle: string;
}

export default function LabelsClient() {
  const [entities, setEntities] = useState<EntityRow[]>([]);
  const [filter, setFilter] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch("/api/entities")
      .then((r) => r.json())
      .then(setEntities);
  }, []);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return entities;
    return entities.filter((e) => e.name.toLowerCase().includes(q));
  }, [entities, filter]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const selectedEntities = entities.filter((e) => selected.has(e.id));

  return (
    <div>
      <div className="no-print mb-6 flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="search"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Entities filtern …"
            className="input input-bordered w-full sm:max-w-sm"
          />
          <button onClick={() => window.print()} className="btn btn-primary" disabled={selected.size === 0}>
            {selected.size} Label{selected.size !== 1 && "s"} drucken
          </button>
        </div>
        <div className="max-h-96 overflow-y-auto rounded-box border border-base-300">
          {filtered.map((e) => (
            <label
              key={e.id}
              className="flex cursor-pointer items-center gap-3 border-b border-base-300 px-3 py-2 last:border-b-0 hover:bg-base-200"
            >
              <input
                type="checkbox"
                checked={selected.has(e.id)}
                onChange={() => toggle(e.id)}
                className="checkbox checkbox-sm"
              />
              <span className="min-w-0 flex-1 truncate">{e.name}</span>
              {e.subtitle && <span className="hidden shrink-0 text-xs text-base-content/60 sm:inline">{e.subtitle}</span>}
              <span className="badge badge-ghost badge-sm shrink-0">{e.typeLabel}</span>
            </label>
          ))}
        </div>
      </div>

      {selectedEntities.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 print:grid-cols-3">
          {selectedEntities.map((e) => (
            <div
              key={e.id}
              className="flex flex-col items-center gap-1 rounded-box border border-base-300 p-3 text-center"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/api/qr/${e.segment}/${e.id}`} alt="" width={120} height={120} />
              <p className="text-sm font-medium">{e.name}</p>
              {e.subtitle && <p className="text-xs text-base-content/60">{e.subtitle}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
