import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { collectRoomSubtree } from "@/lib/entities";
import RoomForm from "@/app/rooms/RoomForm";
import PageHeader from "@/components/PageHeader";

export default async function EditRoomPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = await params;
  const room = await prisma.location.findUnique({ where: { id: roomId } });
  if (!room) notFound();

  const subtree = await collectRoomSubtree(roomId);
  const excludeIds = new Set(subtree.roomIds);

  const rooms = await prisma.location.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div>
      <PageHeader
        breadcrumbs={[
          { label: "Räume", href: "/rooms" },
          { label: room.name, href: `/rooms/${roomId}` },
          { label: "Bearbeiten" },
        ]}
        title="Raum bearbeiten"
      />
      <RoomForm
        mode="edit"
        room={room}
        parentOptions={rooms.filter((l) => !excludeIds.has(l.id))}
      />
    </div>
  );
}
