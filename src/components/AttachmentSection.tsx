import type { EntityType } from "@/lib/constants";
import {
  deleteAttachmentAction,
  setPrimaryPhotoAction,
  uploadAttachmentAction,
} from "@/lib/attachment-actions";

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
  primaryPhotoId,
  attachments,
}: {
  entityType: EntityType;
  entityId: string;
  primaryPhotoId: string | null;
  attachments: AttachmentInfo[];
}) {
  const photos = attachments.filter((a) => a.kind === "PHOTO");
  const files = attachments.filter((a) => a.kind === "FILE");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="mb-2 font-semibold">Fotos</h3>
        <div className="mb-3 flex flex-wrap gap-3">
          {photos.map((photo) => (
            <div key={photo.id} className="flex flex-col items-center gap-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/files/${photo.id}`}
                alt={photo.filename}
                className={`h-28 w-28 rounded-box object-cover ${
                  photo.id === primaryPhotoId ? "ring-2 ring-primary" : ""
                }`}
              />
              <div className="flex gap-1">
                {photo.id !== primaryPhotoId && (
                  <form action={setPrimaryPhotoAction}>
                    <input type="hidden" name="entityType" value={entityType} />
                    <input type="hidden" name="entityId" value={entityId} />
                    <input type="hidden" name="attachmentId" value={photo.id} />
                    <button className="btn btn-ghost btn-xs" type="submit">
                      Als Titelbild
                    </button>
                  </form>
                )}
                <form action={deleteAttachmentAction}>
                  <input type="hidden" name="entityType" value={entityType} />
                  <input type="hidden" name="entityId" value={entityId} />
                  <input type="hidden" name="attachmentId" value={photo.id} />
                  <button className="btn btn-ghost btn-xs text-error" type="submit">
                    Löschen
                  </button>
                </form>
              </div>
            </div>
          ))}
          {photos.length === 0 && <p className="text-sm text-base-content/60">Noch keine Fotos.</p>}
        </div>
        <form action={uploadAttachmentAction} className="flex items-center gap-2">
          <input type="hidden" name="entityType" value={entityType} />
          <input type="hidden" name="entityId" value={entityId} />
          <input type="hidden" name="kind" value="PHOTO" />
          <input
            type="file"
            name="file"
            accept="image/*"
            required
            className="file-input file-input-bordered file-input-sm"
          />
          <button className="btn btn-primary btn-sm" type="submit">
            Foto hochladen
          </button>
        </form>
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
                <form action={deleteAttachmentAction}>
                  <input type="hidden" name="entityType" value={entityType} />
                  <input type="hidden" name="entityId" value={entityId} />
                  <input type="hidden" name="attachmentId" value={file.id} />
                  <button className="btn btn-ghost btn-xs text-error" type="submit">
                    Löschen
                  </button>
                </form>
              </div>
            </li>
          ))}
          {files.length === 0 && <p className="text-sm text-base-content/60">Noch keine Dateien.</p>}
        </ul>
        <form action={uploadAttachmentAction} className="flex items-center gap-2">
          <input type="hidden" name="entityType" value={entityType} />
          <input type="hidden" name="entityId" value={entityId} />
          <input type="hidden" name="kind" value="FILE" />
          <input type="file" name="file" required className="file-input file-input-bordered file-input-sm" />
          <button className="btn btn-primary btn-sm" type="submit">
            Datei hochladen
          </button>
        </form>
      </div>
    </div>
  );
}
