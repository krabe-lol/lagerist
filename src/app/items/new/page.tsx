import { prisma } from "@/lib/db";
import ItemForm from "@/app/items/ItemForm";
import Breadcrumbs from "@/components/Breadcrumbs";
import type { TemplateFieldDef } from "@/lib/constants";

export default async function NewItemPage({
  searchParams,
}: {
  searchParams: Promise<{ containerId?: string; parentItemId?: string }>;
}) {
  const { containerId, parentItemId } = await searchParams;

  const [containers, items, templates] = await Promise.all([
    prisma.container.findMany({
      orderBy: { name: "asc" },
      include: { location: { select: { name: true } } },
    }),
    prisma.item.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.template.findMany({ where: { entityType: "ITEM" } }),
  ]);

  return (
    <div>
      <Breadcrumbs items={[{ label: "Locations", href: "/locations" }, { label: "Neues Item" }]} />
      <h1 className="mb-6 text-2xl font-bold">Neues Item</h1>
      <ItemForm
        mode="new"
        containerOptions={containers.map((c) => ({ id: c.id, name: c.name, locationName: c.location.name }))}
        itemOptions={items}
        templates={templates.map((t) => ({
          id: t.id,
          name: t.name,
          fields: t.fields as unknown as TemplateFieldDef[],
        }))}
        initialTags={[]}
        initialContainerId={containerId}
        initialParentItemId={parentItemId}
      />
    </div>
  );
}
