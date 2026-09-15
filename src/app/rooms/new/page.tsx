import { prisma } from "@/lib/db";
import RoomForm from "@/app/rooms/RoomForm";
import PageHeader from "@/components/PageHeader";

export default async function NewRoomPage({
  searchParams,
}: {
  searchParams: Promise<{ parentId?: string }>;
}) {
  const { parentId } = await searchParams;
  const rooms = await prisma.location.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div>
      <PageHeader breadcrumbs={[{ label: "Räume", href: "/rooms" }, { label: "Neu" }]} title="Neuer Raum" />
      <RoomForm mode="new" parentOptions={rooms} initialParentId={parentId} />
    </div>
  );
}
