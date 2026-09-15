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
