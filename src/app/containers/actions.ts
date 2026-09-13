"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import {
  buildCustomFieldsFromForm,
  collectContainerSubtree,
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

export async function createContainerAction(formData: FormData) {
  const name = formData.get("name") as string;
  const description = (formData.get("description") as string) || null;
  const locationId = formData.get("locationId") as string;
  const templateId = (formData.get("templateId") as string) || null;

  const fieldDefs = await getTemplateFieldDefs(templateId);
  const customFields = buildCustomFieldsFromForm(formData, fieldDefs);

  const container = await prisma.container.create({
    data: { name, description, locationId, templateId, customFields },
  });

  await setEntityTags("CONTAINER", container.id, parseTags(formData));
  await reindexEntity({
    type: "CONTAINER",
    id: container.id,
    name: container.name,
    description: container.description,
    templateId: container.templateId,
    customFields: container.customFields,
  });

  revalidatePath("/");
  revalidatePath(`/locations/${locationId}`);
  redirect(`/containers/${container.id}`);
}

export async function updateContainerAction(formData: FormData) {
  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  const description = (formData.get("description") as string) || null;
  const locationId = formData.get("locationId") as string;
  const templateId = (formData.get("templateId") as string) || null;

  const fieldDefs = await getTemplateFieldDefs(templateId);
  const customFields = buildCustomFieldsFromForm(formData, fieldDefs);

  const container = await prisma.container.update({
    where: { id },
    data: { name, description, locationId, templateId, customFields },
  });

  await setEntityTags("CONTAINER", id, parseTags(formData));
  await reindexEntity({
    type: "CONTAINER",
    id,
    name: container.name,
    description: container.description,
    templateId: container.templateId,
    customFields: container.customFields,
  });

  revalidatePath("/");
  revalidatePath(`/containers/${id}`);
  revalidatePath(`/locations/${locationId}`);
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
  revalidatePath(`/locations/${container.locationId}`);
  redirect(`/locations/${container.locationId}`);
}
