"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Trash2, X } from "lucide-react";
import type { EntityType } from "@/lib/constants";
import { deleteAttachmentAction } from "@/lib/attachment-actions";
import ConfirmDeleteForm from "@/components/ConfirmDeleteForm";

interface Photo {
  id: string;
  filename: string;
}

export default function PhotoGallery({
  photos,
  entityType,
  entityId,
}: {
  photos: Photo[];
  entityType: EntityType;
  entityId: string;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  // Set explicitly by the button that was pressed, never derived from the
  // index change itself — that's what keeps the slide direction matching the
  // arrow the user clicked even when wrapping around the list's ends.
  const [direction, setDirection] = useState<1 | -1>(1);

  const close = () => setOpenIndex(null);
  const next = () => {
    setDirection(1);
    setOpenIndex((i) => (i === null ? null : (i + 1) % photos.length));
  };
  const prev = () => {
    setDirection(-1);
    setOpenIndex((i) => (i === null ? null : (i - 1 + photos.length) % photos.length));
  };

  useEffect(() => {
    if (openIndex === null) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openIndex]);

  return (
    <>
      <div className="mb-3 flex flex-wrap gap-3">
        {photos.map((photo, index) => (
          <div key={photo.id} className="group relative">
            <button
              type="button"
              onClick={() => setOpenIndex(index)}
              className="block cursor-zoom-in"
              aria-label={`${photo.filename} groß anzeigen`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/files/${photo.id}`}
                alt={photo.filename}
                className="h-36 w-36 rounded-box object-cover"
              />
            </button>
            <ConfirmDeleteForm
              action={deleteAttachmentAction}
              confirmMessage={`Foto "${photo.filename}" wirklich löschen?`}
              hiddenFields={{ entityType, entityId, attachmentId: photo.id }}
              className="absolute top-1 right-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
            >
              <button
                type="submit"
                className="btn btn-circle btn-error btn-xs hover:border-error hover:bg-white hover:text-error"
                aria-label="Foto löschen"
                title="Löschen"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </ConfirmDeleteForm>
          </div>
        ))}
        {photos.length === 0 && <p className="text-sm text-base-content/60">Noch keine Fotos.</p>}
      </div>

      {openIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={close}
          role="dialog"
          aria-modal="true"
          aria-label="Fotoansicht"
        >
          <button
            type="button"
            onClick={close}
            className="btn btn-circle btn-ghost absolute top-4 right-4 text-white hover:bg-white/10"
            aria-label="Schließen"
          >
            <X className="h-6 w-6" />
          </button>

          {photos.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                prev();
              }}
              className="btn btn-circle btn-ghost absolute top-1/2 left-4 -translate-y-1/2 text-white hover:bg-white/10"
              aria-label="Vorheriges Foto"
            >
              <ChevronLeft className="h-8 w-8" />
            </button>
          )}

          <div className="overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={openIndex}
              src={`/api/files/${photos[openIndex].id}`}
              alt={photos[openIndex].filename}
              className={`max-h-[85vh] max-w-[90vw] rounded-box object-contain ${
                direction === 1 ? "lightbox-slide-next" : "lightbox-slide-prev"
              }`}
            />
          </div>

          {photos.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                next();
              }}
              className="btn btn-circle btn-ghost absolute top-1/2 right-4 -translate-y-1/2 text-white hover:bg-white/10"
              aria-label="Nächstes Foto"
            >
              <ChevronRight className="h-8 w-8" />
            </button>
          )}
        </div>
      )}
    </>
  );
}
