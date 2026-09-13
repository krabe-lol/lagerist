import { NextRequest, NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import { prisma } from "@/lib/db";
import { absoluteAttachmentPath } from "@/lib/attachments";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ attachmentId: string }> }
) {
  const { attachmentId } = await params;
  const attachment = await prisma.attachment.findUnique({ where: { id: attachmentId } });
  if (!attachment) {
    return NextResponse.json({ error: "Anhang nicht gefunden" }, { status: 404 });
  }

  const buffer = await readFile(absoluteAttachmentPath(attachment.storedPath));
  const disposition =
    attachment.kind === "PHOTO"
      ? "inline"
      : `attachment; filename="${encodeURIComponent(attachment.filename)}"`;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": attachment.mimeType,
      "Content-Disposition": disposition,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
