import Link from "next/link";
import { prisma } from "@/lib/db";
import Breadcrumbs from "@/components/Breadcrumbs";

export default async function LocationsPage() {
  const locations = await prisma.location.findMany({
    where: { parentId: null },
    orderBy: { name: "asc" },
    include: { _count: { select: { children: true, containers: true } } },
  });

  return (
    <div>
      <Breadcrumbs items={[{ label: "Locations" }]} />
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Locations</h1>
        <Link href="/locations/new" className="btn btn-primary btn-sm">
          + Neue Location
        </Link>
      </div>

      {locations.length === 0 ? (
        <p className="text-base-content/60">Noch keine Locations angelegt.</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {locations.map((loc) => (
            <Link
              key={loc.id}
              href={`/locations/${loc.id}`}
              className="rounded-box border border-base-300 bg-base-100 p-4 transition hover:border-primary"
            >
              <p className="font-semibold">{loc.name}</p>
              {loc.description && (
                <p className="mt-1 truncate text-sm text-base-content/60">{loc.description}</p>
              )}
              <p className="mt-2 text-xs text-base-content/60">
                {loc._count.children} Unter-Locations · {loc._count.containers} Container
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
