import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { collectLocationSubtree, getTagNames } from "@/lib/entities";
import LocationForm from "@/app/locations/LocationForm";
import Breadcrumbs from "@/components/Breadcrumbs";
import type { TemplateFieldDef } from "@/lib/constants";

export default async function EditLocationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const location = await prisma.location.findUnique({ where: { id } });
  if (!location) notFound();

  const subtree = await collectLocationSubtree(id);
  const excludeIds = new Set(subtree.locationIds);

  const [locations, templates, tagNames] = await Promise.all([
    prisma.location.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.template.findMany({ where: { entityType: "LOCATION" } }),
    getTagNames("LOCATION", id),
  ]);

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "Locations", href: "/locations" },
          { label: location.name, href: `/locations/${id}` },
          { label: "Bearbeiten" },
        ]}
      />
      <h1 className="mb-6 text-2xl font-bold">Location bearbeiten</h1>
      <LocationForm
        mode="edit"
        location={location}
        parentOptions={locations.filter((l) => !excludeIds.has(l.id))}
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
