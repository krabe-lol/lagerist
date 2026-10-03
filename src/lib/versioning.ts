import { prismaRaw } from "@/lib/db";

// Optimistic concurrency for the Room/Container/Item edit forms: each form
// submits the `updatedAt` it was rendered with as "version", and the save
// only goes through while the row still has that exact `updatedAt` (checked
// and written in one UPDATE ... WHERE, so there's no gap for a concurrent
// save to slip into). If someone else saved in between, the action returns
// "conflict" and the form asks whether to overwrite; confirming resubmits
// with force=1, which skips the version check.

export type SaveState = null | { status: "conflict" } | { status: "deleted" };

/** Extra `where` conditions for the guarded updateMany. */
export function versionGuard(formData: FormData): { updatedAt?: Date } {
  if (formData.get("force") === "1") return {};
  const version = Number(formData.get("version"));
  return Number.isFinite(version) && version > 0 ? { updatedAt: new Date(version) } : {};
}

/** Tells apart why a guarded updateMany touched no row. Uses the unfiltered
 * client so an (unconfirmed) draft still counts as existing. */
export async function failedSaveState(model: "location" | "container" | "item", id: string): Promise<SaveState> {
  const where = { where: { id } };
  const exists =
    model === "location"
      ? await prismaRaw.location.count(where)
      : model === "container"
        ? await prismaRaw.container.count(where)
        : await prismaRaw.item.count(where);
  return { status: exists ? "conflict" : "deleted" };
}
