export const ENTITY_TYPES = ["LOCATION", "CONTAINER", "ITEM"] as const;
export type EntityType = (typeof ENTITY_TYPES)[number];

export const ATTACHMENT_KINDS = ["PHOTO", "FILE"] as const;
export type AttachmentKind = (typeof ATTACHMENT_KINDS)[number];

export const ENTITY_LABELS: Record<EntityType, string> = {
  LOCATION: "Raum",
  CONTAINER: "Container",
  ITEM: "Artikel",
};

export const ENTITY_ROUTE_SEGMENT: Record<EntityType, string> = {
  LOCATION: "rooms",
  CONTAINER: "containers",
  ITEM: "items",
};

export const ENTITY_COLUMN: Record<EntityType, "locationId" | "containerId" | "itemId"> = {
  LOCATION: "locationId",
  CONTAINER: "containerId",
  ITEM: "itemId",
};

export function entityPath(type: EntityType, id: string): string {
  return `/${ENTITY_ROUTE_SEGMENT[type]}/${id}`;
}

const IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"] as const;

export const ALLOWED_UPLOAD_MIME_TYPES: Record<AttachmentKind, readonly string[]> = {
  PHOTO: IMAGE_MIME_TYPES,
  FILE: [...IMAGE_MIME_TYPES, "application/pdf"],
};

export const UPLOAD_REJECT_MESSAGE: Record<AttachmentKind, string> = {
  PHOTO: "Nur Bilddateien (JPEG, PNG, GIF, WebP) sind als Foto erlaubt.",
  FILE: "Nur PDF- oder Bilddateien (JPEG, PNG, GIF, WebP) sind als Dateianhang erlaubt.",
};

export const MAX_UPLOAD_SIZE_BYTES = 500 * 1024 * 1024;
