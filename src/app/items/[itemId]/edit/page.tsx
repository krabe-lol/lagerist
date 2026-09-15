import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getItemTags } from "@/lib/entities";
import ItemForm from "@/app/items/ItemForm";
import PageHeader from "@/components/PageHeader";

export default async function EditItemPage({
  params,
}: {
  params: Promise<{ itemId: string }>;
}) {
  const { itemId } = await params;
  const item = await prisma.item.findUnique({ where: { id: itemId } });
  if (!item) notFound();

  const [rooms, containers, tagNames] = await Promise.all([
    prisma.location.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.container.findMany({
      orderBy: { name: "asc" },
      include: { location: { select: { name: true } } },
    }),
    getItemTags(itemId),
  ]);

  return (
    <div>
      <PageHeader
        breadcrumbs={[
          { label: "Räume", href: "/rooms" },
          { label: item.name, href: `/items/${itemId}` },
          { label: "Bearbeiten" },
        ]}
        title="Artikel bearbeiten"
      />
      <ItemForm
        mode="edit"
        item={item}
        roomOptions={rooms}
        containerOptions={containers.map((c) => ({ id: c.id, name: c.name, number: c.number, roomName: c.location?.name ?? "" }))}
        initialTags={tagNames}
      />
    </div>
  );
}
