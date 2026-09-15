"use client";

import { useState } from "react";
import FormField from "@/components/FormField";

export interface ContainerTemplateOption {
  id: string;
  name: string;
  dimensions: string | null;
  volume: string | null;
}

export default function ContainerTemplateFields({
  templates,
  initialTemplateId,
  initialName,
  initialDimensions,
  initialVolume,
}: {
  templates: ContainerTemplateOption[];
  initialTemplateId?: string | null;
  initialName?: string;
  initialDimensions?: string | null;
  initialVolume?: string | null;
}) {
  const [templateId, setTemplateId] = useState(initialTemplateId ?? "");
  const [name, setName] = useState(initialName ?? "");
  const [dimensions, setDimensions] = useState(initialDimensions ?? "");
  const [volume, setVolume] = useState(initialVolume ?? "");

  // Picking a template loads its name/dimensions/volume as a starting point;
  // all three stay freely editable afterwards regardless of the template.
  function handleTemplateChange(id: string) {
    setTemplateId(id);
    const template = templates.find((t) => t.id === id);
    if (template) {
      setName(template.name);
      setDimensions(template.dimensions ?? "");
      setVolume(template.volume ?? "");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <FormField label="Vorlage">
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
      </FormField>

      <FormField label="Name">
        <input
          type="text"
          name="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="input input-bordered"
        />
      </FormField>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Maße">
          <input
            type="text"
            name="dimensions"
            value={dimensions}
            onChange={(e) => setDimensions(e.target.value)}
            placeholder="z. B. 40 x 30 x 25 cm"
            className="input input-bordered"
          />
        </FormField>
        <FormField label="Volumen">
          <input
            type="text"
            name="volume"
            value={volume}
            onChange={(e) => setVolume(e.target.value)}
            placeholder="z. B. 18 L"
            className="input input-bordered"
          />
        </FormField>
      </div>
    </div>
  );
}
