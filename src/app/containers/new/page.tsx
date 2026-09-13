import { prisma } from "@/lib/db";
import ContainerForm from "@/app/containers/ContainerForm";
import Breadcrumbs from "@/components/Breadcrumbs";
import type { TemplateFieldDef } from "@/lib/constants";

export default async function NewContainerPage({
  searchParams,
}: {
  searchParams: Promise<{ locationId?: string }>;
}) {
  const { locationId } = await searchParams;
  const [locations, templates] = await Promise.all([
    prisma.location.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.template.findMany({ where: { entityType: "CONTAINER" } }),
  ]);

  return (
    <div>
      <Breadcrumbs items={[{ label: "Locations", href: "/locations" }, { label: "Neuer Container" }]} />
      <h1 className="mb-6 text-2xl font-bold">Neuer Container</h1>
      <ContainerForm
        mode="new"
        locationOptions={locations}
        templates={templates.map((t) => ({
          id: t.id,
          name: t.name,
          fields: t.fields as unknown as TemplateFieldDef[],
        }))}
        initialTags={[]}
        initialLocationId={locationId}
      />
    </div>
  );
}
