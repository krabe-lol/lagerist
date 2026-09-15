import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ENTITY_ROUTE_SEGMENT } from "@/lib/constants";

export async function GET() {
  const [rooms, containers, items] = await Promise.all([
    prisma.location.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.container.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, number: true, location: { select: { name: true } } },
    }),
    prisma.item.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  const all = [
    ...rooms.map((l) => ({
      id: l.id,
      name: l.name,
      typeLabel: "Raum",
      segment: ENTITY_ROUTE_SEGMENT.LOCATION,
      subtitle: "",
    })),
    ...containers.map((c) => ({
      id: c.id,
      name: `#${c.number} ${c.name}`,
      typeLabel: "Container",
      segment: ENTITY_ROUTE_SEGMENT.CONTAINER,
      subtitle: c.location?.name ?? "",
    })),
    ...items.map((i) => ({
      id: i.id,
      name: i.name,
      typeLabel: "Artikel",
      segment: ENTITY_ROUTE_SEGMENT.ITEM,
      subtitle: "",
    })),
  ];

  return NextResponse.json(all);
}
