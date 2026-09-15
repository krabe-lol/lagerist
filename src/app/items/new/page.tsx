import { prisma } from "@/lib/db";
import ItemForm from "@/app/items/ItemForm";
import PageHeader from "@/components/PageHeader";

export default async function NewItemPage({
  searchParams,
}: {
  searchParams: Promise<{ roomId?: string }>;
}) {
  const { roomId } = await searchParams;

  const rooms = await prisma.location.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } });

  return (
    <div>
      <PageHeader breadcrumbs={[{ label: "Räume", href: "/rooms" }, { label: "Neuer Artikel" }]} title="Neuer Artikel" />
      <ItemForm mode="new" roomOptions={rooms} initialTags={[]} initialRoomId={roomId} />
    </div>
  );
}
