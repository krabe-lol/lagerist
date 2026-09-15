import type { EntityType } from "@/lib/constants";
import { ENTITY_ROUTE_SEGMENT } from "@/lib/constants";

export default function QrCodeBlock({ type, id }: { type: EntityType; id: string }) {
  const segment = ENTITY_ROUTE_SEGMENT[type];
  const src = `/api/qr/${segment}/${id}`;

  return (
    <div className="flex items-center gap-3">
      <a href={src} target="_blank" rel="noopener noreferrer" className="link link-primary text-sm">
        QR-Code öffnen
      </a>
      <a href={src} download={`${id}.png`} className="link link-primary text-sm">
        Herunterladen
      </a>
    </div>
  );
}
