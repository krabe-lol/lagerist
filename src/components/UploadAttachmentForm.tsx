"use client";

import { useState, type ChangeEvent } from "react";
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
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Reads the file straight from the change event and uploads immediately,
  // rather than selecting it now and reading it back later from a ref on a
  // separate "Upload" button click: on mobile, returning from the native
  // camera/gallery picker can leave that later read empty, so the button
  // click silently did nothing.
  async function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const input = event.target;
    const file = input.files?.[0];
    if (!file) return;
    setError(null);

    if (!ACCEPT[kind].includes(file.type)) {
      setError(REJECT_MESSAGE[kind]);
      input.value = "";
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

      input.value = "";
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
        {kind === "PHOTO" ? (
          <>
            <label className={`btn btn-primary btn-sm ${isUploading ? "btn-disabled" : ""}`}>
              Foto aufnehmen
              <input
                type="file"
                accept={ACCEPT.PHOTO.join(",")}
                capture="environment"
                disabled={isUploading}
                onChange={handleChange}
                className="hidden"
              />
            </label>
            <label className={`btn btn-outline btn-sm ${isUploading ? "btn-disabled" : ""}`}>
              Aus Galerie wählen
              <input
                type="file"
                accept={ACCEPT.PHOTO.join(",")}
                disabled={isUploading}
                onChange={handleChange}
                className="hidden"
              />
            </label>
          </>
        ) : (
          <input
            type="file"
            accept={ACCEPT.FILE.join(",")}
            disabled={isUploading}
            onChange={handleChange}
            className="file-input file-input-bordered file-input-sm"
          />
        )}
        {isUploading && <span className="loading loading-spinner loading-sm" />}
      </div>
      {error && <span className="text-xs text-error">{error}</span>}
    </div>
  );
}
