import { createWriteStream } from "node:fs";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import type { Readable } from "node:stream";
import convertHeic from "heic-convert";

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

// Streams the upload straight to disk, counting bytes as they arrive instead
// of buffering the whole file in memory first. `pipeline` destroys every
// stream in the chain (including the destination file) once any of them
// errors, and waits for that teardown to finish before rejecting — so a
// too-large upload can't leave a half-written orphan file behind.
export async function saveUploadedFile(
  source: Readable,
  filename: string,
  mimeType: string,
  maxBytes: number
): Promise<StoredFile> {
  await mkdir(UPLOADS_DIR, { recursive: true });

  const ext = path.extname(filename);
  const storedPath = `${randomUUID()}${ext}`;
  const destination = path.join(UPLOADS_DIR, storedPath);

  let size = 0;
  const limiter = new Transform({
    transform(chunk: Buffer, _encoding, callback) {
      size += chunk.length;
      if (size > maxBytes) {
        callback(new FileTooLargeError(maxBytes));
        return;
      }
      callback(null, chunk);
    },
  });

  try {
    await pipeline(source, limiter, createWriteStream(destination));
  } catch (err) {
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

// HEIC/HEIF (iOS's default photo format) isn't renderable inline by most
// browsers, so we convert it to JPEG on upload instead of storing it as-is.
// heic-convert needs the whole file in memory to decode it — unlike
// saveUploadedFile, this can't stream straight to disk — so the size limit
// is enforced while buffering instead of while writing.
export async function saveConvertedHeicFile(source: Readable, filename: string, maxBytes: number): Promise<StoredFile> {
  await mkdir(UPLOADS_DIR, { recursive: true });

  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of source as AsyncIterable<Buffer>) {
    size += chunk.length;
    if (size > maxBytes) throw new FileTooLargeError(maxBytes);
    chunks.push(chunk);
  }

  const jpeg = await convertHeic({ buffer: Buffer.concat(chunks), format: "JPEG", quality: 0.9 });

  const storedPath = `${randomUUID()}.jpg`;
  await writeFile(path.join(UPLOADS_DIR, storedPath), jpeg);

  return {
    storedPath,
    filename: `${path.basename(filename, path.extname(filename))}.jpg`,
    mimeType: "image/jpeg",
    size: jpeg.length,
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
