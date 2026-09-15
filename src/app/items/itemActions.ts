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

interface Place {
  locationId: string | null;
  containerId: string | null;
}

/** The combined Room/Container <select> (see PlaceOptions) submits one field,
 * "place", encoded as "room:<id>" or "container:<id>". */
function parsePlace(formData: FormData): Place {
  const raw = (formData.get("place") as string) || "";
  const [kind, id] = raw.split(":");
  return {
    locationId: kind === "room" ? id : null,
    containerId: kind === "container" ? id : null,
  };
}

function placePath({ locationId, containerId }: Place): string | null {
  if (locationId) return `/rooms/${locationId}`;
  if (containerId) return `/containers/${containerId}`;
  return null;
}

export async function createItemAction(formData: FormData) {
  const name = formData.get("name") as string;
  const description = (formData.get("description") as string) || null;
  const quantity = Number(formData.get("quantity") ?? 1) || 1;
  const place = parsePlace(formData);

  const item = await prisma.item.create({
    data: { name, description, quantity, ...place },
  });

  await setItemTags(item.id, parseTags(formData));
  await reindexEntity({
    type: "ITEM",
    id: item.id,
    name: item.name,
    description: item.description,
  });

  revalidatePath("/");
  const path = placePath(place);
  if (path) revalidatePath(path);
  redirect(`/items/${item.id}`);
}

export async function updateItemAction(formData: FormData) {
  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  const description = (formData.get("description") as string) || null;
  const quantity = Number(formData.get("quantity") ?? 1) || 1;
  const place = parsePlace(formData);

  const item = await prisma.item.update({
    where: { id },
    // parentItemId stays explicitly cleared: an item edited through this form
    // always ends up placed directly in a room or container, never as a sub-item.
    data: { name, description, quantity, ...place, parentItemId: null },
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
  const path = placePath(place);
  if (path) revalidatePath(path);
  redirect(`/items/${id}`);
}

export async function updateItemLocationAction(formData: FormData) {
  const id = formData.get("id") as string;
  const place = parsePlace(formData);

  const previous = await prisma.item.findUnique({
    where: { id },
    select: { locationId: true, containerId: true },
  });
  await prisma.item.update({ where: { id }, data: { ...place, parentItemId: null } });

  revalidatePath("/");
  revalidatePath(`/items/${id}`);
  const nextPath = placePath(place);
  const previousPath = previous && placePath(previous);
  if (nextPath) revalidatePath(nextPath);
  if (previousPath && previousPath !== nextPath) revalidatePath(previousPath);
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
  // Legacy items may still have a parentItemId instead of a locationId/containerId;
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
