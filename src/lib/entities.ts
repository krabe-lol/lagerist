import { prisma } from "@/lib/db";
import { indexEntity, removeEntityFromIndex } from "@/lib/search";
import { deleteAttachmentFile } from "@/lib/attachments";
import type { EntityType } from "@/lib/constants";

// ---- Tags (Items only — Locations and Containers don't have tags) --------

export function normalizeTagName(name: string): string {
  return name.trim().toLowerCase();
}

/** Replaces all tag assignments of one item with the given (free-typed) tag names,
 * creating any Tag rows that don't exist yet. */
export async function setItemTags(itemId: string, rawNames: string[]) {
  const names = Array.from(new Set(rawNames.map(normalizeTagName).filter(Boolean)));

  const tags = await Promise.all(
    names.map((name) => prisma.tag.upsert({ where: { name }, create: { name }, update: {} }))
  );
  const tagIds = tags.map((t) => t.id);

  await prisma.itemTag.deleteMany({ where: { itemId } });
  if (tagIds.length > 0) {
    await prisma.itemTag.createMany({ data: tagIds.map((tagId) => ({ itemId, tagId })) });
  }
}

export async function getItemTags(itemId: string): Promise<string[]> {
  const rows = await prisma.itemTag.findMany({ where: { itemId }, include: { tag: true } });
  return rows.map((r) => r.tag.name);
}

// ---- Container numbering --------------------------------------------------

/** Containers get a system-assigned running number (see schema.prisma) so
 * multiple containers sharing the same templated name stay distinguishable. */
export async function nextContainerNumber(): Promise<number> {
  const result = await prisma.container.aggregate({ _max: { number: true } });
  return (result._max.number ?? 0) + 1;
}

// ---- Search index sync ---------------------------------------------------

interface ReindexInput {
  type: EntityType;
  id: string;
  name: string;
  description?: string | null;
  /** Extra freeform text to index, e.g. a Container's dimensions/volume. */
  extraText?: string | null;
}

export async function reindexEntity(input: ReindexInput) {
  const tagNames = input.type === "ITEM" ? await getItemTags(input.id) : [];
  await indexEntity(input.type, input.id, {
    name: input.name,
    description: input.description,
    tagNames,
    extraText: input.extraText,
  });
}

