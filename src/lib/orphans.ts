import { prismaRaw } from "@/lib/db";
import { attachmentFileExists, deleteAttachmentFile, listUploadFiles } from "@/lib/attachments";
import { removeContainerDraft, removeItemDraft, removeRoomDraft, staleDraftFilter } from "@/lib/draft-cleanup";
import { ENTITY_LABELS, entityPath, formatSize, type EntityType } from "@/lib/constants";

// Leftovers the normal flows can't always avoid when several people work at
// once (e.g. a room deleted while someone was adding a photo to an item in
// it) or when a "New" page is simply abandoned. Listed on /cleanup, where
// each can be deleted. Every delete re-checks that the entry is still an
// orphan right before removing it — the list in the browser may be stale.

/** An upload's file lands on disk before its Attachment row is created, so
 * a very fresh file without a row is most likely an upload still in
 * progress, not an orphan. */
const FILE_GRACE_MS = 60 * 60 * 1000;

export const ORPHAN_KINDS = ["draft", "file", "missingFile", "unassigned", "index"] as const;
export type OrphanKind = (typeof ORPHAN_KINDS)[number];

export interface Orphan {
  kind: OrphanKind;
  /** Opaque per-kind key, passed back to deleteOrphan. */
  key: string;
  title: string;
  detail: string;
  href?: string;
}

// ---- Abandoned drafts ----------------------------------------------------

async function findStaleDrafts(only?: { type: EntityType; id: string }): Promise<Orphan[]> {
  const wanted = (type: EntityType) => !only || only.type === type;
  const where = { ...staleDraftFilter(), ...(only && { id: only.id }) };
  const include = { _count: { select: { attachments: true } } } as const;

  const [rooms, containers, items] = await Promise.all([
    wanted("LOCATION") ? prismaRaw.location.findMany({ where, include }) : [],
    wanted("CONTAINER") ? prismaRaw.container.findMany({ where, include }) : [],
    wanted("ITEM") ? prismaRaw.item.findMany({ where, include }) : [],
  ]);

  const toOrphan = (
    type: EntityType,
    d: { id: string; name: string; createdAt: Date; _count: { attachments: number } },
    prefix = ""
  ) => ({
    kind: "draft" as const,
    key: `${type}:${d.id}`,
    title: `${ENTITY_LABELS[type]}-Entwurf: ${prefix}${d.name || "(ohne Name)"}`,
    detail: `angelegt ${formatDate(d.createdAt)} · ${d._count.attachments} Anhänge`,
  });

  return [
    ...rooms.map((d) => toOrphan("LOCATION", d)),
    ...containers.map((d) => toOrphan("CONTAINER", d, `#${d.number} `)),
    ...items.map((d) => toOrphan("ITEM", d)),
  ];
}

// ---- Files on disk without an Attachment row -----------------------------

async function findUnreferencedFiles(only?: string): Promise<Orphan[]> {
  const files = (await listUploadFiles()).filter((f) => !only || f.storedPath === only);
  if (files.length === 0) return [];

  const referenced = new Set(
    (
      await prismaRaw.attachment.findMany({
        where: { storedPath: { in: files.map((f) => f.storedPath) } },
        select: { storedPath: true },
      })
    ).map((a) => a.storedPath)
  );
  const cutoff = Date.now() - FILE_GRACE_MS;

  return files
    .filter((f) => !referenced.has(f.storedPath) && f.modifiedAt.getTime() < cutoff)
    .map((f) => ({
      kind: "file" as const,
      key: f.storedPath,
      title: f.storedPath,
      detail: `${formatSize(f.size)} · ${formatDate(f.modifiedAt)}`,
    }));
}

// ---- Attachment rows ------------------------------------------------------

const attachmentOwner = {
  location: { select: { name: true, confirmed: true } },
  container: { select: { name: true, number: true, confirmed: true } },
  item: { select: { name: true, confirmed: true } },
} as const;

type AttachmentWithOwner = Awaited<
  ReturnType<typeof prismaRaw.attachment.findMany<{ include: typeof attachmentOwner }>>
>[number];

function describeOwner(a: AttachmentWithOwner): { label: string; href?: string } {
  const owner: [EntityType, string | null, { name: string; confirmed: boolean } | null, string][] = [
    ["LOCATION", a.locationId, a.location, ""],
    ["CONTAINER", a.containerId, a.container, a.container ? `#${a.container.number} ` : ""],
    ["ITEM", a.itemId, a.item, ""],
  ];
  for (const [type, id, entity, prefix] of owner) {
    if (id && entity) {
      const label = `${ENTITY_LABELS[type]} ${prefix}${entity.name || "(ohne Name)"}`;
      return entity.confirmed ? { label, href: entityPath(type, id) } : { label: `${label} (Entwurf)` };
    }
  }
  return { label: "ohne Zuordnung" };
}

/** Attachment rows whose file is gone from disk (shown as broken images). */
async function findAttachmentsWithoutFile(only?: string): Promise<Orphan[]> {
  const attachments = await prismaRaw.attachment.findMany({
    where: only ? { id: only } : undefined,
    include: attachmentOwner,
  });
  const exists = await Promise.all(attachments.map((a) => attachmentFileExists(a.storedPath)));

  return attachments
    .filter((_, i) => !exists[i])
    .map((a) => {
      const owner = describeOwner(a);
      return {
        kind: "missingFile" as const,
        key: a.id,
        title: a.filename,
        detail: `gehört zu: ${owner.label}`,
        href: owner.href,
      };
    });
}

