import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { Readable } from "node:stream";
import Busboy from "busboy";
import { prisma, prismaRaw } from "@/lib/db";
import {
  FileTooLargeError,
  deleteAttachmentFile,
  saveConvertedHeicFile,
  saveUploadedFile,
  type StoredFile,
} from "@/lib/attachments";
import { resolveOrigin } from "@/lib/site-url";
import {
  ALLOWED_UPLOAD_MIME_TYPES,
  ATTACHMENT_KINDS,
  ENTITY_COLUMN,
  ENTITY_ROUTE_SEGMENT,
  ENTITY_TYPES,
  HEIC_MIME_TYPES,
  MAX_UPLOAD_SIZE_BYTES,
  UPLOAD_REJECT_MESSAGE,
  entityPath,
  type AttachmentKind,
  type EntityType,
} from "@/lib/constants";

type ParseResult = { ok: true; stored: StoredFile } | { ok: false; status: number; error: string };

/** null if the entity doesn't exist (anymore), otherwise whether it's still
 * an unconfirmed draft from a "New" page. */
async function lookUpEntity(entityType: EntityType, id: string): Promise<{ confirmed: boolean } | null> {
  const args = { where: { id }, select: { confirmed: true } };
  if (entityType === "LOCATION") return prismaRaw.location.findUnique(args);
  if (entityType === "CONTAINER") return prismaRaw.container.findUnique(args);
  return prismaRaw.item.findUnique(args);
}

/** Where to send the browser after the upload: back to the "New" page for a
 * draft (which then resumes it, see lib/drafts.ts — its own detail page
 * would be a 404 while it's still unconfirmed), else the detail page. */
function returnPath(entityType: EntityType, id: string, isDraft: boolean): string {
  return isDraft ? `/${ENTITY_ROUTE_SEGMENT[entityType]}/new?draft=${id}` : entityPath(entityType, id);
}

// Uploads arrive as a real native <form method="post" encType="multipart/
// form-data"> submission (a full page POST, not a fetch() from JS) — that's
// the most battle-tested way browsers hand off a picked/captured file, and
// unlike a JS-held File reference it doesn't depend on the page's JS state
// surviving the round trip through the native camera/gallery picker app.
// Busboy parses that multipart body as a stream so the file still goes
// straight to disk (via saveUploadedFile) without ever buffering the whole
// request in memory.
export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const entityType = searchParams.get("entityType") as EntityType | null;
  const entityId = searchParams.get("entityId");
  const kind = searchParams.get("kind") as AttachmentKind | null;

  if (!entityType || !ENTITY_TYPES.includes(entityType) || !entityId || !kind || !ATTACHMENT_KINDS.includes(kind)) {
    return NextResponse.json({ error: "Fehlende oder ungültige Angaben für den Upload." }, { status: 400 });
  }

  const origin = resolveOrigin(request);

  // Someone else deleted it while this page was open: don't store a file
  // nobody can reach. The detail page's not-found screen explains the rest.
  const entity = await lookUpEntity(entityType, entityId);
  if (!entity) {
    return NextResponse.redirect(new URL(entityPath(entityType, entityId), origin), { status: 303 });
  }
  const backTo = returnPath(entityType, entityId, !entity.confirmed);

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.startsWith("multipart/form-data") || !request.body) {
    return NextResponse.json({ error: "Keine Datei erhalten." }, { status: 400 });
  }

  const maxMb = MAX_UPLOAD_SIZE_BYTES / (1024 * 1024);
  const nodeBody = Readable.fromWeb(request.body as import("node:stream/web").ReadableStream<Uint8Array>);

  const result = await new Promise<ParseResult>((resolve) => {
    const busboy = Busboy({ headers: { "content-type": contentType } });
    let settled = false;

    busboy.on("file", (_fieldname, fileStream, info) => {
      if (settled || !info.filename) {
        fileStream.resume();
        return;
      }

      if (!ALLOWED_UPLOAD_MIME_TYPES[kind].includes(info.mimeType)) {
        settled = true;
        fileStream.resume();
        resolve({ ok: false, status: 415, error: UPLOAD_REJECT_MESSAGE[kind] });
        return;
      }

      settled = true;
      const save = (HEIC_MIME_TYPES as readonly string[]).includes(info.mimeType)
        ? saveConvertedHeicFile(fileStream, info.filename, MAX_UPLOAD_SIZE_BYTES)
        : saveUploadedFile(fileStream, info.filename, info.mimeType, MAX_UPLOAD_SIZE_BYTES);
      save
        .then((stored) => resolve({ ok: true, stored }))
        .catch((err) => {
          if (err instanceof FileTooLargeError) {
            resolve({ ok: false, status: 413, error: `Datei ist zu groß (max. ${maxMb} MB).` });
          } else {
            resolve({ ok: false, status: 500, error: "Upload fehlgeschlagen. Bitte erneut versuchen." });
          }
        });
    });

    busboy.on("error", () => {
      if (!settled) {
        settled = true;
        resolve({ ok: false, status: 400, error: "Upload fehlgeschlagen. Bitte erneut versuchen." });
      }
    });

    busboy.on("finish", () => {
      if (!settled) {
        settled = true;
        resolve({ ok: false, status: 400, error: "Keine Datei erhalten." });
      }
    });

    nodeBody.pipe(busboy);
  });

  const errorParam = kind === "PHOTO" ? "photoUploadError" : "fileUploadError";

  if (!result.ok) {
    const redirectUrl = new URL(backTo, origin);
    redirectUrl.searchParams.set(errorParam, result.error);
    return NextResponse.redirect(redirectUrl, { status: 303 });
  }

  try {
    await prisma.attachment.create({
      data: {
        kind,
        filename: result.stored.filename,
        storedPath: result.stored.storedPath,
        mimeType: result.stored.mimeType,
        size: result.stored.size,
        [ENTITY_COLUMN[entityType]]: entityId,
      },
    });
  } catch (err) {
    await deleteAttachmentFile(result.stored.storedPath);
    // Foreign key violation: deleted by someone else while the file was
    // still uploading.
    if ((err as { code?: string }).code === "P2003") {
      return NextResponse.redirect(new URL(entityPath(entityType, entityId), origin), { status: 303 });
    }
    throw err;
  }

  revalidatePath(entityPath(entityType, entityId));

  return NextResponse.redirect(new URL(backTo, origin), { status: 303 });
}
