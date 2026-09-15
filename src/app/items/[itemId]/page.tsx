import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getItemLocationChain, getItemTags } from "@/lib/entities";
import Breadcrumbs from "@/components/Breadcrumbs";
import DetailHeader from "@/components/DetailHeader";
import DetailList from "@/components/DetailList";
import TagBadges from "@/components/TagBadges";
import AttachmentSection from "@/components/AttachmentSection";
import QrCodeBlock from "@/components/QrCodeBlock";
import LocationChainTrail from "@/components/LocationChainTrail";
import PlaceQuickPicker from "@/components/PlaceQuickPicker";
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

  const [chain, tagNames, rooms, containers] = await Promise.all([
    getItemLocationChain(item.id),
    getItemTags(item.id),
    prisma.location.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.container.findMany({
      orderBy: { name: "asc" },
      include: { location: { select: { name: true } } },
    }),
  ]);

  const current = chain.length > 0 ? chain[chain.length - 1] : null;

  return (
    <div className="flex flex-col gap-4">
      <Breadcrumbs
        items={[
          { label: "Räume", href: "/rooms" },
          ...chain.map((l) => ({ label: l.name, href: l.href })),
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
                  <LocationChainTrail links={chain.slice(0, -1).map((l) => ({ name: l.name, href: l.href }))} />
                  <PlaceQuickPicker
                    id={item.id}
                    currentValue={current ? `${current.kind}:${current.id}` : undefined}
                    currentHref={current?.href}
                    rooms={rooms}
                    containers={containers.map((c) => ({
                      id: c.id,
                      name: c.name,
                      number: c.number,
                      roomName: c.location.name,
                    }))}
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
