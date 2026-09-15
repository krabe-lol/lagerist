import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import ContainerForm from "@/app/containers/ContainerForm";
import PageHeader from "@/components/PageHeader";

export default async function EditContainerPage({
  params,
}: {
  params: Promise<{ containerId: string }>;
}) {
  const { containerId } = await params;
  const container = await prisma.container.findUnique({ where: { id: containerId } });
  if (!container) notFound();

  const [rooms, templates] = await Promise.all([
    prisma.location.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.containerTemplate.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <PageHeader
        breadcrumbs={[
          { label: "Räume", href: "/rooms" },
          { label: `${container.name} #${container.number}`, href: `/containers/${containerId}` },
          { label: "Bearbeiten" },
        ]}
        title="Container bearbeiten"
      />
      <ContainerForm mode="edit" container={container} roomOptions={rooms} templates={templates} />
    </div>
  );
}
