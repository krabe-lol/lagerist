"use client";

import type { FormEvent } from "react";
import { ALLOWED_UPLOAD_MIME_TYPES, type AttachmentKind, type EntityType } from "@/lib/constants";

const FILE_ACCEPT = ALLOWED_UPLOAD_MIME_TYPES.FILE.join(",");

export default function UploadAttachmentForm({
  entityType,
  entityId,
  kind,
}: {
  entityType: EntityType;
  entityId: string;
  kind: AttachmentKind;
}) {
  const action = `/api/uploads?entityType=${entityType}&entityId=${entityId}&kind=${kind}`;

  function onChange(event: FormEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    if (!input.files?.[0]) return;
    input.form?.requestSubmit();
  }

  if (kind === "PHOTO") {
    return (
      <>
        <form action={action} method="POST" encType="multipart/form-data">
          <label className="btn btn-outline btn-sm">
            Foto aufnehmen
            <input type="file" name="file" accept="image/*" capture="environment" onChange={onChange} className="sr-only" />
          </label>
          <label className="btn btn-outline btn-sm ml-2">
            Foto hinzufügen
            <input type="file" name="file" accept="image/*" onChange={onChange} className="sr-only" />
          </label>
        </form>
      </>
    );
  }

  return (
    <form action={action} method="POST" encType="multipart/form-data">
      <label className="btn btn-outline btn-sm">
        Datei(en) hinzufügen
        <input type="file" name="file" accept={FILE_ACCEPT} onChange={onChange} className="sr-only" />
      </label>
    </form>
  );
}
