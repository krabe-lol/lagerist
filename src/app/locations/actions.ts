"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import {
  buildCustomFieldsFromForm,
  collectLocationSubtree,
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

export async function createLocationAction(formData: FormData) {
  const name = formData.get("name") as string;
  const description = (formData.get("description") as string) || null;
  const parentId = (formData.get("parentId") as string) || null;
  const templateId = (formData.get("templateId") as string) || null;

  const fieldDefs = await getTemplateFieldDefs(templateId);
  const customFields = buildCustomFieldsFromForm(formData, fieldDefs);

  const location = await prisma.location.create({
    data: { name, description, parentId, templateId, customFields },
  });

  await setEntityTags("LOCATION", location.id, parseTags(formData));
  await reindexEntity({
    type: "LOCATION",
    id: location.id,
    name: location.name,
    description: location.description,
    templateId: location.templateId,
    customFields: location.customFields,
  });

  revalidatePath("/");
  revalidatePath("/locations");
  if (parentId) revalidatePath(`/locations/${parentId}`);
  redirect(`/locations/${location.id}`);
}

export async function updateLocationAction(formData: FormData) {
  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  const description = (formData.get("description") as string) || null;
  const parentId = (formData.get("parentId") as string) || null;
  const templateId = (formData.get("templateId") as string) || null;

  const fieldDefs = await getTemplateFieldDefs(templateId);
  const customFields = buildCustomFieldsFromForm(formData, fieldDefs);

  const location = await prisma.location.update({
    where: { id },
    data: { name, description, parentId, templateId, customFields },
  });

  await setEntityTags("LOCATION", id, parseTags(formData));
  await reindexEntity({
    type: "LOCATION",
    id,
    name: location.name,
    description: location.description,
    templateId: location.templateId,
    customFields: location.customFields,
  });

  revalidatePath("/");
  revalidatePath(`/locations/${id}`);
  redirect(`/locations/${id}`);
}

export async function deleteLocationAction(formData: FormData) {
  const id = formData.get("id") as string;
  const location = await prisma.location.findUnique({ where: { id } });
  if (!location) return;

  const subtree = await collectLocationSubtree(id);
  const cleanup = await prepareSubtreeCleanup(subtree);
  await prisma.location.delete({ where: { id } });
  await cleanup();

  revalidatePath("/");
  revalidatePath("/locations");
  if (location.parentId) revalidatePath(`/locations/${location.parentId}`);

  redirect(location.parentId ? `/locations/${location.parentId}` : "/locations");
}
