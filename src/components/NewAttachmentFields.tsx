"use client";

import { useRef, useState } from "react";
import { X } from "lucide-react";
import FormField from "@/components/FormField";
import { ALLOWED_UPLOAD_MIME_TYPES } from "@/lib/constants";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function AttachmentPicker({ name, accept, label }: { name: string; accept: string; label: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);

  function applyFiles(next: File[]) {
    setFiles(next);
    if (inputRef.current) {
      const dt = new DataTransfer();
      next.forEach((f) => dt.items.add(f));
      inputRef.current.files = dt.files;
    }
  }

  return (
    <FormField label={label} as="div">
      <input
        ref={inputRef}
        type="file"
        name={name}
        accept={accept}
        multiple
        onChange={(e) => setFiles(Array.from(e.currentTarget.files ?? []))}
        className="file-input file-input-bordered file-input-sm"
      />
      {files.length > 0 && (
        <ul className="mt-1 flex flex-col gap-1">
          {files.map((file, i) => (
            <li
              key={`${file.name}-${i}`}
              className="flex items-center justify-between gap-2 rounded-box border border-base-300 px-2 py-1 text-xs"
            >
              <span className="truncate">{file.name}</span>
              <div className="flex shrink-0 items-center gap-2">
                <span className="text-base-content/60">{formatSize(file.size)}</span>
                <button
                  type="button"
                  className="btn btn-ghost btn-xs"
                  aria-label={`${file.name} entfernen`}
                  onClick={() => applyFiles(files.filter((_, idx) => idx !== i))}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </FormField>
  );
}

/** Photo/file pickers for entity-creation forms. The entity doesn't exist yet
 * at this point, so files are queued here and submitted together with the
 * rest of the form — the creation Server Action saves them right after
 * inserting the new row (see saveAttachmentsFromFormData). */
export default function NewAttachmentFields() {
  return (
    <div className="flex flex-col gap-4">
      <AttachmentPicker name="photos" accept={ALLOWED_UPLOAD_MIME_TYPES.PHOTO.join(",")} label="Fotos" />
      <AttachmentPicker name="files" accept={ALLOWED_UPLOAD_MIME_TYPES.FILE.join(",")} label="Dateianhänge" />
    </div>
  );
}
