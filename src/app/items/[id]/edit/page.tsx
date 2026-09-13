import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { collectItemSubtree, getTagNames } from "@/lib/entities";
import ItemForm from "@/app/items/ItemForm";
import Breadcrumbs from "@/components/Breadcrumbs";
import type { TemplateFieldDef } from "@/lib/constants";

export default async function EditItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await prisma.item.findUnique({ where: { id } });
  if (!item) notFound();

  const subtree = await collectItemSubtree(id);
  const excludeIds = new Set(subtree.itemIds);

  const [containers, items, templates, tagNames] = await Promise.all([
    prisma.container.findMany({
      orderBy: { name: "asc" },
      include: { location: { select: { name: true } } },
    }),
    prisma.item.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.template.findMany({ where: { entityType: "ITEM" } }),
    getTagNames("ITEM", id),
  ]);

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "Locations", href: "/locations" },
          { label: item.name, href: `/items/${id}` },
          { label: "Bearbeiten" },
        ]}
      />
      <h1 className="mb-6 text-2xl font-bold">Item bearbeiten</h1>
      <ItemForm
        mode="edit"
        item={item}
        containerOptions={containers.map((c) => ({ id: c.id, name: c.name, locationName: c.location.name }))}
        itemOptions={items.filter((i) => !excludeIds.has(i.id))}
        templates={templates.map((t) => ({
          id: t.id,
          name: t.name,
          fields: t.fields as unknown as TemplateFieldDef[],
        }))}
        initialTags={tagNames}
      />
    </div>
  );
}
