import { prisma } from "@/lib/db";
import LocationForm from "@/app/locations/LocationForm";
import Breadcrumbs from "@/components/Breadcrumbs";
import type { TemplateFieldDef } from "@/lib/constants";

export default async function NewLocationPage({
  searchParams,
}: {
  searchParams: Promise<{ parentId?: string }>;
}) {
  const { parentId } = await searchParams;
  const [locations, templates] = await Promise.all([
    prisma.location.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.template.findMany({ where: { entityType: "LOCATION" } }),
  ]);

  return (
    <div>
      <Breadcrumbs items={[{ label: "Locations", href: "/locations" }, { label: "Neu" }]} />
      <h1 className="mb-6 text-2xl font-bold">Neue Location</h1>
      <LocationForm
        mode="new"
        parentOptions={locations}
        templates={templates.map((t) => ({
          id: t.id,
          name: t.name,
          fields: t.fields as unknown as TemplateFieldDef[],
        }))}
        initialTags={[]}
        initialParentId={parentId}
      />
    </div>
  );
}
