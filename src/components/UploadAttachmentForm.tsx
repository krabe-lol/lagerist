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

const CTA: Record<AttachmentKind, string> = {
  PHOTO: "Foto hochladen",
  FILE: "Datei hochladen",
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

  async function handleUpload() {
    const file = inputRef.current?.files?.[0];
    if (!file) return;
    setError(null);

    if (!ACCEPT[kind].includes(file.type)) {
      setError(REJECT_MESSAGE[kind]);
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

      if (inputRef.current) inputRef.current.value = "";
      router.refresh();
    } catch {
      setError("Upload fehlgeschlagen. Bitte erneut versuchen.");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT[kind].join(",")}
          capture={kind === "PHOTO" ? "environment" : undefined}
          disabled={isUploading}
          onChange={() => setError(null)}
          className="file-input file-input-bordered file-input-sm"
        />
        <button type="button" className="btn btn-primary btn-sm" disabled={isUploading} onClick={handleUpload}>
          {isUploading ? "Lädt hoch…" : CTA[kind]}
        </button>
      </div>
      {error && <span className="text-xs text-error">{error}</span>}
    </div>
  );
}
