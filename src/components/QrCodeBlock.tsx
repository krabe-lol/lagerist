import type { EntityType } from "@/lib/constants";
import { ENTITY_ROUTE_SEGMENT } from "@/lib/constants";

export default function QrCodeBlock({ type, id }: { type: EntityType; id: string }) {
  const segment = ENTITY_ROUTE_SEGMENT[type];
  const src = `/api/qr/${segment}/${id}`;

  return (
    <div className="flex flex-col gap-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="QR-Code" width={128} height={128} className="rounded" />
      <a href={src} download={`${id}.png`} className="link link-primary text-xs">
        QR-Code herunterladen
      </a>
    </div>
  );
}
