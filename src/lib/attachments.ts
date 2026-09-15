import { createWriteStream } from "node:fs";
import { mkdir, unlink } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

const DATA_DIR = process.env.LAGERIST_DATA_DIR ?? path.join(process.cwd(), "data");
const UPLOADS_DIR = path.join(DATA_DIR, "uploads");

export interface StoredFile {
  storedPath: string; // relative path under UPLOADS_DIR, stored in the DB
  filename: string;
  mimeType: string;
  size: number;
}

export class FileTooLargeError extends Error {
  constructor(maxBytes: number) {
    super(`File exceeds the ${maxBytes} byte limit`);
    this.name = "FileTooLargeError";
  }
}

// Streams the request body straight to disk, counting bytes as they arrive
// instead of buffering the whole upload in memory first (the previous
// file.arrayBuffer() approach held the entire file in RAM twice: once as
// parsed FormData, once as our own copy).
export async function saveUploadedFile(
  body: ReadableStream<Uint8Array>,
  filename: string,
  mimeType: string,
  maxBytes: number
): Promise<StoredFile> {
  await mkdir(UPLOADS_DIR, { recursive: true });

  const ext = path.extname(filename);
  const storedPath = `${randomUUID()}${ext}`;
  const destination = path.join(UPLOADS_DIR, storedPath);

  const writeStream = createWriteStream(destination);
  const reader = body.getReader();
  let size = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      size += value.byteLength;
      if (size > maxBytes) {
        throw new FileTooLargeError(maxBytes);
      }

      if (!writeStream.write(value)) {
        await new Promise<void>((resolve) => writeStream.once("drain", resolve));
      }
    }
    await new Promise<void>((resolve, reject) => {
      writeStream.end((err?: Error | null) => (err ? reject(err) : resolve()));
    });
  } catch (err) {
    // Wait for the stream to fully settle before unlinking — destroying it
    // doesn't synchronously close the underlying fd, so an unlink issued
    // right after destroy() can race the (still pending) file creation and
    // silently no-op, leaving an empty orphan file once that creation
    // finally completes.
    await new Promise<void>((resolve) => {
      writeStream.destroy();
      writeStream.once("close", () => resolve());
    });
    await unlink(destination).catch(() => {});
    throw err;
  }

  return {
    storedPath,
    filename,
    mimeType: mimeType || "application/octet-stream",
    size,
  };
}

export function absoluteAttachmentPath(storedPath: string): string {
  return path.join(UPLOADS_DIR, storedPath);
}

export async function deleteAttachmentFile(storedPath: string): Promise<void> {
  try {
    await unlink(absoluteAttachmentPath(storedPath));
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
  }
}
