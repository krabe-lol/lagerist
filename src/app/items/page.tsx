import Link from "next/link";
import { prisma } from "@/lib/db";
import PageHeader from "@/components/PageHeader";
import EntityCollection from "@/components/EntityCollection";

export default async function ItemsPage() {
  const items = await prisma.item.findMany({
    where: { parentItemId: null },
    orderBy: { name: "asc" },
    include: {
      location: { select: { name: true } },
      container: { select: { name: true } },
      _count: { select: { subItems: true } },
    },
  });

  return (
    <div>
      <PageHeader
        breadcrumbs={[{ label: "Artikel" }]}
        title="Artikel"
        actions={
          <Link href="/items/new" className="btn btn-primary btn-sm">
            + Neuer Artikel
          </Link>
        }
      />

      <EntityCollection
        emptyText="Noch keine Artikel angelegt."
        items={items.map((item) => ({
          key: item.id,
          href: `/items/${item.id}`,
          title: (
            <>
              {item.name} {item.quantity !== 1 && <span className="text-base-content/60">×{item.quantity}</span>}
            </>
          ),
          subtitle: item.description,
          meta: `${item.location?.name ?? item.container?.name ?? ""}${
            item._count.subItems > 0 ? ` · ${item._count.subItems} Unterartikel` : ""
          }`,
        }))}
      />
    </div>
  );
}
