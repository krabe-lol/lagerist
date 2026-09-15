"use client";

import type { FormEvent } from "react";
import type { AttachmentKind, EntityType } from "@/lib/constants";

const ACCEPT: Record<AttachmentKind, string> = {
  PHOTO: "image/jpeg,image/png,image/gif,image/webp",
  FILE: "image/jpeg,image/png,image/gif,image/webp,application/pdf",
};

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
      <form action={action} method="POST" encType="multipart/form-data">
        <label className="btn btn-primary btn-sm">
          Foto hinzufügen
          <input type="file" name="file" accept={ACCEPT.PHOTO} onChange={onChange} className="sr-only" />
        </label>
      </form>
    );
  }

  return (
    <form action={action} method="POST" encType="multipart/form-data">
      <input
        type="file"
        name="file"
        accept={ACCEPT.FILE}
        onChange={onChange}
        className="file-input file-input-bordered file-input-sm"
      />
    </form>
  );
}
