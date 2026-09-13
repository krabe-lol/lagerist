import { prisma } from "@/lib/db";
import { indexEntity, removeEntityFromIndex } from "@/lib/search";
import { deleteAttachmentFile } from "@/lib/attachments";
import type { EntityType, TemplateFieldDef } from "@/lib/constants";

// ---- Tags ---------------------------------------------------------------

export function normalizeTagName(name: string): string {
  return name.trim().toLowerCase();
}

/** Replaces all tag assignments of one entity with the given (free-typed) tag names,
 * creating any Tag rows that don't exist yet. */
export async function setEntityTags(type: EntityType, entityId: string, rawNames: string[]) {
  const names = Array.from(new Set(rawNames.map(normalizeTagName).filter(Boolean)));

  const tags = await Promise.all(
    names.map((name) => prisma.tag.upsert({ where: { name }, create: { name }, update: {} }))
  );
  const tagIds = tags.map((t) => t.id);

  switch (type) {
    case "LOCATION":
      await prisma.locationTag.deleteMany({ where: { locationId: entityId } });
      if (tagIds.length > 0) {
        await prisma.locationTag.createMany({
          data: tagIds.map((tagId) => ({ locationId: entityId, tagId })),
        });
      }
      break;
    case "CONTAINER":
      await prisma.containerTag.deleteMany({ where: { containerId: entityId } });
      if (tagIds.length > 0) {
        await prisma.containerTag.createMany({
          data: tagIds.map((tagId) => ({ containerId: entityId, tagId })),
        });
      }
      break;
    case "ITEM":
      await prisma.itemTag.deleteMany({ where: { itemId: entityId } });
      if (tagIds.length > 0) {
        await prisma.itemTag.createMany({ data: tagIds.map((tagId) => ({ itemId: entityId, tagId })) });
      }
      break;
  }
}

export async function getTagNames(type: EntityType, entityId: string): Promise<string[]> {
  switch (type) {
    case "LOCATION": {
      const rows = await prisma.locationTag.findMany({
        where: { locationId: entityId },
        include: { tag: true },
      });
      return rows.map((r) => r.tag.name);
    }
    case "CONTAINER": {
      const rows = await prisma.containerTag.findMany({
        where: { containerId: entityId },
        include: { tag: true },
      });
      return rows.map((r) => r.tag.name);
    }
    case "ITEM": {
      const rows = await prisma.itemTag.findMany({
        where: { itemId: entityId },
        include: { tag: true },
      });
      return rows.map((r) => r.tag.name);
    }
  }
}

// ---- Templates / custom fields ------------------------------------------

export async function getTemplateFieldDefs(
  templateId: string | null | undefined
): Promise<TemplateFieldDef[]> {
  if (!templateId) return [];
  const template = await prisma.template.findUnique({ where: { id: templateId } });
  if (!template) return [];
  return (template.fields as unknown as TemplateFieldDef[]) ?? [];
}

export function defaultCustomFieldsFromDefs(defs: TemplateFieldDef[]): Record<string, string> {
  const values: Record<string, string> = {};
  for (const def of defs) values[def.key] = def.defaultValue ?? "";
  return values;
}

/** Reads the `cf_<key>` form fields that TemplateFieldsForm renders for the given
 * field definitions. Checkboxes only appear in FormData when checked, so booleans
 * need the explicit presence check rather than a plain `.get()`. */
export function buildCustomFieldsFromForm(
  formData: FormData,
  defs: TemplateFieldDef[]
): Record<string, string> {
  const values: Record<string, string> = {};
  for (const def of defs) {
    const name = `cf_${def.key}`;
    if (def.type === "BOOLEAN") {
      values[def.key] = formData.get(name) === "on" ? "true" : "false";
    } else {
      values[def.key] = (formData.get(name) as string | null) ?? "";
    }
  }
  return values;
}

// ---- Search index sync ---------------------------------------------------

interface ReindexInput {
  type: EntityType;
  id: string;
  name: string;
  description?: string | null;
  templateId?: string | null;
  customFields: unknown;
}

export async function reindexEntity(input: ReindexInput) {
  const [tagNames, fieldDefs] = await Promise.all([
    getTagNames(input.type, input.id),
    getTemplateFieldDefs(input.templateId),
  ]);
  await indexEntity(input.type, input.id, {
    name: input.name,
    description: input.description,
    tagNames,
    customFields: input.customFields,
    fieldDefs,
  });
}

export async function getLocationAncestors(
  locationId: string | null
): Promise<{ id: string; name: string }[]> {
  const ancestors: { id: string; name: string }[] = [];
  let currentId = locationId;
  while (currentId) {
    const loc = await prisma.location.findUnique({
      where: { id: currentId },
      select: { id: true, name: true, parentId: true },
    });
    if (!loc) break;
    ancestors.unshift({ id: loc.id, name: loc.name });
    currentId = loc.parentId;
  }
  return ancestors;
}

