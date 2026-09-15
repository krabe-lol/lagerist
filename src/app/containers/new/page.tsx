import { prisma } from "@/lib/db";
import { nextContainerNumber } from "@/lib/entities";
import ContainerForm from "@/app/containers/ContainerForm";
import PageHeader from "@/components/PageHeader";

export default async function NewContainerPage({
  searchParams,
}: {
  searchParams: Promise<{ roomId?: string }>;
}) {
  const { roomId } = await searchParams;
  const [rooms, templates, nextNumber] = await Promise.all([
    prisma.location.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.containerTemplate.findMany({ orderBy: { name: "asc" } }),
    nextContainerNumber(),
  ]);

  return (
    <div>
      <PageHeader breadcrumbs={[{ label: "Räume", href: "/rooms" }, { label: "Neuer Container" }]} title="Neuer Container" />
      <ContainerForm
        mode="new"
        roomOptions={rooms}
        templates={templates}
        initialRoomId={roomId}
        nextNumber={nextNumber}
      />
    </div>
  );
}
