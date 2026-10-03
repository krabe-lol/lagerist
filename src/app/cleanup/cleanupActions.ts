"use server";

import { revalidatePath } from "next/cache";
import { ORPHAN_KINDS, deleteAllOrphans, deleteOrphan, type OrphanKind } from "@/lib/orphans";

function parseKind(formData: FormData): OrphanKind | undefined {
  const kind = formData.get("kind") as string | null;
  return ORPHAN_KINDS.find((k) => k === kind);
}

export async function deleteOrphanAction(formData: FormData) {
  const kind = parseKind(formData);
  const key = formData.get("key") as string | null;
  if (kind && key) await deleteOrphan(kind, key);
  revalidatePath("/cleanup");
}

/** Without a "kind" field: everything on the page. */
export async function deleteAllOrphansAction(formData: FormData) {
  await deleteAllOrphans(parseKind(formData));
  revalidatePath("/cleanup");
}