export async function getRoomAncestors(
  roomId: string | null
): Promise<{ id: string; name: string }[]> {
  const ancestors: { id: string; name: string }[] = [];
  let currentId = roomId;
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

/** An item's "Lage" (place) is either a Room or a Container (never another
 * Item — no sub-items). This is the fully resolved chain from the topmost
 * Room down to and including the item's own directly-assigned place. */
export interface LocationLink {
  kind: "room" | "container";
  id: string;
  name: string;
  href: string;
}

export async function getItemLocationChain(itemId: string): Promise<LocationLink[]> {
  const item = await prisma.item.findUnique({
    where: { id: itemId },
    select: { locationId: true, containerId: true },
  });
  if (!item) return [];

  if (item.locationId) {
    const roomAncestors = await getRoomAncestors(item.locationId);
    return roomAncestors.map((r) => ({ kind: "room" as const, id: r.id, name: r.name, href: `/rooms/${r.id}` }));
  }

  if (item.containerId) {
    const container = await prisma.container.findUnique({
      where: { id: item.containerId },
      select: { id: true, name: true, number: true, locationId: true },
    });
    if (!container) return [];
    const roomAncestors = await getRoomAncestors(container.locationId);
    return [
      ...roomAncestors.map((r) => ({ kind: "room" as const, id: r.id, name: r.name, href: `/rooms/${r.id}` })),
      {
        kind: "container" as const,
        id: container.id,
        name: `${container.name} #${container.number}`,
        href: `/containers/${container.id}`,
      },
    ];
  }

  return [];
}

// ---- Content trees (for nested "what's stored in what" listings) ---------
//
// Items are always leaves: an item can be placed directly in a Room or a
// Container, but never inside another Item, so ItemNode has no children of
// its own.

export interface ItemNode {
  kind: "item";
  id: string;
  name: string;
  quantity: number;
  href: string;
}

export interface ContainerNode {
  kind: "container";
  id: string;
  name: string;
  number: number;
  href: string;
  children: ItemNode[];
}

export interface RoomNode {
  kind: "room";
  id: string;
  name: string;
  href: string;
  children: EntityNode[];
}

export type EntityNode = RoomNode | ContainerNode | ItemNode;

function buildItemNode(item: { id: string; name: string; quantity: number }): ItemNode {
  return { kind: "item", id: item.id, name: item.name, quantity: item.quantity, href: `/items/${item.id}` };
}

export async function getContainerChildren(containerId: string): Promise<ItemNode[]> {
  const items = await prisma.item.findMany({
    where: { containerId },
    orderBy: { name: "asc" },
    select: { id: true, name: true, quantity: true },
  });
  return items.map(buildItemNode);
}

async function buildContainerNode(container: { id: string; name: string; number: number }): Promise<ContainerNode> {
  const children = await getContainerChildren(container.id);
  return {
    kind: "container",
    id: container.id,
    name: container.name,
    number: container.number,
    href: `/containers/${container.id}`,
    children,
  };
}

export async function getRoomChildren(roomId: string): Promise<EntityNode[]> {
  const [subRooms, containers, items] = await Promise.all([
    prisma.location.findMany({ where: { parentId: roomId }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.container.findMany({
      where: { locationId: roomId },
      orderBy: { name: "asc" },
      select: { id: true, name: true, number: true },
    }),
    prisma.item.findMany({ where: { locationId: roomId }, orderBy: { name: "asc" }, select: { id: true, name: true, quantity: true } }),
  ]);

  const [roomNodes, containerNodes] = await Promise.all([
    Promise.all(subRooms.map(buildRoomNode)),
    Promise.all(containers.map(buildContainerNode)),
  ]);

  return [...roomNodes, ...containerNodes, ...items.map(buildItemNode)];
}

async function buildRoomNode(room: { id: string; name: string }): Promise<RoomNode> {
  const children = await getRoomChildren(room.id);
  return { kind: "room", id: room.id, name: room.name, href: `/rooms/${room.id}`, children };
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
  roomIds: string[];
  containerIds: string[];
  itemIds: string[];
}

export async function collectRoomSubtree(rootId: string): Promise<Subtree> {
  const roomIds = await queryIds(
    `WITH RECURSIVE sub(id) AS (
       SELECT id FROM "Location" WHERE id = ?
       UNION ALL
       SELECT l.id FROM "Location" l JOIN sub ON l."parentId" = sub.id
     )
     SELECT id FROM sub`,
    [rootId]
  );

  const containerIds =
    roomIds.length === 0
      ? []
      : await queryIds(
          `SELECT id FROM "Container" WHERE "locationId" IN (${roomIds.map(() => "?").join(",")})`,
          roomIds
        );

  const itemsInContainers =
    containerIds.length === 0
      ? []
      : await queryIds(
          `SELECT id FROM "Item" WHERE "containerId" IN (${containerIds.map(() => "?").join(",")})`,
          containerIds
        );

  const itemsDirectlyInRooms =
    roomIds.length === 0
      ? []
      : await queryIds(
          `SELECT id FROM "Item" WHERE "locationId" IN (${roomIds.map(() => "?").join(",")})`,
          roomIds
        );

  const itemIds = await itemSubtreeIdsFromSeeds([...itemsInContainers, ...itemsDirectlyInRooms]);

  return { roomIds, containerIds, itemIds };
}

export async function collectContainerSubtree(rootId: string): Promise<Subtree> {
  const topLevelItemIds = await queryIds(`SELECT id FROM "Item" WHERE "containerId" = ?`, [rootId]);
  const itemIds = await itemSubtreeIdsFromSeeds(topLevelItemIds);
  return { roomIds: [], containerIds: [rootId], itemIds };
}

export async function collectItemSubtree(rootId: string): Promise<Subtree> {
  const itemIds = await itemSubtreeIdsFromSeeds([rootId]);
  return { roomIds: [], containerIds: [], itemIds };
}

/** Call BEFORE the actual `prisma.<model>.delete(...)`. Captures everything that
 * the DB-level ON DELETE CASCADE is about to remove, so files on disk and the
 * (separate, non-cascading) FTS index can be cleaned up afterwards. */
export async function prepareSubtreeCleanup(subtree: Subtree) {
  const { roomIds, containerIds, itemIds } = subtree;
  const clauses: string[] = [];
  const params: string[] = [];
  if (roomIds.length) {
    clauses.push(`"locationId" IN (${roomIds.map(() => "?").join(",")})`);
    params.push(...roomIds);
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
      ...roomIds.map((id) => removeEntityFromIndex("LOCATION", id)),
      ...containerIds.map((id) => removeEntityFromIndex("CONTAINER", id)),
      ...itemIds.map((id) => removeEntityFromIndex("ITEM", id)),
    ]);
  };
}
