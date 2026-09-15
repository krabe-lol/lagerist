"use server";

import { prismaRaw } from "@/lib/db";
import {
  collectContainerSubtree,
  collectItemSubtree,
  collectRoomSubtree,
  nextContainerNumber,
  prepareSubtreeCleanup,
} from "@/lib/entities";

// Draft rows (confirmed: false) exist only so a "New X" page has a real id
// to give UploadAttachmentForm before the form is actually submitted —
// they're invisible everywhere else via the confirmed-filtering `prisma`
// client (see lib/db.ts). Assumes single-user usage: opening "New" for an
// entity type sweeps away any other leftover draft of that type first,
// rather than tracking per-session ownership. Sweeping/cancelling goes
// through the same subtree-cleanup helpers the real delete actions use, so
// an abandoned draft's uploaded photos don't leak orphan files on disk.

async function sweepRoomDrafts() {
  const drafts = await prismaRaw.location.findMany({ where: { confirmed: false }, select: { id: true } });
  for (const d of drafts) {
    const cleanup = await prepareSubtreeCleanup(await collectRoomSubtree(d.id));
    await prismaRaw.location.delete({ where: { id: d.id } });
    await cleanup();
  }
}

async function sweepContainerDrafts() {
  const drafts = await prismaRaw.container.findMany({ where: { confirmed: false }, select: { id: true } });
  for (const d of drafts) {
    const cleanup = await prepareSubtreeCleanup(await collectContainerSubtree(d.id));
    await prismaRaw.container.delete({ where: { id: d.id } });
    await cleanup();
  }
}

async function sweepItemDrafts() {
  const drafts = await prismaRaw.item.findMany({ where: { confirmed: false }, select: { id: true } });
  for (const d of drafts) {
    const cleanup = await prepareSubtreeCleanup(await collectItemSubtree(d.id));
    await prismaRaw.item.delete({ where: { id: d.id } });
    await cleanup();
  }
}

export interface DraftRoom {
  id: string;
  name: string;
  description: string | null;
  parentId: string | null;
}

export async function getOrCreateRoomDraft(parentId?: string): Promise<DraftRoom> {
  await sweepRoomDrafts();
  return prismaRaw.location.create({
    data: { name: "", parentId: parentId || null, confirmed: false },
    select: { id: true, name: true, description: true, parentId: true },
  });
}

export async function deleteRoomDraft(id: string): Promise<void> {
  const draft = await prismaRaw.location.findUnique({ where: { id, confirmed: false } });
  if (!draft) return;
  const cleanup = await prepareSubtreeCleanup(await collectRoomSubtree(id));
  await prismaRaw.location.delete({ where: { id } });
  await cleanup();
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
}

export async function getOrCreateContainerDraft(locationId?: string): Promise<DraftContainer> {
  await sweepContainerDrafts();
  const number = await nextContainerNumber();
  return prismaRaw.container.create({
    data: { number, name: "", locationId: locationId || null, confirmed: false },
    select: {
      id: true,
      number: true,
      name: true,
      description: true,
      locationId: true,
      templateId: true,
      dimensions: true,
      volume: true,
    },
  });
}

export async function deleteContainerDraft(id: string): Promise<void> {
  const draft = await prismaRaw.container.findUnique({ where: { id, confirmed: false } });
  if (!draft) return;
  const cleanup = await prepareSubtreeCleanup(await collectContainerSubtree(id));
  await prismaRaw.container.delete({ where: { id } });
  await cleanup();
}

export interface DraftItem {
  id: string;
  name: string;
  description: string | null;
  quantity: number;
  locationId: string | null;
  containerId: string | null;
}

export async function getOrCreateItemDraft(place: { locationId?: string; containerId?: string }): Promise<DraftItem> {
  await sweepItemDrafts();
  return prismaRaw.item.create({
    data: {
      name: "",
      locationId: place.locationId || null,
      containerId: place.containerId || null,
      confirmed: false,
    },
    select: { id: true, name: true, description: true, quantity: true, locationId: true, containerId: true },
  });
}

export async function deleteItemDraft(id: string): Promise<void> {
  const draft = await prismaRaw.item.findUnique({ where: { id, confirmed: false } });
  if (!draft) return;
  const cleanup = await prepareSubtreeCleanup(await collectItemSubtree(id));
  await prismaRaw.item.delete({ where: { id } });
  await cleanup();
}
