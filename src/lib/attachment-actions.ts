"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { saveUploadedFile, deleteAttachmentFile } from "@/lib/attachments";
import { ENTITY_ROUTE_SEGMENT, type AttachmentKind, type EntityType } from "@/lib/constants";

const ENTITY_COLUMN: Record<EntityType, "locationId" | "containerId" | "itemId"> = {
  LOCATION: "locationId",
  CONTAINER: "containerId",
  ITEM: "itemId",
};

function entityPath(type: EntityType, id: string) {
  return `/${ENTITY_ROUTE_SEGMENT[type]}/${id}`;
}

export async function uploadAttachmentAction(formData: FormData) {
  const entityType = formData.get("entityType") as EntityType;
  const entityId = formData.get("entityId") as string;
  const kind = formData.get("kind") as AttachmentKind;
  const file = formData.get("file") as File | null;

  if (!file || file.size === 0) return;

  const stored = await saveUploadedFile(file);
  const column = ENTITY_COLUMN[entityType];

  const attachment = await prisma.attachment.create({
    data: {
      kind,
      filename: stored.filename,
      storedPath: stored.storedPath,
      mimeType: stored.mimeType,
      size: stored.size,
      [column]: entityId,
    },
  });

  if (kind === "PHOTO") {
    const delegate = {
      LOCATION: prisma.location,
      CONTAINER: prisma.container,
      ITEM: prisma.item,
    }[entityType];
    const current = await (
      delegate as { findUnique: (args: unknown) => Promise<{ primaryPhotoId: string | null } | null> }
    ).findUnique({ where: { id: entityId }, select: { primaryPhotoId: true } });
    if (!current?.primaryPhotoId) {
      await (delegate as { update: (args: unknown) => Promise<unknown> }).update({
        where: { id: entityId },
        data: { primaryPhotoId: attachment.id },
      });
    }
  }

  revalidatePath(entityPath(entityType, entityId));
}

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
