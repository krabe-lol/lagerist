import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import { ENTITY_ROUTE_SEGMENT } from "@/lib/constants";
import { resolveOrigin } from "@/lib/site-url";

const VALID_SEGMENTS = new Set(Object.values(ENTITY_ROUTE_SEGMENT));

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ segment: string; entityId: string }> }
) {
  const { segment, entityId } = await params;
  if (!VALID_SEGMENTS.has(segment as never)) {
    return NextResponse.json({ error: "Unbekannter Entity-Typ" }, { status: 400 });
  }

  const targetUrl = `${resolveOrigin(request)}/${segment}/${entityId}`;
  const png = await QRCode.toBuffer(targetUrl, { width: 320, margin: 1 });

  return new NextResponse(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
