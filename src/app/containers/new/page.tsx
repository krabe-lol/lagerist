import { prisma } from "@/lib/db";
import NewContainerClient from "@/app/containers/NewContainerClient";
import PageHeader from "@/components/PageHeader";

export default async function NewContainerPage({
  searchParams,
}: {
  searchParams: Promise<{ roomId?: string }>;
}) {
  const { roomId } = await searchParams;
  const [rooms, templates] = await Promise.all([
    prisma.location.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.containerTemplate.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <PageHeader breadcrumbs={[{ label: "Räume", href: "/rooms" }, { label: "Neuer Container" }]} title="Neuer Container" />
      <NewContainerClient roomOptions={rooms} templates={templates} initialRoomId={roomId} />
    </div>
  );
}
