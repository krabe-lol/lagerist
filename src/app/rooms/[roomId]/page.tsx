import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getRoomAncestors, getRoomChildren } from "@/lib/entities";
import Breadcrumbs from "@/components/Breadcrumbs";
import DetailHeader from "@/components/DetailHeader";
import DetailList from "@/components/DetailList";
import ChildrenCard from "@/components/ChildrenCard";
import AttachmentSection from "@/components/AttachmentSection";
import QrCodeBlock from "@/components/QrCodeBlock";
import { MapPin } from "lucide-react";
import { deleteRoomAction } from "@/app/rooms/roomActions";

export default async function RoomDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ roomId: string }>;
  searchParams: Promise<{ photoUploadError?: string; fileUploadError?: string }>;
}) {
  const { roomId } = await params;
  const { photoUploadError, fileUploadError } = await searchParams;

  const room = await prisma.location.findUnique({
    where: { id: roomId },
    include: {
      parent: { select: { id: true, name: true } },
      attachments: true,
    },
  });
  if (!room) notFound();

  const [ancestors, children] = await Promise.all([getRoomAncestors(room.parentId), getRoomChildren(room.id)]);

  return (
    <div className="flex flex-col gap-4">
      <Breadcrumbs
        items={[
          { label: "Räume", href: "/rooms" },
          ...ancestors.map((a) => ({ label: a.name, href: `/rooms/${a.id}` })),
          { label: room.name },
        ]}
      />

      <DetailHeader
        icon={MapPin}
        title={room.name}
        description={room.description}
        editHref={`/rooms/${room.id}/edit`}
        deleteAction={deleteRoomAction}
        deleteId={room.id}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5 lg:gap-24">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <section>
            <h2 className="mb-2 font-semibold">Details</h2>
            <DetailList
              rows={[
                ...(room.parent
                  ? [
                      {
                        label: "Übergeordneter Raum",
                        value: (
                          <Link href={`/rooms/${room.parent.id}`} className="link">
                            {room.parent.name}
                          </Link>
                        ),
                      },
                    ]
                  : []),
                { label: "QR-Code", value: <QrCodeBlock type="LOCATION" id={room.id} /> },
                {
                  label: "Anhänge",
                  value: (
                    <AttachmentSection
                      entityType="LOCATION"
                      entityId={room.id}
                      attachments={room.attachments}
                      photoUploadError={photoUploadError}
                      fileUploadError={fileUploadError}
                    />
                  ),
                },
              ]}
            />
          </section>
        </div>

        <ChildrenCard
          emptyText="Noch nichts in diesem Raum."
          quickAdds={[
            { label: "Unter-Raum", href: `/rooms/new?parentId=${room.id}` },
            { label: "Container", href: `/containers/new?roomId=${room.id}` },
            { label: "Artikel", href: `/items/new?roomId=${room.id}` },
          ]}
          nodes={children}
        />
      </div>
    </div>
  );
}
