"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { collectItemSubtree, prepareSubtreeCleanup, reindexEntity, setItemTags } from "@/lib/entities";
import { failedSaveState, versionGuard, type SaveState } from "@/lib/versioning";

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

// Also used to finalize a draft item (see lib/drafts.ts) — "New Artikel"
// edits the same freshly-created draft row this form always has an id for,
// and this is what flips it from confirmed: false to true. Only saves if
// nobody else has saved the item since the form was loaded (see
// lib/versioning.ts); otherwise returns why, for VersionedForm to show.
export async function updateItemAction(_prev: SaveState, formData: FormData): Promise<SaveState> {
  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  const description = (formData.get("description") as string) || null;
  const quantity = Number(formData.get("quantity") ?? 1) || 1;
  const place = parsePlace(formData);

  const { count } = await prisma.item.updateMany({
    where: { id, ...versionGuard(formData) },
    // parentItemId stays explicitly cleared: an item edited through this form
    // always ends up placed directly in a room or container, never as a sub-item.
    data: { name, description, quantity, ...place, parentItemId: null, confirmed: true },
  });
  if (count === 0) return failedSaveState("item", id);

  await setItemTags(id, parseTags(formData));
  await reindexEntity({ type: "ITEM", id, name, description });

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
  const { count } = await prisma.item.updateMany({ where: { id }, data: { ...place, parentItemId: null } });
  // Deleted by someone else meanwhile: the redirect below lands on the
  // not-found page, which says so.
  if (count === 0) redirect(`/items/${id}`);

  revalidatePath("/");
  revalidatePath(`/items/${id}`);
  const nextPath = placePath(place);
  const previousPath = previous && placePath(previous);
  if (nextPath) revalidatePath(nextPath);
  if (previousPath && previousPath !== nextPath) revalidatePath(previousPath);
  redirect(`/items/${id}`);
}

/** The −/+ buttons on the item page. Saves a relative change (one atomic
 * UPDATE ... SET quantity = quantity + delta) rather than an absolute value,
 * so two people clicking at once both count. Never goes below 1. */
export async function adjustItemQuantityAction(id: string, delta: number) {
  if (delta !== 1 && delta !== -1) return;

  const { count } = await prisma.item.updateMany({
    where: { id, ...(delta < 0 && { quantity: { gt: 1 } }) },
    data: { quantity: { increment: delta } },
  });
  // Either already at 1 (nothing to do) or deleted by someone else meanwhile —
  // in the latter case the redirect lands on the not-found page, which says so.
  if (count === 0 && !(await prisma.item.findUnique({ where: { id }, select: { id: true } }))) {
    redirect(`/items/${id}`);
  }

  revalidatePath(`/items/${id}`);
}

export async function deleteItemAction(formData: FormData) {
  const id = formData.get("id") as string;
  const item = await prisma.item.findUnique({ where: { id } });
  if (!item) return;

  const subtree = await collectItemSubtree(id);
  const cleanup = await prepareSubtreeCleanup(subtree);
  // deleteMany: someone else deleting it at the same moment isn't an error.
  const { count } = await prisma.item.deleteMany({ where: { id } });
  if (count > 0) await cleanup();

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
