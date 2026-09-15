import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { Readable } from "node:stream";
import Busboy from "busboy";
import { prisma } from "@/lib/db";
import { FileTooLargeError, saveUploadedFile, type StoredFile } from "@/lib/attachments";
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

type ParseResult = { ok: true; stored: StoredFile } | { ok: false; status: number; error: string };

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

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.startsWith("multipart/form-data") || !request.body) {
    return NextResponse.json({ error: "Keine Datei erhalten." }, { status: 400 });
  }

  // The in-page camera (CameraCapture) uploads a captured frame via fetch()
  // instead of a native form submission, since by then the whole capture
  // already happened without the tab ever leaving the page — no native-form
  // reliability concern applies there. It asks for a JSON response instead
  // of the redirect a real <form> submission expects.
  const wantsJson = request.headers.get("accept")?.includes("application/json") ?? false;

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
      saveUploadedFile(fileStream, info.filename, info.mimeType, MAX_UPLOAD_SIZE_BYTES)
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
    if (wantsJson) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    const redirectUrl = new URL(entityPath(entityType, entityId), request.url);
    redirectUrl.searchParams.set(errorParam, result.error);
    return NextResponse.redirect(redirectUrl, { status: 303 });
  }

  const attachment = await prisma.attachment.create({
    data: {
      kind,
      filename: result.stored.filename,
      storedPath: result.stored.storedPath,
      mimeType: result.stored.mimeType,
      size: result.stored.size,
      [ENTITY_COLUMN[entityType]]: entityId,
    },
  });

  if (kind === "PHOTO") {
    const delegate = {
      LOCATION: prisma.location,
      CONTAINER: prisma.container,
      ITEM: prisma.item,
    }[entityType];
    const current = await (
      delegate as { findUnique: (args: unknown) => Promise<{ primaryPhotoId: string | null } | null> }
    ).findUnique({ where: { id: entityId }, select: { primaryPhotoId: true } });
    if (!current?.primaryPhotoId) {
      await (delegate as { update: (args: unknown) => Promise<unknown> }).update({
        where: { id: entityId },
        data: { primaryPhotoId: attachment.id },
      });
    }
  }

  revalidatePath(entityPath(entityType, entityId));

  if (wantsJson) {
    return NextResponse.json({ id: attachment.id });
  }
  return NextResponse.redirect(new URL(entityPath(entityType, entityId), request.url), { status: 303 });
}
