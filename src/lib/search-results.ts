import { prisma } from "@/lib/db";
import { searchIndex } from "@/lib/search";
import { ENTITY_LABELS, ENTITY_ROUTE_SEGMENT, type EntityType } from "@/lib/constants";

export interface SearchHit {
  entityType: EntityType;
  id: string;
  name: string;
  typeLabel: string;
  href: string;
  breadcrumb: string;
}

export async function searchAndHydrate(query: string, limit = 30): Promise<SearchHit[]> {
  const hits = await searchIndex(query, limit);
  if (hits.length === 0) return [];

  const idsByType: Record<EntityType, string[]> = { LOCATION: [], CONTAINER: [], ITEM: [] };
  for (const hit of hits) idsByType[hit.entityType].push(hit.entityId);

  const [rooms, containers, items] = await Promise.all([
    idsByType.LOCATION.length
      ? prisma.location.findMany({
          where: { id: { in: idsByType.LOCATION } },
          include: { parent: { select: { name: true } } },
        })
      : [],
    idsByType.CONTAINER.length
      ? prisma.container.findMany({
          where: { id: { in: idsByType.CONTAINER } },
          include: { location: { select: { name: true } } },
        })
      : [],
    idsByType.ITEM.length
      ? prisma.item.findMany({
          where: { id: { in: idsByType.ITEM } },
          include: {
            location: { select: { name: true } },
            container: { select: { name: true, number: true } },
            parentItem: { select: { name: true } },
          },
        })
      : [],
  ]);

  const byKey = new Map<string, SearchHit>();
  for (const l of rooms) {
    byKey.set(`LOCATION-${l.id}`, {
      entityType: "LOCATION",
      id: l.id,
      name: l.name,
      typeLabel: ENTITY_LABELS.LOCATION,
      href: `/${ENTITY_ROUTE_SEGMENT.LOCATION}/${l.id}`,
      breadcrumb: l.parent ? l.parent.name : "Oberste Ebene",
    });
  }
  for (const c of containers) {
    byKey.set(`CONTAINER-${c.id}`, {
      entityType: "CONTAINER",
      id: c.id,
      name: `#${c.number} ${c.name}`,
      typeLabel: ENTITY_LABELS.CONTAINER,
      href: `/${ENTITY_ROUTE_SEGMENT.CONTAINER}/${c.id}`,
      breadcrumb: c.location?.name ?? "",
    });
  }
  for (const i of items) {
    byKey.set(`ITEM-${i.id}`, {
      entityType: "ITEM",
      id: i.id,
      name: i.name,
      typeLabel: ENTITY_LABELS.ITEM,
      href: `/${ENTITY_ROUTE_SEGMENT.ITEM}/${i.id}`,
      breadcrumb: i.container ? `#${i.container.number} ${i.container.name}` : (i.location?.name ?? i.parentItem?.name ?? ""),
    });
  }

  return hits
    .map((h) => byKey.get(`${h.entityType}-${h.entityId}`))
    .filter((h): h is SearchHit => Boolean(h));
}
