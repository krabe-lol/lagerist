import { Readable } from "node:stream";
import { prisma } from "@/lib/db";
import { FileTooLargeError, saveUploadedFile } from "@/lib/attachments";
import {
  ALLOWED_UPLOAD_MIME_TYPES,
  ENTITY_COLUMN,
  MAX_UPLOAD_SIZE_BYTES,
  UPLOAD_REJECT_MESSAGE,
  type AttachmentKind,
  type EntityType,
} from "@/lib/constants";

/** Saves any photos/files picked in an entity-creation form (see
 * NewAttachmentFields), once the entity's row has just been created and an
 * id exists to attach them to. Mirrors the validation and storage the
 * /api/uploads Route Handler applies to attachments added later from the
 * detail page. Returns the first rejection message, if any, so the caller
 * can surface it the same way (photoUploadError/fileUploadError). */
export async function saveAttachmentsFromFormData(
  formData: FormData,
  fieldName: string,
  kind: AttachmentKind,
  entityType: EntityType,
  entityId: string
): Promise<string | null> {
  const files = formData.getAll(fieldName).filter((f): f is File => f instanceof File && f.size > 0);
  let error: string | null = null;

  for (const file of files) {
    if (!ALLOWED_UPLOAD_MIME_TYPES[kind].includes(file.type)) {
      error ??= UPLOAD_REJECT_MESSAGE[kind];
      continue;
    }

    try {
      const stored = await saveUploadedFile(
        Readable.fromWeb(file.stream() as import("node:stream/web").ReadableStream<Uint8Array>),
        file.name,
        file.type,
        MAX_UPLOAD_SIZE_BYTES
      );
      await prisma.attachment.create({
        data: {
          kind,
          filename: stored.filename,
          storedPath: stored.storedPath,
          mimeType: stored.mimeType,
          size: stored.size,
          [ENTITY_COLUMN[entityType]]: entityId,
        },
      });
    } catch (err) {
      error ??=
        err instanceof FileTooLargeError
          ? `Datei ist zu groß (max. ${MAX_UPLOAD_SIZE_BYTES / (1024 * 1024)} MB).`
          : "Upload fehlgeschlagen. Bitte erneut versuchen.";
    }
  }

  return error;
}
