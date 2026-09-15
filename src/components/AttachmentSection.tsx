import type { EntityType } from "@/lib/constants";
import { deleteAttachmentAction, uploadAttachmentAction } from "@/lib/attachment-actions";
import PhotoGallery from "@/components/PhotoGallery";
import AutoUploadInput from "@/components/AutoUploadInput";
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
}: {
  entityType: EntityType;
  entityId: string;
  attachments: AttachmentInfo[];
}) {
  const photos = attachments.filter((a) => a.kind === "PHOTO");
  const files = attachments.filter((a) => a.kind === "FILE");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h4 className="mb-2 font-semibold">Fotos</h4>
        <PhotoGallery photos={photos} entityType={entityType} entityId={entityId} />
        <AutoUploadInput
          action={uploadAttachmentAction}
          hiddenFields={{ entityType, entityId, kind: "PHOTO" }}
          accept="image/*"
        />
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
                  <button className="btn btn-outline btn-error btn-xs" type="submit">
                    Löschen
                  </button>
                </ConfirmDeleteForm>
              </div>
            </li>
          ))}
          {files.length === 0 && <p className="text-sm text-base-content/60">Noch keine Dateien.</p>}
        </ul>
        <AutoUploadInput action={uploadAttachmentAction} hiddenFields={{ entityType, entityId, kind: "FILE" }} />
      </div>
    </div>
  );
}
