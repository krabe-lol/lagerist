"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";

export async function createTemplateAction(formData: FormData) {
  const name = formData.get("name") as string;
  const dimensions = (formData.get("dimensions") as string) || null;
  const volume = (formData.get("volume") as string) || null;

  await prisma.containerTemplate.create({ data: { name, dimensions, volume } });

  revalidatePath("/templates");
  redirect("/templates");
}

export async function updateTemplateAction(formData: FormData) {
  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  const dimensions = (formData.get("dimensions") as string) || null;
  const volume = (formData.get("volume") as string) || null;

  await prisma.containerTemplate.update({ where: { id }, data: { name, dimensions, volume } });

  revalidatePath("/templates");
  redirect("/templates");
}

export async function deleteTemplateAction(formData: FormData) {
  const id = formData.get("id") as string;
  await prisma.containerTemplate.delete({ where: { id } });
  revalidatePath("/templates");
}
