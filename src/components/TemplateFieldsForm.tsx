"use client";

import { useState } from "react";
import type { TemplateFieldDef } from "@/lib/constants";

export interface TemplateOption {
  id: string;
  name: string;
  fields: TemplateFieldDef[];
}

export default function TemplateFieldsForm({
  templates,
  initialTemplateId,
  initialCustomFields,
}: {
  templates: TemplateOption[];
  initialTemplateId?: string | null;
  initialCustomFields?: Record<string, string>;
}) {
  const [templateId, setTemplateId] = useState(initialTemplateId ?? "");
  const [values, setValues] = useState<Record<string, string>>(initialCustomFields ?? {});

  const selected = templates.find((t) => t.id === templateId);

  function handleTemplateChange(id: string) {
    setTemplateId(id);
    const t = templates.find((x) => x.id === id);
    if (!t) {
      setValues({});
      return;
    }
    const next: Record<string, string> = {};
    for (const f of t.fields) next[f.key] = f.defaultValue ?? "";
    setValues(next);
  }

  return (
    <div className="flex flex-col gap-3">
      <label className="form-control">
        <span className="label-text mb-1">Vorlage</span>
        <select
          name="templateId"
          value={templateId}
          onChange={(e) => handleTemplateChange(e.target.value)}
          className="select select-bordered"
        >
          <option value="">Keine Vorlage</option>
          {templates.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </label>

      {selected && selected.fields.length > 0 && (
        <div className="grid grid-cols-1 gap-3 rounded-box border border-base-300 p-3 sm:grid-cols-2">
          {selected.fields.map((f) => (
            <label key={f.key} className="form-control">
              <span className="label-text mb-1">{f.label}</span>
              {f.type === "BOOLEAN" ? (
                <input
                  type="checkbox"
                  name={`cf_${f.key}`}
                  defaultChecked={values[f.key] === "true"}
                  className="checkbox"
                />
              ) : (
                <input
                  type={f.type === "NUMBER" ? "number" : f.type === "DATE" ? "date" : "text"}
                  name={`cf_${f.key}`}
                  value={values[f.key] ?? ""}
                  onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                  className="input input-bordered"
                />
              )}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