export async function getItemAncestors(itemId: string): Promise<{
  locationAncestors: { id: string; name: string }[];
  container: { id: string; name: string } | null;
  itemChain: { id: string; name: string }[];
}> {
  const itemChain: { id: string; name: string }[] = [];
  let current = await prisma.item.findUnique({
    where: { id: itemId },
    select: { id: true, name: true, containerId: true, parentItemId: true },
  });

  while (current?.parentItemId) {
    const parent = await prisma.item.findUnique({
      where: { id: current.parentItemId },
      select: { id: true, name: true, containerId: true, parentItemId: true },
    });
    if (!parent) break;
    itemChain.unshift({ id: parent.id, name: parent.name });
    current = parent;
  }

  if (!current?.containerId) {
    return { locationAncestors: [], container: null, itemChain };
  }

  const container = await prisma.container.findUnique({
    where: { id: current.containerId },
    select: { id: true, name: true, locationId: true },
  });
  if (!container) return { locationAncestors: [], container: null, itemChain };

  const locationAncestors = await getLocationAncestors(container.locationId);
  return { locationAncestors, container: { id: container.id, name: container.name }, itemChain };
}

// ---- Subtree collection (for cascading file/index cleanup on delete) ----

async function queryIds(sql: string, params: unknown[]): Promise<string[]> {
  const rows = await prisma.$queryRawUnsafe<{ id: string }[]>(sql, ...params);
  return rows.map((r) => r.id);
}

async function itemSubtreeIdsFromSeeds(seedIds: string[]): Promise<string[]> {
  if (seedIds.length === 0) return [];
  const placeholders = seedIds.map(() => "?").join(",");
  return queryIds(
    `WITH RECURSIVE sub(id) AS (
       SELECT id FROM "Item" WHERE id IN (${placeholders})
       UNION ALL
       SELECT i.id FROM "Item" i JOIN sub ON i."parentItemId" = sub.id
     )
     SELECT id FROM sub`,
    seedIds
  );
}

interface Subtree {
  locationIds: string[];
  containerIds: string[];
  itemIds: string[];
}

export async function collectLocationSubtree(rootId: string): Promise<Subtree> {
  const locationIds = await queryIds(
    `WITH RECURSIVE sub(id) AS (
       SELECT id FROM "Location" WHERE id = ?
       UNION ALL
       SELECT l.id FROM "Location" l JOIN sub ON l."parentId" = sub.id
     )
     SELECT id FROM sub`,
    [rootId]
  );

  const containerIds =
    locationIds.length === 0
      ? []
      : await queryIds(
          `SELECT id FROM "Container" WHERE "locationId" IN (${locationIds.map(() => "?").join(",")})`,
          locationIds
        );

  const topLevelItemIds =
    containerIds.length === 0
      ? []
      : await queryIds(
          `SELECT id FROM "Item" WHERE "containerId" IN (${containerIds.map(() => "?").join(",")})`,
          containerIds
        );

  const itemIds = await itemSubtreeIdsFromSeeds(topLevelItemIds);

  return { locationIds, containerIds, itemIds };
}

export async function collectContainerSubtree(rootId: string): Promise<Subtree> {
  const topLevelItemIds = await queryIds(`SELECT id FROM "Item" WHERE "containerId" = ?`, [rootId]);
  const itemIds = await itemSubtreeIdsFromSeeds(topLevelItemIds);
  return { locationIds: [], containerIds: [rootId], itemIds };
}

export async function collectItemSubtree(rootId: string): Promise<Subtree> {
  const itemIds = await itemSubtreeIdsFromSeeds([rootId]);
  return { locationIds: [], containerIds: [], itemIds };
}

/** Call BEFORE the actual `prisma.<model>.delete(...)`. Captures everything that
 * the DB-level ON DELETE CASCADE is about to remove, so files on disk and the
 * (separate, non-cascading) FTS index can be cleaned up afterwards. */
export async function prepareSubtreeCleanup(subtree: Subtree) {
  const { locationIds, containerIds, itemIds } = subtree;
  const clauses: string[] = [];
  const params: string[] = [];
  if (locationIds.length) {
    clauses.push(`"locationId" IN (${locationIds.map(() => "?").join(",")})`);
    params.push(...locationIds);
  }
  if (containerIds.length) {
    clauses.push(`"containerId" IN (${containerIds.map(() => "?").join(",")})`);
    params.push(...containerIds);
  }
  if (itemIds.length) {
    clauses.push(`"itemId" IN (${itemIds.map(() => "?").join(",")})`);
    params.push(...itemIds);
  }

  const storedPaths =
    clauses.length === 0
      ? []
      : (
          await prisma.$queryRawUnsafe<{ storedPath: string }[]>(
            `SELECT "storedPath" FROM "Attachment" WHERE ${clauses.join(" OR ")}`,
            ...params
          )
        ).map((r) => r.storedPath);

  return async function cleanup() {
    await Promise.all(storedPaths.map((p) => deleteAttachmentFile(p)));
    await Promise.all([
      ...locationIds.map((id) => removeEntityFromIndex("LOCATION", id)),
      ...containerIds.map((id) => removeEntityFromIndex("CONTAINER", id)),
      ...itemIds.map((id) => removeEntityFromIndex("ITEM", id)),
    ]);
  };
}
