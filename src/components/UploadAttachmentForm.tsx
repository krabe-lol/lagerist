"use client";

import type { FormEvent } from "react";
import type { AttachmentKind, EntityType } from "@/lib/constants";
import CameraCapture from "@/components/CameraCapture";

const ACCEPT: Record<AttachmentKind, string> = {
  PHOTO: "image/jpeg,image/png,image/gif,image/webp",
  FILE: "image/jpeg,image/png,image/gif,image/webp,application/pdf",
};

// A real native <form encType="multipart/form-data"> submit, auto-triggered
// as soon as a file is picked — not a JS fetch() reading the File object.
// The browser's own form serialization is what reliably hands off a file
// picked via a native gallery/file-picker app; reading the File back out in
// JS afterwards (as a fetch()-based upload has to) turned out to silently
// come up empty on some Android/Chrome combinations. See KNOWN_ISSUES.md.
function autoSubmit(event: FormEvent<HTMLInputElement>) {
  event.currentTarget.form?.requestSubmit();
}

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

  if (kind === "PHOTO") {
    return (
      <div className="flex items-center gap-2">
        <CameraCapture entityType={entityType} entityId={entityId} />
        <form action={action} method="POST" encType="multipart/form-data">
          <label className="btn btn-outline btn-sm">
            Aus Galerie wählen
            <input type="file" name="file" accept={ACCEPT.PHOTO} onChange={autoSubmit} className="sr-only" />
          </label>
        </form>
      </div>
    );
  }

  return (
    <form action={action} method="POST" encType="multipart/form-data">
      <input
        type="file"
        name="file"
        accept={ACCEPT.FILE}
        onChange={autoSubmit}
        className="file-input file-input-bordered file-input-sm"
      />
    </form>
  );
}
