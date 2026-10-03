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
    // deleteMany: someone else deleting it at the same moment isn't an error.
    const { count } = await prisma.attachment.deleteMany({ where: { id: attachmentId } });
    if (count > 0) await deleteAttachmentFile(attachment.storedPath);
  }

  revalidatePath(entityPath(entityType, entityId));
}
