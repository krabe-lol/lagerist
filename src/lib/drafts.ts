"use server";

import { prismaRaw } from "@/lib/db";
import { nextContainerNumber } from "@/lib/entities";
import { removeContainerDraft, removeItemDraft, removeRoomDraft, staleDraftFilter } from "@/lib/draft-cleanup";

// Draft rows (confirmed: false) exist only so a "New X" page has a real id
// to give UploadAttachmentForm before the form is actually submitted —
// they're invisible everywhere else via the confirmed-filtering `prisma`
// client (see lib/db.ts). Several people may have a "New" page open at the
// same time, so opening one only sweeps away drafts older than DRAFT_TTL_MS
// (abandoned by closing the tab instead of cancelling), never someone
// else's draft that's still being filled in. Sweeping/cancelling goes
// through the same subtree-cleanup helpers the real delete actions use, so
// an abandoned draft's uploaded photos don't leak orphan files on disk.
//
// `resumeId` is set when a photo/file upload (a full-page form POST) lands
// back on the "New" page: that page then keeps working on the same draft,
// with the attachment already on it, instead of starting a fresh one.

async function sweepRoomDrafts() {
  const drafts = await prismaRaw.location.findMany({ where: staleDraftFilter(), select: { id: true } });
  for (const d of drafts) await removeRoomDraft(d.id);
}

async function sweepContainerDrafts() {
  const drafts = await prismaRaw.container.findMany({ where: staleDraftFilter(), select: { id: true } });
  for (const d of drafts) await removeContainerDraft(d.id);
}

async function sweepItemDrafts() {
  const drafts = await prismaRaw.item.findMany({ where: staleDraftFilter(), select: { id: true } });
  for (const d of drafts) await removeItemDraft(d.id);
}

export interface DraftRoom {
  id: string;
  name: string;
  description: string | null;
  parentId: string | null;
  updatedAt: Date;
}

const draftRoomSelect = { id: true, name: true, description: true, parentId: true, updatedAt: true } as const;

export async function getOrCreateRoomDraft(parentId?: string, resumeId?: string): Promise<DraftRoom> {
  if (resumeId) {
    const draft = await prismaRaw.location.findUnique({
      where: { id: resumeId, confirmed: false },
      select: draftRoomSelect,
    });
    if (draft) return draft;
  }
  await sweepRoomDrafts();
  return prismaRaw.location.create({
    data: { name: "", parentId: parentId || null, confirmed: false },
    select: draftRoomSelect,
  });
}

export async function deleteRoomDraft(id: string): Promise<void> {
  await removeRoomDraft(id);
}

export interface DraftContainer {
  id: string;
  number: number;
  name: string;
  description: string | null;
  locationId: string | null;
  templateId: string | null;
  dimensions: string | null;
  volume: string | null;
  updatedAt: Date;
}

const draftContainerSelect = {
  id: true,
  number: true,
  name: true,
  description: true,
  locationId: true,
  templateId: true,
  dimensions: true,
  volume: true,
  updatedAt: true,
} as const;

export async function getOrCreateContainerDraft(locationId?: string, resumeId?: string): Promise<DraftContainer> {
  if (resumeId) {
    const draft = await prismaRaw.container.findUnique({
      where: { id: resumeId, confirmed: false },
      select: draftContainerSelect,
    });
    if (draft) return draft;
  }
  await sweepContainerDrafts();
  // Two people opening "New Container" at once can both read the same max
  // number; the loser hits the unique constraint and simply tries the next one.
  for (let attempt = 0; ; attempt++) {
    const number = await nextContainerNumber();
    try {
      return await prismaRaw.container.create({
        data: { number, name: "", locationId: locationId || null, confirmed: false },
        select: draftContainerSelect,
      });
    } catch (e) {
      const uniqueViolation = (e as { code?: string }).code === "P2002";
      if (!uniqueViolation || attempt >= 4) throw e;
    }
  }
}

export async function deleteContainerDraft(id: string): Promise<void> {
  await removeContainerDraft(id);
}

export interface DraftItem {
  id: string;
  name: string;
  description: string | null;
  quantity: number;
  locationId: string | null;
  containerId: string | null;
  updatedAt: Date;
}

const draftItemSelect = {
  id: true,
  name: true,
  description: true,
  quantity: true,
  locationId: true,
  containerId: true,
  updatedAt: true,
} as const;

export async function getOrCreateItemDraft(
  place: { locationId?: string; containerId?: string },
  resumeId?: string
): Promise<DraftItem> {
  if (resumeId) {
    const draft = await prismaRaw.item.findUnique({
      where: { id: resumeId, confirmed: false },
      select: draftItemSelect,
    });
    if (draft) return draft;
  }
  await sweepItemDrafts();
  return prismaRaw.item.create({
    data: {
      name: "",
      locationId: place.locationId || null,
      containerId: place.containerId || null,
      confirmed: false,
    },
    select: draftItemSelect,
  });
}

export async function deleteItemDraft(id: string): Promise<void> {
  await removeItemDraft(id);
}
