"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { collectItemSubtree, prepareSubtreeCleanup, reindexEntity, setItemTags } from "@/lib/entities";

function parseTags(formData: FormData): string[] {
  const raw = (formData.get("tags") as string | null) ?? "";
  return raw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

export async function createItemAction(formData: FormData) {
  const name = formData.get("name") as string;
  const description = (formData.get("description") as string) || null;
  const quantity = Number(formData.get("quantity") ?? 1) || 1;
  const locationId = formData.get("locationId") as string;

  const item = await prisma.item.create({
    data: { name, description, quantity, locationId },
  });

  await setItemTags(item.id, parseTags(formData));
  await reindexEntity({
    type: "ITEM",
    id: item.id,
    name: item.name,
    description: item.description,
  });

  revalidatePath("/");
  revalidatePath(`/rooms/${locationId}`);
  redirect(`/items/${item.id}`);
}

export async function updateItemAction(formData: FormData) {
  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  const description = (formData.get("description") as string) || null;
  const quantity = Number(formData.get("quantity") ?? 1) || 1;
  const locationId = formData.get("locationId") as string;

  const item = await prisma.item.update({
    where: { id },
    // Explicitly clear containerId/parentItemId: an item edited through this form
    // always ends up placed directly in a room, even if it previously lived in a
    // container or as a sub-item.
    data: { name, description, quantity, locationId, containerId: null, parentItemId: null },
  });

  await setItemTags(id, parseTags(formData));
  await reindexEntity({
    type: "ITEM",
    id,
    name: item.name,
    description: item.description,
  });

  revalidatePath("/");
  revalidatePath(`/items/${id}`);
  revalidatePath(`/rooms/${locationId}`);
  redirect(`/items/${id}`);
}

export async function updateItemLocationAction(formData: FormData) {
  const id = formData.get("id") as string;
  const locationId = formData.get("locationId") as string;

  const previous = await prisma.item.findUnique({ where: { id }, select: { locationId: true } });
  await prisma.item.update({ where: { id }, data: { locationId, containerId: null, parentItemId: null } });

  revalidatePath("/");
  revalidatePath(`/items/${id}`);
  revalidatePath(`/rooms/${locationId}`);
  if (previous?.locationId && previous.locationId !== locationId) revalidatePath(`/rooms/${previous.locationId}`);
  redirect(`/items/${id}`);
}

export async function deleteItemAction(formData: FormData) {
  const id = formData.get("id") as string;
  const item = await prisma.item.findUnique({ where: { id } });
  if (!item) return;

  const subtree = await collectItemSubtree(id);
  const cleanup = await prepareSubtreeCleanup(subtree);
  await prisma.item.delete({ where: { id } });
  await cleanup();

  revalidatePath("/");
  // Legacy items may still have a containerId/parentItemId instead of a locationId;
  // handle all three so an old-style item's holder still refreshes on delete.
  if (item.locationId) revalidatePath(`/rooms/${item.locationId}`);
  if (item.containerId) revalidatePath(`/containers/${item.containerId}`);
  if (item.parentItemId) revalidatePath(`/items/${item.parentItemId}`);

  redirect(
    item.locationId
      ? `/rooms/${item.locationId}`
      : item.containerId
        ? `/containers/${item.containerId}`
        : item.parentItemId
          ? `/items/${item.parentItemId}`
          : "/"
  );
}
