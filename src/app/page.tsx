import Link from "next/link";
import { prisma } from "@/lib/db";
import StatCard from "@/components/StatCard";
import { ENTITY_LABELS, ENTITY_ROUTE_SEGMENT, type EntityType } from "@/lib/constants";

interface RecentEntry {
  type: EntityType;
  id: string;
  name: string;
  updatedAt: Date;
}

export default async function DashboardPage() {
  const [locationCount, containerCount, itemCount, recentLocations, recentContainers, recentItems] =
    await Promise.all([
      prisma.location.count(),
      prisma.container.count(),
      prisma.item.count(),
      prisma.location.findMany({ orderBy: { updatedAt: "desc" }, take: 5 }),
      prisma.container.findMany({ orderBy: { updatedAt: "desc" }, take: 5 }),
      prisma.item.findMany({ orderBy: { updatedAt: "desc" }, take: 5 }),
    ]);

  const recent: RecentEntry[] = [
    ...recentLocations.map((l) => ({ type: "LOCATION" as const, id: l.id, name: l.name, updatedAt: l.updatedAt })),
    ...recentContainers.map((c) => ({ type: "CONTAINER" as const, id: c.id, name: c.name, updatedAt: c.updatedAt })),
    ...recentItems.map((i) => ({ type: "ITEM" as const, id: i.id, name: i.name, updatedAt: i.updatedAt })),
  ]
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .slice(0, 8);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Dashboard</h1>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Locations" value={locationCount} href="/locations" />
        <StatCard label="Container" value={containerCount} />
        <StatCard label="Items" value={itemCount} />
      </div>

      <div className="mb-8 flex flex-wrap gap-2">
        <Link href="/locations/new" className="btn btn-primary btn-sm">
          + Neue Location
        </Link>
        <Link href="/templates" className="btn btn-sm">
          Vorlagen verwalten
        </Link>
        <Link href="/scan" className="btn btn-sm">
          QR-Code scannen
        </Link>
        <Link href="/labels" className="btn btn-sm">
          Labels drucken
        </Link>
      </div>

      <section>
        <h2 className="mb-3 font-semibold">Zuletzt geändert</h2>
        {recent.length === 0 ? (
          <p className="text-base-content/60">
            Noch nichts angelegt. Starte mit einer neuen Location.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {recent.map((entry) => (
              <Link
                key={`${entry.type}-${entry.id}`}
                href={`/${ENTITY_ROUTE_SEGMENT[entry.type]}/${entry.id}`}
                className="flex items-center justify-between rounded-box border border-base-300 bg-base-100 px-4 py-2 hover:border-primary"
              >
                <span>{entry.name}</span>
                <span className="badge badge-ghost badge-sm">{ENTITY_LABELS[entry.type]}</span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
