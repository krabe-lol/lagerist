import { mkdir, unlink, writeFile } from "node:fs/promises";
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

export async function saveUploadedFile(file: File): Promise<StoredFile> {
  await mkdir(UPLOADS_DIR, { recursive: true });

  const ext = path.extname(file.name);
  const storedPath = `${randomUUID()}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  await writeFile(path.join(UPLOADS_DIR, storedPath), buffer);

  return {
    storedPath,
    filename: file.name,
    mimeType: file.type || "application/octet-stream",
    size: buffer.byteLength,
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
