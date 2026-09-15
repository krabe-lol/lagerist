import { Trash2 } from "lucide-react";
import type { EntityType } from "@/lib/constants";
import { deleteAttachmentAction } from "@/lib/attachment-actions";
import PhotoGallery from "@/components/PhotoGallery";
import UploadAttachmentForm from "@/components/UploadAttachmentForm";
import ConfirmDeleteForm from "@/components/ConfirmDeleteForm";

interface AttachmentInfo {
  id: string;
  kind: string;
  filename: string;
  mimeType: string;
  size: number;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AttachmentSection({
  entityType,
  entityId,
  attachments,
  photoUploadError,
  fileUploadError,
}: {
  entityType: EntityType;
  entityId: string;
  attachments: AttachmentInfo[];
  photoUploadError?: string;
  fileUploadError?: string;
}) {
  const photos = attachments.filter((a) => a.kind === "PHOTO");
  const files = attachments.filter((a) => a.kind === "FILE");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h4 className="mb-2 font-semibold">Fotos</h4>
        <PhotoGallery photos={photos} entityType={entityType} entityId={entityId} />
        <UploadAttachmentForm entityType={entityType} entityId={entityId} kind="PHOTO" />
        {photoUploadError && (
          <div role="alert" className="alert alert-error mt-2 py-2 text-sm">
            <span>{photoUploadError}</span>
          </div>
        )}
      </div>

      <div>
        <h3 className="mb-2 font-semibold">Dateianhänge</h3>
        <ul className="mb-3 flex flex-col gap-1">
          {files.map((file) => (
            <li
              key={file.id}
              className="flex items-center justify-between rounded-box border border-base-300 px-3 py-2 text-sm"
            >
              <a href={`/api/files/${file.id}`} className="link truncate" download>
                {file.filename}
              </a>
              <div className="flex shrink-0 items-center gap-2">
                <span className="text-base-content/60">{formatSize(file.size)}</span>
                <ConfirmDeleteForm
                  action={deleteAttachmentAction}
                  confirmMessage={`Datei "${file.filename}" wirklich löschen?`}
                  hiddenFields={{ entityType, entityId, attachmentId: file.id }}
                >
                  <button
                    type="submit"
                    className="btn btn-circle btn-error btn-sm hover:border-error hover:bg-white hover:text-error"
                    aria-label="Datei löschen"
                    title="Löschen"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </ConfirmDeleteForm>
              </div>
            </li>
          ))}
          {files.length === 0 && <p className="text-sm text-base-content/60">Noch keine Dateien.</p>}
        </ul>
        <UploadAttachmentForm entityType={entityType} entityId={entityId} kind="FILE" />
        {fileUploadError && (
          <div role="alert" className="alert alert-error mt-2 py-2 text-sm">
            <span>{fileUploadError}</span>
          </div>
        )}
      </div>
    </div>
  );
}
