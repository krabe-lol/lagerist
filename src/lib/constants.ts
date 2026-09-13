export const ENTITY_TYPES = ["LOCATION", "CONTAINER", "ITEM"] as const;
export type EntityType = (typeof ENTITY_TYPES)[number];

export const ATTACHMENT_KINDS = ["PHOTO", "FILE"] as const;
export type AttachmentKind = (typeof ATTACHMENT_KINDS)[number];

export const TEMPLATE_FIELD_TYPES = ["TEXT", "NUMBER", "DATE", "BOOLEAN"] as const;
export type TemplateFieldType = (typeof TEMPLATE_FIELD_TYPES)[number];

export interface TemplateFieldDef {
  key: string;
  label: string;
  type: TemplateFieldType;
  defaultValue?: string;
}

export const ENTITY_LABELS: Record<EntityType, string> = {
  LOCATION: "Location",
  CONTAINER: "Container",
  ITEM: "Item",
};

export const ENTITY_ROUTE_SEGMENT: Record<EntityType, string> = {
  LOCATION: "locations",
  CONTAINER: "containers",
  ITEM: "items",
};
