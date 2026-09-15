"use client";

import { useState, type FormEvent } from "react";
import type { AttachmentKind, EntityType } from "@/lib/constants";

const ACCEPT: Record<AttachmentKind, string> = {
  PHOTO: "image/jpeg,image/png,image/gif,image/webp",
  FILE: "image/jpeg,image/png,image/gif,image/webp,application/pdf",
};

// TEMPORARY: visible on-page diagnostics for a real-device bug where no
// upload request ever reaches the server, cause unknown so far — remove
// this debug line (and the onClick/onChange logging around it) once the
// real cause is found and fixed.
export default function UploadAttachmentForm({
  entityType,
  entityId,
  kind,
}: {
  entityType: EntityType;
  entityId: string;
  kind: AttachmentKind;
}) {
  const [debug, setDebug] = useState("Bereit.");
  const action = `/api/uploads?entityType=${entityType}&entityId=${entityId}&kind=${kind}`;

  function time() {
    return new Date().toLocaleTimeString("de-DE");
  }

  function onLabelClick(label: string) {
    setDebug(`[${time()}] "${label}" angetippt, warte auf Dateiauswahl…`);
  }

  function onChange(event: FormEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) {
      setDebug(`[${time()}] onChange ausgelöst, aber input.files ist leer.`);
      return;
    }
    setDebug(`[${time()}] Datei erkannt: "${file.name}", ${file.size} Bytes, Typ "${file.type || "leer"}".`);

    const form = input.form;
    if (!form) {
      setDebug((d) => `${d} FEHLER: kein umgebendes <form> gefunden.`);
      return;
    }
    try {
      form.requestSubmit();
      setDebug((d) => `${d} requestSubmit() aufgerufen.`);
    } catch (err) {
      setDebug((d) => `${d} FEHLER bei requestSubmit(): ${String(err)}`);
    }
  }

  const debugBox = (
    <div className="rounded bg-base-300 px-2 py-1 font-mono text-xs break-words">Debug: {debug}</div>
  );

  if (kind === "PHOTO") {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <form action={action} method="POST" encType="multipart/form-data">
            <label className="btn btn-primary btn-sm" onClick={() => onLabelClick("Foto aufnehmen")}>
              Foto aufnehmen
              <input
                type="file"
                name="file"
                accept={ACCEPT.PHOTO}
                capture="environment"
                onChange={onChange}
                className="sr-only"
              />
            </label>
          </form>
          <form action={action} method="POST" encType="multipart/form-data">
            <label className="btn btn-outline btn-sm" onClick={() => onLabelClick("Aus Galerie wählen")}>
              Aus Galerie wählen
              <input type="file" name="file" accept={ACCEPT.PHOTO} onChange={onChange} className="sr-only" />
            </label>
          </form>
        </div>
        {debugBox}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <form action={action} method="POST" encType="multipart/form-data">
        <input
          type="file"
          name="file"
          accept={ACCEPT.FILE}
          onChange={onChange}
          className="file-input file-input-bordered file-input-sm"
        />
      </form>
      {debugBox}
    </div>
  );
}
