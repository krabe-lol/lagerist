import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getTagNames } from "@/lib/entities";
import ContainerForm from "@/app/containers/ContainerForm";
import Breadcrumbs from "@/components/Breadcrumbs";
import type { TemplateFieldDef } from "@/lib/constants";

export default async function EditContainerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const container = await prisma.container.findUnique({ where: { id } });
  if (!container) notFound();

  const [locations, templates, tagNames] = await Promise.all([
    prisma.location.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.template.findMany({ where: { entityType: "CONTAINER" } }),
    getTagNames("CONTAINER", id),
  ]);

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "Locations", href: "/locations" },
          { label: container.name, href: `/containers/${id}` },
          { label: "Bearbeiten" },
        ]}
      />
      <h1 className="mb-6 text-2xl font-bold">Container bearbeiten</h1>
      <ContainerForm
        mode="edit"
        container={container}
        locationOptions={locations}
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
