import { prisma } from "@/lib/db";
import NewRoomClient from "@/app/rooms/NewRoomClient";
import PageHeader from "@/components/PageHeader";
import DraftAttachments from "@/components/DraftAttachments";

export default async function NewRoomPage({
  searchParams,
}: {
  searchParams: Promise<{ parentId?: string; draft?: string; photoUploadError?: string; fileUploadError?: string }>;
}) {
  const { parentId, draft, photoUploadError, fileUploadError } = await searchParams;
  const rooms = await prisma.location.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div>
      <PageHeader breadcrumbs={[{ label: "Räume", href: "/rooms" }, { label: "Neu" }]} title="Neuer Raum" />
      <NewRoomClient
        parentOptions={rooms}
        initialParentId={parentId}
        resumeDraftId={draft}
        attachments={
          draft && (
            <DraftAttachments
              entityType="LOCATION"
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
