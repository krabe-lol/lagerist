import Link from "next/link";
import { prisma } from "@/lib/db";
import { getRoomChildren } from "@/lib/entities";
import StatCard from "@/components/StatCard";
import EntityTree from "@/components/EntityTree";

export default async function DashboardPage() {
  const [roomCount, containerCount, itemCount, topLevelRooms] = await Promise.all([
    prisma.location.count(),
    prisma.container.count(),
    prisma.item.count(),
    prisma.location.findMany({
      where: { parentId: null },
      orderBy: { name: "asc" },
      select: { id: true, name: true, description: true },
    }),
  ]);

  const rooms = await Promise.all(
    topLevelRooms.map(async (room) => ({ ...room, children: await getRoomChildren(room.id) }))
  );

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Dashboard</h1>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Räume" value={roomCount} href="/rooms" />
        <StatCard label="Container" value={containerCount} />
        <StatCard label="Artikel" value={itemCount} />
      </div>

      {rooms.length === 0 ? (
        <p className="text-base-content/60">
          Noch keine Räume angelegt.{" "}
          <Link href="/rooms/new" className="link link-primary">
            Jetzt anlegen
          </Link>
          .
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {rooms.map((room) => (
            <div key={room.id} className="rounded-box border border-base-300 bg-base-100 p-4">
              <Link href={`/rooms/${room.id}`} className="font-semibold hover:text-primary">
                {room.name}
              </Link>
              {room.description && (
                <p className="mt-1 truncate text-sm text-base-content/60">{room.description}</p>
              )}
              <div className="mt-3">
                {room.children.length === 0 ? (
                  <p className="px-2 py-1 text-xs text-base-content/60">Leer</p>
                ) : (
                  <EntityTree nodes={room.children} />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
