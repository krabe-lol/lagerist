import { prisma } from "@/lib/db";
import NewItemClient from "@/app/items/NewItemClient";
import PageHeader from "@/components/PageHeader";
import DraftAttachments from "@/components/DraftAttachments";

export default async function NewItemPage({
  searchParams,
}: {
  searchParams: Promise<{ roomId?: string; containerId?: string; draft?: string; photoUploadError?: string; fileUploadError?: string }>;
}) {
  const { roomId, containerId, draft, photoUploadError, fileUploadError } = await searchParams;

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
      <NewItemClient
        roomOptions={rooms}
        containerOptions={containers.map((c) => ({
          id: c.id,
          name: c.name,
          number: c.number,
          roomName: c.location?.name ?? "",
        }))}
        initialRoomId={roomId}
        initialContainerId={containerId}
        resumeDraftId={draft}
        attachments={
          draft && (
            <DraftAttachments
              entityType="ITEM"
              draftId={draft}
              photoUploadError={photoUploadError}
              fileUploadError={fileUploadError}
            />
          )
        }
      />
    </div>
  );
}
