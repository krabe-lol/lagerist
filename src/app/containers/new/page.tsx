import { prisma } from "@/lib/db";
import NewContainerClient from "@/app/containers/NewContainerClient";
import PageHeader from "@/components/PageHeader";
import DraftAttachments from "@/components/DraftAttachments";

export default async function NewContainerPage({
  searchParams,
}: {
  searchParams: Promise<{ roomId?: string; draft?: string; photoUploadError?: string; fileUploadError?: string }>;
}) {
  const { roomId, draft, photoUploadError, fileUploadError } = await searchParams;
  const [rooms, templates] = await Promise.all([
    prisma.location.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.containerTemplate.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <PageHeader breadcrumbs={[{ label: "Räume", href: "/rooms" }, { label: "Neuer Container" }]} title="Neuer Container" />
      <NewContainerClient
        roomOptions={rooms}
        templates={templates}
        initialRoomId={roomId}
        resumeDraftId={draft}
        attachments={
          draft && (
            <DraftAttachments
              entityType="CONTAINER"
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
