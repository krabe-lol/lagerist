import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getContainerChildren, getRoomAncestors } from "@/lib/entities";
import Breadcrumbs from "@/components/Breadcrumbs";
import DetailHeader from "@/components/DetailHeader";
import DetailList from "@/components/DetailList";
import ChildrenCard from "@/components/ChildrenCard";
import AttachmentSection from "@/components/AttachmentSection";
import QrCodeBlock from "@/components/QrCodeBlock";
import RoomQuickPicker from "@/components/RoomQuickPicker";
import LocationChainTrail from "@/components/LocationChainTrail";
import { Box } from "lucide-react";
import { deleteContainerAction, updateContainerLocationAction } from "@/app/containers/containerActions";

export default async function ContainerDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ containerId: string }>;
  searchParams: Promise<{ photoUploadError?: string; fileUploadError?: string }>;
}) {
  const { containerId } = await params;
  const { photoUploadError, fileUploadError } = await searchParams;

  const container = await prisma.container.findUnique({
    where: { id: containerId },
    include: {
      location: true,
      attachments: true,
    },
  });
  if (!container) notFound();

  const [ancestors, rooms, children] = await Promise.all([
    getRoomAncestors(container.location.id),
    prisma.location.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    getContainerChildren(container.id),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <Breadcrumbs
        items={[
          { label: "Räume", href: "/rooms" },
          ...ancestors.map((a) => ({ label: a.name, href: `/rooms/${a.id}` })),
          { label: `#${container.number} ${container.name}` },
        ]}
      />

      <DetailHeader
        icon={Box}
        title={
          <>
            <span className="text-base-content/60">#{container.number}</span> {container.name}
          </>
        }
        description={container.description}
        editHref={`/containers/${container.id}/edit`}
        deleteAction={deleteContainerAction}
        deleteId={container.id}
      />

      <div className="detail-grid gap-6 lg:gap-20">
        <div className="detail-grid-details flex flex-col gap-6">
          <section>
            <h2 className="mb-2 font-semibold">Details</h2>
            <DetailList
              rows={[
                {
                  label: "Lage",
                  value: (
                    <div className="flex flex-col gap-1">
                      <LocationChainTrail
                        links={ancestors.slice(0, -1).map((r) => ({ name: r.name, href: `/rooms/${r.id}` }))}
                      />
                      <RoomQuickPicker
                        id={container.id}
                        currentRoomId={container.location.id}
                        roomOptions={rooms}
                        updateAction={updateContainerLocationAction}
                      />
                    </div>
                  ),
                },
                ...(container.dimensions ? [{ label: "Maße", value: container.dimensions }] : []),
                ...(container.volume ? [{ label: "Volumen", value: container.volume }] : []),
                {
                  label: "Anhänge",
                  value: (
                    <AttachmentSection
                      entityType="CONTAINER"
                      entityId={container.id}
                      attachments={container.attachments}
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
          className="detail-grid-children"
          emptyText="Noch keine Artikel in diesem Container."
          quickAdds={[{ label: "Artikel", href: `/items/new?containerId=${container.id}` }]}
          nodes={children}
        />

        <section className="detail-grid-qr">
          <h2 className="mb-2 font-semibold">QR-Code</h2>
          <QrCodeBlock type="CONTAINER" id={container.id} />
        </section>
      </div>
    </div>
  );
}
