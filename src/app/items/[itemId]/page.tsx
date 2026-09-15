import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getRoomAncestors, getItemTags } from "@/lib/entities";
import Breadcrumbs from "@/components/Breadcrumbs";
import DetailHeader from "@/components/DetailHeader";
import DetailList from "@/components/DetailList";
import TagBadges from "@/components/TagBadges";
import AttachmentSection from "@/components/AttachmentSection";
import QrCodeBlock from "@/components/QrCodeBlock";
import LocationChainTrail from "@/components/LocationChainTrail";
import RoomQuickPicker from "@/components/RoomQuickPicker";
import { LayoutGrid } from "lucide-react";
import { deleteItemAction, updateItemLocationAction } from "@/app/items/itemActions";

export default async function ItemDetailPage({
  params,
}: {
  params: Promise<{ itemId: string }>;
}) {
  const { itemId } = await params;

  const item = await prisma.item.findUnique({
    where: { id: itemId },
    include: { attachments: true },
  });
  if (!item) notFound();

  const [ancestors, tagNames, rooms] = await Promise.all([
    getRoomAncestors(item.locationId),
    getItemTags(item.id),
    prisma.location.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <Breadcrumbs
        items={[
          { label: "Räume", href: "/rooms" },
          ...ancestors.map((a) => ({ label: a.name, href: `/rooms/${a.id}` })),
          { label: item.name },
        ]}
      />

      <DetailHeader
        icon={LayoutGrid}
        title={item.name}
        badge={item.quantity !== 1 && <span className="text-base-content/60">×{item.quantity}</span>}
        description={item.description}
        extra={
          <div className="mt-2">
            <TagBadges tags={tagNames} />
          </div>
        }
        editHref={`/items/${item.id}/edit`}
        deleteAction={deleteItemAction}
        deleteId={item.id}
      />

      <section className="max-w-2xl">
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
                    id={item.id}
                    currentRoomId={item.locationId ?? undefined}
                    roomOptions={rooms}
                    updateAction={updateItemLocationAction}
                  />
                </div>
              ),
            },
            { label: "QR-Code", value: <QrCodeBlock type="ITEM" id={item.id} /> },
            {
              label: "Anhänge",
              value: (
                <AttachmentSection
                  entityType="ITEM"
                  entityId={item.id}
                  primaryPhotoId={item.primaryPhotoId}
                  attachments={item.attachments}
                />
              ),
            },
          ]}
        />
      </section>
    </div>
  );
}
