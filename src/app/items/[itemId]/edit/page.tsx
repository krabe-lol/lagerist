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

  const [rooms, tagNames] = await Promise.all([
    prisma.location.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
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
      <ItemForm mode="edit" item={item} roomOptions={rooms} initialTags={tagNames} />
    </div>
  );
}
