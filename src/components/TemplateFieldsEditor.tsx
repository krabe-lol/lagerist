"use client";

import { useState } from "react";
import type { TemplateFieldDef, TemplateFieldType } from "@/lib/constants";
import { TEMPLATE_FIELD_TYPES } from "@/lib/constants";

const TYPE_LABELS: Record<TemplateFieldType, string> = {
  TEXT: "Text",
  NUMBER: "Zahl",
  DATE: "Datum",
  BOOLEAN: "Ja/Nein",
};

let rowIdCounter = 0;

export default function TemplateFieldsEditor({
  initialFields,
}: {
  initialFields: TemplateFieldDef[];
}) {
  const [rows, setRows] = useState<(TemplateFieldDef & { rowId: number })[]>(
    initialFields.map((f) => ({ ...f, rowId: rowIdCounter++ }))
  );

  function addRow() {
    setRows((r) => [...r, { rowId: rowIdCounter++, key: "", label: "", type: "TEXT", defaultValue: "" }]);
  }

  function removeRow(rowId: number) {
    setRows((r) => r.filter((row) => row.rowId !== rowId));
  }

  function updateRow(rowId: number, patch: Partial<TemplateFieldDef>) {
    setRows((r) => r.map((row) => (row.rowId === rowId ? { ...row, ...patch } : row)));
  }

  const fieldsJson = JSON.stringify(
    rows
      .filter((r) => r.key.trim() && r.label.trim())
      .map(({ key, label, type, defaultValue }) => ({ key: key.trim(), label, type, defaultValue }))
  );

  return (
    <div className="flex flex-col gap-3">
      <input type="hidden" name="fieldsJson" value={fieldsJson} />
      {rows.map((row) => (
        <div key={row.rowId} className="grid grid-cols-12 items-end gap-2 rounded-box border border-base-300 p-2">
          <label className="form-control col-span-3">
            <span className="label-text text-xs">Key</span>
            <input
              type="text"
              value={row.key}
              onChange={(e) => updateRow(row.rowId, { key: e.target.value })}
              placeholder="z. B. farbe"
              className="input input-bordered input-sm"
            />
          </label>
          <label className="form-control col-span-3">
            <span className="label-text text-xs">Label</span>
            <input
              type="text"
              value={row.label}
              onChange={(e) => updateRow(row.rowId, { label: e.target.value })}
              placeholder="z. B. Farbe"
              className="input input-bordered input-sm"
            />
          </label>
          <label className="form-control col-span-2">
            <span className="label-text text-xs">Typ</span>
            <select
              value={row.type}
              onChange={(e) => updateRow(row.rowId, { type: e.target.value as TemplateFieldType })}
              className="select select-bordered select-sm"
            >
              {TEMPLATE_FIELD_TYPES.map((t) => (
                <option key={t} value={t}>
                  {TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </label>
          <label className="form-control col-span-3">
            <span className="label-text text-xs">Standardwert</span>
            <input
              type="text"
              value={row.defaultValue ?? ""}
              onChange={(e) => updateRow(row.rowId, { defaultValue: e.target.value })}
              className="input input-bordered input-sm"
            />
          </label>
          <button
            type="button"
            onClick={() => removeRow(row.rowId)}
            className="btn btn-ghost btn-sm col-span-1 text-error"
          >
            ✕
          </button>
        </div>
      ))}
      <button type="button" onClick={addRow} className="btn btn-ghost btn-sm self-start">
        + Feld hinzufügen
      </button>
    </div>
  );
}
