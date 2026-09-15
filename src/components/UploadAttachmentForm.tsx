"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { AttachmentKind, EntityType } from "@/lib/constants";

const ACCEPT: Record<AttachmentKind, string[]> = {
  PHOTO: ["image/jpeg", "image/png", "image/gif", "image/webp"],
  FILE: ["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf"],
};

const REJECT_MESSAGE: Record<AttachmentKind, string> = {
  PHOTO: "Nur Bilddateien (JPEG, PNG, GIF, WebP) sind als Foto erlaubt.",
  FILE: "Nur PDF- oder Bilddateien (JPEG, PNG, GIF, WebP) sind als Dateianhang erlaubt.",
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
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  async function handleUpload(file: File) {
    setError(null);

    if (!ACCEPT[kind].includes(file.type)) {
      setError(REJECT_MESSAGE[kind]);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    setIsUploading(true);
    try {
      const params = new URLSearchParams({ entityType, entityId, kind, filename: file.name });
      const res = await fetch(`/api/uploads?${params.toString()}`, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Upload fehlgeschlagen. Bitte erneut versuchen.");
        return;
      }

      router.refresh();
    } catch {
      setError("Upload fehlgeschlagen. Bitte erneut versuchen.");
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT[kind].join(",")}
          disabled={isUploading}
          onChange={(e) => {
            const file = e.currentTarget.files?.[0];
            if (file) handleUpload(file);
          }}
          className="file-input file-input-bordered file-input-sm"
        />
        {isUploading && <span className="loading loading-spinner loading-sm" aria-label="Lädt hoch …" />}
      </div>
      {error && <span className="text-xs text-error">{error}</span>}
    </div>
  );
}
