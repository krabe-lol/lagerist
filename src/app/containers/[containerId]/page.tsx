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
}: {
  params: Promise<{ containerId: string }>;
}) {
  const { containerId } = await params;

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
          { label: `${container.name} #${container.number}` },
        ]}
      />

      <DetailHeader
        icon={Box}
        title={container.name}
        badge={<span className="text-base-content/60">#{container.number}</span>}
        description={container.description}
        editHref={`/containers/${container.id}/edit`}
        deleteAction={deleteContainerAction}
        deleteId={container.id}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5 lg:gap-20">
        <div className="flex flex-col gap-6 lg:col-span-2">
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
                { label: "QR-Code", value: <QrCodeBlock type="CONTAINER" id={container.id} /> },
                {
                  label: "Anhänge",
                  value: (
                    <AttachmentSection
                      entityType="CONTAINER"
                      entityId={container.id}
                      primaryPhotoId={container.primaryPhotoId}
                      attachments={container.attachments}
                    />
                  ),
                },
              ]}
            />
          </section>
        </div>

        <ChildrenCard
          emptyText="Noch keine Artikel in diesem Container."
          quickAdds={[{ label: "Artikel", href: `/items/new?containerId=${container.id}` }]}
          nodes={children}
        />
      </div>
    </div>
  );
}
