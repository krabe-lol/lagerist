import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { FileTooLargeError, saveUploadedFile } from "@/lib/attachments";
import {
  ALLOWED_UPLOAD_MIME_TYPES,
  ATTACHMENT_KINDS,
  ENTITY_COLUMN,
  ENTITY_TYPES,
  MAX_UPLOAD_SIZE_BYTES,
  UPLOAD_REJECT_MESSAGE,
  entityPath,
  type AttachmentKind,
  type EntityType,
} from "@/lib/constants";

// Handles uploads directly as a streamed request body (not multipart/
// FormData) so the file is written to disk as it arrives, rather than being
// buffered whole in memory first — see saveUploadedFile. This is why uploads
// go through a Route Handler and a client-side fetch() instead of the
// uploadAttachmentAction Server Action they used before: Server Actions must
// fully parse the FormData body before the action runs, so the framework has
// no streaming path.
export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const entityType = searchParams.get("entityType") as EntityType | null;
  const entityId = searchParams.get("entityId");
  const kind = searchParams.get("kind") as AttachmentKind | null;
  const filename = searchParams.get("filename");

  if (
    !entityType ||
    !ENTITY_TYPES.includes(entityType) ||
    !entityId ||
    !kind ||
    !ATTACHMENT_KINDS.includes(kind) ||
    !filename
  ) {
    return NextResponse.json({ error: "Fehlende oder ungültige Angaben für den Upload." }, { status: 400 });
  }

  const mimeType = request.headers.get("content-type") ?? "";
  if (!ALLOWED_UPLOAD_MIME_TYPES[kind].includes(mimeType)) {
    return NextResponse.json({ error: UPLOAD_REJECT_MESSAGE[kind] }, { status: 415 });
  }

  if (!request.body) {
    return NextResponse.json({ error: "Keine Datei erhalten." }, { status: 400 });
  }

  const maxMb = MAX_UPLOAD_SIZE_BYTES / (1024 * 1024);
  let stored;
  try {
    stored = await saveUploadedFile(request.body, filename, mimeType, MAX_UPLOAD_SIZE_BYTES);
  } catch (err) {
    if (err instanceof FileTooLargeError) {
      return NextResponse.json({ error: `Datei ist zu groß (max. ${maxMb} MB).` }, { status: 413 });
    }
    throw err;
  }

  const attachment = await prisma.attachment.create({
    data: {
      kind,
      filename: stored.filename,
      storedPath: stored.storedPath,
      mimeType: stored.mimeType,
      size: stored.size,
      [ENTITY_COLUMN[entityType]]: entityId,
    },
  });

  revalidatePath(entityPath(entityType, entityId));

  return NextResponse.json({ id: attachment.id });
}
