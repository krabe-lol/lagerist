"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { collectRoomSubtree, prepareSubtreeCleanup, reindexEntity } from "@/lib/entities";

// Also used to finalize a draft room (see lib/drafts.ts) — "New Room" edits
// the same freshly-created draft row this form always has an id for, and
// this is what flips it from confirmed: false to true.
export async function updateRoomAction(formData: FormData) {
  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  const description = (formData.get("description") as string) || null;
  const parentId = (formData.get("parentId") as string) || null;

  const room = await prisma.location.update({
    where: { id },
    data: { name, description, parentId, confirmed: true },
  });

  await reindexEntity({
    type: "LOCATION",
    id,
    name: room.name,
    description: room.description,
  });

  revalidatePath("/");
  revalidatePath(`/rooms/${id}`);
  redirect(`/rooms/${id}`);
}

export async function deleteRoomAction(formData: FormData) {
  const id = formData.get("id") as string;
  const room = await prisma.location.findUnique({ where: { id } });
  if (!room) return;

  const subtree = await collectRoomSubtree(id);
  const cleanup = await prepareSubtreeCleanup(subtree);
  await prisma.location.delete({ where: { id } });
  await cleanup();

  revalidatePath("/");
  revalidatePath("/rooms");
  if (room.parentId) revalidatePath(`/rooms/${room.parentId}`);

  redirect(room.parentId ? `/rooms/${room.parentId}` : "/rooms");
}
