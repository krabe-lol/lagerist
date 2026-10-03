import { prismaRaw } from "@/lib/db";
import {
  collectContainerSubtree,
  collectItemSubtree,
  collectRoomSubtree,
  prepareSubtreeCleanup,
  type Subtree,
} from "@/lib/entities";

// Shared by the draft lifecycle (lib/drafts.ts) and the cleanup page — kept
// out of the "use server" drafts module so none of these become publicly
// callable Server Actions.

/** Drafts older than this are treated as abandoned (tab closed instead of
 * "Abbrechen"). Anything younger may still be open in someone's browser. */
export const DRAFT_TTL_MS = 24 * 60 * 60 * 1000;

export function staleDraftFilter() {
  return { confirmed: false, createdAt: { lt: new Date(Date.now() - DRAFT_TTL_MS) } };
}

/** Deletes one draft row if it's still a draft. Uses deleteMany (not delete)
 * so a concurrent sweep/cancel/confirm that got there first is a no-op
 * rather than a "record not found" error; files are only cleaned up by
 * whichever caller actually deleted the row. */
async function removeDraft(subtree: Subtree, deleteRow: () => Promise<{ count: number }>) {
  const cleanup = await prepareSubtreeCleanup(subtree);
  const { count } = await deleteRow();
  if (count > 0) await cleanup();
}

export async function removeRoomDraft(id: string) {
  await removeDraft(await collectRoomSubtree(id), () =>
    prismaRaw.location.deleteMany({ where: { id, confirmed: false } })
  );
}

export async function removeContainerDraft(id: string) {
  await removeDraft(await collectContainerSubtree(id), () =>
    prismaRaw.container.deleteMany({ where: { id, confirmed: false } })
  );
}

export async function removeItemDraft(id: string) {
  await removeDraft(await collectItemSubtree(id), () =>
    prismaRaw.item.deleteMany({ where: { id, confirmed: false } })
  );
}
