"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { deleteAttachmentFile } from "@/lib/attachments";
import { entityPath, type EntityType } from "@/lib/constants";

export async function deleteAttachmentAction(formData: FormData) {
  const attachmentId = formData.get("attachmentId") as string;
  const entityType = formData.get("entityType") as EntityType;
  const entityId = formData.get("entityId") as string;

  const attachment = await prisma.attachment.findUnique({ where: { id: attachmentId } });
  if (attachment) {
    await prisma.attachment.delete({ where: { id: attachmentId } });
    await deleteAttachmentFile(attachment.storedPath);
  }

  revalidatePath(entityPath(entityType, entityId));
}

export async function setPrimaryPhotoAction(formData: FormData) {
  const entityType = formData.get("entityType") as EntityType;
  const entityId = formData.get("entityId") as string;
  const attachmentId = formData.get("attachmentId") as string;

  const delegate = {
    LOCATION: prisma.location,
    CONTAINER: prisma.container,
    ITEM: prisma.item,
  }[entityType];

  await (delegate as { update: (args: unknown) => Promise<unknown> }).update({
    where: { id: entityId },
    data: { primaryPhotoId: attachmentId },
  });

  revalidatePath(entityPath(entityType, entityId));
}
