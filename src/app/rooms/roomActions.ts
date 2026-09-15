"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { collectRoomSubtree, prepareSubtreeCleanup, reindexEntity } from "@/lib/entities";
import { saveAttachmentsFromFormData } from "@/lib/attachment-uploads";

export async function createRoomAction(formData: FormData) {
  const name = formData.get("name") as string;
  const description = (formData.get("description") as string) || null;
  const parentId = (formData.get("parentId") as string) || null;

  const room = await prisma.location.create({
    data: { name, description, parentId },
  });

  await reindexEntity({
    type: "LOCATION",
    id: room.id,
    name: room.name,
    description: room.description,
  });

  const photoError = await saveAttachmentsFromFormData(formData, "photos", "PHOTO", "LOCATION", room.id);
  const fileError = await saveAttachmentsFromFormData(formData, "files", "FILE", "LOCATION", room.id);

  revalidatePath("/");
  revalidatePath("/rooms");
  if (parentId) revalidatePath(`/rooms/${parentId}`);

  const query = new URLSearchParams();
  if (photoError) query.set("photoUploadError", photoError);
  if (fileError) query.set("fileUploadError", fileError);
  const qs = query.toString();
  redirect(`/rooms/${room.id}${qs ? `?${qs}` : ""}`);
}

export async function updateRoomAction(formData: FormData) {
  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  const description = (formData.get("description") as string) || null;
  const parentId = (formData.get("parentId") as string) || null;

  const room = await prisma.location.update({
    where: { id },
    data: { name, description, parentId },
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
