import { prisma } from "@/lib/db";
import type { EntityType } from "@/lib/constants";
import type { TemplateFieldDef } from "@/lib/constants";

interface IndexableEntity {
  name: string;
  description?: string | null;
  tagNames: string[];
  customFields?: unknown;
  fieldDefs?: TemplateFieldDef[];
}

function customFieldsToText(customFields: unknown, fieldDefs?: TemplateFieldDef[]): string {
  if (!customFields || typeof customFields !== "object") return "";
  const values = Object.entries(customFields as Record<string, unknown>).map(([key, value]) => {
    const def = fieldDefs?.find((f) => f.key === key);
    const label = def?.label ?? key;
    return `${label} ${value ?? ""}`;
  });
  return values.join(" ");
}

/** Inserts or updates the full-text search row for one entity. Delete-then-insert
 * because FTS5 has no UNIQUE/PRIMARY KEY to upsert against. */
export async function indexEntity(type: EntityType, id: string, entity: IndexableEntity) {
  const tagsText = entity.tagNames.join(" ");
  const fieldsText = customFieldsToText(entity.customFields, entity.fieldDefs);

  await prisma.$executeRawUnsafe(
    `DELETE FROM search_index WHERE entity_type = ? AND entity_id = ?`,
    type,
    id
  );
  await prisma.$executeRawUnsafe(
    `INSERT INTO search_index (entity_type, entity_id, name, description, tags_text, fields_text)
     VALUES (?, ?, ?, ?, ?, ?)`,
    type,
    id,
    entity.name,
    entity.description ?? "",
    tagsText,
    fieldsText
  );
}

export async function removeEntityFromIndex(type: EntityType, id: string) {
  await prisma.$executeRawUnsafe(
    `DELETE FROM search_index WHERE entity_type = ? AND entity_id = ?`,
    type,
    id
  );
}

/** Turns free text into an FTS5 MATCH query: each token becomes a phrase-safe
 * prefix term, tokens are ANDed together (FTS5 default) for good-enough
 * "starts with" / substring-per-word matching without external tooling. */
function buildMatchQuery(raw: string): string | null {
  const tokens = raw
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((t) => t.replace(/"/g, ""))
    .filter(Boolean);

  if (tokens.length === 0) return null;
  return tokens.map((t) => `"${t}"*`).join(" ");
}

export interface SearchResult {
  entityType: EntityType;
  entityId: string;
  rank: number;
}

export async function searchIndex(query: string, limit = 30): Promise<SearchResult[]> {
  const matchQuery = buildMatchQuery(query);
  if (!matchQuery) return [];

  const rows = await prisma.$queryRawUnsafe<
    { entity_type: EntityType; entity_id: string; rank: number }[]
  >(
    `SELECT entity_type, entity_id, bm25(search_index) as rank
     FROM search_index
     WHERE search_index MATCH ?
     ORDER BY rank
     LIMIT ?`,
    matchQuery,
    limit
  );

  return rows.map((r) => ({ entityType: r.entity_type, entityId: r.entity_id, rank: r.rank }));
}