/** Attachment rows that belong to nothing at all. */
async function findUnassignedAttachments(only?: string): Promise<Orphan[]> {
  const attachments = await prismaRaw.attachment.findMany({
    where: { id: only, locationId: null, containerId: null, itemId: null },
  });
  return attachments.map((a) => ({
    kind: "unassigned" as const,
    key: a.id,
    title: a.filename,
    detail: `${formatSize(a.size)} · ${formatDate(a.createdAt)}`,
  }));
}

// ---- Search index ---------------------------------------------------------

/** Index rows whose entity no longer exists (or is only a draft), and
 * duplicate rows for the same entity (only the newest one counts). */
async function findIndexOrphans(only?: number): Promise<Orphan[]> {
  const rows = await prismaRaw.$queryRawUnsafe<
    { rowid: number | bigint; entityType: EntityType; entityId: string; name: string; duplicate: number | bigint }[]
  >(
    `SELECT s.rowid AS rowid, s.entity_type AS entityType, s.entity_id AS entityId, s.name AS name,
            (s.rowid NOT IN (SELECT MAX(rowid) FROM search_index GROUP BY entity_type, entity_id)) AS duplicate
     FROM search_index s
     WHERE (? IS NULL OR s.rowid = ?)
       AND (
         (s.entity_type = 'LOCATION' AND NOT EXISTS (SELECT 1 FROM "Location" x WHERE x.id = s.entity_id AND x.confirmed = 1))
         OR (s.entity_type = 'CONTAINER' AND NOT EXISTS (SELECT 1 FROM "Container" x WHERE x.id = s.entity_id AND x.confirmed = 1))
         OR (s.entity_type = 'ITEM' AND NOT EXISTS (SELECT 1 FROM "Item" x WHERE x.id = s.entity_id AND x.confirmed = 1))
         OR s.rowid NOT IN (SELECT MAX(rowid) FROM search_index GROUP BY entity_type, entity_id)
       )`,
    only ?? null,
    only ?? null
  );

  return rows.map((r) => ({
    kind: "index" as const,
    key: String(r.rowid),
    title: `${ENTITY_LABELS[r.entityType] ?? r.entityType}: ${r.name || "(ohne Name)"}`,
    detail: Number(r.duplicate) ? "doppelter Eintrag" : "Objekt existiert nicht mehr",
  }));
}

// ---- Public API -------------------------------------------------------------

export async function findOrphans(): Promise<Record<OrphanKind, Orphan[]>> {
  const [draft, file, missingFile, unassigned, index] = await Promise.all([
    findStaleDrafts(),
    findUnreferencedFiles(),
    findAttachmentsWithoutFile(),
    findUnassignedAttachments(),
    findIndexOrphans(),
  ]);
  return { draft, file, missingFile, unassigned, index };
}

/** Deletes one orphan, but only if it still is one. */
export async function deleteOrphan(kind: OrphanKind, key: string): Promise<void> {
  switch (kind) {
    case "draft": {
      const [type, id] = key.split(":") as [EntityType, string];
      if ((await findStaleDrafts({ type, id })).length === 0) return;
      if (type === "LOCATION") await removeRoomDraft(id);
      else if (type === "CONTAINER") await removeContainerDraft(id);
      else if (type === "ITEM") await removeItemDraft(id);
      return;
    }
    case "file": {
      if ((await findUnreferencedFiles(key)).length === 0) return;
      await deleteAttachmentFile(key);
      return;
    }
    case "missingFile": {
      if ((await findAttachmentsWithoutFile(key)).length === 0) return;
      await prismaRaw.attachment.deleteMany({ where: { id: key } });
      return;
    }
    case "unassigned": {
      const [attachment] = await prismaRaw.attachment.findMany({
        where: { id: key, locationId: null, containerId: null, itemId: null },
      });
      if (!attachment) return;
      const { count } = await prismaRaw.attachment.deleteMany({ where: { id: key } });
      if (count > 0) await deleteAttachmentFile(attachment.storedPath);
      return;
    }
    case "index": {
      const rowid = Number(key);
      if (!Number.isInteger(rowid) || (await findIndexOrphans(rowid)).length === 0) return;
      await prismaRaw.$executeRawUnsafe(`DELETE FROM search_index WHERE rowid = ?`, rowid);
      return;
    }
  }
}

/** Deletes every current orphan, or every one of a single kind. Recomputed
 * server-side right now rather than trusting the list the page showed. */
export async function deleteAllOrphans(kind?: OrphanKind): Promise<void> {
  const orphans = await findOrphans();
  for (const k of kind ? [kind] : ORPHAN_KINDS) {
    for (const orphan of orphans[k]) await deleteOrphan(orphan.kind, orphan.key);
  }
}

// ---- Formatting -------------------------------------------------------------

function formatDate(date: Date): string {
  return date.toLocaleString("de-DE", { dateStyle: "short", timeStyle: "short" });
}
