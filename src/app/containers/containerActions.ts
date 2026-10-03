"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { collectContainerSubtree, prepareSubtreeCleanup, reindexEntity } from "@/lib/entities";
import { failedSaveState, versionGuard, type SaveState } from "@/lib/versioning";

function extraSearchText(dimensions: string | null, volume: string | null): string {
  return [dimensions, volume].filter(Boolean).join(" ");
}

// Also used to finalize a draft container (see lib/drafts.ts) — "New
// Container" edits the same freshly-created draft row this form always has
// an id for, and this is what flips it from confirmed: false to true.
// Version-checked like updateItemAction (see lib/versioning.ts).
export async function updateContainerAction(_prev: SaveState, formData: FormData): Promise<SaveState> {
  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  const description = (formData.get("description") as string) || null;
  const locationId = formData.get("locationId") as string;
  const templateId = (formData.get("templateId") as string) || null;
  const dimensions = (formData.get("dimensions") as string) || null;
  const volume = (formData.get("volume") as string) || null;

  const { count } = await prisma.container.updateMany({
    where: { id, ...versionGuard(formData) },
    data: { name, description, locationId, templateId, dimensions, volume, confirmed: true },
  });
  if (count === 0) return failedSaveState("container", id);

  await reindexEntity({
    type: "CONTAINER",
    id,
    name,
    description,
    extraText: extraSearchText(dimensions, volume),
  });

  revalidatePath("/");
  revalidatePath(`/containers/${id}`);
  revalidatePath(`/rooms/${locationId}`);
  redirect(`/containers/${id}`);
}

export async function updateContainerLocationAction(formData: FormData) {
  const id = formData.get("id") as string;
  const locationId = formData.get("locationId") as string;

  const previous = await prisma.container.findUnique({ where: { id }, select: { locationId: true } });
  const { count } = await prisma.container.updateMany({ where: { id }, data: { locationId } });
  // Deleted by someone else meanwhile: the not-found page says so.
  if (count === 0) redirect(`/containers/${id}`);

  revalidatePath("/");
  revalidatePath(`/containers/${id}`);
  revalidatePath(`/rooms/${locationId}`);
  if (previous?.locationId && previous.locationId !== locationId) revalidatePath(`/rooms/${previous.locationId}`);
  redirect(`/containers/${id}`);
}

export async function deleteContainerAction(formData: FormData) {
  const id = formData.get("id") as string;
  const container = await prisma.container.findUnique({ where: { id } });
  if (!container) return;

  const subtree = await collectContainerSubtree(id);
  const cleanup = await prepareSubtreeCleanup(subtree);
  const { count } = await prisma.container.deleteMany({ where: { id } });
  if (count > 0) await cleanup();

  revalidatePath("/");
  if (container.locationId) revalidatePath(`/rooms/${container.locationId}`);

  redirect(container.locationId ? `/rooms/${container.locationId}` : "/rooms");
}
