import Link from "next/link";
import { prisma } from "@/lib/db";
import PageHeader from "@/components/PageHeader";
import EntityCollection from "@/components/EntityCollection";

export default async function ContainersPage() {
  const containers = await prisma.container.findMany({
    orderBy: { name: "asc" },
    include: { location: { select: { name: true } }, _count: { select: { items: true } } },
  });

  return (
    <div>
      <PageHeader
        breadcrumbs={[{ label: "Container" }]}
        title="Container"
        actions={
          <Link href="/containers/new" className="btn btn-primary btn-sm">
            + Neuer Container
          </Link>
        }
      />

      <EntityCollection
        layout="list"
        emptyText="Noch keine Container angelegt."
        items={containers.map((c) => ({
          key: c.id,
          href: `/containers/${c.id}`,
          title: (
            <>
              <span className="text-base-content/60">#{c.number}</span> {c.name}
            </>
          ),
          subtitle: c.description,
          meta: `${c.location?.name ?? "Kein Raum"} · ${c._count.items} Artikel`,
        }))}
      />
    </div>
  );
}
