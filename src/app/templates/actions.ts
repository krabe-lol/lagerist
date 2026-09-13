"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";

function parseFields(formData: FormData): Prisma.InputJsonValue {
  const raw = (formData.get("fieldsJson") as string) || "[]";
  try {
    return JSON.parse(raw) as Prisma.InputJsonValue;
  } catch {
    return [];
  }
}

export async function createTemplateAction(formData: FormData) {
  const name = formData.get("name") as string;
  const entityType = formData.get("entityType") as string;
  const fields = parseFields(formData);

  await prisma.template.create({ data: { name, entityType, fields } });

  revalidatePath("/templates");
  redirect("/templates");
}

export async function updateTemplateAction(formData: FormData) {
  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  const entityType = formData.get("entityType") as string;
  const fields = parseFields(formData);

  await prisma.template.update({ where: { id }, data: { name, entityType, fields } });

  revalidatePath("/templates");
  redirect("/templates");
}

export async function deleteTemplateAction(formData: FormData) {
  const id = formData.get("id") as string;
  await prisma.template.delete({ where: { id } });
  revalidatePath("/templates");
}
