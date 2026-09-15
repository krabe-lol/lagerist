import Link from "next/link";
import { prisma } from "@/lib/db";
import PageHeader from "@/components/PageHeader";
import EntityCollection from "@/components/EntityCollection";

export default async function RoomsPage() {
  const rooms = await prisma.location.findMany({
    where: { parentId: null },
    orderBy: { name: "asc" },
    include: { _count: { select: { children: true, containers: true } } },
  });

  return (
    <div>
      <PageHeader
        breadcrumbs={[{ label: "Räume" }]}
        title="Räume"
        actions={
          <Link href="/rooms/new" className="btn btn-primary btn-sm">
            + Neuer Raum
          </Link>
        }
      />

      <EntityCollection
        layout="list"
        emptyText="Noch keine Räume angelegt."
        items={rooms.map((room) => ({
          key: room.id,
          href: `/rooms/${room.id}`,
          title: room.name,
          subtitle: room.description,
          meta: `${room._count.children} Unter-Räume · ${room._count.containers} Container`,
        }))}
      />
    </div>
  );
}
