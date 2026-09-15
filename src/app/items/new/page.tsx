import { prisma } from "@/lib/db";
import ItemForm from "@/app/items/ItemForm";
import PageHeader from "@/components/PageHeader";

export default async function NewItemPage({
  searchParams,
}: {
  searchParams: Promise<{ roomId?: string; containerId?: string }>;
}) {
  const { roomId, containerId } = await searchParams;

  const [rooms, containers] = await Promise.all([
    prisma.location.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.container.findMany({
      orderBy: { name: "asc" },
      include: { location: { select: { name: true } } },
    }),
  ]);

  return (
    <div>
      <PageHeader breadcrumbs={[{ label: "Räume", href: "/rooms" }, { label: "Neuer Artikel" }]} title="Neuer Artikel" />
      <ItemForm
        mode="new"
        roomOptions={rooms}
        containerOptions={containers.map((c) => ({ id: c.id, name: c.name, number: c.number, roomName: c.location.name }))}
        initialTags={[]}
        initialRoomId={roomId}
        initialContainerId={containerId}
      />
    </div>
  );
}
