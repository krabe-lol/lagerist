"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import {
  buildCustomFieldsFromForm,
  collectItemSubtree,
  getTemplateFieldDefs,
  prepareSubtreeCleanup,
  reindexEntity,
  setEntityTags,
} from "@/lib/entities";

function parseTags(formData: FormData): string[] {
  const raw = (formData.get("tags") as string | null) ?? "";
  return raw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

function parseParent(formData: FormData): { containerId: string | null; parentItemId: string | null } {
  // ItemParentPicker disables whichever <select> isn't active, so only one of
  // these two ever actually makes it into the submitted FormData.
  const containerId = (formData.get("containerId") as string) || null;
  const parentItemId = (formData.get("parentItemId") as string) || null;
  return { containerId, parentItemId };
}

export async function createItemAction(formData: FormData) {
  const name = formData.get("name") as string;
  const description = (formData.get("description") as string) || null;
  const quantity = Number(formData.get("quantity") ?? 1) || 1;
  const templateId = (formData.get("templateId") as string) || null;
  const { containerId, parentItemId } = parseParent(formData);

  const fieldDefs = await getTemplateFieldDefs(templateId);
  const customFields = buildCustomFieldsFromForm(formData, fieldDefs);

  const item = await prisma.item.create({
    data: { name, description, quantity, templateId, customFields, containerId, parentItemId },
  });

  await setEntityTags("ITEM", item.id, parseTags(formData));
  await reindexEntity({
    type: "ITEM",
    id: item.id,
    name: item.name,
    description: item.description,
    templateId: item.templateId,
    customFields: item.customFields,
  });

  revalidatePath("/");
  if (containerId) revalidatePath(`/containers/${containerId}`);
  if (parentItemId) revalidatePath(`/items/${parentItemId}`);
  redirect(`/items/${item.id}`);
}

export async function updateItemAction(formData: FormData) {
  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  const description = (formData.get("description") as string) || null;
  const quantity = Number(formData.get("quantity") ?? 1) || 1;
  const templateId = (formData.get("templateId") as string) || null;
  const { containerId, parentItemId } = parseParent(formData);

  const fieldDefs = await getTemplateFieldDefs(templateId);
  const customFields = buildCustomFieldsFromForm(formData, fieldDefs);

  const item = await prisma.item.update({
    where: { id },
    data: { name, description, quantity, templateId, customFields, containerId, parentItemId },
  });

  await setEntityTags("ITEM", id, parseTags(formData));
  await reindexEntity({
    type: "ITEM",
    id,
    name: item.name,
    description: item.description,
    templateId: item.templateId,
    customFields: item.customFields,
  });

  revalidatePath("/");
  revalidatePath(`/items/${id}`);
  if (containerId) revalidatePath(`/containers/${containerId}`);
  if (parentItemId) revalidatePath(`/items/${parentItemId}`);
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
  if (item.containerId) revalidatePath(`/containers/${item.containerId}`);
  if (item.parentItemId) revalidatePath(`/items/${item.parentItemId}`);

  redirect(
    item.containerId
      ? `/containers/${item.containerId}`
      : item.parentItemId
        ? `/items/${item.parentItemId}`
        : "/"
  );
}
