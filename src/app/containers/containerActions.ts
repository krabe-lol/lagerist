"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import {
  collectContainerSubtree,
  nextContainerNumber,
  prepareSubtreeCleanup,
  reindexEntity,
} from "@/lib/entities";
import { saveAttachmentsFromFormData } from "@/lib/attachment-uploads";

function extraSearchText(dimensions: string | null, volume: string | null): string {
  return [dimensions, volume].filter(Boolean).join(" ");
}

export async function createContainerAction(formData: FormData) {
  const name = formData.get("name") as string;
  const description = (formData.get("description") as string) || null;
  const locationId = formData.get("locationId") as string;
  const templateId = (formData.get("templateId") as string) || null;
  const dimensions = (formData.get("dimensions") as string) || null;
  const volume = (formData.get("volume") as string) || null;

  const number = await nextContainerNumber();

  const container = await prisma.container.create({
    data: { number, name, description, locationId, templateId, dimensions, volume },
  });

  await reindexEntity({
    type: "CONTAINER",
    id: container.id,
    name: container.name,
    description: container.description,
    extraText: extraSearchText(container.dimensions, container.volume),
  });

  const photoError = await saveAttachmentsFromFormData(formData, "photos", "PHOTO", "CONTAINER", container.id);
  const fileError = await saveAttachmentsFromFormData(formData, "files", "FILE", "CONTAINER", container.id);

  revalidatePath("/");
  revalidatePath(`/rooms/${locationId}`);

  const query = new URLSearchParams();
  if (photoError) query.set("photoUploadError", photoError);
  if (fileError) query.set("fileUploadError", fileError);
  const qs = query.toString();
  redirect(`/containers/${container.id}${qs ? `?${qs}` : ""}`);
}

export async function updateContainerAction(formData: FormData) {
  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  const description = (formData.get("description") as string) || null;
  const locationId = formData.get("locationId") as string;
  const templateId = (formData.get("templateId") as string) || null;
  const dimensions = (formData.get("dimensions") as string) || null;
  const volume = (formData.get("volume") as string) || null;

  const container = await prisma.container.update({
    where: { id },
    data: { name, description, locationId, templateId, dimensions, volume },
  });

  await reindexEntity({
    type: "CONTAINER",
    id,
    name: container.name,
    description: container.description,
    extraText: extraSearchText(container.dimensions, container.volume),
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
  await prisma.container.update({ where: { id }, data: { locationId } });

  revalidatePath("/");
  revalidatePath(`/containers/${id}`);
  revalidatePath(`/rooms/${locationId}`);
  if (previous && previous.locationId !== locationId) revalidatePath(`/rooms/${previous.locationId}`);
  redirect(`/containers/${id}`);
}

export async function deleteContainerAction(formData: FormData) {
  const id = formData.get("id") as string;
  const container = await prisma.container.findUnique({ where: { id } });
  if (!container) return;

  const subtree = await collectContainerSubtree(id);
  const cleanup = await prepareSubtreeCleanup(subtree);
  await prisma.container.delete({ where: { id } });
  await cleanup();

  revalidatePath("/");
  revalidatePath(`/rooms/${container.locationId}`);
  redirect(`/rooms/${container.locationId}`);
}
